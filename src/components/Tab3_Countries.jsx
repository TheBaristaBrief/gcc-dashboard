import { useState, useMemo } from "react";
import data from "../data/gcc-model.json";

const COUNTRIES = data.countries;
const SCENARIOS = data.scenarios;
const LIVE      = data.liveStatus;
const GDP_USD   = { kwt:146, qat:249, bhr:47, sau:1322, uae:564, omn:108 };
const EXP_USD   = { kwt:85.1, qat:60.5, bhr:12.0, sau:350.6, uae:132.4, omn:31.1 };
const DEBT_CEIL = { kwt:3.0, qat:2.0, bhr:8.0, sau:2.5, uae:0, omn:0 };

const fmtPct  = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
const fmtPct2 = (v) => v.toFixed(1) + "%";
const fmtUsd  = (v) => "$" + Math.abs(v).toFixed(1) + "bn";
const fmtLcu  = (v, lcu, fx) => {
  const lv = Math.abs(v) / fx;
  return (lv >= 100 ? lv.toFixed(0) : lv.toFixed(1)) + "bn " + lcu;
};

function ScenarioBar({ value, max=45 }) {
  const pct = Math.min(Math.abs(value)/max*100,100);
  const color = value >= 0 ? "bg-green-500" : value > -10 ? "bg-amber-500" : "bg-red-500";
  const tc    = value >= 0 ? "text-green-700" : value > -10 ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-gray-100 rounded-sm overflow-hidden">
        <div className={`h-full ${color}`} style={{ width:`${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-14 text-right ${tc}`}>{fmtPct(value)}</span>
    </div>
  );
}

