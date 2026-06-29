export type QuestionType = "dropdown" | "number" | "single" | "multiselect" | "per-brand";

export interface Question {
  id: number;
  question: string;
  voicePrompt: string;
  type: QuestionType;
  options?: string[];
  optional?: boolean;
  dependsOn?: number;
}

const heights: string[] = [];
for (let ft = 4; ft <= 6; ft++) {
  const startIn = ft === 4 ? 10 : 0;
  const endIn = ft === 6 ? 2 : 11;
  for (let inch = startIn; inch <= endIn; inch++) {
    heights.push(`${ft}'${inch}"`);
  }
}

const waists: string[] = [];
for (let i = 24; i <= 52; i++) waists.push(`${i}"`);

const hips: string[] = [];
for (let i = 32; i <= 60; i++) hips.push(`${i}"`);

export const BRANDS = [
  "Levi's", "Wrangler", "Lee", "Gap", "H&M", "Zara", "Mango", "Forever 21",
  "Pepe Jeans", "Spykar", "Flying Machine", "Jack & Jones", "Vero Moda",
  "Only", "Roadster", "Bershka", "Pull&Bear", "American Eagle", "Hollister", "Uniqlo"
];

export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is your height?",
    voicePrompt: "Let's start! What's your height? You can say something like five foot six.",
    type: "dropdown",
    options: heights,
  },
  {
    id: 2,
    question: "What is your weight? (Optional)",
    voicePrompt: "What's your weight in kilograms or pounds? Feel free to skip this one — just say 'skip' if you'd prefer.",
    type: "number",
    optional: true,
  },
  {
    id: 3,
    question: "Waist measurement in inches (narrowest point)",
    voicePrompt: "What's your waist measurement in inches at the narrowest point?",
    type: "dropdown",
    options: waists,
  },
  {
    id: 4,
    question: "Hip measurement in inches (fullest point)",
    voicePrompt: "And your hip measurement in inches at the fullest point?",
    type: "dropdown",
    options: hips,
  },
  {
    id: 5,
    question: "How do you like your jeans to fit at the waist?",
    voicePrompt: "How do you like jeans to fit at the waist — snug, slightly relaxed, or relaxed?",
    type: "single",
    options: ["Snug", "Slightly relaxed", "Relaxed"],
  },
  {
    id: 6,
    question: "Where do you like the waistband to sit?",
    voicePrompt: "Where do you like the waistband to sit — high rise, mid rise, or low rise?",
    type: "single",
    options: ["High rise", "Mid rise", "Low rise"],
  },
  {
    id: 7,
    question: "How should jeans fit through the thighs?",
    voicePrompt: "How do you prefer jeans to fit through the thighs — fitted, relaxed, or loose?",
    type: "single",
    options: ["Fitted", "Relaxed", "Loose"],
  },
  {
    id: 8,
    question: "Which denim brands have you bought before?",
    voicePrompt: "Which denim brands have you bought jeans from before? Name as many as you like.",
    type: "multiselect",
    options: BRANDS,
  },
  {
    id: 9,
    question: "What size did you buy in those brands?",
    voicePrompt: "For each brand you mentioned, what size did you buy?",
    type: "per-brand",
    dependsOn: 8,
  },
  {
    id: 10,
    question: "What's your biggest fit frustration when buying jeans?",
    voicePrompt: "Last one! What's your biggest frustration when buying jeans?",
    type: "single",
    options: ["Waist gap", "Hip tightness", "Wrong length", "Thigh fit", "Rise", "Other"],
  },
];

export type Answers = Record<number, string | string[] | Record<string, string>>;
