import Link from "next/link";

type AuthShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  currentPage: "login" | "register";
  children: React.ReactNode;
  message?: string;
};

export function AuthShell({
  title,
  eyebrow,
  description,
  currentPage,
  children,
  message,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#050505] px-5 py-6 text-white sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(217,255,0,0.12),transparent_26%),linear-gradient(180deg,#0b0b0b,#060606)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-10">
          <Link
            href="/"
            className="font-heading text-[1.7rem] uppercase tracking-[-0.04em] text-[#D7F205]"
          >
            Agent Flow
          </Link>

          <div className="mt-12 max-w-xl space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-[#a3c319]">
              Supabase Auth
            </p>
            <h1 className="text-balance font-heading text-[2.7rem] uppercase leading-[0.92] tracking-[-0.06em] text-white sm:text-[4.1rem]">
              {title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-white/72">
              {description}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/login"
                className={`rounded-full px-5 py-3 text-sm transition ${
                  currentPage === "login"
                    ? "bg-[#8f90ff] text-white"
                    : "border border-white/12 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
                }`}
              >
                Iniciar sesion
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-5 py-3 text-sm transition ${
                  currentPage === "register"
                    ? "bg-[#d9ff00] text-black"
                    : "border border-white/12 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
                }`}
              >
                Crear cuenta
              </Link>
            </div>

            <div className="grid gap-4 pt-6 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  01
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Email y password con Supabase Auth.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  02
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Perfil sincronizado con rol user o developer.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  03
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Dashboard protegido y sesion persistente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {message ? (
            <div className="mb-5 rounded-[1.4rem] border border-[#d9ff00]/25 bg-[#d9ff00]/8 px-5 py-4 text-sm text-[#eff7c9]">
              {message}
            </div>
          ) : null}

          <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-7">
            <p className="text-sm uppercase tracking-[0.26em] text-white/48">
              {eyebrow}
            </p>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