function StatCard({ label, value, sub, variant="neutral" }) {
  const bg   = { red:"bg-red-50", orange:"bg-orange-50", amber:"bg-amber-50", green:"bg-green-50", neutral:"bg-gray-50" };
  const text = { red:"text-red-700", orange:"text-orange-700", amber:"text-amber-700", green:"text-green-700", neutral:"text-gray-800" };
  return (
    <div className={`rounded-lg p-3 ${bg[variant]}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold tabular-nums leading-tight ${text[variant]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Interactive Funding Block ─────────────────────────────────────────────
function FundingBlock({ country }) {
  const gdpUsd = GDP_USD[country.id] || 100;
  const expUsd = EXP_USD[country.id] || 10;
  const lcu    = country.lcu;
  const fx     = country.fxToUsd;
  const [scenarioId, setScenarioId] = useState("B");

  const sc         = country.scenarios[scenarioId];
  const deficitBn  = sc.fiscalBalancePct / 100 * gdpUsd;
  const isDeficit  = deficitBn < 0;
  const defAbs     = Math.abs(deficitBn);
  const maxSwf     = country.swf.totalBn;
  const usableSwf  = country.swf.usableBn;
  const maxDebt    = Math.max(defAbs * 1.5, 1);

  const prudentDebt = Math.min((DEBT_CEIL[country.id]/100)*gdpUsd, defAbs);
  const [swfDraw, setSwfDraw] = useState(isDeficit ? Math.min(Math.max(0,defAbs-prudentDebt),maxSwf) : 0);
  const [newDebt, setNewDebt] = useState(isDeficit ? prudentDebt : 0);

  const handleDebt = (val) => {
    const d = Number(val);
    setNewDebt(d);
    setSwfDraw(parseFloat(Math.min(Math.max(0,defAbs-d),maxSwf).toFixed(1)));
  };
  const handleSwf = (val) => {
    const s = Number(val);
    setSwfDraw(s);
    setNewDebt(parseFloat(Math.min(Math.max(0,defAbs-s),maxDebt).toFixed(1)));
  };
  const handleScenario = (id) => {
    setScenarioId(id);
    const nd = Math.abs(country.scenarios[id].fiscalBalancePct/100*gdpUsd);
    const isD = country.scenarios[id].fiscalBalancePct < 0;
    const d = isD ? Math.min((DEBT_CEIL[country.id]/100)*gdpUsd,nd) : 0;
    const s = isD ? Math.min(Math.max(0,nd-d),maxSwf) : 0;
    setNewDebt(parseFloat(d.toFixed(1)));
    setSwfDraw(parseFloat(s.toFixed(1)));
  };

  const totalFunded    = swfDraw + newDebt;
  const gap            = isDeficit ? Math.max(0,defAbs-totalFunded) : 0;
  const isFullyCovered = gap < 0.1;
  const covPct         = isDeficit ? Math.min((totalFunded/defAbs)*100,100) : 100;
  const swfCovPct      = isDeficit ? Math.min((swfDraw/defAbs)*100,100) : 0;
  const debtCovPct     = isDeficit ? Math.min((newDebt/defAbs)*100,100-swfCovPct) : 0;
  const debtGdpPct     = newDebt/gdpUsd*100;
  const postWarDebt    = country.debtGdpPct + debtGdpPct;
  const swfRemaining   = Math.max(0,maxSwf-swfDraw);
  const swfRemPct      = maxSwf > 0 ? (swfRemaining/maxSwf*100) : 0;
  // Interest on ALL debt (existing + new war debt)
  const existingDebtBn = country.debtGdpPct / 100 * gdpUsd;
  const totalDebtBn    = existingDebtBn + newDebt;
  const allInRate      = country.borrowing.allInRateByScenario[scenarioId] / 100;
  const annualInt      = totalDebtBn * allInRate;
  const intGdpPct      = annualInt / gdpUsd * 100;
  // Interest as % of total expenditure
  const intExpPct      = annualInt / expUsd * 100;

  const scBtnCls = (id) => {
    const a = scenarioId === id;
    if (id==="A") return a ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200";
    if (id==="B") return a ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200";
    return a ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500 hover:bg-gray-200";
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Deficit funding — interactive
        </p>
        <div className="flex gap-1">
          {Object.values(SCENARIOS).map((s) => (
            <button key={s.id} onClick={() => handleScenario(s.id)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${scBtnCls(s.id)}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!isDeficit ? (
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-green-700 font-semibold text-lg">
            {fmtUsd(Math.abs(deficitBn))} / {fmtLcu(Math.abs(deficitBn),lcu,fx)} surplus
          </p>
          <p className="text-green-600 text-sm mt-1">No financing needed under {sc.label}</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">War deficit</p>
              <p className="text-base font-semibold text-red-700">{fmtUsd(deficitBn)}</p>
              <p className="text-xs text-gray-400">{fmtLcu(deficitBn,lcu,fx)}</p>
              <p className="text-xs text-gray-400">{fmtPct(sc.fiscalBalancePct)} of GDP</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                {country.id==="kwt" ? "Future Generations Fund" : "SWF total"}
              </p>
              <p className={`text-base font-semibold ${maxSwf<10?"text-red-700":maxSwf<50?"text-amber-700":"text-green-700"}`}>
                {fmtUsd(maxSwf)}
              </p>
              <p className="text-xs text-gray-400">{fmtLcu(maxSwf,lcu,fx)}</p>
              <p className={`text-xs mt-0.5 ${usableSwf<5?"text-red-500 font-medium":"text-gray-400"}`}>
                {fmtUsd(usableSwf)} immediately usable
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Borrowing rate</p>
              <p className={`text-base font-semibold ${country.borrowing.allInRateByScenario[scenarioId]>8?"text-red-700":"text-gray-800"}`}>
                {fmtPct2(country.borrowing.allInRateByScenario[scenarioId])}
              </p>
              <p className="text-xs text-gray-400">{country.borrowing.creditRating}</p>
              <p className="text-xs text-gray-400">{country.borrowing.preWarSpreadBps + country.borrowing.warPremiumByScenario[scenarioId]}bps over UST</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 mb-4">
            <span className="text-blue-400 text-xs mt-0.5">ℹ</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              Sliders are linked — moving one adjusts the other to cover the deficit.
              Default: borrow ~{fmtPct2(DEBT_CEIL[country.id])} of GDP, SWF covers the rest.
            </p>
          </div>

          {/* Debt slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-600">New debt issuance</label>
              <div>
                <span className="text-sm font-semibold text-gray-900">{fmtUsd(newDebt)}</span>
                <span className="text-xs text-gray-400 ml-2">{fmtLcu(newDebt,lcu,fx)}</span>
                <span className="text-xs text-gray-400 ml-2">({defAbs>0?Math.round(newDebt/defAbs*100):0}% of deficit)</span>
              </div>
            </div>
            <input type="range" min={0} max={maxDebt} step={0.5}
              value={newDebt} onChange={(e)=>handleDebt(e.target.value)} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>$0</span>
              <span>at {fmtPct2(country.borrowing.allInRateByScenario[scenarioId])} all-in</span>
            </div>
          </div>

          {/* SWF slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-600">SWF / fund drawdown</label>
              <div>
                <span className="text-sm font-semibold text-gray-900">{fmtUsd(swfDraw)}</span>
                <span className="text-xs text-gray-400 ml-2">{fmtLcu(swfDraw,lcu,fx)}</span>
                <span className="text-xs text-gray-400 ml-2">({defAbs>0?Math.round(swfDraw/defAbs*100):0}% of deficit)</span>
              </div>
            </div>
            <input type="range" min={0} max={Math.max(maxSwf,0.1)} step={maxSwf>10?0.5:0.1}
              value={swfDraw} onChange={(e)=>handleSwf(e.target.value)}
              disabled={maxSwf===0} className="w-full" />
            <div className="flex justify-between text-xs mt-0.5">
              <span className="text-gray-400">$0</span>
              <span className={maxSwf<5?"text-red-500 font-medium":"text-gray-400"}>
                Max {fmtUsd(maxSwf)}
                {country.id==="kwt" && " — Future Generations Fund (FGF) †"}
                {country.id==="bhr" && " — Mumtalakat liquid only"}
              </span>
            </div>
            {country.id==="kwt" && (
              <p className="text-xs text-blue-500 italic mt-1">
                † Accessing the FGF requires special approval — withdrawal requires a parliamentary law or emergency decree by the Emir.
              </p>
            )}
          </div>

          {/* Coverage bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Deficit coverage</span>
              <span className={`text-xs font-semibold ${isFullyCovered?"text-green-600":"text-red-600"}`}>
                {Math.round(covPct)}% covered{!isFullyCovered && ` — ${fmtUsd(gap)} gap`}
              </span>
            </div>
            <div className="h-4 bg-gray-100 rounded-sm overflow-hidden relative">
              <div className="absolute left-0 top-0 h-full bg-blue-400 transition-all duration-100"
                style={{ width:`${swfCovPct}%` }} />
              <div className="absolute top-0 h-full bg-indigo-500 transition-all duration-100"
                style={{ left:`${swfCovPct}%`, width:`${debtCovPct}%` }} />
            </div>
            <div className="flex gap-4 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
                SWF {fmtUsd(swfDraw)}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                Debt {fmtUsd(newDebt)}
              </span>
              {!isFullyCovered && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />
                  Gap {fmtUsd(gap)}
                </span>
              )}
            </div>
          </div>

          {/* Outcome grid — 6 cards incl. interest % of budget */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Post-war debt / GDP"
              value={fmtPct2(postWarDebt)}
              sub={`Pre-war ${country.debtGdpPct}% + ${debtGdpPct.toFixed(1)}pp`}
              variant={postWarDebt>150?"red":postWarDebt>80?"orange":"neutral"} />
            <StatCard label="SWF remaining"
              value={maxSwf>0?fmtUsd(swfRemaining):"No SWF"}
              sub={maxSwf>0?`${Math.round(swfRemPct)}% of usable left`:"Fully reliant on debt"}
              variant={swfRemaining<5?"red":swfRemaining<20?"amber":"green"} />
            <StatCard label="Annual interest cost"
              value={annualInt>0.01?`${fmtUsd(annualInt)}/yr`:"—"}
              sub="on total debt (existing + new)"
              variant={annualInt>1?"red":annualInt>0.3?"amber":"neutral"} />
            <StatCard label="Interest — % of GDP"
              value={intGdpPct>0.01?fmtPct2(intGdpPct)+" of GDP":"—"}
              sub="total debt servicing burden"
              variant={intGdpPct>2?"red":intGdpPct>0.5?"amber":"neutral"} />
            <StatCard label="Interest — % of budget"
              value={intExpPct>0.01?fmtPct2(intExpPct)+" of expenditure":"—"}
              sub="existing + war debt / total spend"
              variant={intExpPct>15?"red":intExpPct>8?"amber":"neutral"} />
            <StatCard label="New debt / GDP"
              value={newDebt>0?fmtPct2(debtGdpPct)+" of GDP":"—"}
              sub="new debt added this year"
              variant={debtGdpPct>10?"red":debtGdpPct>5?"amber":"neutral"} />
          </div>

          <p className="text-xs text-gray-400 mt-4 leading-relaxed border-t border-gray-100 pt-3">
            {country.swf.note}
          </p>
        </>
      )}
    </div>
  );
}

// ── Per-country Build Your Own ────────────────────────────────────────────
function CountryBuildYourOwn({ country }) {
  const gdpUsd = GDP_USD[country.id];

  // "Today" defaults — pulled live from JSON so reset always reflects reality
  const DEF_MIL  = { kwt:2, qat:1, bhr:1, sau:4, uae:2, omn:0.5 }[country.id] || 2;
  const DEF_SUB  = { kwt:1, qat:1, bhr:1.5, sau:2, uae:1, omn:0.5 }[country.id] || 1;
  const DEF_NOL  = { kwt:2, qat:5, bhr:6, sau:2, uae:4, omn:1 }[country.id] || 2;
  const DEF_WEEKS = LIVE.weeksElapsed;                          // e.g. 4 weeks into war
  const DEF_OIL  = Math.round(LIVE.oilPrice / 5) * 5;          // current Brent rounded to $5
  const DEF_POST = 70;                                          // BofA mid-cycle
  const DEF_HORMUZ = 100;                                       // effectively closed

  const [warWeeks, setWarWeeks] = useState(DEF_WEEKS);
  const [milPct,   setMilPct]   = useState(DEF_MIL);
  const [subPct,   setSubPct]   = useState(DEF_SUB);
  const [nolPct,   setNolPct]   = useState(DEF_NOL);
  const [oilWar,   setOilWar]   = useState(DEF_OIL);
  const [oilPost,  setOilPost]  = useState(DEF_POST);
  const [hormuzCl, setHormuzCl] = useState(DEF_HORMUZ);
  const [debtSplit, setDebtSplit] = useState(50);

  const resetToToday = () => {
    setWarWeeks(DEF_WEEKS);
    setOilWar(DEF_OIL);
    setOilPost(DEF_POST);
    setHormuzCl(DEF_HORMUZ);
    setMilPct(DEF_MIL);
    setSubPct(DEF_SUB);
    setNolPct(DEF_NOL);
    setDebtSplit(50);
  };

  const warMos = warWeeks / 4.33;
  const oilAvg = (2*69 + warMos*oilWar + Math.max(0,10-warMos)*oilPost) / 12;

  const result = useMemo(() => {
    const i = ["kwt","qat","bhr","sau","uae","omn"].indexOf(country.id);
    const oil_sh   = [0.858,0.792,0.542,0.546,0.527,0.696][i];
    const bypass_v = [0,0,0,3.0,1.8,0.8][i];
    const fullprod = [2.59,0.77,0.18,10.15,3.40,0.81][i];
    // MOF official 2026 budget figures (LCU bn) — updated from fiscal2025 JSON fields
    const nol_25   = [3.5,   44,    1.829, 557,    280.193, 3.734][i];  // non-oil revenue
    const oil_25   = [12.8,  155,   1.63,  590,    312.782, 7.713][i];  // hydrocarbon revenue
    const exp_25   = [26.1,  220.8, 4.537, 1313,   486.683, 11.977][i]; // expenditure
    const gdp_25   = [47.95, 908,   17.82, 4960,   2105.62, 41.5][i];   // GDP
    const base_pct = [-20.4, -2.4,  -6.1,  -3.3,   4.5,     -1.3][i];  // pre-war fiscal balance % (MOF)
    const imf_sp   = [0.0245,0.0538,0.0358,0.0328,0.0397,-0.0144][i];
    const mfg_sh   = [0.08,0.077,0.20,0.158,0.093,0.106][i];
    const oth_sh   = [0.52,0.57,0.67,0.67,0.72,0.52][i];
    const mfg_shk  = [-0.80,-0.90,-0.60,-0.60,-0.40,0.0][i];
    const oth_shk  = [-0.10,-0.10,-0.15,-0.05,-0.15,0.0][i];
    const cl = hormuzCl/100;

    const byp_f = Math.min(1, Math.max(0,(bypass_v+0.1*fullprod)/fullprod));
    let oil_chg;
    if (i >= 3) {
      oil_chg = (2*(1+0.07)+warMos*(1+byp_f-1+((oilWar-65)/65)*byp_f*cl)+Math.max(0,10-warMos)*(1+0.08)*oilPost/65)/12-1;
    } else {
      // war period: (1-cl) = export volume fraction × oilWar price; post-war: oilPost price
      oil_chg = (2*(1+0.05)+warMos*(1-cl)*(oilWar/65)+Math.max(0,10-warMos)*(oilPost/65))/12-1;
    }
    const nol_chg   = -(nolPct/100)*warMos/12;
    const spend_chg = (milPct+subPct)/100*warMos/12; // exp_25 is already the 2026 MOF budget — no growth factor needed
    const rev26 = oil_25*(1+oil_chg) + nol_25*(1+nol_chg);
    const exp26 = exp_25*(1+spend_chg);
    const gdp_chg = oil_sh*oil_chg + mfg_sh*(mfg_shk*warMos/12) + oth_sh*(oth_shk*warMos/12);
    const gdp26 = gdp_25*(1+gdp_chg);
    const bal = (rev26-exp26)/gdp26*100;
    const fx = country.fxToUsd;
    const existDebt = ([22,30,134,24,30,38][i]) / 100 * gdpUsd;
    const newDebtEst = Math.max(0, -(rev26-exp26) * fx);
    const totalDebt = existDebt + newDebtEst;
    const debtToGdp = totalDebt / (gdpUsd * (1 + (gdp26/gdp_25-1))) * 100;
    return {
      bal, delta:bal-base_pct, gdpGrowth:(gdp26/gdp_25-1)*100,
      rev: rev26,         // LCU bn
      exp: exp26,         // LCU bn
      deficit: rev26-exp26, // LCU bn (negative = deficit)
      newDebt: newDebtEst, totalDebt, debtToGdp,
      gdp: gdp26 * fx
    };
  }, [warWeeks, milPct, subPct, nolPct, oilWar, oilPost, hormuzCl, warMos]);

  const Slider = ({ label, value, min, max, step, onChange, display, hint }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-sm font-semibold text-gray-800">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e)=>onChange(Number(e.target.value))} className="w-full" />
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Build your own — {country.name} specific
        </p>
        <button
          onClick={resetToToday}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          title={`Reset to today: ${DEF_WEEKS}wk war · $${DEF_OIL}/bbl · ${DEF_HORMUZ}% Hormuz`}
        >
          ↺ Reset to today
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Slider label="War duration" value={warWeeks} min={1} max={16} step={1}
            onChange={setWarWeeks} display={`${warWeeks} weeks`}
            hint="Sc A=5wk · Sc B=7wk · Sc C=11wk" />
          <Slider label="% Hormuz closed" value={hormuzCl} min={0} max={100} step={5}
            onChange={setHormuzCl} display={`${hormuzCl}%`}
            hint={country.hormuz.exposurePct===0?"Country has bypass — low Hormuz exposure":"100%=full closure · 50%=partial"} />
          <Slider label="Oil/gas price during war" value={oilWar} min={70} max={160} step={5}
            onChange={setOilWar} display={`$${oilWar}/bbl`} hint={`Annual avg: $${oilAvg.toFixed(1)}`} />
          <Slider label="Oil/gas price post-war" value={oilPost} min={55} max={90} step={1}
            onChange={setOilPost} display={`$${oilPost}/bbl`} hint="BofA mid-cycle $70" />
          <Slider label="Military spending (%/mo)" value={milPct} min={0} max={8} step={0.5}
            onChange={setMilPct} display={`+${milPct}%/mo`} hint="Model default shown" />
          <Slider label="Subsidies & support (%/mo)" value={subPct} min={0} max={4} step={0.5}
            onChange={setSubPct} display={`+${subPct}%/mo`} hint="Model default shown" />
          <Slider label="Non-hydrocarbon revenue hit (%/yr)" value={nolPct} min={0} max={15} step={0.5}
            onChange={setNolPct} display={`–${nolPct}%/yr`} hint="Model default shown" />
        </div>
        <div>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-3 font-medium">Your scenario output</p>
            <p className={`text-4xl font-semibold tabular-nums leading-none mb-1 ${result.bal>=0?"text-green-700":result.bal>-10?"text-amber-700":"text-red-700"}`}>
              {fmtPct(result.bal)}
            </p>
            <p className="text-sm text-gray-500 mb-3">fiscal balance % of GDP</p>
            {/* ── Fiscal outcomes grid ── */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">Δ vs baseline</p>
                <p className={`font-semibold text-sm ${result.delta>0?"text-green-600":"text-red-600"}`}>{fmtPct(result.delta)}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">GDP growth</p>
                <p className={`font-semibold text-sm ${result.gdpGrowth>0?"text-green-600":"text-red-600"}`}>{fmtPct(result.gdpGrowth)}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">Revenue total</p>
                <p className="font-semibold text-sm text-gray-800">
                  {result.rev >= 100 ? result.rev.toFixed(0) : result.rev.toFixed(1)}bn {country.lcu}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">Expenditure total</p>
                <p className="font-semibold text-sm text-gray-800">
                  {result.exp >= 100 ? result.exp.toFixed(0) : result.exp.toFixed(1)}bn {country.lcu}
                </p>
              </div>
              {/* Fiscal deficit — full width row */}
              <div className={`col-span-2 rounded-lg p-2 ${result.deficit<0?"bg-red-50":"bg-green-50"}`}>
                <p className="text-gray-400 mb-0.5">Fiscal {result.deficit<0?"deficit":"surplus"} (nominal)</p>
                <p className={`font-semibold text-sm ${result.deficit<0?"text-red-700":"text-green-700"}`}>
                  {result.deficit<0?"-":"+"}
                  {Math.abs(result.deficit) >= 100 ? Math.abs(result.deficit).toFixed(0) : Math.abs(result.deficit).toFixed(1)}bn {country.lcu}
                  <span className="font-normal text-gray-400 ml-2">
                    (${(Math.abs(result.deficit)*country.fxToUsd).toFixed(1)}bn USD)
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">Total debt</p>
                <p className={`font-semibold text-sm ${result.totalDebt>100?"text-red-600":"text-gray-800"}`}>${result.totalDebt.toFixed(1)}bn</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-400 mb-0.5">Debt / GDP</p>
                <p className={`font-semibold text-sm ${result.debtToGdp>100?"text-red-600":result.debtToGdp>60?"text-amber-600":"text-gray-800"}`}>{result.debtToGdp.toFixed(1)}%</p>
              </div>
            </div>

            {/* ── Fund the deficit ── */}
            {result.deficit < 0 && (() => {
              const defAbs = Math.abs(result.deficit);
              const debtFrac = debtSplit / 100;
              const swfFrac  = 1 - debtFrac;
              const debtLcu  = debtFrac * defAbs;
              const swfLcu   = swfFrac  * defAbs;
              const debtUsd  = debtLcu  * country.fxToUsd;
              const swfUsd   = swfLcu   * country.fxToUsd;
              const rate     = country.borrowing.allInRate;
              const intUsd   = debtUsd  * rate / 100;
              const swfTotal = country.swf.totalBn;
              const swfLeft  = swfTotal - swfUsd;
              const swfLeftPct = swfTotal > 0 ? (swfLeft / swfTotal * 100) : 100;
              const fmt = v => v >= 100 ? v.toFixed(0) : v.toFixed(1);
              return (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">Fund the deficit</p>
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600">
                        New debt <span className="text-amber-600 font-semibold">{debtSplit}%</span>
                        {" "}vs SWF drawdown <span className="text-blue-600 font-semibold">{100-debtSplit}%</span>
                      </label>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={debtSplit}
                      onChange={e=>setDebtSplit(Number(e.target.value))} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>◀ 100% SWF</span><span>100% debt ▶</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">New debt raised</p>
                      <p className="font-semibold text-sm text-amber-700">{fmt(debtLcu)}bn {country.lcu}</p>
                      <p className="text-gray-400">${debtUsd.toFixed(1)}bn · int. ${intUsd.toFixed(1)}bn/yr @ {rate.toFixed(2)}%</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-gray-400 mb-0.5">SWF drawdown</p>
                      <p className="font-semibold text-sm text-blue-700">{fmt(swfLcu)}bn {country.lcu}</p>
                      <p className="text-gray-400">${swfUsd.toFixed(1)}bn of ${swfTotal}bn total</p>
                    </div>
                    <div className={`col-span-2 rounded-lg p-2 ${swfLeftPct<20?"bg-red-50":swfLeftPct<50?"bg-amber-50":"bg-green-50"}`}>
                      <p className="text-gray-400 mb-0.5">SWF remaining after drawdown</p>
                      <p className={`font-semibold text-sm ${swfLeftPct<20?"text-red-700":swfLeftPct<50?"text-amber-700":"text-green-700"}`}>
                        ${swfLeft.toFixed(0)}bn <span className="font-normal text-gray-400">({swfLeftPct.toFixed(0)}% of fund left)</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>No-war baseline</span>
              <span className="font-medium">{fmtPct(country.baseline.fiscalBalancePct)}</span>
            </div>
            {["A","B","C"].map(id => (
              <div key={id} className="flex justify-between">
                <span>{SCENARIOS[id].label}</span>
                <span className="font-medium">{fmtPct(country.scenarios[id].fiscalBalancePct)}</span>
              </div>
            ))}
            <div className="flex justify-between font-medium text-gray-700 border-t border-gray-200 pt-1.5 mt-1.5">
              <span>Your scenario</span>
              <span className={result.bal>=0?"text-green-700":result.bal>-10?"text-amber-700":"text-red-700"}>
                {fmtPct(result.bal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Country detail ────────────────────────────────────────────────────────
function CountryDetail({ country }) {
  const bal   = country.baseline.fiscalBalancePct;
  const isPos = bal >= 0;
  const isQatar = country.id === "qat";
  const isUAE   = country.id === "uae";

  return (
    <div className="space-y-5">

      {/* Latest news strip */}
      {country.latestNews?.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">Latest Developments</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {country.latestNews.map((item, i) => (
              <div key={i} className="min-w-[210px] max-w-[230px] flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.impact === 'negative' ? 'bg-red-400' :
                    item.impact === 'positive' ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded font-medium">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-800 font-medium leading-relaxed mb-1.5 line-clamp-2">
                  {item.headline}
                </p>
                <p className="text-xs text-gray-400">{item.source} · {item.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qatar Ras Laffan alert */}
      {isQatar && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-700 mb-1">⚠ Ras Laffan structural damage — beyond Hormuz</p>
          <p className="text-xs text-red-600 leading-relaxed">
            Iranian missile strikes 18-19 Mar 2026 destroyed LNG Trains 4 & 6 (17% of capacity = 12.8 MTPA).
            Repairs take 3–5 years. $20bn/yr in lost revenue. Force majeure on long-term contracts with
            China, South Korea, Italy, Belgium. Pearl GTL offline min 1 year. North Field East delayed.
            Qatar faces a permanent ~4% of GDP revenue gap until 2029-2031 — independent of Hormuz.
          </p>
          <p className="text-xs text-red-500 mt-1">Source: QatarEnergy CEO Reuters/Al Jazeera Mar 19-24 2026</p>
        </div>
      )}

      {/* UAE Abu Dhabi / Dubai split */}
      {isUAE && (
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
          <p className="text-xs font-medium text-amber-700 mb-3">
            ⚠ UAE consolidated figures mask sharp internal divergence
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Abu Dhabi */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 mb-1">Abu Dhabi + Federal</p>
              <p className="text-xs text-green-700 mb-2">ADNOC Fujairah bypass · Oil windfall</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Pre-war</span><span className="font-semibold text-green-700">~+9% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc A</span><span className="font-semibold text-green-700">~+10% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc B</span><span className="font-semibold text-green-700">~+8% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc C</span><span className="font-semibold text-green-600">~+6% GDP</span></div>
              </div>
              <p className="text-xs text-green-600 mt-2 italic">1.8 m b/d via Fujairah · ADIA $900bn buffer</p>
            </div>
            {/* Dubai */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800 mb-1">Dubai (standalone est.)</p>
              <p className="text-xs text-red-700 mb-2">Jebel Ali · Tourism · Trade finance</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Pre-war</span><span className="font-semibold text-green-700">~+2.5% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc A</span><span className="font-semibold text-amber-700">~−3% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc B</span><span className="font-semibold text-red-700">~−8% GDP</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sc C</span><span className="font-semibold text-red-700">~−15% GDP</span></div>
              </div>
              <p className="text-xs text-red-600 mt-2 italic">Jebel Ali = 9% UAE GDP · 30M tourists/yr at risk</p>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Consolidated UAE (+4.5% → +3.4% Sc B) is mathematically correct but obscures Dubai's war-year stress.
            Source: Dubai DOF 2026 · UAE MoF · ADNOC annual report
          </p>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 col-span-2">
          <p className="text-xs text-gray-500 mb-1">Pre-war fiscal balance</p>
          <p className={`text-3xl font-semibold leading-none tabular-nums ${isPos?"text-green-700":bal>-8?"text-amber-700":"text-red-700"}`}>
            {isPos?"+":""}{bal.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">of GDP · $65/bbl baseline</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Breakeven oil</p>
          <p className="text-xl font-semibold text-gray-800">${country.baseline.breakevenOil}</p>
          <p className="text-xs text-gray-400 mt-1">per barrel</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Debt / GDP</p>
          <p className={`text-xl font-semibold ${country.debtGdpPct>100?"text-red-700":country.debtGdpPct>50?"text-amber-700":"text-gray-800"}`}>
            {country.debtGdpPct}%
          </p>
          <p className="text-xs text-gray-400 mt-1">2025 est.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Borrowing (Sc B)</p>
          <p className={`text-xl font-semibold ${country.borrowing.allInRateByScenario["B"]>8?"text-red-700":country.borrowing.allInRateByScenario["B"]>6?"text-amber-700":"text-gray-800"}`}>
            {country.borrowing.allInRateByScenario["B"].toFixed(2)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{country.borrowing.creditRating}</p>
        </div>
      </div>

      {/* Scenarios + Revenue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">War scenarios</p>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Baseline (no war)</span>
              <span className={`font-semibold ${isPos?"text-green-600":"text-gray-600"}`}>{fmtPct(bal)}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-sm" />
          </div>
          {Object.values(SCENARIOS).map((sc) => {
            const sd = country.scenarios[sc.id];
            return (
              <div key={sc.id} className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{sc.label} <span className="text-gray-400">{sc.sublabel}</span></span>
                  <span className={`font-semibold ${sd.delta>0?"text-green-600":"text-red-500"}`}>{fmtPct(sd.delta)}</span>
                </div>
                <ScenarioBar value={sd.fiscalBalancePct} />
              </div>
            );
          })}
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Revenue (2025)</p>
          <div className="space-y-2 mb-4">
            {[
              { label:country.id==="qat"?"LNG (gas) revenue":"Hydrocarbon revenue", pct:country.baseline.oilRevShare, color:country.id==="qat"?"bg-purple-500":"bg-amber-400" },
              { label:"Non-hydrocarbon revenue", pct:country.baseline.nonOilRevShare, color:"bg-blue-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-500 tabular-nums">{item.pct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-sm overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width:`${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {country.id==="bhr" && (
            <p className="text-xs text-gray-400 mb-3">54.2% confirmed: BHD 1.774bn / BHD 3.274bn total · Source: IMF Art. IV Bahrain 2025</p>
          )}
          {country.id==="qat" && (
            <div className="bg-purple-50 rounded p-2 mb-3">
              <p className="text-xs text-purple-700 font-medium mb-0.5">Gas ≠ oil price</p>
              <p className="text-xs text-purple-600 leading-relaxed">
                Qatar's LNG is indexed to JKM/TTF, not Brent. When oil spikes, Qatar's revenue doesn't automatically follow.
                During Hormuz closure Qatar can't export anyway.
              </p>
            </div>
          )}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Hormuz bypass</p>
          <div className="flex h-3 rounded-sm overflow-hidden mb-1">
            <div className="bg-red-400" style={{ width:`${country.hormuz.exposurePct}%` }} />
            <div className="bg-green-400" style={{ width:`${100-country.hormuz.exposurePct}%` }} />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{country.hormuz.bypassDescription}</p>
        </div>
      </div>

      <FundingBlock country={country} />
      <CountryBuildYourOwn country={country} />

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Analyst note</p>
        <p className="text-sm text-gray-600 leading-relaxed">{country.vulnerability.note}</p>
      </div>
    </div>
  );
}

export default function Tab3_Countries() {
  const [selected, setSelected] = useState("kwt");
  const country = COUNTRIES.find((c) => c.id === selected);
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {COUNTRIES.map((c) => {
          const bal     = c.baseline.fiscalBalancePct;
          const isActive= c.id === selected;
          const dotColor= c.baseline.riskRating==="Beneficiary" ? "bg-gray-400" :
                          bal >= 0 ? "bg-green-500" : bal > -8 ? "bg-amber-500" : "bg-red-500";
          return (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-all -mb-px ${
                isActive ? "border-gray-800 text-gray-900 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
              {c.name}
            </button>
          );
        })}
      </div>
      {country && <CountryDetail country={country} />}
    </div>
  );
}
