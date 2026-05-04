"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── API Response Types ───────────────────────────────────────────────────────

type RoutineStep = {
  time?: string;
  hour?: string;
  title?: string;
  name?: string;
  step?: string;
  description?: string;
  detail?: string;
  tip?: string;
  priority?: boolean;
};

type SkinConcern = {
  name: string;
  description?: string;
  severity?: string;
  location?: string;
  intensity?: number | string;
  priority?: boolean;
};

type SkinRecommendation = {
  name?: string;
  ingredient?: string;
  product?: string;
  description?: string;
  reason?: string;
  category?: string;
  type?: string;
};

type RawSkinAnalysis = {
  health_score?: number;
  overall_score?: number;
  score?: number;
  skin_type?: string;
  skin_tone?: string;
  age_estimate?: number | string;
  estimated_age?: number | string;
  timestamp?: string;
  message?: string;
  metrics?: Record<string, number | string>;
  analysis?: Record<string, number | string | SkinConcern[]>;
  skin_metrics?: Record<string, number | string>;
  hydration?: number | string;
  elasticity?: number | string;
  luminosity?: number | string;
  sensitivity?: number | string;
  uv_damage?: number | string;
  oiliness?: number | string;
  pores?: number | string;
  acne?: number | string;
  wrinkles?: number | string;
  dark_spots?: number | string;
  redness?: number | string;
  texture?: number | string;
  firmness?: number | string;
  radiance?: number | string;
  sebum?: number | string;
  erythema?: number | string;
  fine_lines?: number | string;
  blemishes?: number | string;
  uv?: number | string;
  brightness?: number | string;
  hyperpigmentation_score?: number | string;
  concerns?: SkinConcern[] | string[];
  issues?: SkinConcern[] | string[];
  detected_concerns?: SkinConcern[] | string[];
  conditions?: SkinConcern[] | string[];
  skin_issues?: SkinConcern[] | string[];
  recommendations?: SkinRecommendation[] | string[];
  routine?: SkinRecommendation[] | RoutineStep[] | Record<string, string | SkinRecommendation[]>;
  products?: SkinRecommendation[] | string[];
  ingredients?: SkinRecommendation[] | string[];
  suggested_ingredients?: SkinRecommendation[] | string[];
  [key: string]: unknown;
};

// ─── Dev scenarios ────────────────────────────────────────────────────────────

type DevScenario = { label: string; emoji: string; tag: string; data: RawSkinAnalysis };

