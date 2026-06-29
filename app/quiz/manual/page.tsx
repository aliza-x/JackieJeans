"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, BRANDS, Answers } from "@/lib/quiz";

export default function ManualQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const totalSteps = QUESTIONS.length;
  const currentQ = step > 0 ? QUESTIONS[step - 1] : null;

  // Q9 uses brands selected in Q8
  const selectedBrands: string[] = step > 0 && currentQ?.dependsOn
    ? ((answers[8] as string[]) || [])
    : [];

  function next() {
    if (step === 0) { animate(() => setStep(1)); return; }
    const q = QUESTIONS[step - 1];

    // Validate
    if (!q.optional) {
      const val = answers[q.id];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        setError("Please answer this before continuing.");
        return;
      }
      if (q.type === "per-brand") {
        const bmap = val as Record<string, string>;
        if (selectedBrands.some(b => !bmap[b])) {
          setError("Please fill in a size for each brand.");
          return;
        }
      }
    }
    setError("");

    if (step >= totalSteps) {
      // Done — store and redirect
      sessionStorage.setItem("jj_answers", JSON.stringify(answers));
      router.push("/complete");
      return;
    }
    animate(() => setStep(s => s + 1));
  }

  function back() {
    setError("");
    if (step <= 1) { animate(() => setStep(0)); return; }
    animate(() => setStep(s => s - 1));
  }

  function animate(fn: () => void) {
    setTransitioning(true);
    setTimeout(() => { fn(); setTransitioning(false); }, 200);
  }

  function setAnswer(id: number, val: string | string[] | Record<string, string>) {
    setAnswers(prev => ({ ...prev, [id]: val }));
    setError("");
  }

  function toggleBrand(brand: string) {
    const cur = (answers[8] as string[]) || [];
    const next = cur.includes(brand) ? cur.filter(b => b !== brand) : [...cur, brand];
    setAnswer(8, next);
    // Clear per-brand sizes for deselected brands
    if (!next.includes(brand)) {
      const sizes = { ...((answers[9] as Record<string, string>) || {}) };
      delete sizes[brand];
      setAnswer(9, sizes);
    }
  }

  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  // ---- INTRO ----
  if (step === 0) {
    return (
      <main className="min-h-dvh flex flex-col px-6 py-10"
        style={{ background: "var(--cream)" }}>
        <button onClick={() => router.push("/")} className="text-sm mb-8"
          style={{ color: "var(--stone)" }}>← Back</button>
        <div className="flex-1 flex flex-col justify-center animate-fade-up">
          <span className="text-5xl mb-6">📋</span>
          <h1 className="font-display text-3xl font-bold mb-4"
            style={{ color: "var(--charcoal)" }}>Your Fit Quiz</h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: "var(--stone)" }}>
            We'll ask you 10 quick questions about your measurements and style preferences.
            It takes about 2 minutes.
          </p>
          <ul className="space-y-2 mb-10">
            {["Measurements (height, waist, hips)", "Style preferences", "Past brand experience"].map(t => (
              <li key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--charcoal)" }}>
                <span style={{ color: "var(--accent)" }}>✓</span> {t}
              </li>
            ))}
          </ul>
          <button onClick={next}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95"
            style={{ background: "var(--indigo)" }}>
            Start Quiz →
          </button>
        </div>
      </main>
    );
  }

  const q = currentQ!;
  const val = answers[q.id];

  return (
    <main className="min-h-dvh flex flex-col px-6 py-10" style={{ background: "var(--cream)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={back} className="text-xl" style={{ color: "var(--stone)" }}>←</button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--sand)", opacity: 0.4 }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--indigo)" }} />
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--stone)" }}>
          {step}/{totalSteps}
        </span>
      </div>

      {/* Question */}
      <div className={`flex-1 flex flex-col transition-opacity duration-200 ${transitioning ? "opacity-0" : "opacity-100"}`}>
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
            Question {step}
          </p>
          <h2 className="font-display text-2xl font-bold leading-snug" style={{ color: "var(--charcoal)" }}>
            {q.question}
          </h2>
          {q.optional && (
            <p className="text-sm mt-1" style={{ color: "var(--stone)" }}>Optional — you can skip this</p>
          )}
        </div>

        {/* Input types */}
        <div className="flex-1">
          {q.type === "dropdown" && (
            <select
              className="w-full px-4 py-3.5 rounded-xl text-base border-2 appearance-none"
              style={{ borderColor: val ? "var(--indigo)" : "var(--sand)", background: "white", color: "var(--charcoal)", outline: "none" }}
              value={(val as string) || ""}
              onChange={e => setAnswer(q.id, e.target.value)}>
              <option value="">Select...</option>
              {q.options!.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}

          {q.type === "number" && (
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Enter weight (e.g. 65)"
                className="w-full px-4 py-3.5 rounded-xl text-base border-2"
                style={{ borderColor: val ? "var(--indigo)" : "var(--sand)", background: "white", color: "var(--charcoal)", outline: "none" }}
                value={(val as string) || ""}
                onChange={e => setAnswer(q.id, e.target.value)}
              />
              <button onClick={() => { setAnswer(q.id, "skipped"); next(); }}
                className="text-sm underline" style={{ color: "var(--stone)" }}>
                Skip this question
              </button>
            </div>
          )}

          {q.type === "single" && (
            <div className="space-y-3">
              {q.options!.map(opt => (
                <button key={opt} onClick={() => setAnswer(q.id, opt)}
                  className="w-full text-left px-4 py-3.5 rounded-xl border-2 text-base font-medium transition-all active:scale-95"
                  style={{
                    borderColor: val === opt ? "var(--indigo)" : "var(--sand)",
                    background: val === opt ? "var(--indigo)" : "white",
                    color: val === opt ? "white" : "var(--charcoal)"
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "multiselect" && (
            <div className="grid grid-cols-2 gap-2">
              {BRANDS.map(brand => {
                const sel = ((val as string[]) || []).includes(brand);
                return (
                  <button key={brand} onClick={() => toggleBrand(brand)}
                    className="text-sm px-3 py-2.5 rounded-xl border-2 font-medium transition-all active:scale-95 text-left"
                    style={{
                      borderColor: sel ? "var(--indigo)" : "var(--sand)",
                      background: sel ? "var(--indigo)" : "white",
                      color: sel ? "white" : "var(--charcoal)"
                    }}>
                    {brand}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "per-brand" && (
            <div className="space-y-4">
              {selectedBrands.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--stone)" }}>
                  (No brands selected in the previous step)
                </p>
              ) : (
                selectedBrands.map(brand => {
                  const sizes = (val as Record<string, string>) || {};
                  return (
                    <div key={brand}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--charcoal)" }}>
                        {brand}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 30, W32/L30, M..."
                        className="w-full px-4 py-3 rounded-xl border-2 text-base"
                        style={{
                          borderColor: sizes[brand] ? "var(--indigo)" : "var(--sand)",
                          background: "white", color: "var(--charcoal)", outline: "none"
                        }}
                        value={sizes[brand] || ""}
                        onChange={e => setAnswer(q.id, { ...sizes, [brand]: e.target.value })}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--error)" }}>{error}</p>
        )}

        {/* Next button */}
        <div className="mt-8 pb-6">
          <button onClick={next}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95"
            style={{ background: "var(--indigo)" }}>
            {step >= totalSteps ? "See My Results →" : "Continue →"}
          </button>
        </div>
      </div>
    </main>
  );
}
