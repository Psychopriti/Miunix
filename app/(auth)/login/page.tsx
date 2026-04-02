import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <AuthShell
      currentPage="login"
      eyebrow="Login"
      title="Entra a tu cuenta y continua tu flujo"
      description="Inicia sesion con tu correo y contraseña. Si tu cuenta ya existe, entraras directo al dashboard."
      message={params?.message}
    >
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
            placeholder="Tu contraseña"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-[#8f90ff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#a0a1ff]"
        >
          Entrar al dashboard
        </button>
      </form>

      <p className="mt-5 text-sm text-white/60">
        No tienes cuenta?{" "}
        <Link href="/register" className="text-[#d9ff00] hover:text-[#efff7d]">
          Crea una aqui
        </Link>
      </p>
    </AuthShell>
  );
}
