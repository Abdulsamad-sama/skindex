"use client";

import { LocateFixedIcon, LocateIcon, Plus, Smile, Sun } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type ForecastPeriod = {
  morning?: number | string;
  noon?: number | string;
  midday?: number | string;
  afternoon?: number | string;
  evening?: number | string;
  night?: number | string;
};

// Every key the weather API might return
type WeatherBriefRaw = {
  // Temperature
  temperature?: number | string;
  temp?: number | string;
  current_temp?: number | string;
  feels_like?: number | string;
  apparent_temp?: number | string;

  // Forecast spread
  forecast?: ForecastPeriod;
  temperatures?: ForecastPeriod;
  temp_forecast?: ForecastPeriod;
  morning_temp?: number | string;
  noon_temp?: number | string;
  evening_temp?: number | string;

  // UV
  uv_index?: number | string;
  uv?: number | string;
  uvi?: number | string;

  // Humidity
  humidity?: number | string;
  relative_humidity?: number | string;

  // Description
  conditions?: string;
  description?: string;
  weather?: string;
  weather_condition?: string;
  summary?: string;
  label?: string;

  // Clothing
  clothing_recommendation?: string;
  clothing?: string;
  outfit?: string;
  outfit_suggestion?: string;
  outfit_tip?: string;
  dress_code?: string;

  // Humidity alert / skin note
  humidity_alert?: string;
  skin_alert?: string;
  skin_note?: string;
  barrier_note?: string;

  // Air quality
  air_quality?: number | string;
  aqi?: number | string;
  pollution?: number | string;

  // Routine
  routine?: RoutineStep[] | Record<string, string>;
  skincare_routine?: RoutineStep[] | string[];
  daily_routine?: RoutineStep[] | string[];
  steps?: RoutineStep[] | string[];

  // Location
  city?: string;
  location?: string;
  place?: string;

  // misc
  icon?: string;
  wind_speed?: number | string;
  pressure?: number | string;
  [key: string]: unknown;
};

// Normalised shape used by the UI
type WeatherData = {
  currentTemp: number | null;
  feelsLike: number | null;
  uvIndex: number | null;
  humidity: number | null;
  conditions: string;
  clothingTip: string;
  humidityAlert: string;
  airQuality: string | null;
  location: string | null;
  windSpeed: number | null;
  forecast: { label: string; temp: number | null }[];
  routine: { time: string; title: string; description: string; highlight: boolean }[];
};

// ─── Mock scenarios for dev mode ──────────────────────────────────────────────

type DevScenario = { label: string; emoji: string; data: WeatherBriefRaw };