const DEV_SCENARIOS: DevScenario[] = [
  {
    label: "Healthy Glow",
    emoji: "✨",
    tag: "Good",
    data: {
      health_score: 87,
      skin_type: "Combination",
      age_estimate: 28,
      hydration: 76,
      elasticity: 84,
      luminosity: 79,
      sensitivity: 12,
      uv_damage: 8,
      oiliness: 35,
      pores: 22,
      texture: 81,
      concerns: [
        { name: "Mild Dehydration", severity: "low", description: "Slight moisture deficit in the T-zone. Increase water intake.", priority: false },
      ],
      recommendations: [
        { product: "Hydra-Boost Serum", ingredient: "Hyaluronic Acid", reason: "Replenish moisture to the T-zone and lock in hydration.", category: "Hydration" },
        { product: "Glow Activator", ingredient: "Niacinamide 10%", reason: "Maintain luminosity and refine open pores.", category: "Radiance" },
        { product: "Daily Shield SPF 50", ingredient: "Zinc Oxide", reason: "Protect against low UV exposure and prevent premature ageing.", category: "Protection" },
      ],
    },
  },
  {
    label: "Acne-Prone",
    emoji: "🔴",
    tag: "Needs Attention",
    data: {
      health_score: 52,
      skin_type: "Oily",
      age_estimate: 22,
      hydration: 38,
      elasticity: 70,
      luminosity: 44,
      sensitivity: 68,
      uv_damage: 14,
      oiliness: 82,
      acne: 71,
      pores: 76,
      texture: 40,
      concerns: [
        { name: "Active Acne", severity: "high", description: "Moderate comedonal and inflammatory lesions across T-zone and cheeks.", priority: true, intensity: 71 },
        { name: "Excess Sebum", severity: "high", description: "Overactive sebaceous glands detected. Pore congestion likely.", priority: true },
        { name: "Dehydration", severity: "medium", description: "Skin appears tight despite oiliness — a common paradox.", priority: false },
      ],
      recommendations: [
        { product: "Salicylic Cleanser", ingredient: "Salicylic Acid 2%", reason: "Dissolve excess sebum and clear blocked follicles.", category: "Clarifying" },
        { product: "Benzoyl Spot Gel", ingredient: "Benzoyl Peroxide 5%", reason: "Target active lesions and reduce bacterial load.", category: "Treatment" },
        { product: "Oil-Free Gel Moisturiser", ingredient: "Centella Asiatica", reason: "Hydrate without clogging pores. Essential for dehydrated-oily skin.", category: "Hydration" },
        { product: "Niacinamide B3 Serum", ingredient: "Niacinamide 10%", reason: "Regulate sebum production and fade post-acne marks.", category: "Control" },
      ],
    },
  },
  {
    label: "Hyperpigmented",
    emoji: "🌑",
    tag: "Priority",
    data: {
      health_score: 65,
      skin_type: "Normal-Dry",
      age_estimate: 35,
      hydration: 62,
      elasticity: 74,
      luminosity: 38,
      sensitivity: 28,
      uv_damage: 54,
      dark_spots: 72,
      hyperpigmentation_score: 68,
      texture: 58,
      concerns: [
        { name: "Hyperpigmentation", severity: "high", description: "Post-inflammatory and solar-induced discolouration in cheek region.", location: "Bilateral cheeks", priority: true, intensity: "68%" },
        { name: "UV Damage", severity: "moderate", description: "Cumulative sun exposure accelerating melanin production.", priority: true },
        { name: "Uneven Texture", severity: "low", description: "Surface roughness from repeated inflammation cycles.", priority: false },
      ],
      recommendations: [
        { product: "C-Glow 15% Serum", ingredient: "Vitamin C (L-Ascorbic Acid)", reason: "Inhibit tyrosinase and neutralise free radicals causing discolouration.", category: "Brightening" },
        { product: "Alpha Arbutin 2%", ingredient: "Alpha Arbutin", reason: "Reduce melanin synthesis at the source for even skin tone.", category: "Brightening" },
        { product: "Broad-Spectrum SPF 50+", ingredient: "Titanium Dioxide", reason: "Prevent further UV-induced pigmentation. Non-negotiable.", category: "Protection" },
        { product: "AHA Resurfacer", ingredient: "Glycolic Acid 8%", reason: "Accelerate cell turnover to fade existing dark spots.", category: "Exfoliation" },
      ],
    },
  },
  {
    label: "Dry & Sensitive",
    emoji: "🌵",
    tag: "Protective",
    data: {
      health_score: 59,
      skin_type: "Dry-Sensitive",
      age_estimate: 42,
      hydration: 24,
      elasticity: 55,
      luminosity: 49,
      sensitivity: 88,
      uv_damage: 22,
      redness: 64,
      texture: 43,
      pores: 14,
      concerns: [
        { name: "Impaired Barrier", severity: "high", description: "Transepidermal water loss significantly elevated. Barrier function compromised.", priority: true },
        { name: "Chronic Redness", severity: "moderate", description: "Vasodilation and reactive flushing pattern detected across nasal bridge and cheeks.", location: "Nasal bridge, cheeks", priority: true },
        { name: "Fine Lines", severity: "low", description: "Early periorbital fine lines linked to dehydration, not age.", priority: false },
      ],
      recommendations: [
        { product: "Ceramide Repair Cream", ingredient: "Ceramides NP + AP", reason: "Restore lipid matrix and seal compromised barrier function.", category: "Repair" },
        { product: "Azelaic Acid 10%", ingredient: "Azelaic Acid", reason: "Calm redness, reduce erythema, and improve skin evenness gently.", category: "Calming" },
        { product: "Squalane Oil", ingredient: "Squalane", reason: "Occlusive hydration without irritation. Perfect for reactive skin.", category: "Moisturising" },
        { product: "Mineral SPF 30", ingredient: "Zinc Oxide", reason: "Mineral-only formula to avoid chemical filter irritation.", category: "Protection" },
      ],
    },
  },
];

