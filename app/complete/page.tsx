"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/quiz";

export default function Complete() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("jj_answers");
      if (saved) setAnswers(JSON.parse(saved));
    } catch {}
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = "https://jackie-jeans.vercel.app/";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 py-10"
      style={{ background: "var(--cream)" }}>
      
      {/* Success header */}
      <div className="text-center mt-8 mb-8 animate-fade-up">
        <div className="text-5xl mb-4">✨</div>
        <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "var(--charcoal)" }}>
          Your fit profile is ready!
        </h1>
        <p className="text-base" style={{ color: "var(--stone)" }}>
          We're taking you to Jackie Jeans in {countdown}s…
        </p>
      </div>

      {/* Summary card */}
      <div className="w-full max-w-sm rounded-2xl overflow-hidden mb-6 animate-fade-up"
        style={{ animationDelay: "0.1s", opacity: 0, border: "1px solid var(--sand)", background: "white" }}>
        <div className="px-5 py-3 text-sm font-semibold" style={{ background: "var(--indigo)", color: "white" }}>
          Your Fit Profile
        </div>
        <div className="divide-y" style={{ borderColor: "#f0ebe3" }}>
          {QUESTIONS.map(q => {
            const val = answers[q.id];
            if (!val) return null;
            let display = "";
            if (Array.isArray(val)) display = val.join(", ");
            else if (typeof val === "object") display = Object.entries(val as Record<string,string>).map(([k,v])=>`${k}: ${v}`).join(" · ");
            else display = val as string;
            if (display === "skipped") display = "—";
            return (
              <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: "var(--accent)", minWidth: 20 }}>Q{q.id}</span>
                <div className="min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: "var(--stone)" }}>{q.question.replace(" (Optional)", "")}</p>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--charcoal)" }}>{display}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-3 animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
        <button
          onClick={() => { window.location.href = "https://jackie-jeans.vercel.app/"; }}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95"
          style={{ background: "var(--indigo)" }}>
          Go to Jackie Jeans →
        </button>
        <button onClick={() => router.push("/")}
          className="w-full text-sm" style={{ color: "var(--stone)" }}>
          ← Take the quiz again
        </button>
      </div>
    </main>
  );
}