const DEV_SCENARIOS: DevScenario[] = [
  {
    label: "Tropical Heat",
    emoji: "🌞",
    data: {
      temperature: 38,
      feels_like: 42,
      uv_index: 9,
      humidity: 78,
      conditions: "Tropical Heat Surge",
      clothing_recommendation: "Ultra-light breathable fabric. Avoid dark colours.",
      humidity_alert: "High humidity intensifies skin congestion and breakouts.",
      air_quality: "Moderate",
      wind_speed: 12,
      city: "Lagos",
      forecast: { morning: 28, noon: 38, evening: 30 },
      routine: [
        { time: "07:00", title: "Lightweight Hydration", description: "Oil-free gel moisturiser + SPF 50+ to withstand peak heat.", priority: false },
        { time: "12:00", title: "Midday Mist Reset", description: "Facial mist reapplication and blot excess oil. No heavy retouch.", priority: true },
        { time: "20:00", title: "Deep Cleanse & Repair", description: "Double cleanse to remove sweat and SPF. Apply niacinamide to calm skin.", priority: false },
      ],
    },
  },
  {
    label: "Cold & Dry",
    emoji: "🧊",
    data: {
      temperature: 8,
      feels_like: 4,
      uv_index: 2,
      humidity: 18,
      conditions: "Cold Dry Spell",
      clothing_recommendation: "Layered wool base + waterproof outer shell.",
      humidity_alert: "Critically dry air — skin barrier is under stress. Seal with occlusives.",
      air_quality: "Good",
      wind_speed: 22,
      city: "Abuja",
      forecast: { morning: 5, noon: 8, evening: 3 },
      routine: [
        { time: "08:00", title: "Barrier Prep", description: "Ceramide-rich cream before SPF. Skip water-thin serums today.", priority: false },
        { time: "13:00", title: "Midday Oil Check", description: "Balancing mist only — skin is producing extra oil to compensate for dryness.", priority: false },
        { time: "21:00", title: "Occlusive Lock-in", description: "Layer hyaluronic acid, then seal with a rich balm. Do not skip.", priority: true },
      ],
    },
  },
  {
    label: "Mild & Rainy",
    emoji: "🌧",
    data: {
      temperature: 22,
      feels_like: 20,
      uv_index: 3,
      humidity: 88,
      conditions: "Overcast Rain Showers",
      clothing_recommendation: "Waterproof jacket, light layers underneath.",
      humidity_alert: "Near-saturated air. Excess moisture may clog pores.",
      air_quality: "Good",
      wind_speed: 8,
      city: "Port Harcourt",
      forecast: { morning: 20, noon: 22, evening: 18 },
      routine: [
        { time: "08:30", title: "Minimal Moisture Base", description: "Lightweight gel hydration only — external humidity compensates.", priority: false },
        { time: "14:00", title: "Anti-Congestion Check", description: "Blot and apply salicylic acid toner to prevent humidity-induced breakouts.", priority: true },
        { time: "22:00", title: "Gentle Reset", description: "Micellar cleanse + lightweight retinol serum. Avoid heavy night creams.", priority: false },
      ],
    },
  },
  {
    label: "Harmattan Haze",
    emoji: "💨",
    data: {
      temperature: 32,
      feels_like: 29,
      uv_index: 7,
      humidity: 12,
      conditions: "Harmattan Dust Wind",
      clothing_recommendation: "Cover exposed skin. Wear a light scarf around nose and mouth.",
      humidity_alert: "Extreme dryness. Dust particles actively degrade skin barrier — protect immediately.",
      air_quality: "Poor",
      wind_speed: 35,
      city: "Kano",
      forecast: { morning: 24, noon: 32, evening: 20 },
      routine: [
        { time: "07:00", title: "Protective Shield Layer", description: "Heavy-duty SPF + barrier repair serum. Apply before stepping outside.", priority: true },
        { time: "12:00", title: "Dust Defence Refresh", description: "Wipe face with a damp cloth, reapply barrier cream — do not use water alone.", priority: false },
        { time: "20:00", title: "Intensive Recovery", description: "Full cleanse, then multi-layer hydration: toner → serum → occlusive balm.", priority: false },
      ],
    },
  },
];

// ─── Normalise raw API response ────────────────────────────────────────────────

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalise(raw: WeatherBriefRaw): WeatherData {
  const currentTemp =
    toNum(raw.temperature) ?? toNum(raw.temp) ?? toNum(raw.current_temp);

  const feelsLike =
    toNum(raw.feels_like) ?? toNum(raw.apparent_temp);

  const uvIndex =
    toNum(raw.uv_index) ?? toNum(raw.uv) ?? toNum(raw.uvi);

  const humidity =
    toNum(raw.humidity) ?? toNum(raw.relative_humidity);

  const conditions =
    str(raw.conditions) || str(raw.description) || str(raw.weather) ||
    str(raw.weather_condition) || str(raw.summary) || "Current Conditions";

  const clothingTip =
    str(raw.clothing_recommendation) || str(raw.clothing) ||
    str(raw.outfit) || str(raw.outfit_suggestion) || str(raw.dress_code) ||
    "Dress for the conditions.";

  const humidityAlert =
    str(raw.humidity_alert) || str(raw.skin_alert) ||
    str(raw.skin_note) || str(raw.barrier_note) || "";

  const airRaw =
    raw.air_quality ?? raw.aqi ?? raw.pollution ?? null;
  const airQuality = airRaw !== null ? str(airRaw) : null;

  const location =
    str(raw.city) || str(raw.location) || str(raw.place) || null;

  const windSpeed = toNum(raw.wind_speed);

  // Build 3-point forecast
  const fp: ForecastPeriod =
    (raw.forecast as ForecastPeriod | undefined) ??
    (raw.temperatures as ForecastPeriod | undefined) ??
    (raw.temp_forecast as ForecastPeriod | undefined) ??
    {};

  const forecast = [
    { label: "Morning", temp: toNum(fp.morning) ?? toNum(raw.morning_temp) },
    {
      label: "Noon",
      temp: toNum(fp.noon) ?? toNum(fp.midday) ?? toNum(fp.afternoon) ?? toNum(raw.noon_temp),
    },
    { label: "Evening", temp: toNum(fp.evening) ?? toNum(fp.night) ?? toNum(raw.evening_temp) },
  ];

  // Normalise routine
  let routineSteps: RoutineStep[] = [];
  const raw_routine = raw.routine ?? raw.skincare_routine ?? raw.daily_routine ?? raw.steps;

  if (Array.isArray(raw_routine)) {
    routineSteps = (raw_routine as Array<RoutineStep | string>).map((r) =>
      typeof r === "string" ? { description: r } : r
    );
  } else if (raw_routine && typeof raw_routine === "object") {
    routineSteps = Object.entries(raw_routine as Record<string, string>).map(([k, v]) => ({
      time: k,
      description: v,
    }));
  }

  const routine = routineSteps.map((s, i) => ({
    time: str(s.time ?? s.hour ?? `${(8 + i * 5).toString().padStart(2, "0")}:00`),
    title: str(s.title ?? s.name ?? s.step ?? `Step ${i + 1}`),
    description: str(s.description ?? s.detail ?? s.tip ?? ""),
    highlight: s.priority === true || i === 1,
  }));

  return {
    currentTemp,
    feelsLike,
    uvIndex,
    humidity,
    conditions,
    clothingTip,
    humidityAlert,
    airQuality,
    location,
    windSpeed,
    forecast,
    routine,
  };
}

