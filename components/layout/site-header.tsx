import Link from "next/link";
import { AuthSessionControls } from "@/components/auth/auth-session-controls";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Workflows", href: "/workflows" },
  { label: "Developers", href: "/developers" },
];

type SiteHeaderProps = {
  currentPath?: string;
};

export async function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
  ]);
  const isAdmin = profile?.role === "admin";
  const visibleNavItems = isAdmin ? [] : navItems;

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <Link
        href="/"
        className="w-fit font-heading text-[1.7rem] uppercase tracking-[-0.04em] !text-[#D7F205]"
        style={{ color: "#D7F205" }}
      >
        Miunix
      </Link>

      <nav className="flex justify-center lg:flex-1">
        {visibleNavItems.length > 0 ? (
          <div className="flex w-full max-w-max flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(88,88,88,0.85),rgba(56,56,56,0.92))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur">
            {visibleNavItems.map((item) => {
              const isActive = item.href === currentPath;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-[0.68rem] transition ${
                    isActive
                      ? "bg-white/10 text-[#d7f205]"
                      : "text-white/80 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : (
          <div />
        )}
      </nav>

      <AuthSessionControls
        isAuthenticated={Boolean(user)}
        isDeveloper={profile?.role === "developer"}
        isAdmin={isAdmin}
        currentPath={currentPath}
      />
    </header>
  );
}
