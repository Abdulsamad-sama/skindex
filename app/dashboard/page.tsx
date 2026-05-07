"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

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

type RoutineItem = { name: string; amazon_url: string; reason: string };

type RoutineData = {
  overall_score: number;
  skincare_routine: RoutineItem[];
  outfit_suggestions: RoutineItem[];
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



// ─── Normalisation helpers ────────────────────────────────────────────────────

type ExtraField = { key: string; value: string };



function normaliseConcern(raw: SkinConcern | string): SkinConcern {
  return typeof raw === "string" ? { name: raw } : raw;
}

function extractConcerns(raw: RawSkinAnalysis): SkinConcern[] {
  // Standard sources
  const standard = raw.concerns ?? raw.detected_concerns ?? raw.issues ?? raw.conditions ?? raw.skin_issues ?? [];
  const standardConcerns = (Array.isArray(standard) ? standard : []).map(normaliseConcern);

  // If we already have concerns, return them
  if (standardConcerns.length > 0) return standardConcerns;

  // Otherwise, auto-generate concerns from skin_concerns
  const concernsObj = raw.skin_concerns as Record<string, { ui_score?: number; raw_score?: number }> | undefined;
  if (!concernsObj) return [];

  const generated: SkinConcern[] = [];
  for (const [key, entry] of Object.entries(concernsObj)) {
    if (!entry || typeof entry !== "object") continue;
    const score = entry.ui_score ?? entry.raw_score;
    if (typeof score !== "number") continue;

    let severity = "low";
    if (score >= 80) severity = "high";
    else if (score >= 50) severity = "medium";

    generated.push({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      severity,
      intensity: Math.round(score),
      description: `Detected by computer‑vision with a confidence of ${Math.round(score)}%.`,
      priority: severity === "high",
    });
  }
  return generated;
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
  "recommendations", "routine", "products", "ingredients", "suggested_ingredients", "skin_concerns",
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
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-on-surface/10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={colour} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-on-surface leading-none">{score}</span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">/ 100</span>
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
  if (!s) return "border-outline-variant bg-surface-container text-on-surface-variant";
  return SEVERITY_STYLE[s.toLowerCase()] ?? "border-outline-variant bg-surface-container text-on-surface-variant";
}

type ConcernCardProps = { concern: SkinConcern; index: number };

function ConcernCard({ concern, index }: ConcernCardProps): React.JSX.Element {
  const ICONS = ["⚡", "💧", "🔬", "☀️", "🌿", "🔴", "💨"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-4 p-4 rounded-2xl border ${severityStyle(concern.severity)}`}
    >
      <div className="text-2xl mt-0.5 shrink-0">{ICONS[index % ICONS.length]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <h4 className="font-bold text-sm capitalize text-on-surface">{concern.name.replace(/_/g, " ")}</h4>
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
        {concern.description && <p className="text-xs text-on-surface-variant leading-relaxed">{concern.description}</p>}
        {concern.location && <p className="text-xs text-on-surface-variant/70 mt-1">📍 {concern.location}</p>}
        {concern.intensity !== undefined && <p className="text-xs text-on-surface-variant/70 mt-1">Intensity: {concern.intensity}</p>}
      </div>
    </motion.div>
  );
}

const REC_GRADIENTS = [
  "from-violet-500/20 to-indigo-500/20",
  "from-teal-500/20 to-cyan-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-emerald-500/20 to-green-500/20",
  "from-sky-500/20 to-blue-500/20",
];

type RecCardProps = { rec: SkinRecommendation; index: number };

function RecCard({ rec, index }: RecCardProps): React.JSX.Element {
  const title = rec.product ?? rec.name ?? rec.ingredient ?? `Recommendation ${index + 1}`;
  const subtitle = rec.ingredient ?? rec.category ?? rec.type ?? "";
  const body = rec.reason ?? rec.description ?? "";
  return (
    <div className={`rounded-2xl border border-outline-variant bg-linear-to-br ${REC_GRADIENTS[index % REC_GRADIENTS.length]} p-5 flex flex-col gap-2 hover:border-primary transition-all duration-300`}>
      {subtitle && <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{subtitle}</span>}
      <h4 className="font-bold text-on-surface text-sm leading-tight">{title}</h4>
      {body && <p className="text-xs text-on-surface-variant leading-relaxed">{body}</p>}
    </div>
  );
}

function getProductImage(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("cerave") || n.includes("hydrating") || n.includes("cleanser")) return "/cerave-hydrating.webp";
  if (n.includes("neutrogena") || n.includes("oil-free") || n.includes("moisturizer")) return "/NTG_EMEA_oil_free.webp";
  if (n.includes("elta") || n.includes("sunscreen") || n.includes("uv")) return "/uv-elta.webp";
  if (n.includes("mascara") || n.includes("maybelline")) return "/maybelline-lash-sensational-waterproof-mascara_grande-1.webp";
  return null;
}

function ProductCard({ item, icon = "🛍️" }: { item: RoutineItem; icon?: string }): React.JSX.Element {
  const img = getProductImage(item.name);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-4 rounded-2xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-all duration-200 flex gap-4"
    >
      {img && (
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-surface border border-outline-variant">
          <Image src={img} alt={item.name} fill sizes="80px" unoptimized className="object-contain p-2 rounded-lg" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-sm text-on-surface leading-tight" title={item.name}>{item.name}</h4>
          <span className="text-lg">{icon}</span>
        </div>
        <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{item.reason}</p>
        <a
          href={item.amazon_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
        >
          View on Amazon ↗
        </a>
      </div>
    </motion.div>
  );
}

type ExtrasProps = { extras: ExtraField[] };

function ExtrasTable({ extras }: ExtrasProps): React.JSX.Element | null {
  if (extras.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">Additional Data</h3>
      <div className="rounded-2xl border border-outline-variant overflow-hidden divide-y divide-outline-variant bg-surface-container-low">
        {extras.map(({ key, value }) => (
          <div key={key} className="flex gap-4 px-4 py-2.5">
            <span className="text-xs font-bold text-on-surface/50 uppercase tracking-wide min-w-35 shrink-0">
              {key.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-on-surface font-mono break-all">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─── Empty state ──────────────────────────────────────────────────────────────

type EmptyStateProps = { onRetake: () => void };

function EmptyState({ onRetake }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🔬</div>
        <h2 className="text-2xl font-black text-on-surface mb-3">No analysis found</h2>
        <p className="text-on-surface-variant text-sm mb-8">
          Run a scan first to see your skin analysis results.
        </p>
        <button
          onClick={onRetake}
          className="px-8 py-3 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-colors"
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
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [showRaw, setShowRaw] = useState<boolean>(false);

  useEffect((): void => {
    void Promise.resolve().then(() => {
      const stored = sessionStorage.getItem("skinAnalysisResult");
      if (stored) {
        try { setRaw(JSON.parse(stored) as RawSkinAnalysis); } catch { /* ignore */ }
      }
      const routineStored = sessionStorage.getItem("skinRoutineData");
      if (routineStored) {
        try { setRoutine(JSON.parse(routineStored) as RoutineData); } catch { /* ignore */ }
      }
    });
  }, []);

  const handleRetake = (): void => {
    sessionStorage.removeItem("skinAnalysisResult");
    sessionStorage.removeItem("skinRoutineData");
    router.push("/analysis");
  };

  const displayRaw: RawSkinAnalysis | null = raw;

  if (!displayRaw) {
    return <EmptyState onRetake={handleRetake} />;
  }

  const score = routine?.overall_score ?? (typeof displayRaw.overall_score === 'number' ? displayRaw.overall_score : null);
  const concerns = extractConcerns(displayRaw);
  const recommendations = extractRecommendations(displayRaw);
  const extras = extractExtras(displayRaw);

  const skinType = displayRaw.skin_type ?? displayRaw.skin_tone ?? null;
  const ageEst = displayRaw.age_estimate ?? displayRaw.estimated_age ?? displayRaw.skin_age ?? null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex-1 min-h-screen bg-background">
      <main className="text-on-surface pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant block mb-2">
                Clinical Dashboard
              </span>
              <h1 className="text-3xl font-black tracking-tight text-on-surface">
                Analysis Results
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Completed {dateStr} at {timeStr}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container transition-all"
              >
                New Analysis
              </button>
              <button
                onClick={(): void => setShowRaw((p) => !p)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-all"
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

            {/* LEFT: Score + Concerns */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-7 flex flex-col items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Health Score</span>
                {score !== null ? (
                  <ScoreRing score={score} />
                ) : (
                  <div className="text-5xl font-black text-on-surface/20">—</div>
                )}
                {skinType && (
                  <div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    {String(skinType)} Skin
                  </div>
                )}
                {ageEst && (
                  <p className="text-xs text-on-surface-variant">
                    Estimated skin age: <span className="text-on-surface font-bold">{String(ageEst)}</span>
                  </p>
                )}
              </div>

              {concerns.length > 0 && (
                <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">⚠️</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Detected Concerns</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
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
            </div>

            {/* RIGHT: Recommendations */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {routine?.skincare_routine && routine.skincare_routine.length > 0 && (
                <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">✨</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Recommended Products</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                      {routine.skincare_routine.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                    {routine.skincare_routine.slice(0, 4).map((item, i) => (
                      <ProductCard key={i} item={item} />
                    ))}
                  </div>
                  {routine.skincare_routine.length && (
                    <div className="flex justify-center mt-6">
                      <Link
                        href="/weather"
                        className="px-6 py-2 rounded-full border border-outline-variant text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                      >
                        See More Results
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {routine?.outfit_suggestions && routine.outfit_suggestions.length > 0 && (
                <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">👕</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Recommended Outfit</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
                      {routine.outfit_suggestions.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                    {routine.outfit_suggestions.slice(0, 4).map((item, i) => (
                      <ProductCard key={i} item={item} icon="👕" />
                    ))}
                  </div>
                  {routine.outfit_suggestions.length > 4 && (
                    <div className="flex justify-center mt-6">
                      <Link
                        href="/weather"
                        className="px-6 py-2 rounded-full border border-outline-variant text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                      >
                        See More Results
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-base">✦</span>
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Precision Formulations</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant">
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

              {concerns.length === 0 && recommendations.length === 0 && (!routine?.skincare_routine || routine.skincare_routine.length === 0) && (!routine?.outfit_suggestions || routine.outfit_suggestions.length === 0) && (
                <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-8 flex flex-col items-center text-center gap-3">
                  <span className="text-4xl">✅</span>
                  <h3 className="font-bold text-on-surface">Your skin looks great!</h3>
                  <p className="text-sm text-on-surface-variant">
                    No specific concerns detected. Keep up your current routine.
                  </p>
                </div>
              )}

              <ExtrasTable extras={extras} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