// ─── Normalisation helpers ────────────────────────────────────────────────────

type SkinMetric = { label: string; value: number };
type ExtraField = { key: string; value: string };

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

const METRIC_KEYS: Array<{ keys: string[]; label: string; higherIsBetter: boolean }> = [
  { keys: ["hydration"], label: "Hydration", higherIsBetter: true },
  { keys: ["elasticity", "firmness"], label: "Elasticity", higherIsBetter: true },
  { keys: ["luminosity", "radiance", "brightness"], label: "Luminosity", higherIsBetter: true },
  { keys: ["sensitivity"], label: "Sensitivity", higherIsBetter: false },
  { keys: ["uv_damage", "uv"], label: "UV Damage", higherIsBetter: false },
  { keys: ["oiliness", "sebum"], label: "Oiliness", higherIsBetter: false },
  { keys: ["acne", "blemishes"], label: "Acne", higherIsBetter: false },
  { keys: ["pores"], label: "Pores", higherIsBetter: false },
  { keys: ["texture"], label: "Texture", higherIsBetter: true },
  { keys: ["wrinkles", "fine_lines"], label: "Wrinkles", higherIsBetter: false },
  { keys: ["redness", "erythema"], label: "Redness", higherIsBetter: false },
  { keys: ["dark_spots", "hyperpigmentation_score"], label: "Dark Spots", higherIsBetter: false },
];

function extractScore(raw: RawSkinAnalysis): number | null {
  return toNumber(raw.health_score) ?? toNumber(raw.overall_score) ?? toNumber(raw.score) ?? null;
}

function extractMetrics(raw: RawSkinAnalysis): SkinMetric[] {
  const found: SkinMetric[] = [];
  const nested: Record<string, unknown> | null =
    (raw.metrics as Record<string, unknown> | undefined) ??
    (raw.skin_metrics as Record<string, unknown> | undefined) ??
    null;

  for (const { keys, label } of METRIC_KEYS) {
    let value: number | null = null;
    for (const k of keys) {
      const flat = toNumber(raw[k] as number | string | undefined);
      if (flat !== null) { value = flat; break; }
      if (nested) {
        const nest = toNumber(nested[k] as number | string | undefined);
        if (nest !== null) { value = nest; break; }
      }
    }
    if (value !== null) found.push({ label, value });
  }

  if (found.length === 0 && nested) {
    for (const [k, v] of Object.entries(nested)) {
      const n = toNumber(v as number | string | undefined);
      if (n !== null) found.push({ label: k.replace(/_/g, " "), value: n });
    }
  }

  return found;
}

function normaliseConcern(raw: SkinConcern | string): SkinConcern {
  return typeof raw === "string" ? { name: raw } : raw;
}

function extractConcerns(raw: RawSkinAnalysis): SkinConcern[] {
  const source = raw.concerns ?? raw.detected_concerns ?? raw.issues ?? raw.conditions ?? raw.skin_issues ?? [];
  return (Array.isArray(source) ? source : []).map(normaliseConcern);
}

function normaliseRec(raw: SkinRecommendation | string): SkinRecommendation {
  return typeof raw === "string" ? { name: raw } : raw;
}

function extractRecommendations(raw: RawSkinAnalysis): SkinRecommendation[] {
  let source: unknown = raw.recommendations ?? raw.products ?? raw.ingredients ?? raw.suggested_ingredients ?? null;
  if (!source && raw.routine) {
    source = Array.isArray(raw.routine)
      ? raw.routine
      : Object.values(raw.routine as Record<string, unknown>).flat();
  }
  return (Array.isArray(source) ? source : []).map(normaliseRec);
}

