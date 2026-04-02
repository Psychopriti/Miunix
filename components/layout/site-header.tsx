import Link from "next/link";

import { AuthSessionControls } from "@/components/auth/auth-session-controls";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Precios", href: "#" },
  { label: "Developers", href: "#" },
  { label: "Inicio", href: "/" },
];

type SiteHeaderProps = {
  currentPath?: string;
};

export async function SiteHeader({ currentPath }: SiteHeaderProps) {
  const user = await getCurrentUser();

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <Link
        href="/"
        className="w-fit font-heading text-[1.7rem] uppercase tracking-[-0.04em] !text-[#D7F205]"
        style={{ color: "#D7F205" }}
      >
        Agent Flow
      </Link>

      <nav className="flex justify-center lg:flex-1">
        <div className="flex w-full max-w-max flex-wrap items-center justify-center gap-2 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(88,88,88,0.85),rgba(56,56,56,0.92))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur">
          {navItems.map((item) => {
            const isActive = item.href === currentPath;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-[0.72rem] transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/80 hover:bg-white/8 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthSessionControls isAuthenticated={Boolean(user)} />
    </header>
  );
}
