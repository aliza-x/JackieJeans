"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, BRANDS, Answers, Question } from "@/lib/quiz";

type VoiceState = "idle" | "speaking" | "listening" | "processing" | "done";

// Parse spoken height like "five foot six" -> "5'6\""
function parseHeight(text: string): string | null {
  const t = text.toLowerCase().trim();
  const wordNums: Record<string, number> = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12
  };
  const ftMatch = t.match(/(\w+)\s*(?:foot|feet|ft|')\s*(\w+)?/);
  if (ftMatch) {
    const ft = wordNums[ftMatch[1]] ?? parseInt(ftMatch[1]);
    const inch = ftMatch[2] ? (wordNums[ftMatch[2]] ?? parseInt(ftMatch[2])) : 0;
    if (!isNaN(ft) && !isNaN(inch)) return `${ft}'${inch}"`;
  }
  return null;
}

// Parse inches like "thirty" -> "30\""
function parseInches(text: string): string | null {
  const t = text.toLowerCase().trim();
  const wordNums: Record<string, number> = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
    seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60
  };
  const numMatch = t.match(/\d+/);
  if (numMatch) return `${numMatch[0]}"`;
  const words = t.split(/\s+/);
  let total = 0;
  for (const w of words) {
    if (wordNums[w] !== undefined) total += wordNums[w];
  }
  if (total > 0) return `${total}"`;
  return null;
}

// Match spoken text to one of the options
function matchOption(text: string, options: string[]): string | null {
  const t = text.toLowerCase().trim();
  // exact
  for (const o of options) {
    if (t.includes(o.toLowerCase())) return o;
  }
  // fuzzy first word
  for (const o of options) {
    if (t.includes(o.split(" ")[0].toLowerCase())) return o;
  }
  return null;
}

// Match brands from spoken text
function matchBrands(text: string): string[] {
  const t = text.toLowerCase();
  return BRANDS.filter(b => t.includes(b.toLowerCase()));
}

