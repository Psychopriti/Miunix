"use client";

import { TextEffect } from "@/components/ui/text-effect";

export function DevelopersHeading() {
  return (
    <TextEffect
      as="h1"
      per="word"
      preset="blur"
      delay={0.1}
      speedReveal={1.5}
      className="font-heading text-center text-[2.65rem] uppercase leading-none tracking-[-0.04em] text-white sm:text-[4.1rem]"
    >
      Developers Destacados
    </TextEffect>
  );
}