// ─── UV helpers ───────────────────────────────────────────────────────────────

function uvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function uvColour(uv: number): string {
  if (uv <= 2) return "text-emerald-600 dark:text-emerald-400";
  if (uv <= 5) return "text-amber-500 dark:text-amber-400";
  if (uv <= 7) return "text-orange-500 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function humidityLabel(h: number): string {
  if (h < 20) return "Critical";
  if (h < 40) return "Low";
  if (h < 60) return "Comfortable";
  if (h < 80) return "High";
  return "Very High";
}

function aqColour(aq: string): string {
  const s = aq.toLowerCase();
  if (s === "good") return "text-emerald-600 dark:text-emerald-400";
  if (s === "moderate") return "text-amber-500 dark:text-amber-400";
  if (s === "poor" || s === "unhealthy") return "text-rose-500 dark:text-rose-400";
  return "text-on-surface-variant";
}

// ─── Forecast bar ─────────────────────────────────────────────────────────────

type BarProps = {
  period: { label: string; temp: number | null };
  maxTemp: number;
  minTemp: number;
  isActive: boolean;
};

function ForecastBar({ period, maxTemp, minTemp, isActive }: BarProps): React.JSX.Element {
  const range = maxTemp - minTemp || 1;
  const pct = period.temp !== null ? ((period.temp - minTemp) / range) * 70 + 20 : 30;

  return (
    <div className="flex flex-col items-center gap-2 h-full justify-end">
      <p className={`font-label-caps text-label-caps ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
        {period.label}
      </p>
      <div
        className={`w-full rounded-t-xl flex items-center justify-center transition-all duration-500 ${isActive
          ? "bg-[#00C2B8] dark:bg-[#40dcd1] shadow-lg shadow-[#00C2B8]/30"
          : "bg-surface-container hover:bg-primary-container/20"
          }`}
        style={{ height: `${pct}%` }}
      >
        <span className={`font-h3 text-h3 ${isActive ? "text-white dark:text-on-primary" : ""}`}>
          {period.temp !== null ? `${Math.round(period.temp)}°` : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Dev Panel ────────────────────────────────────────────────────────────────

type DevPanelProps = {
  activeScenario: number | null;
  onSelect: (index: number) => void;
  onReal: () => void;
  isRealMode: boolean;
  status: string;
};

function DevPanel({ activeScenario, onSelect, onReal, isRealMode, status }: DevPanelProps): React.JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col items-start gap-2">
      {open && (
        <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-2xl w-64 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              ⚡ Dev Mode
            </span>
            <span className="ml-auto text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{status}</span>
          </div>

          <button
            onClick={onReal}
            className={`w-full mb-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isRealMode
              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
              : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
          >
            {isRealMode ? "✓ Live API" : "↩ Switch to Live API"}
          </button>

          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold mb-2 mt-3">
            Mock Scenarios
          </p>

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
                {activeScenario === i && <span className="ml-auto text-amber-400">✓</span>}
              </button>
            ))}
          </div>
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

