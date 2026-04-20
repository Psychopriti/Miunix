import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type AuthSessionControlsProps = {
  isAuthenticated: boolean;
  isDeveloper?: boolean;
  isAdmin?: boolean;
  isPremiumUser?: boolean;
  shouldShowMiunixPlus?: boolean;
  currentPath?: string;
};

export function AuthSessionControls({
  isAuthenticated,
  isDeveloper = false,
  isAdmin = false,
  isPremiumUser = false,
  shouldShowMiunixPlus = false,
  currentPath,
}: AuthSessionControlsProps) {
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Button
            asChild
            className={`h-auto rounded-full border px-4 py-2.5 text-[0.74rem] font-medium transition ${
              currentPath === "/review-center"
                ? "border-[#d9ff00]/30 bg-[#d9ff00] text-black hover:bg-[#e5ff45]"
                : "border-white/12 bg-white/6 text-white hover:bg-white/10"
            }`}
          >
            <Link href="/review-center">Review Center</Link>
          </Button>
        ) : null}

        {isDeveloper && !isAdmin ? (
          <Button
            asChild
            className={`h-auto rounded-full border px-4 py-2.5 text-[0.74rem] font-medium transition ${
              currentPath === "/dev-center"
                ? "border-[#d9ff00]/30 bg-[#d9ff00] text-black hover:bg-[#e5ff45]"
                : "border-white/12 bg-white/6 text-white hover:bg-white/10"
            }`}
          >
            <Link href="/dev-center">Dev Center</Link>
          </Button>
        ) : null}

        {shouldShowMiunixPlus ? (
          <Button
            asChild
            className={`h-auto rounded-full border px-4 py-2.5 text-[0.74rem] font-medium transition ${
              currentPath === "/miunix-plus" || currentPath === "/miunix-plus-center"
                ? "border-[#d9ff00]/30 bg-[#d9ff00] text-black hover:bg-[#e5ff45]"
                : "border-white/12 bg-white/6 text-white hover:bg-white/10"
            }`}
          >
            <Link href={isPremiumUser ? "/miunix-plus-center" : "/miunix-plus"}>
              {isPremiumUser ? "MIUNIX+ Center" : "MIUNIX+"}
            </Link>
          </Button>
        ) : null}

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
      <Link href="/login">Iniciar sesion</Link>
    </Button>
  );
}
