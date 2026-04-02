import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <AuthShell
      currentPage="register"
      eyebrow="Registro"
      title="Crea usuarios reales para developers o users"
      description="El registro crea la cuenta en Supabase Auth, guarda el perfil en la base de datos y deja el rol listo para usar permisos despues."
      message={params?.message}
    >
      <form action={signUpAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/46">
            Nombre completo
          </span>
          <input
            required
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
            Tipo de cuenta
          </span>
          <select
            name="role"
            defaultValue="user"
            className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8f90ff]"
          >
            <option value="user" className="bg-[#0d0d0d] text-white">
              User
            </option>
            <option value="developer" className="bg-[#0d0d0d] text-white">
              Developer
            </option>
          </select>
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

      <p className="mt-5 text-sm text-white/60">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#8f90ff] hover:text-[#b2b2ff]">
          Inicia sesion aqui
        </Link>
      </p>
    </AuthShell>
  );
}
