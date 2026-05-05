"use client";

import { Check, LocateFixedIcon, LocateIcon, Plus, Smile, Sun } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdCheckroom, MdOpacity } from "react-icons/md";

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
  conditions?: string | string[];
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

  const conditionsRaw = Array.isArray(raw.conditions)
    ? raw.conditions.join(", ")
    : raw.conditions;
  const conditions =
    str(conditionsRaw) || str(raw.description) || str(raw.weather) ||
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



// ─── Routine response types ───────────────────────────────────────────────────

type RoutineItem = { name: string; amazon_url: string; reason: string };

type RoutineData = {
  overall_score: number;
  skincare_routine: RoutineItem[];
  outfit_suggestions: RoutineItem[];
};

// ─── Main component ───────────────────────────────────────────────────────────

type PageState =
  | { status: "locating" }
  | { status: "fetching"; lat: number; lon: number }
  | { status: "ok"; data: WeatherData; lat: number; lon: number }
  | { status: "error"; message: string }
  | { status: "no-location" };

export default function WeatherPage(): React.JSX.Element {
  const [pageState, setPageState] = useState<PageState>({ status: "locating" });
  const [routine, setRoutine] = useState<RoutineData | null>(null);
  const [routineLoading, setRoutineLoading] = useState<boolean>(false);
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  // ── Fetch weather + routine ──────────────────────────────────────────────

  const fetchAll = useCallback(async (lat: number, lon: number): Promise<void> => {
    setPageState({ status: "fetching", lat, lon });
    try {
      // 1. Weather brief
      const weatherRes = await fetch(
        `https://skin-analysis-production.up.railway.app/api/weather/brief?lat=${lat}&lon=${lon}`
      );
      if (!weatherRes.ok) throw new Error(`Weather API error ${weatherRes.status}`);
      const weatherRaw = (await weatherRes.json()) as WeatherBriefRaw & {
        temp_current?: number;
        temp_min?: number;
        temp_max?: number;
        has_rain?: boolean;
        conditions?: string[];
        summary?: string;
      };

      // Map known brief shape onto WeatherBriefRaw for normalise()
      const normaliseInput: WeatherBriefRaw = {
        ...weatherRaw,
        temperature: weatherRaw.temp_current ?? weatherRaw.temperature,
        conditions: Array.isArray(weatherRaw.conditions)
          ? weatherRaw.conditions.join(", ")
          : weatherRaw.conditions,
        summary: weatherRaw.summary,
      };
      setPageState({ status: "ok", data: normalise(normaliseInput), lat, lon });

      // 2. Personalized routine (non-blocking — runs after weather is shown)
      const dataUrl = sessionStorage.getItem("capturedImageDataUrl");
      if (!dataUrl) return;

      setRoutineLoading(true);
      try {
        const blobRes = await fetch(dataUrl);
        const blob = await blobRes.blob();
        const imageFile = new File([blob], "face.jpg", { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("file", imageFile);

        const routineRes = await fetch(
          `https://skin-analysis-production.up.railway.app/api/routine/daily?lat=${lat}&lon=${lon}`,
          { method: "POST", body: formData }
        );
        if (!routineRes.ok) throw new Error(`Routine API error ${routineRes.status}`);
        const routineRaw = (await routineRes.json()) as RoutineData;
        setRoutine(routineRaw);
      } catch (routineErr: unknown) {
        console.warn("Routine fetch failed:", routineErr);
        // Don't block the page — weather data is already shown
      } finally {
        setRoutineLoading(false);
      }
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
        void fetchAll(lat, lon);
      },
      (): void => {
        setPageState({ status: "no-location" });
      },
      { timeout: 8000 }
    );
  }, [fetchAll]);

  // ── Resolve displayed data ───────────────────────────────────────────────

  const displayData: WeatherData | null =
    pageState.status === "ok" ? pageState.data : null;

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
              <div>
                <p className="text-4xl mb-4">⚠️</p>
                <h2 className="font-h2 text-h2 mb-2">Couldn&apos;t load weather</h2>
                <p className="text-on-surface-variant text-sm mb-6">{pageState.message}</p>

              </div>
            ) : (
              <div className="max-w-sm">
                <p className="text-4xl mb-4">📍</p>
                <h2 className="font-h2 text-h2 mb-2">Location access needed</h2>
                <p className="text-on-surface-variant text-sm mb-6">
                  Allow location access so we can fetch your local weather conditions for a personalised skin routine.
                </p>

              </div>
            )}
          </div>
        </main>
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
                  <span className="material-symbols-outlined text-on-secondary-fixed" data-icon="checkroom"><MdCheckroom /></span>
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
                  <span className="material-symbols-outlined text-on-tertiary-fixed" data-icon="opacity"><MdOpacity /></span>
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

            {/* Precision Score Banner */}
            {routine && (
              <div className="p-md rounded-xl bg-primary text-white flex justify-between items-center shadow-lg shadow-primary/20">
                <div>
                  <p className="text-xs font-bold uppercase opacity-80">Precision Score</p>
                  <p className="font-h2 text-h2 font-black">{routine.overall_score}% Match</p>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-white/30 flex items-center justify-center font-black text-xl">
                  ✓
                </div>
              </div>
            )}

            {/* Skincare Products */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
              <div className="absolute inset-0 bg-linear-to-b from-[#00C2B8]/5 to-transparent pointer-events-none" />
              <div className="p-md">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-h2 text-h2">Recommended Products</h3>
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome"><Smile /></span>
                </div>

                {routineLoading && (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-on-surface-variant">Loading your personalized routine…</p>
                  </div>
                )}

                {!routineLoading && !routine && (
                  <p className="text-sm text-on-surface-variant italic py-4">
                    Complete a skin scan on the Analysis page to see your personalized routine.
                  </p>
                )}

                {routine && routine.skincare_routine.length > 0 && (
                  <div className="space-y-md">
                    {routine.skincare_routine.map((item: RoutineItem, i: number) => (
                      <div
                        key={i}
                        className="p-base rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-surface-container-low transition-colors"
                      >
                        <p className="font-bold text-sm text-on-surface mb-1">{item.name}</p>
                        <p className="text-xs text-on-surface-variant mb-2">{item.reason}</p>
                        <a
                          href={item.amazon_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                        >
                          <LocateIcon size={10} /> Buy on Amazon
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Outfit Suggestions */}
            {routine && routine.outfit_suggestions.length > 0 && (
              <div className="glass p-md rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-label-caps text-label-caps text-on-surface-variant block mb-base">APPAREL STRATEGY</span>
                <div className="space-y-base">
                  {routine.outfit_suggestions.map((item: RoutineItem, i: number) => (
                    <div key={i} className="p-base rounded-lg bg-surface-container">
                      <p className="font-bold text-sm text-on-surface mb-1">{item.name}</p>
                      <p className="text-xs text-on-surface-variant mb-2">{item.reason}</p>
                      <a
                        href={item.amazon_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                      >
                        <LocateIcon size={10} /> Buy on Amazon
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coords indicator */}
            {coordsRef.current && (
              <p className="font-body-md text-xs text-on-surface-variant">
                Lat {coordsRef.current.lat.toFixed(3)}, Long {coordsRef.current.lon.toFixed(3)} — live sync active.
              </p>
            )}
          </aside>
        </div>
      </main>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 bg-[#00C2B8] dark:bg-[#40dcd1] text-white dark:text-on-primary p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center gap-2">
        <span className="material-symbols-outlined" data-icon="add"><Plus /></span>
        <span className="font-bold text-sm hidden md:block">Update Skin Log</span>
      </button>


    </>
  );
}
