import { useState } from "react";
import data from "../data/gcc-model.json";

const COUNTRIES = data.countries;

function KpiCard({ country }) {
  const bal = country.baseline.fiscalBalancePct;
  const isPos = bal >= 0;
  const colorClass = isPos ? "text-green-700" : Math.abs(bal) < 1.5 ? "text-gray-500" : bal > -8 ? "text-amber-700" : "text-red-700";
  const subLabel = isPos ? "Surplus" : Math.abs(bal) < 1.5 ? "Near balance" : bal > -8 ? "Moderate deficit" : "Structural deficit";
  const isBeneficiary = country.baseline.riskRating === "Beneficiary";
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1.5">
        {country.name}
        {country.id === "uae" && <span className="text-gray-400"> *</span>}
      </p>
      <p className={`text-2xl font-semibold leading-none mb-1 tabular-nums ${colorClass}`}>
        {isPos ? "+" : ""}{bal.toFixed(1)}%
      </p>
      <p className="text-xs text-gray-400">{subLabel}</p>
      {isBeneficiary && <p className="text-xs text-blue-500 mt-1">War beneficiary</p>}
    </div>
  );
}

function HydrocarbonRevenueBar({ country }) {
  const oil = country.baseline.oilRevShare;
  const nol = country.baseline.nonOilRevShare;
  const isGas = country.id === "qat";
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{country.name}</span>
        <div className="flex items-center gap-1.5">
          {isGas && <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-xs">LNG</span>}
          <span className="text-xs text-gray-400">{oil.toFixed(0)}% hydrocarbons</span>
        </div>
      </div>
      <div className="flex h-2.5 rounded-sm overflow-hidden">
        <div className={`${isGas ? "bg-purple-500" : "bg-amber-500"}`} style={{ width: `${oil}%` }} />
        <div className="bg-blue-400" style={{ width: `${nol}%` }} />
      </div>
      {country.id === "bhr" && (
        <p className="text-xs text-gray-400 mt-0.5">
          54.2% — BAPCO crude, not gas · IMF Art. IV 2025
        </p>
      )}
    </div>
  );
}

