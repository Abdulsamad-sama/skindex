import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
      {/* Header & Primary Actions */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-6">
        <div>
          <span className="font-label-caps text-primary uppercase tracking-widest mb-2 block">Clinical Dashboard</span>
          <h1 className="font-display text-display text-on-surface">Analysis Results</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mt-2">Latest scan completed today at 09:42 AM. Precision metrics for your unique skin profile.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl flex items-center gap-2 hover:-translate-y-0.5 transition-all duration-200 shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[20px]" data-icon="cloud">cloud</span>
            View Weather Routine
          </button>
          <button className="px-8 py-3 bg-primary-container text-white font-bold rounded-xl flex items-center gap-2 hover:-translate-y-1 transition-all duration-200 shadow-lg shadow-primary-container/20">
            <span className="material-symbols-outlined text-[20px]" data-icon="refresh">refresh</span>
            Redo Analysis
          </button>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Skin Visualization (LHS) */}
        <div className="lg:col-span-5 flex flex-col gap-gutter">
          <div className="relative rounded-3xl overflow-hidden bg-slate-200 aspect-4/5 shadow-xl group">
            <Image
              fill
              alt="Skin Analysis"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC3ywtVOHp-OgASltpiWwe4GyPS3XtmZOWEAoOzz1TOmXahzkUH8ou8SvU68hhpjHWBV_UhWxAzPl8XToC0oqWsKdKCvLoNakclC5TdD137t9mlhfh0k7LNgFqiqcnEfztPVyM1eO80O8ma8WASIeOFMMv0LBrTSUT7zVfi_TGwuyJaTROhyRVjwF-zjHjTh7mMRr28vmY7QSr7F5D6SBCYDxgc4TSwJy-q95cARGzSZOWI3IkUuXN7TdRlLltb1pwp4-J5VAL_Po"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent"></div>
            <div className="scan-line"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass p-4 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Health Score</p>
                    <p className="text-3xl font-black">84<span className="text-sm font-medium ml-1">/100</span></p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-primary-container flex items-center justify-center bg-slate-900/50">
                    <span className="material-symbols-outlined" data-icon="verified">verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Data (RHS) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-gutter content-start">
          {/* Summary Metrics */}
          <Card className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm ring-0 gap-0">
            <CardHeader className="p-0 mb-md pb-0">
              <CardTitle className="font-h3 text-h3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-icon="analytics">analytics</span>
                Metrics Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-label-caps text-on-surface-variant">HYDRATION</p>
                  <p className="text-2xl font-bold">72%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary-container h-full w-[72%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label-caps text-on-surface-variant">ELASTICITY</p>
                  <p className="text-2xl font-bold">88%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-tertiary-container h-full w-[88%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label-caps text-on-surface-variant">LUMINOSITY</p>
                  <p className="text-2xl font-bold">64%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-secondary-container h-full w-[64%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label-caps text-on-surface-variant">SENSITIVITY</p>
                  <p className="text-2xl font-bold">15%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full w-[15%]"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-label-caps text-on-surface-variant">UV DAMAGE</p>
                  <p className="text-2xl font-bold text-secondary">Low</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full w-[12%]"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detected Concerns */}
          <Card className="md:col-span-2 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm ring-0 gap-0">
            <CardHeader className="p-0 mb-md pb-0">
              <CardTitle className="font-h3 text-h3 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary" data-icon="report_problem">report_problem</span>
                Detected Concerns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined" data-icon="tonality">tonality</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Hyperpigmentation</h4>
                  <p className="text-sm text-on-surface-variant">Localized activity detected in the cheek area (12% intensity).</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-black rounded uppercase">Priority</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <span className="material-symbols-outlined" data-icon="water_drop">water_drop</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Transepidermal Water Loss</h4>
                  <p className="text-sm text-on-surface-variant">Slight dehydration detected in the orbital region.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Ingredients Section Header */}
          <div className="md:col-span-2 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-h2 text-h2">Precision Formulations</h2>
              <span className="text-sm font-medium text-primary hover:underline cursor-pointer">Science Documentation →</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Product 1: Vitamin C */}
              <Card className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300 ring-0 p-0 gap-0">
                <div className="h-40 relative">
                  <Image fill alt="Vitamin C Serum" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCM0JQQ-cUa4Ykg7C6HoFJmQaaLhzcipV9cB1t38MWXs6dMt4arnwfEy_Q5bDhy2cvWftlbjGIuu-75DCwfbEvzYUoRExaUvC2u1mNwqRhmj53nlNj3SX9jH1tGklsNg5V3cL4qM1J0cuCjLQzmvpN1GAHvpb8jj6ikQ-etNzKH7Btl0zkxudLfH1Xfd3UpyFxAXBC53yVkUgDNtWKEveRhYsEImV5XY-7ZQ6f2mTLeZtEJvt2qeH7jkTTeVzJJpcuAn3ziiIBBnhI" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-tighter">Brightening</div>
                </div>
                <CardContent className="p-6">
                  <CardTitle className="font-h3 text-h3 mb-1">C-Glow 15%</CardTitle>
                  <CardDescription className="text-sm text-on-surface-variant mb-4 m-0 p-0">Targeted for hyperpigmentation and uneven skin tone.</CardDescription>
                </CardContent>
              </Card>

              {/* Product 2: Hyaluronic Acid */}
              <Card className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300 ring-0 p-0 gap-0">
                <div className="h-40 relative">
                  <Image fill alt="Hyaluronic Acid" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWLQVQ53FclVQnhlxLmx_o055f-oHCjUuFyxoa6p8URnBp-Vk2wJ1DE3rWuFxrRbUN5JDsWIS_2ixrmwkeZ3XbVZE629FXHqntki56Y_YsCBSlmiOpoS9SmLFl2RxsWr9QR7aNG7Mis84gW7_N42Jnu45QLRktcqLpv7YdM2bhf-RaIlHFq3a1N7lBQHr5yoWfOm0Oqniur39BheRdsUZYsx2J9q0fUQ-IE3n1nWMLtr1MWVzc5u5HQbxHVcPjrbuHyHRU8ruF6EY" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-tighter">Hydration</div>
                </div>
                <CardContent className="p-6">
                  <CardTitle className="font-h3 text-h3 mb-1">Hydro-Matrix</CardTitle>
                  <CardDescription className="text-sm text-on-surface-variant mb-4 m-0 p-0">Multi-molecular weight for deep dermal hydration.</CardDescription>
                </CardContent>
              </Card>

              {/* Product 3: Niacinamide */}
              <Card className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300 ring-0 p-0 gap-0">
                <div className="h-40 relative">
                  <Image fill alt="Niacinamide" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnThOGqff9yvmCXFnYZsiCPavdQ7laxAJA6-zVO9hy1p_y-fvO5-cpOxvG0GvEeK8g6K7m46dgFrOoh-ONhA_84DaPK0LL44RGlW6ptfqzOzLMob0E4nQgJFEbbWJ6uXqOiauncy521BrKIoTSPHF2vWxTmr3Vx9wpFtop1dufmg9Jk_GL-oMJOOmFQfmWFQrzz7rAO3nBoy-IWJOiR9ie6wjQ_3j8KnDHZSpv-4fU3aBlw5c_2y-wMXAQAVTFzwPMdfRH0qI8-VQ" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-slate-900 shadow-sm uppercase tracking-tighter">Barrier</div>
                </div>
                <CardContent className="p-6">
                  <CardTitle className="font-h3 text-h3 mb-1">Niacin-B3</CardTitle>
                  <CardDescription className="text-sm text-on-surface-variant mb-4 m-0 p-0">Strengthens the skin barrier and minimizes pores.</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
