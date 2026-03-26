import { useState, useMemo } from "react";
import data from "../data/gcc-model.json";

const COUNTRIES = data.countries;
const SCENARIOS = data.scenarios;
const LIVE = data.liveStatus;

const GDP_USD = { kwt:146, qat:193, bhr:45, sau:1274, uae:564, omn:105 };
const fmtPct = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

// ── Live situation ────────────────────────────────────────────────────────
function LiveBlock() {
  return (
    <div className="mb-8">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
        Situation as of {data.meta.lastUpdated}
      </p>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Conflict day",    value: `Day ${LIVE.conflictDay}`,       sub: "Since 28 Feb 2026",            color: "text-red-600" },
          { label: "Brent crude",     value: `$${LIVE.oilPrice}`,             sub: `+$${LIVE.oilChange24h} 24h`,   color: "text-amber-600" },
          { label: "Hormuz status",   value: "Effectively closed",             sub: "Tanker traffic –90%",          color: "text-red-600" },
          { label: "Qatar LNG",       value: "Force majeure",                  sub: "17% capacity offline 3-5yr",   color: "text-red-600" },
        ].map((card) => (
          <div key={card.label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-semibold leading-tight ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {["Iran mines confirmed","Qatar LNG force majeure","P&I insurance cancelled",
              "USS Ford — Arabian Sea","IEA 400mb reserve release","Ras Laffan 17% offline"].map((s, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded border ${i < 3 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Key events</p>
          <div className="space-y-1">
            {LIVE.keyEvents.slice(-5).map((e, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-gray-400 w-14 flex-shrink-0 font-mono">{e.date}</span>
                <span className="text-gray-600">{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scenario cards ────────────────────────────────────────────────────────
function ScenarioBar({ value, baseline, max = 42 }) {
  const absVal = Math.abs(value);
  const baseWidthPct = Math.min(Math.abs(baseline) / max * 100, 100);
  const widthPct = Math.min(absVal / max * 100, 100);
  const barColor = value >= 0 ? "bg-green-500" : value > -10 ? "bg-amber-500" : "bg-red-500";
  const textColor = value >= 0 ? "text-green-700" : value > -10 ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-4 bg-gray-100 rounded-sm relative overflow-hidden">
        <div className={`h-full rounded-sm ${barColor}`} style={{ width: `${widthPct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-gray-400 opacity-60" style={{ left: `${baseWidthPct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-14 text-right tabular-nums ${textColor}`}>
        {fmtPct(value)}
      </span>
    </div>
  );
}

function ScenarioCard({ scenario, isSelected, onClick }) {
  const colorMap = {
    A: { border: isSelected ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300", hdr: "text-green-800" },
    B: { border: isSelected ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300", hdr: "text-amber-800" },
    C: { border: isSelected ? "border-red-400 bg-red-50"   : "border-gray-200 hover:border-red-300",   hdr: "text-red-800"   },
  }[scenario.id];

  return (
    <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${colorMap.border}`} onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className={`text-sm font-semibold ${colorMap.hdr}`}>{scenario.label}</span>
          <p className="text-xs text-gray-500">{scenario.sublabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Reopens</p>
          <p className="text-xs font-medium text-gray-600">{scenario.reopens}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {scenario.totalWeeks} weeks · Oil avg ${scenario.oilAnnualAvg}/bbl
      </p>
      <div className="space-y-2">
        {COUNTRIES.map((c) => {
          const s = c.scenarios[scenario.id];
          return (
            <div key={c.id}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-500 w-24">{c.name}</span>
                <span className={`font-medium ${s.delta > 0 ? "text-green-600" : "text-red-500"}`}>
                  {fmtPct(s.delta)}
                </span>
              </div>
              <ScenarioBar value={s.fiscalBalancePct} baseline={c.baseline.fiscalBalancePct} />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 border-t border-gray-200 pt-3 leading-relaxed">
        {scenario.rationale}
      </p>
    </div>
  );
}

// ── Assumptions table ─────────────────────────────────────────────────────
function AssumptionsTable({ scenarioId }) {
  const rows = [
    { v: "Oil price — during closure ($/bbl)", vals: { A:"$115", B:"$125", C:"$130" }, note:"EIA STEO Mar 2026: peaked $126. Current spot ~$109." },
    { v: "Annual avg hydrocarbon price ($/bbl)", vals: { A:"$75.1", B:"$77.2", C:"$81.5" }, note:"Sc B validates against BofA $77.50 forecast ✓" },
    { v: "War / closure duration (months)", vals: { A:"1.15", B:"1.62", C:"2.54" }, note:"From 28 Feb 2026 conflict start" },
    { v: "Kuwait/Qatar/Bahrain — exports", vals: { A:"–100%", B:"–100%", C:"–100%" }, note:"Zero bypass — total export loss during closure" },
    { v: "Saudi bypass (m b/d)", vals: { A:"3.0", B:"3.0", C:"3.0" }, note:"East-West Pipeline to Yanbu. StanChart: 2.0-2.5m b/d operational." },
    { v: "UAE Fujairah bypass (m b/d)", vals: { A:"1.8", B:"1.8", C:"1.8" }, note:"Abu Dhabi Crude Oil Pipeline. UAE stays in surplus even at zero." },
    { v: "Qatar Ras Laffan damage", vals: { A:"–17%", B:"–17%", C:"–17%" }, note:"Trains 4 & 6 offline 3-5 years. Permanent hit regardless of Hormuz. QatarEnergy CEO Mar 19 2026." },
    { v: "Non-oil revenue hit/mo (Bahrain)", vals: { A:"–6%", B:"–6%", C:"–6%" }, note:"Tourism, F1, financial services, retail" },
    { v: "Hydrocarbon spending shock (Saudi)", vals: { A:"+4%", B:"+4%", C:"+4%" }, note:"Active combatant — air defence restocking, fuel subsidies" },
    { v: "Military spending shock — breakdown", vals: { A:"by country", B:"by country", C:"by country" }, note:"Saudi 4%, UAE 3%, Kuwait/Qatar/Bahrain 2%, Oman 1%/mo" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left font-medium text-gray-500 pb-2 pr-4 w-52">Variable</th>
            <th className="text-center font-medium text-green-700 pb-2 px-3 w-14">Sc A</th>
            <th className="text-center font-medium text-amber-700 pb-2 px-3 w-14">Sc B</th>
            <th className="text-center font-medium text-red-700 pb-2 px-3 w-14">Sc C</th>
            <th className="text-left font-medium text-gray-400 pb-2 pl-4">Source / note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 pr-4 text-gray-700">{row.v}</td>
              {["A","B","C"].map((sc) => (
                <td key={sc} className={`py-2 px-3 text-center font-mono tabular-nums ${scenarioId===sc ? "bg-yellow-50 font-semibold" : "text-gray-600"}`}>
                  {row.vals[sc]}
                </td>
              ))}
              <td className="py-2 pl-4 text-gray-400 leading-relaxed">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">
        Sources: IMF WEO Oct 2025 · EIA STEO Mar 2026 · BofA/Goldman/StanChart Mar 2026 · Columbia CGEP Mar 2026 · QatarEnergy CEO statement Mar 2026
      </p>
    </div>
  );
}

// ── Build your own — global sliders ──────────────────────────────────────
function BuildYourOwn() {
  const [warWeeks, setWarWeeks]     = useState(7);
  const [hormuzPct, setHormuzPct]   = useState(100);
  const [oilWar, setOilWar]         = useState(125);
  const [oilPost, setOilPost]       = useState(70);
  const [milPct, setMilPct]         = useState(2);
  const [subPct, setSubPct]         = useState(1);
  const [nolPct, setNolPct]         = useState(3);

  const warMos = warWeeks / 4.33;

  const oilAvg = useMemo(() => {
    return (2*69 + warMos*oilWar + Math.max(0,10-warMos)*oilPost) / 12;
  }, [warMos, oilWar, oilPost]);

  const results = useMemo(() => {
    const oil_sh   = [0.858,0.792,0.542,0.546,0.527,0.696];
    const bypass_v = [0,0,0,3.0,1.8,0.8];
    const fullprod = [2.59,0.77,0.18,10.15,3.40,0.81];
    const nol_25   = [2.90,43.699,1.500,505.284,280.193,3.573];
    const oil_25   = [17.40,166.317,1.774,606.545,312.782,8.187];
    const exp_25   = [24.491,201.0,5.378,1388.433,486.683,12.240];
    const gdp_25   = [47.95,793.69,18.29,4788.54,2105.62,37.27];
    const imf_sp   = [0.0245,0.0538,0.0358,0.0328,0.0397,-0.0144];
    const mfg_sh   = [0.08,0.077,0.20,0.158,0.093,0.106];
    const oth_sh   = [0.52,0.57,0.67,0.67,0.72,0.52];
    const mfg_shk  = [-0.80,-0.90,-0.60,-0.60,-0.40,0.0];
    const oth_shk  = [-0.10,-0.10,-0.15,-0.05,-0.15,0.0];
    const base_pct = [-10.3,-0.2,-13.0,-6.4,4.5,-0.9];
    const cl = hormuzPct / 100;

    return COUNTRIES.map((c, i) => {
      const byp_f = Math.min(1, Math.max(0, (bypass_v[i]+0.1*fullprod[i])/fullprod[i]));
      let oil_chg;
      if (i >= 3) {
        oil_chg = (2*(1+0.07) + warMos*(1+byp_f-1+((oilWar-65)/65)*byp_f*cl) + Math.max(0,10-warMos)*(1+0.08)*oilPost/65)/12 - 1;
      } else {
        oil_chg = (2*(1+0.05) + warMos*(1-cl) + Math.max(0,10-warMos)*(1+((oilPost-65)/65)))/12 - 1;
      }
      const nol_chg = -(nolPct/100) * warMos/12;
      const spend_chg = imf_sp[i] + (milPct+subPct)/100 * warMos/12;
      const rev26 = oil_25[i]*(1+oil_chg) + nol_25[i]*(1+nol_chg);
      const exp26 = exp_25[i]*(1+spend_chg);
      const gdp_chg = oil_sh[i]*oil_chg + mfg_sh[i]*(mfg_shk[i]*warMos/12) + oth_sh[i]*(oth_shk[i]*warMos/12);
      const gdp26 = gdp_25[i]*(1+gdp_chg);
      const bal = (rev26-exp26)/gdp26*100;
      return { name:c.name, bal, delta:bal-base_pct[i] };
    });
  }, [warWeeks, hormuzPct, oilWar, oilPost, milPct, subPct, nolPct, warMos]);

  const reopensDate = new Date(2026, 2, 25);
  reopensDate.setDate(reopensDate.getDate() + (warWeeks-3)*7);
  const reopensStr = reopensDate.toLocaleDateString("en-GB",{day:"numeric",month:"short"});

  const Slider = ({ label, value, min, max, step, onChange, display, hint }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-sm font-semibold text-gray-800">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
        Build your own scenario — global (all 6 countries update simultaneously)
      </p>
      <div className="grid grid-cols-2 gap-6">
        {/* LHS — variables */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Variables</p>

          <Slider label="War / closure duration" value={warWeeks} min={1} max={16} step={1}
            onChange={setWarWeeks} display={`${warWeeks} weeks · reopens ~${reopensStr}`}
            hint={`Sc A=5wk · Sc B=7wk · Sc C=11wk · Total ${warWeeks+3}wks from 28 Feb`} />

          <Slider label="% Hormuz closed" value={hormuzPct} min={0} max={100} step={5}
            onChange={setHormuzPct} display={`${hormuzPct}%`}
            hint="100%=full closure · 50%=selective tanker attacks · 0%=open" />

          <Slider label="Oil/gas price during war ($/bbl)" value={oilWar} min={70} max={160} step={5}
            onChange={setOilWar} display={`$${oilWar}/bbl`}
            hint="Current spot ~$109 · Sc B=$125 · Range $90–$150" />

          <Slider label="Oil/gas price post-war ($/bbl)" value={oilPost} min={55} max={90} step={1}
            onChange={setOilPost} display={`$${oilPost}/bbl`}
            hint={`BofA mid-cycle $70 · Annual avg: $${oilAvg.toFixed(1)}/bbl`} />

          <Slider label="Military spending increase (%/mo)" value={milPct} min={0} max={8} step={0.5}
            onChange={setMilPct} display={`+${milPct}%/mo`}
            hint="Saudi=4%, UAE=2%, Kuwait=2%, others=1%. Applied globally here." />

          <Slider label="Subsidies & support (%/mo)" value={subPct} min={0} max={4} step={0.5}
            onChange={setSubPct} display={`+${subPct}%/mo`}
            hint="Bahrain risk: 3–4% social stability. Saudi: 2%. Others: 1%." />

          <Slider label="Non-hydrocarbon revenue hit (%/yr)" value={nolPct} min={0} max={15} step={0.5}
            onChange={setNolPct} display={`–${nolPct}%/yr`}
            hint="Qatar –5%, Bahrain –6%, UAE –4%. Applied globally here." />
        </div>

        {/* RHS — outputs */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Live outputs</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Annual oil avg</p>
              <p className="text-lg font-semibold text-amber-700">${oilAvg.toFixed(1)}/bbl</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Scenario benchmark</p>
              <p className="text-lg font-semibold text-gray-800">
                {warWeeks <= 4 ? "≈ Sc A" : warWeeks <= 8 ? "≈ Sc B" : warWeeks <= 12 ? "≈ Sc C" : "> Sc C"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {results.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-medium text-gray-600">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold tabular-nums ${r.bal >= 0 ? "text-green-700" : r.bal > -10 ? "text-amber-700" : "text-red-700"}`}>
                      {fmtPct(r.bal)}
                    </span>
                    <span className={`text-xs tabular-nums ${r.delta > 0 ? "text-green-500" : "text-red-400"}`}>
                      {fmtPct(r.delta)}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-sm overflow-hidden mt-0.5">
                  {/* Zero centre line */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-gray-400 z-10" />
                  {/* Bar — extends left if negative, right if positive */}
                  {r.bal >= 0 ? (
                    <div
                      className="absolute top-0 h-full bg-green-400 rounded-r-sm transition-all duration-300"
                      style={{ left: '50%', width: `${Math.min(r.bal / 45 * 50, 50)}%` }}
                    />
                  ) : (
                    <div
                      className={`absolute top-0 h-full rounded-l-sm transition-all duration-300 ${r.bal > -10 ? "bg-amber-400" : "bg-red-500"}`}
                      style={{ right: '50%', width: `${Math.min(Math.abs(r.bal) / 45 * 50, 50)}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>–45%</span>
                  <span>0</span>
                  <span>+</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span></span>
              <div className="flex gap-3">
                <span>Balance % GDP</span>
                <span>Δ vs baseline</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-gray-100 pt-3">
            Global sliders apply the same % to all countries. For per-country control,
            use the Country Deep Dives tab.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Tab 2 ────────────────────────────────────────────────────────────
export default function Tab2_Scenarios() {
  const [selectedScenario, setSelectedScenario] = useState("B");

  return (
    <div className="space-y-8">
      <LiveBlock />

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
          Scenario analysis — fiscal balance % of GDP
        </p>
        <div className="grid grid-cols-3 gap-4 mb-2">
          {Object.values(SCENARIOS).map((sc) => (
            <ScenarioCard key={sc.id} scenario={sc}
              isSelected={selectedScenario === sc.id}
              onClick={() => setSelectedScenario(sc.id)} />
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Vertical line = no-war baseline · Click a scenario to highlight assumptions below
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
          Model assumptions
        </p>
        <AssumptionsTable scenarioId={selectedScenario} />
      </div>

      <BuildYourOwn />
    </div>
  );
}
