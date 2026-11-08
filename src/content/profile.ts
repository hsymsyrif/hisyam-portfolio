/**
 * Portfolio content. Every user-facing string is provided in Indonesian (id)
 * and English (en). Update this file to change what the site shows.
 */
import type { Locale } from "@/i18n/routing";

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export function pick<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale];
}

/* -------------------------------------------------------------------------- */

export const person = {
  name: "Muhammad Hisyam Syarif",
  shortName: "Hisyam",
  initials: "MHS",
  role: { id: "System Integration Analyst", en: "System Integration Analyst" } satisfies Localized,
  company: "Bank Mandiri",
  location: { id: "Jakarta, Indonesia", en: "Jakarta, Indonesia" } satisfies Localized,
};

export const socials = [
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "in/hisyamsyarif",
    href: "https://www.linkedin.com/in/hisyamsyarif",
  },
  { id: "github", label: "GitHub", handle: "@hsymsyrif", href: "https://github.com/hsymsyrif" },
] as const;

export const about: LocalizedList = {
  id: [
    "Saya lulusan Sistem Informasi BINUS yang memulai karier dari menulis kode. Sejak 2020 saya mengerjakan website dan aplikasi web untuk lebih dari 50 klien, lalu masuk ke dunia perbankan lewat CIMB Niaga sebagai full-stack developer, QA tester, dan kemudian system analyst.",
    "Tiga peran itu membentuk cara saya bekerja sekarang: memahami kebutuhan bisnis, menerjemahkannya menjadi desain integrasi dan data mapping yang jelas, lalu memastikan semuanya benar-benar berjalan saat diuji dan dirilis.",
    "Sekarang saya di Bank Mandiri, menangani integrasi Livin’ Food, Livin’ Merchant, dan Merchant Portal dengan sistem-sistem di sekitarnya.",
  ],
  en: [
    "I studied Information Systems at BINUS and started my career writing code. Since 2020 I’ve built websites and web apps for more than 50 clients, and I entered banking at CIMB Niaga as a full-stack developer, then QA tester, then system analyst.",
    "Working in all three roles shaped how I work today: understand what the business needs, turn it into clear integration design and data mapping, and make sure it actually holds up in testing and release.",
    "I’m now at Bank Mandiri, handling integrations for Livin’ Food, Livin’ Merchant and Merchant Portal with the systems around them.",
  ],
};

/* -------------------------------------------------------------------------- */

export type Role = {
  title: string;
  period: Localized;
  /** Short focus tags shown with the role (drawn from its points). */
  tags: string[];
  points: LocalizedList;
};

export type Experience = {
  company: string;
  /** Full logo in /public/logos, shown in the detail panel. Without one, a monogram is shown. */
  logo?: string;
  /** Square symbol-only version for the small timeline icon. */
  icon?: string;
  /** Monogram and brand colour for the fallback badge; "self" uses the site's own mark. */
  mark: string;
  brand: string;
  location: Localized;
  type: Localized;
  current?: boolean;
  roles: Role[];
};

