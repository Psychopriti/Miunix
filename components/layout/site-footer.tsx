import Link from "next/link";

const footerLinks = [
  { label: "Inicio",       href: "/" },
  { label: "Workflows",    href: "/workflows" },
  { label: "Mis Agentes",  href: "/dashboard" },
  { label: "Mi Cuenta",    href: "/mi-cuenta" },
];

/**
 * SiteFooter — glassmorphic footer for public-facing pages only.
 * Auth and dashboard areas intentionally exclude this component.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-white/6 glass">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="
            font-heading font-bold text-[1.1rem] uppercase tracking-[-0.05em]
            text-[#d7f209]
            transition-opacity duration-200 hover:opacity-75
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#858BE3]/60 focus-visible:rounded-sm
          "
          aria-label="Miunix — volver al inicio"
        >
          Miunix
        </Link>

        {/* ── Nav links ── */}
        <nav aria-label="Navegación de pie de página">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="
                    text-sm text-zinc-400
                    transition-colors duration-200 hover:text-zinc-100
                    focus-visible:outline-none focus-visible:underline
                  "
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Copyright ── */}
        <p className="text-xs text-zinc-600 tabular-nums">
          © {year} Miunix. Todos los derechos reservados.
        </p>

      </div>
    </footer>
  );
}