export default function VoiceQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<Answers>({});
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [caption, setCaption] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [perBrandStep, setPerBrandStep] = useState(0); // for Q9, which brand we're on
  const [partialBrandSizes, setPartialBrandSizes] = useState<Record<string, string>>({});

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<{ abort: () => void } | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      synthRef.current?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      synthRef.current?.cancel();
      setCaption(text);
      setVoiceState("speaking");
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.pitch = 1.05;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      synthRef.current?.speak(utt);
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR = (window as unknown as { SpeechRecognition?: new() => { start: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onerror: unknown; onend: unknown }; webkitSpeechRecognition?: new() => { start: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onerror: unknown; onend: unknown } }).SpeechRecognition || 
                 (window as unknown as { SpeechRecognition?: new() => { start: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onerror: unknown; onend: unknown }; webkitSpeechRecognition?: new() => { start: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: unknown; onerror: unknown; onend: unknown } }).webkitSpeechRecognition;
      if (!SR) { resolve(""); return; }
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-US";
      recognitionRef.current = r;
      setVoiceState("listening");
      setTranscript("");
      isListeningRef.current = true;
      r.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
        const t = e.results[0][0].transcript;
        setTranscript(t);
        isListeningRef.current = false;
        resolve(t);
      };
      r.onerror = () => { isListeningRef.current = false; resolve(""); };
      r.onend = () => { if (isListeningRef.current) { isListeningRef.current = false; resolve(""); } };
      r.start();
    });
  }, []);

  const processAnswer = useCallback(async (q: Question, text: string, stepNum: number, pbSizes?: Record<string, string>, pbStep?: number): Promise<{ success: boolean; confirmation?: string }> => {
    const t = text.toLowerCase();

    // Q2 optional skip
    if (q.optional && (t.includes("skip") || t.includes("pass") || t.includes("no") || t.trim() === "")) {
      setAnswers(prev => ({ ...prev, [q.id]: "skipped" }));
      return { success: true, confirmation: "No problem, we'll skip that." };
    }

    if (q.type === "dropdown" && q.id === 1) {
      const h = parseHeight(text);
      if (h && q.options?.includes(h)) {
        setAnswers(prev => ({ ...prev, [q.id]: h }));
        return { success: true, confirmation: `Got it — ${h}.` };
      }
      return { success: false };
    }

    if (q.type === "dropdown" && (q.id === 3 || q.id === 4)) {
      const inches = parseInches(text);
      if (inches && q.options?.includes(inches)) {
        setAnswers(prev => ({ ...prev, [q.id]: inches }));
        return { success: true, confirmation: `${q.id === 3 ? "Waist" : "Hips"} — ${inches}. Got it.` };
      }
      return { success: false };
    }

    if (q.type === "number") {
      const numMatch = text.match(/\d+/);
      if (numMatch) {
        setAnswers(prev => ({ ...prev, [q.id]: numMatch[0] }));
        return { success: true, confirmation: `${numMatch[0]} — noted.` };
      }
      return { success: false };
    }

    if (q.type === "single") {
      const match = matchOption(text, q.options!);
      if (match) {
        setAnswers(prev => ({ ...prev, [q.id]: match }));
        return { success: true, confirmation: `${match} — perfect.` };
      }
      return { success: false };
    }

    if (q.type === "multiselect") {
      const brands = matchBrands(text);
      if (brands.length > 0) {
        setAnswers(prev => ({ ...prev, [q.id]: brands }));
        const list = brands.length <= 3 ? brands.join(", ") : `${brands.length} brands`;
        return { success: true, confirmation: `Got it — ${list}.` };
      }
      return { success: false };
    }

    if (q.type === "per-brand") {
      const selectedBrands = (answers[8] as string[]) || [];
      const currentBrand = selectedBrands[pbStep ?? 0];
      const numMatch = text.match(/\d+/);
      const sizeText = numMatch ? numMatch[0] : text.trim().split(/\s+/)[0];
      if (sizeText) {
        const newSizes = { ...(pbSizes || {}), [currentBrand]: sizeText };
        setPartialBrandSizes(newSizes);
        if ((pbStep ?? 0) >= selectedBrands.length - 1) {
          setAnswers(prev => ({ ...prev, [q.id]: newSizes }));
          return { success: true, confirmation: `${sizeText} in ${currentBrand}. All done!` };
        } else {
          return { success: true, confirmation: `${sizeText} in ${currentBrand}.` };
        }
      }
      return { success: false };
    }

    return { success: false };
  }, [answers]);

  const runQuestion = useCallback(async (stepNum: number, pbStep: number = 0, pbSizes: Record<string, string> = {}) => {
    if (stepNum >= QUESTIONS.length) {
      await speak("You're all done! Let me take you to your results now.");
      setVoiceState("done");
      sessionStorage.setItem("jj_answers", JSON.stringify(answers));
      setTimeout(() => router.push("/complete"), 1500);
      return;
    }

    const q = QUESTIONS[stepNum];
    let prompt = q.voicePrompt;

    // Q9: ask per brand
    if (q.type === "per-brand") {
      const selectedBrands = (answers[8] as string[]) || [];
      if (selectedBrands.length === 0) {
        setAnswers(prev => ({ ...prev, [q.id]: {} }));
        runQuestion(stepNum + 1);
        return;
      }
      const brand = selectedBrands[pbStep];
      prompt = pbStep === 0
        ? `Great. Now, for each brand, what size did you usually buy? Starting with ${brand} — what was your size?`
        : `And in ${brand}?`;
    }

    await speak(prompt);

    let retries = 0;
    while (retries < 2) {
      const text = await listen();
      setVoiceState("processing");
      await new Promise(r => setTimeout(r, 300));

      const result = await processAnswer(q, text, stepNum, pbSizes, pbStep);

      if (result.success) {
        await speak(result.confirmation || "Got it.");

        // Q9 per-brand: loop through brands
        if (q.type === "per-brand") {
          const selectedBrands = (answers[8] as string[]) || [];
          const nextBrandStep = pbStep + 1;
          const currentSizes = { ...pbSizes };
          // get the brand that was just answered
          const brand = selectedBrands[pbStep];
          const numMatch = text.match(/\d+/);
          currentSizes[brand] = numMatch ? numMatch[0] : text.trim().split(/\s+/)[0];

          if (nextBrandStep < selectedBrands.length) {
            setPerBrandStep(nextBrandStep);
            await runQuestion(stepNum, nextBrandStep, currentSizes);
          } else {
            setAnswers(prev => ({ ...prev, [q.id]: currentSizes }));
            runQuestion(stepNum + 1);
          }
          return;
        }

        runQuestion(stepNum + 1);
        return;
      } else {
        retries++;
        if (retries < 2) {
          await speak("Sorry, I didn't catch that. Could you say that again?");
        } else {
          await speak("No worries, let's move on.");
          runQuestion(stepNum + 1);
          return;
        }
      }
    }
  }, [speak, listen, processAnswer, answers, router]);

  async function startVoice() {
    setStep(0);
    await speak("Hi! I'm your Jackie Jeans stylist. I'll ask you a few quick questions to find your perfect fit. Let's go!");
    await runQuestion(0);
  }

  const selectedBrands = (answers[8] as string[]) || [];

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "var(--charcoal)" }}>

      {step === -1 ? (
        // Intro
        <div className="text-center animate-fade-up">
          <span className="text-6xl mb-6 block">🎙️</span>
          <h1 className="font-display text-3xl font-bold mb-3 text-white">AI Stylist</h1>
          <p className="text-base mb-2" style={{ color: "var(--sand)" }}>
            Talk naturally — we'll handle the rest
          </p>
          <p className="text-sm mb-10 max-w-xs mx-auto" style={{ color: "var(--stone)" }}>
            Make sure your speaker and microphone are on. We'll ask 10 questions out loud.
          </p>
          <button onClick={startVoice}
            className="px-10 py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-95"
            style={{ background: "var(--accent)" }}>
            Start Talking →
          </button>
          <div className="mt-6">
            <button onClick={() => router.push("/")} className="text-sm" style={{ color: "var(--stone)" }}>
              ← Back
            </button>
          </div>
        </div>
      ) : voiceState === "done" ? (
        <div className="text-center animate-fade-up">
          <span className="text-5xl mb-4 block">✅</span>
          <h2 className="font-display text-2xl font-bold text-white mb-2">All done!</h2>
          <p style={{ color: "var(--sand)" }}>Taking you to your results…</p>
        </div>
      ) : (
        <div className="w-full max-w-sm text-center">
          {/* Progress */}
          <div className="mb-8">
            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: "#333" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((step / QUESTIONS.length) * 100)}%`,
                  background: "var(--accent)"
                }} />
            </div>
            <p className="text-xs" style={{ color: "var(--stone)" }}>
              Question {Math.min(step + 1, QUESTIONS.length)} of {QUESTIONS.length}
            </p>
          </div>

          {/* Voice orb */}
          <div className="relative flex items-center justify-center mb-8" style={{ height: 160 }}>
            {voiceState === "listening" && (
              <div className="absolute rounded-full"
                style={{
                  width: 120, height: 120,
                  background: "var(--accent)",
                  opacity: 0.15
                }} />
            )}
            <div className={`relative rounded-full flex items-center justify-center transition-all duration-300
              ${voiceState === "listening" ? "scale-110" : "scale-100"}`}
              style={{
                width: 100, height: 100,
                background: voiceState === "listening" ? "var(--accent)" :
                  voiceState === "speaking" ? "var(--indigo)" : "#333"
              }}>
              <span className="text-3xl">
                {voiceState === "listening" ? "🎤" :
                  voiceState === "speaking" ? "🔊" :
                  voiceState === "processing" ? "⏳" : "•••"}
              </span>
            </div>

            {/* Wave bars when listening */}
            {voiceState === "listening" && (
              <div className="absolute flex items-center gap-1" style={{ bottom: 10 }}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="wave-bar rounded-full"
                    style={{
                      width: 4, height: 24,
                      background: "var(--accent)",
                      animationDelay: `${i * 0.12}s`
                    }} />
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="min-h-20 mb-4">
            {caption && (
              <p className="text-base font-medium leading-relaxed text-white animate-fade-in">
                {caption}
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="rounded-xl px-4 py-3 mb-4 text-left animate-fade-in"
              style={{ background: "#2a2a2a" }}>
              <p className="text-xs mb-1" style={{ color: "var(--stone)" }}>You said:</p>
              <p className="text-sm text-white">"{transcript}"</p>
            </div>
          )}

          {/* State label */}
          <p className="text-xs" style={{ color: "var(--stone)" }}>
            {voiceState === "speaking" ? "AI is speaking…" :
              voiceState === "listening" ? "Listening… speak now" :
              voiceState === "processing" ? "Processing…" : ""}
          </p>

          {/* Selected brands display for Q9 */}
          {QUESTIONS[step]?.type === "per-brand" && selectedBrands.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-xs mb-2" style={{ color: "var(--stone)" }}>Sizes collected:</p>
              <div className="flex flex-wrap gap-2">
                {selectedBrands.map(b => (
                  <span key={b} className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: partialBrandSizes[b] ? "var(--accent)" : "#333",
                      color: "white"
                    }}>
                    {b}{partialBrandSizes[b] ? `: ${partialBrandSizes[b]}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
