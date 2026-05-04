import Image from "next/image";

export default function WeatherPage() {
  return (
    <>
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-lg">
          <h1 className="font-display text-display text-on-surface mb-xs">Today&apos;s Skin Forecast</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Precision weather-adaptive skincare routines for your unique tone and environment.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* ── LEFT COLUMN: Weather + Alerts ── */}
          <section className="lg:col-span-8 flex flex-col gap-gutter">
            {/* Current Conditions Card */}
            <div className="glass rounded-xl p-lg border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,194,184,0.08)] relative overflow-hidden">
              {/* Header Row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-lg">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase mb-2 block">Current Conditions</span>
                  <h2 className="font-h1 text-h1">Variable Heat Spike</h2>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-secondary-container" data-icon="wb_sunny">wb_sunny</span>
                  <div className="text-right">
                    <p className="font-h1 text-h1 text-[#00C2B8] dark:text-[#40dcd1]">35°C</p>
                    <p className="font-label-caps text-label-caps text-on-surface-variant">UV INDEX: HIGH (8)</p>
                  </div>
                </div>
              </div>

              {/* Temperature Bar Chart */}
              <div className="grid grid-cols-3 gap-base items-end h-40 mb-md relative">
                {/* Morning */}
                <div className="flex flex-col items-center gap-base h-full justify-end">
                  <p className="font-label-caps text-label-caps">Morning</p>
                  <div className="w-full bg-surface-container rounded-t-lg h-[40%] flex items-center justify-center transition-all hover:bg-primary-container/20">
                    <span className="font-h3 text-h3">20°C</span>
                  </div>
                </div>
                {/* Noon (active) */}
                <div className="flex flex-col items-center gap-base h-full justify-end">
                  <p className="font-label-caps text-label-caps text-primary">Noon</p>
                  <div className="w-full bg-[#00C2B8] dark:bg-[#40dcd1] rounded-t-lg h-full flex items-center justify-center shadow-lg">
                    <span className="font-h3 text-h3 text-white dark:text-on-primary">35°C</span>
                  </div>
                </div>
                {/* Evening */}
                <div className="flex flex-col items-center gap-base h-full justify-end">
                  <p className="font-label-caps text-label-caps">Evening</p>
                  <div className="w-full bg-surface-container rounded-t-lg h-[30%] flex items-center justify-center transition-all hover:bg-primary-container/20">
                    <span className="font-h3 text-h3">15°C</span>
                  </div>
                </div>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant italic">
                Today: 20°C → 35°C → 15°C. Expect a significant thermal shift.
              </p>
            </div>

            {/* Clothing + Humidity Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Clothing Recommendation */}
              <div className="bg-surface-container-lowest border border-slate-200 dark:border-slate-800 rounded-xl p-md shadow-sm flex items-start gap-md">
                <div className="p-3 bg-secondary-fixed rounded-lg">
                  <span className="material-symbols-outlined text-on-secondary-fixed" data-icon="checkroom">checkroom</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary mb-1 block">CLOTHING RECOMMENDATION</span>
                  <p className="font-h3 text-h3 mb-2">Suggestion: Simple jacket</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Layer up for the midday heat and evening chill. Choose breathable cotton for base layers.
                  </p>
                </div>
              </div>

              {/* Humidity Alert */}
              <div className="bg-surface-container-lowest border border-slate-200 dark:border-slate-800 rounded-xl p-md shadow-sm flex items-start gap-md">
                <div className="p-3 bg-tertiary-fixed rounded-lg">
                  <span className="material-symbols-outlined text-on-tertiary-fixed" data-icon="opacity">opacity</span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-tertiary mb-1 block">HUMIDITY ALERT</span>
                  <p className="font-h3 text-h3 mb-2">Low: 22%</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Dry air detected. Skin barrier may feel tight as temperature drops this evening.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── RIGHT COLUMN: Routine + Map ── */}
          <aside className="lg:col-span-4 flex flex-col gap-gutter">
            {/* Dynamic Routine Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[#00C2B8]/5 to-transparent pointer-events-none" />
              <div className="p-md">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-h2 text-h2">Dynamic Routine</h3>
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
                </div>

                <div className="space-y-md">
                  {/* 08:00 */}
                  <div className="flex gap-md items-start p-base rounded-lg hover:bg-surface-container-low transition-colors group">
                    <span className="font-label-caps text-label-caps w-12 pt-1 text-on-surface-variant">08:00</span>
                    <div>
                      <p className="font-h3 text-sm font-bold group-hover:text-primary transition-colors">Protective Base</p>
                      <p className="text-xs text-on-surface-variant">
                        Light antioxidant serum + Ceramide moisturizer to prep for the heat spike.
                      </p>
                    </div>
                  </div>

                  {/* 12:30 (highlighted) */}
                  <div className="flex gap-md items-start p-base rounded-lg bg-primary-container/10 border border-primary-container/20 group">
                    <span className="font-label-caps text-label-caps w-12 pt-1 text-primary">12:30</span>
                    <div>
                      <p className="font-h3 text-sm font-bold text-primary">High UV Protection</p>
                      <p className="text-xs text-on-surface-variant">
                        Re-apply SPF 50+. Focus on cooling mist application to manage surface temp (35°C).
                      </p>
                    </div>
                  </div>

                  {/* 19:00 */}
                  <div className="flex gap-md items-start p-base rounded-lg hover:bg-surface-container-low transition-colors group">
                    <span className="font-label-caps text-label-caps w-12 pt-1 text-on-surface-variant">19:00</span>
                    <div>
                      <p className="font-h3 text-sm font-bold group-hover:text-primary transition-colors">Intense Recovery</p>
                      <p className="text-xs text-on-surface-variant">
                        Thicker barrier cream needed as temp drops to 15°C. Hyaluronic acid on damp skin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Image + CTA */}
                <div className="mt-lg relative h-48 rounded-lg overflow-hidden group">
                  <Image
                    fill
                    alt="Skincare products arranged on marble surface"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc1vfrAf3m9cDITUgdC85s2b5erfAGX5xBiiRz-kNMKuZ74wNd033YUhvGliYU2aHicIOliVvj_NuS-syLre69KoD-qQkOgHsbd5XhwE9GYRtS42aEK0LyLMcL2gD076GFvMVFtYXBcJyAK46wQ2g60cdnqwMtSIxNksjzDqaHqZo6Z2dd3VA2fxmrLFPj3p6FHA8EJ5hMuJHnl2Zkycv8zOgD8kWQu-umFH47WkDtlSU9GrPh0DGAlLJUoTJzYCtZr3JmxRnhmJo"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <button className="w-full bg-white text-on-surface font-bold py-3 rounded-lg text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">
                      Shop Routine Essentials
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Analysis Map */}
            <div className="glass p-md rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-base">LOCAL ANALYSIS MAP</span>
              <div className="h-32 bg-surface-container rounded-lg overflow-hidden relative">
                <Image
                  fill
                  alt="Local analysis map of San Francisco"
                  className="object-cover opacity-50 grayscale"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy4cjlZZ5fncj_XyEPK5JanqMpojcD2lp8ZYPKoSRJWQY6xYOoYwLVDdt6okHtrLmCdglNvigT6fK5hbWA0SEKb8MEYDtTbqWGX8FcYlQWeHB6hHuw0vtprF_HNvKkbjDTCMY5Y6PyLPhhbkfpN1ToXdTxehml3UiwJH0L2DpthaNdDDGSuELL1jm_KbHsYPjmLEYYrBOmhqgz5142Kpe2u5AbjM5bnysMD_m9TiXCSMpZSVKVa_yE3BcaYuT5TGfZAfEEo5D21ew"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#00C2B8] dark:bg-[#40dcd1] rounded-full animate-ping" />
                  <div className="absolute w-3 h-3 bg-[#00C2B8] dark:bg-[#40dcd1] rounded-full border-2 border-white shadow-md" />
                </div>
              </div>
              <p className="font-body-md text-xs mt-base text-on-surface-variant">
                Analyzing air quality and pollution levels in your area.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-[#00C2B8] dark:bg-[#40dcd1] text-white dark:text-on-primary p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center gap-2">
        <span className="material-symbols-outlined" data-icon="add">add</span>
        <span className="font-bold text-sm hidden md:block">Update Skin Log</span>
      </button>
    </>
  );
}
