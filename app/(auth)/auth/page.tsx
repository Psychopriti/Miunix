import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction, signUpAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

type AuthPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;
  const message = params?.message;

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
              Entra y ejecuta agentes con tu propia sesion
            </h1>
            <p className="max-w-lg text-base leading-7 text-white/72">
              Ya dejamos la autenticacion conectada con Supabase y sincronizada
              con la tabla de perfiles. Desde aqui podes crear cuenta, iniciar
              sesion y entrar al dashboard protegido.
            </p>

            <div className="grid gap-4 pt-6 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  01
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Login y registro con email y password.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  02
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Perfil sincronizado automaticamente en Supabase.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  03
                </p>
                <p className="mt-3 text-sm text-white/78">
                  Dashboard protegido y listo para enganchar agentes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {message ? (
            <div className="rounded-[1.4rem] border border-[#d9ff00]/25 bg-[#d9ff00]/8 px-5 py-4 text-sm text-[#eff7c9]">
              {message}
            </div>
          ) : null}

          <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.26em] text-white/48">
              Iniciar sesion
            </p>

            <form action={signInAction} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
                  Email
                </span>
                <input
                  required
                  type="email"
                  name="email"
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                  placeholder="tu@correo.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
                  Password
                </span>
                <input
                  required
                  type="password"
                  name="password"
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                  placeholder="Minimo 6 caracteres"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-[#8f90ff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#a0a1ff]"
              >
                Entrar al dashboard
              </button>
            </form>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.26em] text-white/48">
              Crear cuenta
            </p>

            <form action={signUpAction} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
                  Nombre
                </span>
                <input
                  type="text"
                  name="fullName"
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
                  Email
                </span>
                <input
                  required
                  type="email"
                  name="email"
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                  placeholder="tu@correo.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
                  Password
                </span>
                <input
                  required
                  minLength={6}
                  type="password"
                  name="password"
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                  placeholder="Minimo 6 caracteres"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full border border-[#d9ff00]/30 bg-[#d9ff00] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e5ff45]"
              >
                Crear cuenta
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
