/**
 * Integration Playground scenarios. Everything here is a simulation with made-up
 * values; it shows how a payment travels between systems, not any real bank's API.
 */
import type { Localized } from "./profile";

export type NodeId = "app" | "gateway" | "esb" | "core" | "merchant";
export type StepKind = "req" | "res" | "cb" | "err" | "wait";

export type Step = {
  from: NodeId;
  to: NodeId;
  kind: StepKind;
  /** "POST /v1/payments/qr", "ISO 8583 0200", … */
  call: string;
  /** HTTP status or response code shown in the log, if any. */
  status?: string;
  /** Simulated latency of this hop in milliseconds. */
  ms: number;
  note: Localized;
  payload: Record<string, unknown>;
};

export type Scenario = { id: string; title: Localized; summary: Localized; steps: Step[] };

export const NODES: { id: NodeId; label: string; sub: Localized }[] = [
  { id: "app", label: "Mobile App", sub: { en: "Channel", id: "Channel" } },
  { id: "gateway", label: "API Gateway", sub: { en: "Auth · routing", id: "Auth · routing" } },
  { id: "esb", label: "ESB / Middleware", sub: { en: "Orchestration", id: "Orkestrasi" } },
  { id: "core", label: "Core Banking", sub: { en: "Ledger", id: "Ledger" } },
  { id: "merchant", label: "Merchant", sub: { en: "Callback", id: "Callback" } },
];

const REF = "TRX-20261108-00042";
const qrRequest = {
  method: "POST",
  path: "/v1/payments/qr",
  headers: {
    "x-client-id": "mobile-app",
    "x-signature": "hmac-sha256=9f2c…e81a",
    "x-request-id": REF,
  },
  body: {
    merchantId: "MRC-0007",
    amount: 125000,
    currency: "IDR",
    qrPayload: "00020101021226…6304A1B2",
  },
};

const head = (signature = "valid"): Step[] => [
  {
    from: "app",
    to: "gateway",
    kind: "req",
    call: "POST /v1/payments/qr",
    ms: 42,
    note: {
      en: "The app sends a signed payment request.",
      id: "Aplikasi mengirim request pembayaran yang ditandatangani.",
    },
    payload: qrRequest,
  },
  ...(signature === "valid"
    ? ([
        {
          from: "gateway",
          to: "esb",
          kind: "req",
          call: "route payments.qr",
          ms: 18,
          note: {
            en: "Signature checked, rate limit OK, routed to the ESB.",
            id: "Signature dicek, rate limit aman, diteruskan ke ESB.",
          },
          payload: {
            route: "payments.qr",
            auth: "signature valid",
            client: "mobile-app",
            requestId: REF,
          },
        },
        {
          from: "esb",
          to: "core",
          kind: "req",
          call: "ISO 8583 0200",
          ms: 175,
          note: {
            en: "The ESB maps JSON to an ISO 8583 debit message.",
            id: "ESB memetakan JSON ke pesan debit ISO 8583.",
          },
          payload: {
            mti: "0200",
            processingCode: "400000",
            amount: "000000125000",
            stan: "000042",
            terminalId: "QRIS0001",
          },
        },
      ] as Step[])
    : []),
];

const success: Step[] = [
  {
    from: "core",
    to: "esb",
    kind: "res",
    call: "ISO 8583 0210",
    status: "RC 00",
    ms: 160,
    note: { en: "Core approves and posts the debit.", id: "Core menyetujui dan membukukan debit." },
    payload: { mti: "0210", responseCode: "00", approvalCode: "A81C42", balanceAfter: "masked" },
  },
];

