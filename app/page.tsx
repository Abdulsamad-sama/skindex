import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-24 text-center">
      <h1 className="text-display font-display font-black text-primary mb-6">Welcome to Skindex</h1>
      <p className="text-body-lg text-on-surface-variant max-w-2xl mb-12">
        Precision Skin Science for every tone. Explore our clinical dashboard or run an AI-driven skin analysis.
      </p>
      <div className="flex gap-6">
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:-translate-y-1 transition-transform duration-200 shadow-lg shadow-primary/20"
        >
          View Dashboard
        </Link>
        <Link
          href="/analysis"
          className="px-8 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-200 shadow-sm"
        >
          Start Analysis
        </Link>
      </div>
    </main>
  );
}