// ─── Main component ───────────────────────────────────────────────────────────

type PageState =
  | { status: "locating" }
  | { status: "fetching"; lat: number; lon: number }
  | { status: "ok"; data: WeatherData; lat: number; lon: number }
  | { status: "error"; message: string }
  | { status: "no-location" };

export default function WeatherPage(): React.JSX.Element {
  const [pageState, setPageState] = useState<PageState>({ status: "locating" });
  const [devScenario, setDevScenario] = useState<number | null>(null);
  const [isRealMode, setIsRealMode] = useState<boolean>(true);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // ── Fetch from real API ──────────────────────────────────────────────────

  const fetchWeather = useCallback(async (lat: number, lon: number): Promise<void> => {
    setPageState({ status: "fetching", lat, lon });
    try {
      const res = await fetch(
        `https://skin-analysis-production.up.railway.app/api/weather/brief?lat=${lat}&lon=${lon}`
      );
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const raw = (await res.json()) as WeatherBriefRaw;
      setPageState({ status: "ok", data: normalise(raw), lat, lon });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPageState({ status: "error", message: msg });
    }
  }, []);

  // ── Geolocation on mount ─────────────────────────────────────────────────

  useEffect((): void => {
    if (!navigator.geolocation) {
      setPageState({ status: "no-location" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos: GeolocationPosition): void => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        coordsRef.current = { lat, lon };
        void fetchWeather(lat, lon);
      },
      (): void => {
        setPageState({ status: "no-location" });
      },
      { timeout: 8000 }
    );
  }, [fetchWeather]);

  // ── Dev scenario selection ───────────────────────────────────────────────

  const handleDevSelect = (index: number): void => {
    setDevScenario(index);
    setIsRealMode(false);
  };

  const handleRealMode = (): void => {
    setDevScenario(null);
    setIsRealMode(true);
    if (coordsRef.current) {
      void fetchWeather(coordsRef.current.lat, coordsRef.current.lon);
    } else {
      setPageState({ status: "no-location" });
    }
  };

  // ── Resolve displayed data ───────────────────────────────────────────────

  const devData: WeatherData | null =
    devScenario !== null ? normalise(DEV_SCENARIOS[devScenario].data) : null;

  const displayData: WeatherData | null =
    devData ?? (pageState.status === "ok" ? pageState.data : null);

  const devStatusLabel =
    devScenario !== null
      ? `mock: ${DEV_SCENARIOS[devScenario].label}`
      : pageState.status === "ok"
        ? `live ${pageState.lat.toFixed(2)},${pageState.lon.toFixed(2)}`
        : pageState.status;

  // ── Loading / error states ───────────────────────────────────────────────

  if (!displayData) {
    return (
      <>
        <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
          <header className="mb-lg">
            <h1 className="font-display text-display text-on-surface mb-xs">Today&apos;s Skin Forecast</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Precision weather-adaptive skincare routines for your unique tone and environment.
            </p>
          </header>

          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center">
            {pageState.status === "locating" || pageState.status === "fetching" ? (
              <>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-on-surface-variant font-body-md">
                  {pageState.status === "locating" ? "Detecting your location…" : "Fetching weather data…"}
                </p>
              </>
            ) : pageState.status === "error" ? (
              <div className="max-w-sm">
                <p className="text-4xl mb-4">⚠️</p>
                <h2 className="font-h2 text-h2 mb-2">Couldn&apos;t load weather</h2>
                <p className="text-on-surface-variant text-sm mb-6">{pageState.message}</p>
                <p className="text-xs text-on-surface-variant/60">
                  Use the <span className="text-amber-400 font-bold">DEV</span> panel (bottom-left) to preview with mock data.
                </p>
              </div>
            ) : (
              <div className="max-w-sm">
                <p className="text-4xl mb-4">📍</p>
                <h2 className="font-h2 text-h2 mb-2">Location access needed</h2>
                <p className="text-on-surface-variant text-sm mb-6">
                  Allow location access so we can fetch your local weather conditions for a personalised skin routine.
                </p>
                <p className="text-xs text-on-surface-variant/60">
                  Or use the <span className="text-amber-400 font-bold">DEV</span> panel (bottom-left) to preview with mock data.
                </p>
              </div>
            )}
          </div>
        </main>

        <DevPanel
          activeScenario={devScenario}
          onSelect={handleDevSelect}
          onReal={handleRealMode}
          isRealMode={isRealMode}
          status={devStatusLabel}
        />
      </>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  const d = displayData;

  const forecastTemps = d.forecast.map((f) => f.temp).filter((t): t is number => t !== null);
  const maxTemp = forecastTemps.length > 0 ? Math.max(...forecastTemps) : 40;
  const minTemp = forecastTemps.length > 0 ? Math.min(...forecastTemps) : 0;
  const activeBarIndex = d.forecast.findIndex(
    (f) => f.temp !== null && f.temp === Math.max(...forecastTemps)
  );

  return (
    <>
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-lg">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-display text-on-surface mb-xs">Today&apos;s Skin Forecast</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Precision weather-adaptive skincare routines for your unique tone and environment.
              </p>
            </div>
            {d.location && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container border border-slate-200 dark:border-slate-800 text-on-surface-variant text-sm font-bold">
                <span className="material-symbols-outlined text-[18px] text-primary" data-icon="location_on"><LocateFixedIcon /></span>
                {d.location}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <section className="lg:col-span-8 flex flex-col gap-gutter">

            {/* Current Conditions Card */}
            <div className="glass rounded-xl p-lg border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,194,184,0.08)] relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#00C2B8]/10 blur-3xl pointer-events-none" />

              {/* Header row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-lg">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase mb-2 block">Current Conditions</span>
                  <h2 className="font-h1 text-h1">{d.conditions}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-secondary-container" data-icon="wb_sunny"><Sun /></span>
                  <div className="text-right">
                    <p className="font-h1 text-h1 text-[#00C2B8] dark:text-[#40dcd1]">
                      {d.currentTemp !== null ? `${Math.round(d.currentTemp)}°C` : "—"}
                    </p>
                    {d.feelsLike !== null && (
                      <p className="text-xs text-on-surface-variant">Feels like {Math.round(d.feelsLike)}°C</p>
                    )}
                    {d.uvIndex !== null && (
                      <p className={`font-label-caps text-label-caps ${uvColour(d.uvIndex)}`}>
                        UV INDEX: {uvLabel(d.uvIndex)} ({Math.round(d.uvIndex)})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Forecast bar chart */}
              {forecastTemps.length > 0 && (
                <div className="grid grid-cols-3 gap-base items-end h-40 mb-md relative">
                  {d.forecast.map((period, i) => (
                    <ForecastBar
                      key={period.label}
                      period={period}
                      maxTemp={maxTemp}
                      minTemp={minTemp}
                      isActive={i === activeBarIndex}
                    />
                  ))}
                </div>
              )}

              <p className="font-body-md text-body-md text-on-surface-variant italic">
                {d.forecast.map((f) => f.temp !== null ? `${Math.round(f.temp)}°C` : null).filter(Boolean).join(" → ")}{" "}
                {forecastTemps.length > 0 && "— Thermal spread may stress skin barrier."}
              </p>

              {/* Quick stats strip */}
              <div className="mt-md grid grid-cols-3 gap-3">
                {d.humidity !== null && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-container border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Humidity</span>
                    <span className="font-bold text-on-surface">{Math.round(d.humidity)}%</span>
                    <span className="text-[10px] text-on-surface-variant">{humidityLabel(d.humidity)}</span>
                  </div>
                )}
                {d.windSpeed !== null && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-container border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Wind</span>
                    <span className="font-bold text-on-surface">{Math.round(d.windSpeed)} km/h</span>
                    <span className="text-[10px] text-on-surface-variant">
                      {d.windSpeed > 30 ? "Strong" : d.windSpeed > 15 ? "Moderate" : "Light"}
                    </span>
                  </div>
                )}
                {d.airQuality && (
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-container border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Air Quality</span>
                    <span className={`font-bold ${aqColour(d.airQuality)}`}>{d.airQuality}</span>
                    <span className="text-[10px] text-on-surface-variant">AQI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clothing + Humidity alert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Clothing */}
              <div className="bg-surface-container-lowest border border-slate-200 dark:border-slate-800 rounded-xl p-md shadow-sm flex items-start gap-md">
                <div className="p-3 bg-secondary-fixed rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-fixed" data-icon="checkroom">checkroom</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary mb-1 block">CLOTHING RECOMMENDATION</span>
                  <p className="font-h3 text-h3 mb-2">Outfit Guide</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{d.clothingTip}</p>
                </div>
              </div>

              {/* Humidity alert */}
              <div className="bg-surface-container-lowest border border-slate-200 dark:border-slate-800 rounded-xl p-md shadow-sm flex items-start gap-md">
                <div className="p-3 bg-tertiary-fixed rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-fixed" data-icon="opacity">opacity</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-tertiary mb-1 block">SKIN ALERT</span>
                  <p className="font-h3 text-h3 mb-2">
                    {d.humidity !== null
                      ? `${humidityLabel(d.humidity)}: ${Math.round(d.humidity)}%`
                      : "Humidity Alert"}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {d.humidityAlert || "Monitor your skin barrier throughout the day."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
          <aside className="lg:col-span-4 flex flex-col gap-gutter">
            {/* Dynamic Routine Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
              <div className="absolute inset-0 bg-linear-to-b from-[#00C2B8]/5 to-transparent pointer-events-none" />
              <div className="p-md">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-h2 text-h2">Dynamic Routine</h3>
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome"><Smile /></span>
                </div>

                {d.routine.length > 0 ? (
                  <div className="space-y-md">
                    {d.routine.map((step, i) => (
                      <div
                        key={i}
                        className={`flex gap-md items-start p-base rounded-lg transition-colors group ${step.highlight
                          ? "bg-primary-container/10 border border-primary-container/20"
                          : "hover:bg-surface-container-low"
                          }`}
                      >
                        <span
                          className={`font-label-caps text-label-caps w-12 pt-1 shrink-0 ${step.highlight ? "text-primary" : "text-on-surface-variant"
                            }`}
                        >
                          {step.time}
                        </span>
                        <div>
                          <p
                            className={`font-h3 text-sm font-bold transition-colors ${step.highlight ? "text-primary" : "group-hover:text-primary"
                              }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs text-on-surface-variant">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant italic py-4">
                    No routine steps returned by the API for these conditions.
                  </p>
                )}

                <div className="mt-md relative h-32 rounded-lg overflow-hidden group bg-surface-container flex items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-xs font-bold text-on-surface-variant mb-2">
                      Weather-adaptive routine loaded
                    </p>
                    <div className="flex justify-center gap-3">
                      {d.uvIndex !== null && (
                        <div className="text-center">
                          <p className={`text-lg font-black ${uvColour(d.uvIndex)}`}>{Math.round(d.uvIndex)}</p>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant">UV</p>
                        </div>
                      )}
                      {d.humidity !== null && (
                        <div className="text-center">
                          <p className="text-lg font-black text-sky-500">{Math.round(d.humidity)}%</p>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant">HUMID</p>
                        </div>
                      )}
                      {d.currentTemp !== null && (
                        <div className="text-center">
                          <p className="text-lg font-black text-[#00C2B8]">{Math.round(d.currentTemp)}°</p>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant">TEMP</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Analysis map placeholder */}
            <div className="glass p-md rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-base">LOCAL ANALYSIS MAP</span>
              <div className="h-32 bg-surface-container rounded-lg overflow-hidden relative flex items-center justify-center">
                {coordsRef.current ? (
                  <>
                    <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 to-sky-500/10" />
                    <div className="text-center relative z-10">
                      <div className="w-4 h-4 bg-[#00C2B8] dark:bg-[#40dcd1] rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <div className="w-3 h-3 bg-[#00C2B8] dark:bg-[#40dcd1] rounded-full border-2 border-white shadow-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-on-surface-variant text-center px-4">
                    Location unavailable — map view requires geolocation access.
                  </p>
                )}
              </div>
              <p className="font-body-md text-xs mt-base text-on-surface-variant">
                {coordsRef.current
                  ? `Lat ${coordsRef.current.lat.toFixed(3)}, Long ${coordsRef.current.lon.toFixed(3)} — analyzing local air conditions.`
                  : "Enable location access to view your local air quality analysis."}
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 bg-[#00C2B8] dark:bg-[#40dcd1] text-white dark:text-on-primary p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center gap-2">
        <span className="material-symbols-outlined" data-icon="add"><Plus /></span>
        <span className="font-bold text-sm hidden md:block">Update Skin Log</span>
      </button>

      <DevPanel
        activeScenario={devScenario}
        onSelect={handleDevSelect}
        onReal={handleRealMode}
        isRealMode={isRealMode}
        status={devStatusLabel}
      />
    </>
  );
}