export const experiences: Experience[] = [
  {
    company: "PT Bank Mandiri (Persero) Tbk.",
    logo: "/logos/mandiri.png",
    icon: "/logos/mandiri-mark.png",
    mark: "BM",
    brand: "#0a3d91",
    location: { id: "Jakarta · On-site", en: "Jakarta · On-site" },
    type: { id: "Penuh waktu", en: "Full-time" },
    current: true,
    roles: [
      {
        title: "System Integration Analyst",
        period: { id: "Agu 2026 – Sekarang", en: "Aug 2026 – Present" },
        tags: [
          "API Integration",
          "Callbacks",
          "Transaction Flows",
          "Integration Testing",
          "Livin’ Merchant",
        ],
        points: {
          id: [
            "Menangani integrasi sistem Livin’ Food, Livin’ Merchant, dan Merchant Portal dengan sistem-sistem pendukungnya.",
            "Menganalisis dan melakukan troubleshooting API, alur transaksi, callback, serta isu integrasi lintas sistem.",
            "Melakukan integration testing, memvalidasi response API dan alur data, serta mengoordinasikan penyelesaian isu dengan tim terkait.",
            "Memantau dan memastikan integrasi end-to-end berjalan lancar sesuai kebutuhan bisnis dan teknis.",
          ],
          en: [
            "Handle system integration for Livin’ Food, Livin’ Merchant and Merchant Portal with surrounding systems.",
            "Analyze and troubleshoot APIs, transaction flows, callbacks and integration issues across systems.",
            "Perform integration testing, validate API responses and data flow, and coordinate issue resolution with teams.",
            "Monitor and ensure end-to-end integration runs smoothly according to business and technical requirements.",
          ],
        },
      },
    ],
  },
  {
    company: "PT Bank CIMB Niaga Tbk.",
    logo: "/logos/cimb.png",
    icon: "/logos/cimb-mark.png",
    mark: "CN",
    brand: "#c8102e",
    location: { id: "Bintaro, Tangerang Selatan", en: "Bintaro, South Tangerang" },
    type: { id: "Penuh waktu", en: "Full-time" },
    roles: [
      {
        title: "System Analyst",
        period: { id: "Jul 2025 – Jul 2026", en: "Jul 2025 – Jul 2026" },
        tags: ["ESB / Middleware", "Core Banking", "Data Mapping", "Requirements", "15 Projects"],
        points: {
          id: [
            "Mengelola dan memelihara integrasi API di lingkungan ESB/Middleware untuk pertukaran data yang aman dan andal antara berbagai channel dan Core Banking.",
            "Melakukan requirement gathering, analisis sistem, dan desain integrasi, lengkap dengan data mapping dan dokumentasi, untuk 15+ proyek dalam 6 bulan.",
            "Berhasil merilis 15 proyek (SWR, CR, Project) sesuai standar integrasi, kebutuhan performa, dan ekspektasi stakeholder.",
          ],
          en: [
            "Managed and maintained API integrations in the ESB/Middleware environment, enabling secure, reliable data exchange between channels and Core Banking.",
            "Ran requirement gathering, system analysis and integration design, producing detailed data mapping and documentation across 15+ projects in 6 months.",
            "Delivered and promoted 15 projects (SWR, CR, Project) in line with integration standards, performance requirements and stakeholder expectations.",
          ],
        },
      },
      {
        title: "Quality Assurance Tester",
        period: { id: "Mar 2025 – Jul 2025", en: "Mar 2025 – Jul 2025" },
        tags: ["Agile / Scrum", "API Testing", "Test Cases", "Regression"],
        points: {
          id: [
            "Berkolaborasi dengan developer dan product owner dalam sprint Agile/Scrum untuk meninjau requirement dan menentukan cakupan pengujian.",
            "Merancang dan menjalankan test case manual dan API untuk modul User Management, Role Management, Approval Workflow, dan Reporting.",
            "Mendokumentasikan defect, hasil uji, dan metrik kualitas untuk mendukung kesiapan rilis dan regression testing.",
          ],
          en: [
            "Worked with developers and product owners in Agile/Scrum sprints to review requirements and define test scope.",
            "Designed and executed manual and API test cases for User Management, Role Management, Approval Workflow and Reporting.",
            "Documented defects, test results and quality metrics to support release readiness and regression testing.",
          ],
        },
      },
      {
        title: "Fullstack Developer",
        period: { id: "Jan 2025 – Mar 2025", en: "Jan 2025 – Mar 2025" },
        tags: ["LLM", "REST API", "Frontend", "AI Workflows"],
        points: {
          id: [
            "Mengembangkan aplikasi web berbasis AI: backend service, REST API, dan fitur frontend untuk workflow AI.",
            "Mengintegrasikan layanan Large Language Model (LLM): desain prompt, penanganan request/response, dan format output.",
            "Membangun komponen frontend yang responsif dan mengoptimalkan komunikasi API untuk performa dan skalabilitas.",
          ],
          en: [
            "Built an AI-powered web application: backend services, REST APIs and frontend features for AI-driven workflows.",
            "Integrated Large Language Model (LLM) services, handling prompt design, request/response flow and output formatting.",
            "Built responsive frontend components and optimized API communication for performance and scalability.",
          ],
        },
      },
    ],
  },
  {
    company: "Fullstack Developer · Freelance",
    mark: "self",
    brand: "#3d5bff",
    location: { id: "Remote · Tangerang", en: "Remote · Tangerang" },
    type: { id: "Freelance", en: "Freelance" },
    roles: [
      {
        title: "Fullstack Developer",
        period: { id: "Jan 2020 – Sekarang", en: "Jan 2020 – Present" },
        tags: ["Fullstack", "Payment Gateway", "Third-party API", "50+ Clients"],
        points: {
          id: [
            "Membangun website dan aplikasi web untuk 50+ klien dengan solusi yang disesuaikan kebutuhan bisnis masing-masing.",
            "Menganalisis kebutuhan klien, mengusulkan pendekatan teknis, dan mengintegrasikan layanan pihak ketiga seperti payment gateway dan API eksternal.",
            "Menjaga keandalan sistem lewat pembaruan rutin, debugging, dan optimasi performa.",
          ],
          en: [
            "Delivered websites and web applications for 50+ clients, tailored to each business's needs.",
            "Analyzed requirements, proposed technical approaches and integrated third-party services such as payment gateways and external APIs.",
            "Kept systems reliable through regular updates, debugging and performance optimization.",
          ],
        },
      },
    ],
  },
  {
    company: "Alfagift · PT Global Loyalty Indonesia",
    logo: "/logos/alfagift.png",
    icon: "/logos/alfagift-mark.png",
    mark: "AG",
    brand: "#e31e24",
    location: { id: "Alam Sutera, Tangerang", en: "Alam Sutera, Tangerang" },
    type: { id: "Magang", en: "Internship" },
    roles: [
      {
        title: "Fullstack Developer Intern",
        period: { id: "Sep 2024 – Feb 2025", en: "Sep 2024 – Feb 2025" },
        tags: ["Vue.js", "Next.js", "Tailwind CSS", "Bootstrap"],
        points: {
          id: [
            "Mengembangkan E-Ticketing Task Management System (Vue.js, Bootstrap) dan Winner Confirmation Website (Next.js, Tailwind) dalam 6 bulan.",
            "Memperbaiki bug, mengamankan input pengguna, dan mengoptimalkan performa di berbagai perangkat.",
          ],
          en: [
            "Built an E-Ticketing Task Management System (Vue.js, Bootstrap) and a Winner Confirmation Website (Next.js, Tailwind) within 6 months.",
            "Resolved bugs, secured user inputs and optimized performance across devices.",
          ],
        },
      },
    ],
  },
  {
    company: "PT Smartfren Telecom Tbk.",
    logo: "/logos/smartfren.png",
    icon: "/logos/smartfren-mark.png",
    mark: "SF",
    brand: "#d6006f",
    location: { id: "Jakarta", en: "Jakarta" },
    type: { id: "Magang", en: "Internship" },
    roles: [
      {
        title: "IT Security Analyst Intern",
        period: { id: "Jan 2024 – Jul 2024", en: "Jan 2024 – Jul 2024" },
        tags: ["Security Events", "ISO 27001", "Secure Coding", "Audit"],
        points: {
          id: [
            "Menganalisis security event, menindaklanjuti insiden, dan mengadakan security awareness untuk pengguna dan developer, termasuk secure coding.",
            "Menyusun checklist kepatuhan ISO 27001:2022 dan mendukung persiapan audit surveillance.",
            "Mendokumentasikan tindakan keamanan dan memantau progres kepatuhan untuk memperkuat postur keamanan informasi.",
          ],
          en: [
            "Analyzed security events, followed up on incidents and ran security awareness sessions for users and developers, including secure coding.",
            "Developed an ISO 27001:2022 compliance checklist and supported audit surveillance preparation.",
            "Documented security actions and tracked compliance progress to strengthen the information security posture.",
          ],
        },
      },
    ],
  },
  {
    company: "Bina Nusantara Computer Club",
    logo: "/logos/binus.png",
    icon: "/logos/binus-mark.png",
    mark: "BN",
    brand: "#1f4fa3",
    location: { id: "Jakarta", en: "Jakarta" },
    type: { id: "Mentor", en: "Mentor" },
    roles: [
      {
        title: "Front-End Development Mentor",
        period: { id: "Sep 2023 – Feb 2024", en: "Sep 2023 – Feb 2024" },
        tags: ["HTML · CSS · JS", "React", "Firebase", "Mentoring"],
        points: {
          id: [
            "Mengajar dasar front-end: HTML, CSS, JavaScript, React, Firebase, responsive design, dan aksesibilitas web.",
            "Membimbing 10 mahasiswa melalui sesi 1-on-1 dan kelompok dalam tugas dan proyek.",
          ],
          en: [
            "Taught front-end fundamentals: HTML, CSS, JavaScript, React, Firebase, responsive design and web accessibility.",
            "Mentored 10 students through 1-on-1 and group sessions on assignments and projects.",
          ],
        },
      },
    ],
  },
  {
    company: "Apple Developer Academy · iOS Foundation",
    logo: "/logos/apple-academy.png",
    icon: "/logos/apple-academy-mark.png",
    mark: "AD",
    brand: "#2b2b30",
    location: { id: "Jakarta", en: "Jakarta" },
    type: { id: "Program", en: "Program" },
    roles: [
      {
        title: "iOS Developer",
        period: { id: "Jul 2023 – Sep 2023", en: "Jul 2023 – Sep 2023" },
        tags: ["iOS", "Fitness App", "Client Demos"],
        points: {
          id: [
            "Mengembangkan aplikasi Running & Fitness untuk melacak aktivitas lari, progres kebugaran, dan motivasi pengguna.",
            "Mempresentasikan progres dan hasil akhir ke klien, lalu menerapkan feedback ke pengembangan.",
          ],
          en: [
            "Developed a Running & Fitness app that tracks runs, monitors fitness progress and keeps users motivated.",
            "Presented progress and final results to clients and fed their feedback back into development.",
          ],
        },
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */

export type Project = {
  slug: string;
  title: Localized;
  context: string;
  year: string;
  summary: Localized;
  stack: string[];
  link?: { href: string; label: Localized };
  /** Context icon on the card: a logo in /public/logos, "self" for the site's own mark, "github" for a public repo, or none for a text badge. */
  icon?: string;
  /** Glow colour of the card's visual header. */
  accent: string;
};

/** A public repo on github.com/hsymsyrif, shown with the GitHub mark and a link to the repo. */
const repo = (r: Omit<Project, "context" | "icon" | "link">): Project => ({
  ...r,
  context: "GitHub",
  icon: "github",
  link: {
    href: `https://github.com/hsymsyrif/${r.slug}`,
    label: { id: "Lihat repo", en: "View repo" },
  },
});

/** Newest first. */
export const projects: Project[] = [
  repo({
    slug: "GameCenterRentalPS",
    title: { id: "Sistem Rental PlayStation", en: "PlayStation Rental System" },
    year: "2026",
    accent: "#3d5bff",
    summary: {
      id: "Aplikasi desktop untuk admin rental: kelola game, pelanggan, dan transaksi, hitung biaya sewa otomatis, dan cetak laporan.",
      en: "A desktop app for rental admins: manage games, customers and rentals, calculate fees automatically, and print reports.",
    },
    stack: ["Java", "Swing", "MySQL", "JDBC", "JasperReports"],
  }),
  repo({
    slug: "work_schedule_project",
    title: { id: "Penjadwalan Kerja Optimal", en: "Optimal Work Scheduling" },
    year: "2025",
    accent: "#a99bff",
    summary: {
      id: "Membandingkan Merge Sort dan Dynamic Programming untuk mencari jadwal kerja pegawai dengan profit maksimum tanpa bentrok waktu.",
      en: "Compares Merge Sort and Dynamic Programming to find the employee schedule with the highest profit and no time clashes.",
    },
    stack: ["Python", "Dynamic Programming", "Algorithms"],
  }),
  repo({
    slug: "diabetes-ml",
    title: { id: "Prediksi Risiko Diabetes", en: "Diabetes Risk Prediction" },
    year: "2025",
    accent: "#6fe3d0",
    summary: {
      id: "Pipeline machine learning yang rapi: load data, preprocessing, model Logistic Regression scikit-learn, dan model tersimpan untuk prediksi ulang.",
      en: "A tidy machine-learning pipeline: data loading, preprocessing, a scikit-learn Logistic Regression model, and a saved model for repeat predictions.",
    },
    stack: ["Python", "scikit-learn", "pandas", "joblib"],
  }),
  repo({
    slug: "microfrontend-weather",
    title: { id: "Micro-frontend Cuaca", en: "Weather Micro-frontend" },
    year: "2025",
    accent: "#5fd3ff",
    summary: {
      id: "Host React dan remote Vue yang digabung saat runtime lewat Module Federation: dua framework, satu aplikasi, dengan dependensi yang dibagi.",
      en: "A React host and a Vue remote joined at runtime with Module Federation: two frameworks, one app, with shared dependencies.",
    },
    stack: ["React", "Vue", "TypeScript", "Module Federation", "Vite"],
  }),
  repo({
    slug: "detect_fake_news_with_snorkel",
    title: { id: "Deteksi Berita Palsu Kesehatan", en: "Health Fake-News Detection" },
    year: "2025",
    accent: "#7b5cff",
    summary: {
      id: "Fungsi labeling berbasis aturan di Snorkel (weak supervision) memberi label berita kesehatan otomatis, lalu melatih Perceptron untuk mendeteksi hoaks.",
      en: "Rule-based labeling functions with Snorkel (weak supervision) label health news automatically, then a Perceptron is trained to spot fake stories.",
    },
    stack: ["Python", "Snorkel", "Perceptron", "Jupyter"],
  }),
  {
    slug: "ai-web-app",
    title: { id: "Aplikasi Web Berbasis AI", en: "AI-Powered Web Application" },
    context: "CIMB Niaga",
    icon: "/logos/cimb.png",
    accent: "#5fd3ff",
    year: "2025",
    summary: {
      id: "Backend service, REST API, dan frontend untuk workflow berbasis AI, dengan integrasi LLM mulai dari desain prompt sampai format output.",
      en: "Backend services, REST APIs and frontend for AI-driven workflows, with LLM integration from prompt design to output formatting.",
    },
    stack: ["LLM", "REST API", "Fullstack"],
  },
  {
    slug: "winner-confirmation",
    title: { id: "Winner Confirmation Website", en: "Winner Confirmation Website" },
    context: "Alfagift",
    icon: "/logos/alfagift.png",
    accent: "#7b5cff",
    year: "2025",
    summary: {
      id: "Website konfirmasi pemenang program yang cepat dan responsif, dibangun dengan Next.js dan Tailwind.",
      en: "A fast, responsive winner confirmation website for customer programs, built with Next.js and Tailwind.",
    },
    stack: ["Next.js", "Tailwind CSS"],
  },
  {
    slug: "ieee-research",
    title: {
      id: "Riset Voice Assistant & E-Commerce",
      en: "Voice Assistant & E-Commerce Research",
    },
    context: "IEEE · ICIMCIS 2024",
    accent: "#8fa8ff",
    year: "2024",
    summary: {
      id: "Skripsi tentang pengaruh voice assistant terhadap daya beli konsumen e-commerce, dipublikasikan IEEE dan dipresentasikan di ICIMCIS 2024.",
      en: "Thesis on how voice assistants influence e-commerce consumer buying power, published by IEEE and presented at ICIMCIS 2024.",
    },
    stack: ["Research", "E-Commerce", "Voice AI"],
    link: {
      href: "https://ieeexplore.ieee.org/document/10956832",
      label: { id: "Baca di IEEE Xplore", en: "Read on IEEE Xplore" },
    },
  },
  {
    slug: "e-ticketing",
    title: { id: "E-Ticketing Task Management System", en: "E-Ticketing Task Management System" },
    context: "Alfagift",
    icon: "/logos/alfagift.png",
    accent: "#3d5bff",
    year: "2024",
    summary: {
      id: "Sistem tiket dan manajemen tugas internal yang responsif, dengan input pengguna yang diamankan dan performa yang dioptimalkan.",
      en: "An internal ticketing and task management system, responsive across devices, with secured inputs and tuned performance.",
    },
    stack: ["Vue.js", "Bootstrap"],
  },
  repo({
    slug: "webgis-leaflet-master",
    title: { id: "WebGIS Geotagging", en: "WebGIS Geotagging" },
    year: "2024",
    accent: "#8fa8ff",
    summary: {
      id: "Peta interaktif berbasis Leaflet dengan data GeoJSON kota, sidebar, inspeksi lokasi, dan halaman perbandingan antar wilayah.",
      en: "An interactive Leaflet map with GeoJSON city data, a sidebar, location inspection, and a page to compare regions.",
    },
    stack: ["Leaflet", "GeoJSON", "JavaScript"],
  }),
  {
    slug: "running-fitness",
    title: { id: "Aplikasi iOS Running & Fitness", en: "Running & Fitness iOS App" },
    context: "Apple Developer Academy",
    icon: "/logos/apple-academy.png",
    accent: "#6fe3d0",
    year: "2023",
    summary: {
      id: "Aplikasi iOS untuk melacak lari, memantau progres kebugaran, dan menjaga motivasi, dengan UI yang dirancang sesuai fungsinya.",
      en: "An iOS app to track runs, monitor fitness progress and stay motivated, with an interface designed around its function.",
    },
    stack: ["iOS", "UI Design"],
  },
  {
    slug: "client-platforms",
    title: { id: "Platform Web untuk 50+ Klien", en: "Web Platforms for 50+ Clients" },
    context: "Freelance",
    icon: "self",
    accent: "#a99bff",
    year: "2020 –",
    summary: {
      id: "Website dan aplikasi web sesuai kebutuhan bisnis, termasuk integrasi payment gateway dan API pihak ketiga.",
      en: "Websites and web apps built around each business, including payment gateway and third-party API integrations.",
    },
    stack: ["Payment Gateway", "Third-party API", "Fullstack"],
  },
];

/* -------------------------------------------------------------------------- */

export type SkillGroup = {
  id: string;
  title: Localized;
  /** What this toolkit is used for, in one line. */
  summary: Localized;
  /** Where it has been applied (from the experience above). */
  usedAt: string[];
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "integration",
    title: { id: "Integrasi & Analisis", en: "Integration & Analysis" },
    summary: {
      id: "Merancang dan menjalankan integrasi antara channel, middleware, dan core banking: kontrak API, data mapping, callback, dan alur end-to-end.",
      en: "Designing and running integrations between channels, middleware and core banking: API contracts, data mapping, callbacks and end-to-end flows.",
    },
    usedAt: ["Bank Mandiri", "CIMB Niaga"],
    items: [
      "API Integration",
      "ESB / Middleware",
      "System Design",
      "Interface Data Mapping",
      "UML",
      "Flowchart",
    ],
  },
  {
    id: "engineering",
    title: { id: "Engineering", en: "Engineering" },
    summary: {
      id: "Membangun aplikasi web dari ujung ke ujung, dari REST API dan backend sampai frontend yang responsif.",
      en: "Building web apps end to end, from REST APIs and backends to responsive frontends.",
    },
    usedAt: ["Freelance · 50+ clients", "Alfagift", "CIMB Niaga"],
    items: [
      "JavaScript",
      "PHP",
      "Java",
      "Python",
      "Rust",
      "React",
      "Next.js",
      "Vue",
      "Node.js",
      "Express",
      "WordPress",
    ],
  },
  {
    id: "data-quality",
    title: { id: "Data & Kualitas", en: "Data & Quality" },
    summary: {
      id: "Menjaga sistem tetap benar: pengecekan data dengan SQL, pengujian manual dan otomatis, serta API testing sebelum rilis.",
      en: "Keeping systems correct: SQL data checks, manual and automated tests, and API testing before release.",
    },
    usedAt: ["CIMB Niaga", "Bank Mandiri"],
    items: [
      "MySQL",
      "PostgreSQL",
      "Manual Testing",
      "Automation Testing",
      "API Testing",
      "Katalon",
    ],
  },
  {
    id: "design",
    title: { id: "Desain & Kolaborasi", en: "Design & Collaboration" },
    summary: {
      id: "Menerjemahkan kebutuhan menjadi UI dan dokumentasi yang jelas, lalu mengirimkannya bersama tim Agile.",
      en: "Turning requirements into clear UI and documentation, and shipping it with Agile teams.",
    },
    usedAt: ["Apple Developer Academy", "CIMB Niaga"],
    items: ["Figma", "Agile / Scrum", "Technical Documentation"],
  },
];

export const softSkills: LocalizedList = {
  id: [
    "Komunikasi",
    "Problem Solving",
    "Berpikir Analitis",
    "Kolaborasi Tim",
    "Manajemen Proyek",
    "Adaptif",
    "Kepemimpinan",
  ],
  en: [
    "Communication",
    "Problem Solving",
    "Analytical Thinking",
    "Team Collaboration",
    "Project Management",
    "Adaptability",
    "Leadership",
  ],
};

/** `bars` (out of 5) only drives the little meter next to each level. */
export const languages: { name: Localized; level: Localized; bars: number }[] = [
  {
    name: { id: "Bahasa Indonesia", en: "Indonesian" },
    level: { id: "Bahasa ibu", en: "Native" },
    bars: 5,
  },
  {
    name: { id: "Bahasa Inggris", en: "English" },
    level: { id: "Profesional", en: "Professional proficiency" },
    bars: 4,
  },
];

/* -------------------------------------------------------------------------- */

export const education: {
  school: string;
  degree: Localized;
  period: string;
  score: Localized;
  points: LocalizedList;
}[] = [
  {
    school: "Bina Nusantara University",
    degree: { id: "S1 Sistem Informasi", en: "Bachelor of Information Systems" },
    period: "2021 – 2025",
    score: { id: "IPK 3.68 / 4.00 · Cum Laude", en: "GPA 3.68 / 4.00 · Cum Laude" },
    points: {
      id: [
        "Lulus dalam 3,5 tahun dengan predikat Cum Laude.",
        "Skripsi dipublikasikan IEEE dan dipresentasikan di ICIMCIS 2024.",
        "Beasiswa mentoring Web Development senilai 16 SKS untuk satu semester.",
        "Lead committee di Information Systems Association.",
      ],
      en: [
        "Graduated Cum Laude in 3.5 years.",
        "Thesis published by IEEE and presented at ICIMCIS 2024.",
        "Web Development mentoring scholarship covering 16 credits for one semester.",
        "Lead committee member of the Information Systems Association.",
      ],
    },
  },
  {
    school: "SMK Bina Informatika",
    degree: { id: "Multimedia", en: "Multimedia" },
    period: "2018 – 2021",
    score: { id: "Nilai akhir 3.90 / 4.00", en: "Final score 3.90 / 4.00" },
    points: {
      id: [
        "Proyek desain aplikasi, produksi film pendek, dan implementasi sistem manajemen proyek.",
        "Magang di perusahaan di Jakarta.",
      ],
      en: [
        "Projects in application design, short film production and project management system implementation.",
        "Industry internships at companies in Jakarta.",
      ],
    },
  },
];

export const community: { name: string; role: Localized; period: string; summary: Localized }[] = [
  {
    name: "Google Developer Community · BINUS International",
    role: { id: "Anggota", en: "Member" },
    period: "2023 – 2024",
    summary: {
      id: "Ikut Google Developer Indonesia Hackathon 2024 dan aktif di acara komunitas teknologi.",
      en: "Took part in the Google Developer Indonesia Hackathon 2024 and active in tech community events.",
    },
  },
  {
    name: "Bina Nusantara University",
    role: { id: "Scholarship Student Mentor", en: "Scholarship Student Mentor" },
    period: "2022 – 2023",
    summary: {
      id: "Mendampingi mahasiswa di mata kuliah Introduction to Programming dan IS Project Management.",
      en: "Supported students in Introduction to Programming and IS Project Management courses.",
    },
  },
];

export const certificates: { title: Localized; issuer: string; date: string; href?: string }[] = [
  {
    title: {
      id: "Paper riset: Pengaruh Voice Assistant terhadap E-Commerce",
      en: "Research paper: Influence of Voice Assistants on E-Commerce",
    },
    issuer: "IEEE · ICIMCIS 2024",
    date: "Nov 2024",
    href: "https://ieeexplore.ieee.org/document/10956832",
  },
  {
    title: { id: "Mendix Developer Certification", en: "Mendix Developer Certification" },
    issuer: "Mendix",
    date: "Dec 2023",
  },
  {
    title: { id: "Finalis ke-8 Kompetisi UI/UX", en: "8th Finalist, UI/UX Competition" },
    issuer: "Universitas Multimedia Nusantara",
    date: "Jul 2023",
  },
  {
    title: {
      id: "Top 5 Regional Student Company Competition",
      en: "Top 5, Regional Student Company Competition",
    },
    issuer: "Citibank",
    date: "Jul 2019",
  },
];