const tail = (merchantRetry: boolean): Step[] => [
  {
    from: "esb",
    to: "merchant",
    kind: "cb",
    call: "POST /callback/payment",
    status: merchantRetry ? "503" : "200",
    ms: merchantRetry ? 3000 : 88,
    note: merchantRetry
      ? {
          en: "Merchant is down: callback fails with 503.",
          id: "Merchant sedang down: callback gagal dengan 503.",
        }
      : {
          en: "The merchant is notified that the payment succeeded.",
          id: "Merchant diberi tahu bahwa pembayaran berhasil.",
        },
    payload: { event: "payment.succeeded", ref: REF, amount: 125000, signature: "hmac-sha256=…" },
  },
  ...(merchantRetry
    ? ([
        {
          from: "esb",
          to: "esb",
          kind: "wait",
          call: "retry #1 · backoff 2s",
          ms: 2000,
          note: {
            en: "The ESB waits with exponential backoff, then retries.",
            id: "ESB menunggu dengan exponential backoff, lalu mencoba lagi.",
          },
          payload: { attempt: 2, backoffMs: 2000, idempotencyKey: REF },
        },
        {
          from: "esb",
          to: "merchant",
          kind: "cb",
          call: "POST /callback/payment",
          status: "200",
          ms: 95,
          note: {
            en: "Retry succeeds; the same idempotency key avoids double processing.",
            id: "Retry berhasil; idempotency key yang sama mencegah proses ganda.",
          },
          payload: { event: "payment.succeeded", ref: REF, attempt: 2 },
        },
      ] as Step[])
    : []),
  {
    from: "esb",
    to: "gateway",
    kind: "res",
    call: "200 OK",
    status: "200",
    ms: 20,
    note: {
      en: "The ESB maps the result back to JSON.",
      id: "ESB memetakan hasilnya kembali ke JSON.",
    },
    payload: { status: "SUCCESS", ref: REF, approvalCode: "A81C42" },
  },
  {
    from: "gateway",
    to: "app",
    kind: "res",
    call: "200 OK",
    status: "200",
    ms: 26,
    note: { en: "The customer sees the payment receipt.", id: "Nasabah melihat bukti pembayaran." },
    payload: { status: "SUCCESS", ref: REF, amount: 125000, paidAt: "2026-11-08T10:58:29+07:00" },
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: "qr",
    title: { en: "QR payment", id: "Pembayaran QR" },
    summary: {
      en: "The happy path from app to core and back, with a merchant callback.",
      id: "Jalur normal dari aplikasi ke core dan kembali, dengan callback ke merchant.",
    },
    steps: [...head(), ...success, ...tail(false)],
  },
  {
    id: "retry",
    title: { en: "Callback retry", id: "Retry callback" },
    summary: {
      en: "The merchant is down; the ESB retries with backoff and an idempotency key.",
      id: "Merchant down; ESB mencoba ulang dengan backoff dan idempotency key.",
    },
    steps: [...head(), ...success, ...tail(true)],
  },
  {
    id: "timeout",
    title: { en: "Core timeout", id: "Timeout core" },
    summary: {
      en: "Core does not answer in time; the ESB reverses the debit to keep balances right.",
      id: "Core tidak menjawab tepat waktu; ESB me-reverse debit agar saldo tetap benar.",
    },
    steps: [
      ...head(),
      {
        from: "core",
        to: "esb",
        kind: "err",
        call: "no response",
        status: "TIMEOUT",
        ms: 30000,
        note: {
          en: "30 s without a reply: the outcome is unknown.",
          id: "30 detik tanpa balasan: hasilnya tidak diketahui.",
        },
        payload: { error: "READ_TIMEOUT", waitedMs: 30000, stan: "000042" },
      },
      {
        from: "esb",
        to: "core",
        kind: "req",
        call: "ISO 8583 0400",
        ms: 120,
        note: {
          en: "The ESB sends a reversal for the same transaction.",
          id: "ESB mengirim reversal untuk transaksi yang sama.",
        },
        payload: { mti: "0400", originalStan: "000042", amount: "000000125000", reason: "timeout" },
      },
      {
        from: "core",
        to: "esb",
        kind: "res",
        call: "ISO 8583 0410",
        status: "RC 00",
        ms: 110,
        note: {
          en: "Reversal confirmed; no money moved.",
          id: "Reversal terkonfirmasi; tidak ada dana yang berpindah.",
        },
        payload: { mti: "0410", responseCode: "00", reversed: true },
      },
      {
        from: "esb",
        to: "gateway",
        kind: "err",
        call: "504 Gateway Timeout",
        status: "504",
        ms: 18,
        note: {
          en: "A clear error with a reference goes back up.",
          id: "Error yang jelas beserta referensinya dikirim kembali.",
        },
        payload: { status: "FAILED", reason: "CORE_TIMEOUT", reversed: true, ref: REF },
      },
      {
        from: "gateway",
        to: "app",
        kind: "err",
        call: "504 Gateway Timeout",
        status: "504",
        ms: 24,
        note: {
          en: "The app tells the customer it failed and nothing was charged.",
          id: "Aplikasi memberi tahu nasabah transaksi gagal dan tidak ada potongan.",
        },
        payload: { status: "FAILED", message: "Payment failed. You were not charged.", ref: REF },
      },
    ],
  },
  {
    id: "auth",
    title: { en: "Invalid signature", id: "Signature tidak valid" },
    summary: {
      en: "A tampered request is stopped at the edge and never reaches the bank.",
      id: "Request yang dimanipulasi dihentikan di gateway dan tidak pernah sampai ke bank.",
    },
    steps: [
      ...head("invalid"),
      {
        from: "gateway",
        to: "app",
        kind: "err",
        call: "401 Unauthorized",
        status: "401",
        ms: 12,
        note: {
          en: "The HMAC does not match the body; rejected at the gateway.",
          id: "HMAC tidak cocok dengan body; ditolak di gateway.",
        },
        payload: {
          error: "INVALID_SIGNATURE",
          requestId: REF,
          hint: "x-signature does not match the request body",
        },
      },
    ],
  },
];
