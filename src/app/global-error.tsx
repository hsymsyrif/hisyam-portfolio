"use client";

/** Last-resort error page (the root layout itself failed). Generic on purpose: no error details reach the visitor. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          background: "#030817",
          color: "#f0f3fb",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#a6b0c9" }}>Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            margin: "1rem auto 0",
            padding: "0.75rem 1.25rem",
            borderRadius: 999,
            border: "1px solid #2a5cff",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
