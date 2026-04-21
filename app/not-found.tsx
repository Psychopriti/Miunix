import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#09090b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(217,255,0,0.14),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(133,139,227,0.12),transparent_30%)]" />
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-[#d9ff00]/20 blur-2xl" />
          <div className="relative rounded-[2rem] border border-[#d9ff00]/25 bg-[#d9ff00] p-4 shadow-[0_24px_80px_rgba(217,255,0,0.18)]">
            <Image
              src="/brand/miunix-mark.svg"
              alt="Robot Miunix"
              width={132}
              height={132}
              priority
              className="h-32 w-32 rounded-[1.4rem]"
            />
          </div>
        </div>

        <p className="mt-8 text-xs font-medium uppercase tracking-[0.28em] text-[#d9ff00]/70">
          Error 404
        </p>
        <h1 className="mt-3 max-w-2xl text-balance font-heading text-[3rem] font-bold leading-[0.95] tracking-[-0.06em] text-white sm:text-[4.5rem]">
          Este agente no encontro la ruta
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/58">
          La pagina que buscas no existe o fue movida. Puedes volver al inicio,
          explorar agentes listos o revisar workflows para encontrar una ruta util.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#d9ff00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e8ff33]"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
            Explorar marketplace
          </Link>
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ver workflows
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
