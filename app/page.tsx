"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--cream)" }}>
      
      {/* Logo */}
      <div className="mb-12 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-2">
          <span style={{ fontSize: 28 }}>🪡</span>
          <span className="font-display text-2xl font-bold" style={{ color: "var(--indigo)" }}>
            Jackie Jeans
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--stone)" }}>Smart Fit Technology</p>
      </div>

      {/* Hero */}
      <div className="text-center mb-12 animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <h1 className="font-display text-4xl font-bold mb-4 leading-tight"
          style={{ color: "var(--charcoal)" }}>
          Jeans that<br />actually fit.
        </h1>
        <p className="text-base max-w-xs mx-auto leading-relaxed" style={{ color: "var(--stone)" }}>
          Answer a few quick questions and we'll find your perfect pair — no guesswork, no returns.
        </p>
      </div>

      {/* Flow selection */}
      <div className="w-full max-w-sm space-y-4 animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
        
        <Link href="/quiz/manual" className="block">
          <div className="rounded-2xl p-5 border-2 transition-all active:scale-95"
            style={{ background: "var(--indigo)", borderColor: "var(--indigo)", color: "white" }}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">📋</div>
              <div>
                <div className="font-semibold text-base mb-0.5">Fill it in yourself</div>
                <div className="text-sm opacity-70">Quick form, one step at a time</div>
              </div>
              <div className="ml-auto text-xl opacity-50">→</div>
            </div>
          </div>
        </Link>

        <Link href="/quiz/voice" className="block">
          <div className="rounded-2xl p-5 border-2 transition-all active:scale-95"
            style={{ background: "white", borderColor: "var(--sand)", color: "var(--charcoal)" }}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎙️</div>
              <div>
                <div className="font-semibold text-base mb-0.5">Talk to our AI stylist</div>
                <div className="text-sm" style={{ color: "var(--stone)" }}>Voice-guided, hands-free</div>
              </div>
              <div className="ml-auto text-xl" style={{ color: "var(--sand)" }}>→</div>
            </div>
          </div>
        </Link>
      </div>

      <p className="mt-8 text-xs text-center animate-fade-up" style={{ color: "var(--stone)", animationDelay: "0.3s", opacity: 0 }}>
        Takes about 2 minutes · No account needed
      </p>
    </main>
  );
}
