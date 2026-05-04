import Link from "next/link";

const footerLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Scientific Method" },
  { href: "#", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-4 md:space-y-0">
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          Skindex
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-manrope text-slate-500 hover:text-[#00C2B8] dark:hover:text-[#40dcd1] hover:underline decoration-[#00C2B8] dark:decoration-[#40dcd1] transition-all duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs font-manrope text-slate-500 dark:text-slate-400">
          © {year} Skindex. Precision Skin Science for every tone.
        </p>
      </div>
    </footer>
  );
}
