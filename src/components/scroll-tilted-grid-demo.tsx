"use client";

import { ScrollTiltedGrid } from "@/components/ui/scroll-tilted-grid";

export default function ScrollTiltedGridDemo() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0c0a09] text-[#fafaf9]">
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
          A field of stills
        </h1>
        <p className="mt-4 max-w-md text-sm text-[#a8a29e]">
          Pictures rise from below, settle into focus, then tilt away as the page
          advances.
        </p>
      </section>

      <ScrollTiltedGrid loop />
    </main>
  );
}
