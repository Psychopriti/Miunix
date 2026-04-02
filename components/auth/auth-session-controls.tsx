import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type AuthSessionControlsProps = {
  isAuthenticated: boolean;
};

export function AuthSessionControls({
  isAuthenticated,
}: AuthSessionControlsProps) {
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          className="h-auto rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-[0.74rem] font-medium text-white hover:bg-white/10"
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>

        <form action={signOutAction}>
          <Button
            type="submit"
            className="h-auto rounded-full border-0 bg-[#8f90ff] px-5 py-3 text-[0.76rem] font-medium text-white shadow-[0_12px_30px_rgba(143,144,255,0.35)] hover:bg-[#a0a1ff]"
          >
            Cerrar sesion
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Button
      asChild
      className="h-auto rounded-full border-0 bg-[#8f90ff] px-5 py-3 text-[0.76rem] font-medium text-white shadow-[0_12px_30px_rgba(143,144,255,0.35)] hover:bg-[#a0a1ff]"
    >
      <Link href="/auth">Iniciar sesion</Link>
    </Button>
  );
}
