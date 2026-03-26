import { useState } from "react";
import data from "../data/gcc-model.json";

const COUNTRIES = data.countries;
const GDP_USD   = { kwt:146, qat:193, bhr:45, sau:1274, uae:564, omn:105 };
const fmtPct    = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
const fmtPct2   = (v) => v.toFixed(1) + "%";

const SCENARIO_2026 = {
  baseline: { label:"No-war baseline", color:"bg-gray-300",   text:"text-gray-600" },
  A:        { label:"Sc A — +2 weeks", color:"bg-green-400",  text:"text-green-700" },
  B:        { label:"Sc B — +1 month", color:"bg-amber-400",  text:"text-amber-700" },
  C:        { label:"Sc C — +2 months",color:"bg-red-500",    text:"text-red-700"   },
};

function ForecastBar({ value, max=45, color }) {
  const pct = Math.min(Math.abs(value)/max*100,100);
  const isPos = value >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-gray-100 rounded-sm overflow-hidden">
        <div className={`h-full rounded-sm ${isPos ? "bg-green-500" : color}`} style={{ width:`${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-12 text-right ${isPos?"text-green-700":"text-gray-700"}`}>
        {fmtPct(value)}
      </span>
    </div>
  );
}

function CountryForecastCard({ country }) {
  const bal25 = country.baseline.fiscalBalancePct;
  const scA   = country.scenarios.A.fiscalBalancePct;
  const scB   = country.scenarios.B.fiscalBalancePct;
  const scC   = country.scenarios.C.fiscalBalancePct;
  const f27   = country.forecast2027;
  const isQatar = country.id === "qat";

  const rows = [
    { year:"2025 (pre-war)",  val:bal25,    color:"bg-gray-400",  note:"IMF WEO Oct 2025 baseline" },
    { year:"2026 — Sc A",     val:scA,      color:"bg-green-400", note:`+2wk · oil $75/bbl avg` },
    { year:"2026 — Sc B",     val:scB,      color:"bg-amber-400", note:`+1mo · oil $77/bbl avg` },
    { year:"2026 — Sc C",     val:scC,      color:"bg-red-500",   note:`+2mo · oil $82/bbl avg` },
    { year:"2027 (recovery)", val:f27.fiscalBalancePct, color:"bg-blue-400", note:f27.note },
  ];

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{country.name}</p>
          <p className="text-xs text-gray-400">{country.lcu} · GDP ${ GDP_USD[country.id]}bn</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold tabular-nums ${f27.fiscalBalancePct>=0?"text-blue-700":f27.fiscalBalancePct>-8?"text-amber-700":"text-red-700"}`}>
            {fmtPct(f27.fiscalBalancePct)}
          </p>
          <p className="text-xs text-gray-400">2027 forecast</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-gray-500 font-medium">{row.year}</span>
              <span className="text-gray-400">{row.note}</span>
            </div>
            <ForecastBar value={row.val} color={row.color} />
          </div>
        ))}
      </div>

      {isQatar && (
        <div className="mt-3 bg-red-50 rounded p-2">
          <p className="text-xs text-red-600 leading-relaxed">
            2027 recovery limited by Ras Laffan — 17% LNG capacity offline until 2029-2031.
            ~4% of GDP permanent revenue gap post-Hormuz.
          </p>
        </div>
      )}
    </div>
  );
}

function DebtTrajectory() {
  const [scenario, setScenario] = useState("B");
  const scData = {
    baseline: { kwt:22, qat:41, bhr:134, sau:32, uae:30, omn:35 },
    A:  { kwt:24, qat:42, bhr:142, sau:33, uae:30, omn:35 },
    B:  { kwt:26, qat:46, bhr:153, sau:35, uae:30, omn:34 },
    C:  { kwt:33, qat:50, bhr:167, sau:38, uae:29, omn:33 },
    r27:{ kwt:28, qat:48, bhr:158, sau:36, uae:30, omn:34 },
  };
  const base = scData.baseline;
  const war  = scData[scenario];
  const rec  = scData.r27;

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Debt / GDP trajectory — 2025 → 2026 → 2027
        </p>
        <div className="flex gap-1">
          {["A","B","C"].map((s) => (
            <button key={s} onClick={()=>setScenario(s)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                scenario===s
                  ? s==="A"?"bg-green-100 text-green-800":s==="B"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              Sc {s}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left font-medium text-gray-500 pb-2 pr-4">Country</th>
              <th className="text-center font-medium text-gray-500 pb-2 px-3">2025 pre-war</th>
              <th className={`text-center font-medium pb-2 px-3 ${scenario==="A"?"text-green-700":scenario==="B"?"text-amber-700":"text-red-700"}`}>
                2026 war ({`Sc ${scenario}`})
              </th>
              <th className="text-center font-medium text-blue-600 pb-2 px-3">2027 recovery</th>
              <th className="text-center font-medium text-gray-500 pb-2 px-3">Change 2025→2027</th>
            </tr>
          </thead>
          <tbody>
            {COUNTRIES.map((c) => {
              const id  = c.id;
              const b   = base[id]; const w = war[id]; const r = rec[id];
              const chg = r - b;
              return (
                <tr key={id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-700">{c.name}</td>
                  <td className="py-2 px-3 text-center tabular-nums text-gray-600">{b}%</td>
                  <td className={`py-2 px-3 text-center tabular-nums font-semibold ${w>100?"text-red-700":w>60?"text-amber-700":"text-gray-700"}`}>
                    {w}%
                    {w>b && <span className="text-red-400 ml-1 font-normal">+{w-b}pp</span>}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums text-blue-700 font-medium">{r}%</td>
                  <td className={`py-2 px-3 text-center tabular-nums font-semibold ${chg>0?"text-red-600":"text-green-600"}`}>
                    {chg>0?"+":""}{chg}pp
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Bahrain Sc B debt/GDP at 153% — well above 134% pre-war. GCC bailout threshold typically ~150%.
        Post-war recovery assumes partial fiscal consolidation and moderate oil price ($67/bbl 2027).
      </p>
    </div>
  );
}

function KeyRisks2027() {
  const risks = [
    { country:"Qatar",        risk:"Ras Laffan offline 3-5yr",  impact:"–4% GDP/yr permanent",      color:"red" },
    { country:"Bahrain",      risk:"Debt > 150% GDP → bailout", impact:"GCC emergency support likely", color:"red" },
    { country:"Kuwait",       risk:"FGF drawdown = deficit finance", impact:"SWF depleted over time if deficit persists", color:"amber" },
    { country:"Saudi Arabia", risk:"Vision 2030 disruption",    impact:"Non-oil revenue diversification delayed", color:"amber" },
    { country:"UAE (Dubai)",  risk:"Jebel Ali trade confidence lags", impact:"Real estate/finance recovery slow", color:"amber" },
    { country:"Oman",         risk:"Oil price normalisation",   impact:"War windfall fades → back to near-deficit", color:"green" },
  ];
  const colors = {
    red:   "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    green: "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
        Key 2027 recovery risks per country
      </p>
      <div className="grid grid-cols-2 gap-3">
        {risks.map((r, i) => (
          <div key={i} className={`rounded-lg p-3 border ${colors[r.color]}`}>
            <p className="text-xs font-semibold mb-1">{r.country}</p>
            <p className="text-xs font-medium mb-0.5">{r.risk}</p>
            <p className="text-xs opacity-80">{r.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Tab4_Forecast() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">
          2-year fiscal trajectory — 2026 war year + 2027 recovery
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Pre-war IMF trajectory disrupted by Hormuz closure in 2026.
          2027 assumes Hormuz reopening (~95% normalisation), partial fiscal consolidation,
          and oil at ~$67/bbl (EIA STEO Mar 2026). Qatar 2027 reflects permanent Ras Laffan damage.
          Debt service on 2026 war borrowing becomes a recurring drag in 2027 and beyond.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COUNTRIES.map((c) => <CountryForecastCard key={c.id} country={c} />)}
      </div>

      <DebtTrajectory />

      <KeyRisks2027 />

      <div className="bg-gray-50 rounded-xl p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
          Key assumptions — 2027 recovery scenario
        </p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            ["Hormuz normalisation","~95% — residual tanker risk premium, slow insurance recovery"],
            ["Oil price 2027","$64–67/bbl — EIA STEO Mar 2026 base case; BofA $70 bull case"],
            ["Qatar Ras Laffan","0% repair progress in 2027 — 3-5yr timeline, no shortcuts"],
            ["Military spending","50-60% of war level retained — post-war defence posture elevated"],
            ["Subsidy rollback","30-50% rolled back — politically constrained, especially Bahrain"],
            ["Non-oil recovery","75-95% of 2025 baseline — UAE/Saudi faster, Qatar structurally impaired"],
            ["Debt service","Interest on 2026 war borrowing becomes permanent annual burden"],
            ["Bahrain bailout","GCC emergency support modelled if debt/GDP exceeds 150%"],
          ].map(([k,v],i) => (
            <div key={i}>
              <span className="font-medium text-gray-600">{k}: </span>
              <span className="text-gray-400">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-200">
          Sources: IMF WEO Oct 2025 · EIA STEO Mar 2026 · BofA Mar 2026 · World Bank GEU Dec 2025 ·
          QatarEnergy CEO statement Mar 2026 · IMF Article IV consultations per country 2025-2026
        </p>
      </div>
    </div>
  );
}