function HormuzBar({ country }) {
  const exp = country.hormuz.exposurePct;
  const byp = 100 - exp;
  const isFree = exp === 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{country.name}</span>
        <span className={`text-xs font-semibold ${isFree ? "text-green-600" : exp === 100 ? "text-red-600" : "text-amber-600"}`}>
          {isFree ? "Hormuz-free" : `${exp}% exposed`}
        </span>
      </div>
      <div className="flex h-2 rounded-sm overflow-hidden">
        <div className="bg-red-400" style={{ width: `${exp}%` }} />
        <div className="bg-green-400" style={{ width: `${byp}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{country.hormuz.bypassDescription}</p>
    </div>
  );
}

function BreakevenCard({ country }) {
  const be = country.baseline.breakevenOil;
  const current = 65;
  const gap = be - current;
  const isGood = gap <= 0;
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{country.name}</p>
      <p className={`text-xl font-semibold leading-none mb-1 tabular-nums ${isGood ? "text-green-700" : gap < 20 ? "text-amber-700" : "text-red-700"}`}>
        ${be}
      </p>
      <p className="text-xs text-gray-400">{isGood ? `$${Math.abs(gap)} cushion` : `$${gap} above $65 base`}</p>
    </div>
  );
}

const riskColors = {
  "Critical":    "bg-red-100 text-red-700 border border-red-200",
  "High":        "bg-orange-100 text-orange-700 border border-orange-200",
  "Medium":      "bg-amber-100 text-amber-700 border border-amber-200",
  "Low":         "bg-green-100 text-green-700 border border-green-200",
  "Beneficiary": "bg-gray-100 text-gray-600 border border-gray-200",
};

function SWFCard({ country }) {
  const swf = country.swf;
  const isIlliquid = swf.illiquid;
  const isKuwait = country.id === "kwt";
  const displayBn = isKuwait ? swf.fgfBn : swf.totalBn;
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{country.name}</p>
      <p className="text-xs text-gray-400 mb-0.5">{isKuwait ? "Future Generations Fund (FGF)" : "SWF"}</p>
      <p className="text-xl font-semibold text-gray-800">
        {displayBn > 0 ? `$${displayBn >= 1000 ? (displayBn/1000).toFixed(1)+"T" : displayBn+"bn"}` : "None"}
      </p>
      <p className={`text-xs mt-1 ${swf.usableBn < 5 ? "text-red-600 font-medium" : "text-gray-400"}`}>
        ${swf.usableBn >= 1 ? swf.usableBn.toFixed(0) : swf.usableBn.toFixed(1)}bn usable
      </p>
      {isIlliquid && <p className="text-xs text-orange-600 mt-0.5">Mostly illiquid</p>}
      {isKuwait && <p className="text-xs text-blue-600 mt-0.5 italic">† Requires special approval to access</p>}
    </div>
  );
}

export default function Tab1_Overview() {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="space-y-8">

      {/* KPI cards */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">
          Pre-war fiscal balance — % of GDP · $65/bbl baseline
        </p>
        <div className="grid grid-cols-6 gap-2">
          {COUNTRIES.map((c) => <KpiCard key={c.id} country={c} />)}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * UAE consolidated. Abu Dhabi ~+8–10% surplus (ADNOC). Dubai ~+2–3% pre-war but severely impacted during war (Jebel Ali, tourism, trade finance).
        </p>
      </div>

      {/* Revenue + Hormuz */}
      <div className="grid grid-cols-2 gap-5">
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
            Revenue composition — hydrocarbon vs non-hydrocarbon
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Qatar exports LNG (gas), not crude — purple bar.
            Gas prices (JKM/TTF) are not directly linked to oil prices.
          </p>
          {COUNTRIES.map((c) => <HydrocarbonRevenueBar key={c.id} country={c} />)}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />Oil
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />LNG (Qatar)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />Non-hydrocarbon
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
            Hormuz dependency — exports at risk
          </p>
          {COUNTRIES.map((c) => <HormuzBar key={c.id} country={c} />)}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Hormuz-dependent
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />Bypass / free
            </span>
          </div>
        </div>
      </div>

      {/* Breakeven + Vulnerability */}
      <div className="grid grid-cols-2 gap-5">
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
            Breakeven hydrocarbon price ($/bbl)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {COUNTRIES.map((c) => <BreakevenCard key={c.id} country={c} />)}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Pre-war baseline $65/bbl · No-war scenario · Source: IMF REO MENAP Oct 2025
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
            Vulnerability matrix
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left font-medium text-gray-400 pb-2">Country</th>
                <th className="text-center font-medium text-gray-400 pb-2">Balance</th>
                <th className="text-center font-medium text-gray-400 pb-2">Hormuz</th>
                <th className="text-center font-medium text-gray-400 pb-2">SWF usable</th>
                <th className="text-center font-medium text-gray-400 pb-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {COUNTRIES.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 font-medium text-gray-700">{c.name}</td>
                  <td className={`py-2 text-center font-semibold tabular-nums ${c.baseline.fiscalBalancePct >= 0 ? "text-green-700" : c.baseline.fiscalBalancePct > -8 ? "text-amber-700" : "text-red-700"}`}>
                    {c.baseline.fiscalBalancePct >= 0 ? "+" : ""}{c.baseline.fiscalBalancePct.toFixed(1)}%
                  </td>
                  <td className="py-2 text-center">
                    <span className={`font-semibold ${c.hormuz.exposurePct === 0 ? "text-green-600" : c.hormuz.exposurePct < 60 ? "text-amber-600" : "text-red-600"}`}>
                      {c.hormuz.exposurePct}%
                    </span>
                  </td>
                  <td className={`py-2 text-center font-semibold ${c.swf.usableBn < 5 ? "text-red-600" : c.swf.usableBn < 50 ? "text-amber-600" : "text-green-700"}`}>
                    {c.swf.usableBn > 0 ? `$${c.swf.usableBn >= 100 ? Math.round(c.swf.usableBn)+"bn" : c.swf.usableBn.toFixed(1)+"bn"}` : "None"}
                    {c.swf.illiquid && <span className="text-orange-500 ml-0.5">*</span>}
                  </td>
                  <td className="py-2 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${riskColors[c.baseline.riskRating] || "bg-gray-100 text-gray-600"}`}>
                      {c.baseline.riskRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">* Mostly illiquid — see SWF notes</p>
        </div>
      </div>

      {/* SWF buffer cards */}
      <div className="border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
          Sovereign wealth fund buffers
        </p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {COUNTRIES.map((c) => <SWFCard key={c.id} country={c} />)}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs font-medium text-orange-700 mb-1">Bahrain — Mumtalakat $17bn mostly illiquid</p>
            <p className="text-xs text-orange-600 leading-relaxed">
              Portfolio concentrated in Gulf Air (~40%, loss-making), ALBA smelter (force majeure), Batelco.
              Liquid portion ~$0.88bn only. Cannot be monetised quickly under war conditions.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">Kuwait — Future Generations Fund (FGF)</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Kuwait's SWF is the Future Generations Fund (FGF) ~$913bn — a liquid, globally diversified portfolio.
              GRF (operating buffer) ~$6.5bn, nearly depleted.
              ~$184bn practically mobilisable.
            </p>
            <p className="text-xs text-blue-500 mt-1.5 italic">
              † Accessing the FGF requires special approval — withdrawal requires a parliamentary law or emergency decree by the Emir (constitutionally unprecedented).
            </p>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div className="border border-gray-100 rounded-xl p-4">
        <button
          onClick={() => setShowSources(!showSources)}
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span>{showSources ? "▼" : "▶"}</span>
          Data sources for this tab
        </button>
        {showSources && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {data.meta.tab1Sources.map((s, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium text-gray-600">{s.label}: </span>
                <span className="text-gray-400">{s.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