const CONSUMED_KEYS = new Set([
  "health_score", "overall_score", "score", "skin_type", "skin_tone", "age_estimate", "estimated_age",
  "timestamp", "message", "metrics", "analysis", "skin_metrics", "hydration", "elasticity", "luminosity",
  "sensitivity", "uv_damage", "oiliness", "pores", "acne", "wrinkles", "dark_spots", "redness", "texture",
  "firmness", "radiance", "brightness", "sebum", "erythema", "fine_lines", "blemishes", "uv",
  "hyperpigmentation_score", "concerns", "issues", "detected_concerns", "conditions", "skin_issues",
  "recommendations", "routine", "products", "ingredients", "suggested_ingredients",
]);

function extractExtras(raw: RawSkinAnalysis): ExtraField[] {
  return Object.entries(raw)
    .filter(([k, v]) => !CONSUMED_KEYS.has(k) && v !== null && v !== undefined)
    .map(([k, v]) => ({
      key: k,
      value: typeof v === "object" ? JSON.stringify(v, null, 2) : String(v),
    }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ScoreRingProps = { score: number };

function ScoreRing({ score }: ScoreRingProps): React.JSX.Element {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const colour = score >= 75 ? "#4ade80" : score >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={colour} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-white leading-none">{score}</span>
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider mt-1">/ 100</span>
      </div>
    </div>
  );
}

type MetricBarProps = { metric: SkinMetric; higherIsBetter: boolean };

function MetricBar({ metric, higherIsBetter }: MetricBarProps): React.JSX.Element {
  const pct = Math.min(100, Math.max(0, metric.value));
  const barColour = higherIsBetter
    ? pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-rose-400"
    : pct <= 30 ? "bg-emerald-400" : pct <= 60 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">{metric.label}</p>
        <p className="text-lg font-black text-white">{Math.round(pct)}%</p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`${barColour} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SEVERITY_STYLE: Record<string, string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  moderate: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  mild: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  severe: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

function severityStyle(s: string | undefined): string {
  if (!s) return "border-white/10 bg-white/5 text-white/70";
  return SEVERITY_STYLE[s.toLowerCase()] ?? "border-white/10 bg-white/5 text-white/70";
}

type ConcernCardProps = { concern: SkinConcern; index: number };

function ConcernCard({ concern, index }: ConcernCardProps): React.JSX.Element {
  const ICONS = ["⚡", "💧", "🔬", "☀️", "🌿", "🔴", "💨"];
  return (
    <div className={`flex gap-4 p-4 rounded-2xl border ${severityStyle(concern.severity)}`}>
      <div className="text-2xl mt-0.5 shrink-0">{ICONS[index % ICONS.length]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <h4 className="font-bold text-sm capitalize">{concern.name.replace(/_/g, " ")}</h4>
          {concern.severity && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-current opacity-70">
              {concern.severity}
            </span>
          )}
          {concern.priority && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Priority
            </span>
          )}
        </div>
        {concern.description && <p className="text-xs text-white/60 leading-relaxed">{concern.description}</p>}
        {concern.location && <p className="text-xs text-white/40 mt-1">📍 {concern.location}</p>}
        {concern.intensity !== undefined && <p className="text-xs text-white/40 mt-1">Intensity: {concern.intensity}</p>}
      </div>
    </div>
  );
}

const REC_GRADIENTS = [
  "from-violet-600/30 to-indigo-600/30",
  "from-teal-600/30 to-cyan-600/30",
  "from-amber-600/30 to-orange-600/30",
  "from-rose-600/30 to-pink-600/30",
  "from-emerald-600/30 to-green-600/30",
  "from-sky-600/30 to-blue-600/30",
];

type RecCardProps = { rec: SkinRecommendation; index: number };

function RecCard({ rec, index }: RecCardProps): React.JSX.Element {
  const title = rec.product ?? rec.name ?? rec.ingredient ?? `Recommendation ${index + 1}`;
  const subtitle = rec.ingredient ?? rec.category ?? rec.type ?? "";
  const body = rec.reason ?? rec.description ?? "";
  return (
    <div className={`rounded-2xl border border-white/10 bg-linear-to-br ${REC_GRADIENTS[index % REC_GRADIENTS.length]} p-5 flex flex-col gap-2 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5`}>
      {subtitle && <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{subtitle}</span>}
      <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
      {body && <p className="text-xs text-white/60 leading-relaxed">{body}</p>}
    </div>
  );
}

type ExtrasProps = { extras: ExtraField[] };

function ExtrasTable({ extras }: ExtrasProps): React.JSX.Element | null {
  if (extras.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Additional Data</h3>
      <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
        {extras.map(({ key, value }) => (
          <div key={key} className="flex gap-4 px-4 py-2.5 hover:bg-white/5 transition-colors">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wide min-w-[140px] shrink-0">
              {key.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-white/70 font-mono break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dev Panel ────────────────────────────────────────────────────────────────

type DevPanelProps = {
  activeScenario: number | null;
  onSelect: (i: number) => void;
  onReal: () => void;
  isRealMode: boolean;
};

function DevPanel({ activeScenario, onSelect, onReal, isRealMode }: DevPanelProps): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="fixed bottom-8 left-4 z-50 flex flex-col items-start gap-2">
      {open && (
        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-2xl w-64 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">⚡ Dev Mode</span>
            <span className={`ml-auto text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${isRealMode ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
              {isRealMode ? "LIVE" : "MOCK"}
            </span>
          </div>

          <button
            onClick={onReal}
            className={`w-full mb-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isRealMode
              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
              : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
          >
            {isRealMode ? "✓ Reading from sessionStorage" : "↩ Switch to Live Data"}
          </button>

          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mb-2 mt-3">Mock Scenarios</p>

          <div className="flex flex-col gap-1.5">
            {DEV_SCENARIOS.map((s, i) => (
              <button
                key={s.label}
                onClick={(): void => onSelect(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${activeScenario === i
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${s.tag === "Good" ? "bg-emerald-500/20 text-emerald-400" :
                  s.tag === "Priority" ? "bg-rose-500/20 text-rose-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>{s.tag}</span>
              </button>
            ))}
          </div>

          <p className="text-[9px] text-slate-700 mt-4 leading-relaxed">
            Scenarios override sessionStorage data. Switch back to live to read from the real API response.
          </p>
        </div>
      )}

      <button
        onClick={(): void => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest shadow-lg hover:border-amber-400/70 transition-all"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        DEV
        <span className="text-slate-600">{open ? "▲" : "▼"}</span>
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

type EmptyStateProps = { onRetake: () => void };

function EmptyState({ onRetake }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🔬</div>
        <h2 className="text-2xl font-black text-white mb-3">No analysis found</h2>
        <p className="text-white/50 text-sm mb-8">
          Run a scan first, or use the{" "}
          <span className="text-amber-400 font-bold">DEV</span> panel (bottom-left) to preview with mock data.
        </p>
        <button
          onClick={onRetake}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors"
        >
          Start a Scan
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const [raw, setRaw] = useState<RawSkinAnalysis | null>(null);
  const [devScenario, setDevScenario] = useState<number | null>(null);
  const [isRealMode, setIsRealMode] = useState<boolean>(true);
  const [showRaw, setShowRaw] = useState<boolean>(false);

  useEffect((): void => {
    const stored = sessionStorage.getItem("skinAnalysisResult");
    if (stored) {
      try { setRaw(JSON.parse(stored) as RawSkinAnalysis); } catch { /* ignore */ }
    }
  }, []);

  const handleDevSelect = (index: number): void => {
    setDevScenario(index);
    setIsRealMode(false);
  };

  const handleRealMode = (): void => {
    setDevScenario(null);
    setIsRealMode(true);
  };

  const handleRetake = (): void => {
    sessionStorage.removeItem("skinAnalysisResult");
    router.push("/analysis");
  };

  // Resolve which data to display
  const displayRaw: RawSkinAnalysis | null =
    devScenario !== null ? DEV_SCENARIOS[devScenario].data : raw;

  // No data + no dev scenario = empty state
  if (!displayRaw) {
    return (
      <>
        <EmptyState onRetake={handleRetake} />
        <DevPanel
          activeScenario={devScenario}
          onSelect={handleDevSelect}
          onReal={handleRealMode}
          isRealMode={isRealMode}
        />
      </>
    );
  }

  const score = extractScore(displayRaw);
  const metrics = extractMetrics(displayRaw);
  const concerns = extractConcerns(displayRaw);
  const recommendations = extractRecommendations(displayRaw);
  const extras = extractExtras(displayRaw);

  const skinType = displayRaw.skin_type ?? displayRaw.skin_tone ?? null;
  const ageEst = displayRaw.age_estimate ?? displayRaw.estimated_age ?? null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  const devLabel = devScenario !== null
    ? DEV_SCENARIOS[devScenario].label
    : "Live API";

  return (
    <>
      <main className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              {devScenario !== null && (
                <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Dev Mode — {devLabel}
                  </span>
                </div>
              )}
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 block mb-2">
                Clinical Dashboard
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                Analysis{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-cyan-400">
                  Results
                </span>
              </h1>
              <p className="text-sm text-white/40 mt-3">
                {devScenario !== null
                  ? `Previewing mock scenario — ${DEV_SCENARIOS[devScenario].label}`
                  : `Scan completed ${dateStr} at ${timeStr}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-white/70 hover:border-white/20 hover:text-white transition-all duration-200"
              >
                ↩ Redo Scan
              </button>
              <button
                onClick={(): void => setShowRaw((p) => !p)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-white/50 hover:border-white/20 hover:text-white transition-all duration-200"
              >
                {showRaw ? "Hide" : "View"} Raw JSON
              </button>
            </div>
          </header>

          {/* ── Raw JSON toggle ─────────────────────────────────────────────── */}
          {showRaw && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 overflow-auto p-5 max-h-96">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(displayRaw, null, 2)}
              </pre>
            </div>
          )}

          {/* ── Main grid ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* LEFT: Score + Metrics */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-7 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Health Score</span>
                {score !== null ? (
                  <ScoreRing score={score} />
                ) : (
                  <div className="text-5xl font-black text-white/20">—</div>
                )}
                {skinType && (
                  <div className="px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    {String(skinType)} Skin
                  </div>
                )}
                {ageEst && (
                  <p className="text-xs text-white/30">
                    Estimated skin age: <span className="text-white/60 font-bold">{String(ageEst)}</span>
                  </p>
                )}
              </div>

              {metrics.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-6 flex flex-col gap-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-1">Skin Metrics</h3>
                  {metrics.map((m) => {
                    const meta = METRIC_KEYS.find((mk) => mk.label.toLowerCase() === m.label.toLowerCase());
                    return <MetricBar key={m.label} metric={m} higherIsBetter={meta?.higherIsBetter ?? true} />;
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Concerns + Recommendations */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {concerns.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">⚠️</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Detected Concerns</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white/50">
                      {concerns.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {concerns.map((c, i) => (
                      <ConcernCard key={`${c.name}-${i}`} concern={c} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/5 to-white/2 p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">✦</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Precision Formulations</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white/50">
                      {recommendations.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {recommendations.map((r, i) => (
                      <RecCard key={i} rec={r} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {concerns.length === 0 && recommendations.length === 0 && metrics.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/2 p-8 flex flex-col items-center text-center gap-3">
                  <span className="text-4xl">✅</span>
                  <h3 className="font-bold text-white">Your skin looks great!</h3>
                  <p className="text-sm text-white/40 max-w-xs">
                    No specific concerns detected. Keep up your current routine.
                  </p>
                </div>
              )}

              <ExtrasTable extras={extras} />
            </div>
          </div>
        </div>
      </main>

      <DevPanel
        activeScenario={devScenario}
        onSelect={handleDevSelect}
        onReal={handleRealMode}
        isRealMode={isRealMode}
      />
    </>
  );
}
