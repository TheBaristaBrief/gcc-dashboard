import { useState } from "react";
import Tab1_Overview from "./Tab1_Overview";
import Tab2_Scenarios from "./Tab2_Scenarios";
import Tab3_Countries from "./Tab3_Countries";
import data from "../data/gcc-model.json";

const WAR_START_GCC = new Date(2026, 1, 28);
const conflictDayLive = Math.max(1, Math.floor((new Date() - WAR_START_GCC) / (1000 * 60 * 60 * 24)) + 1);
const weeksNowGCC = Math.max(1, Math.round((new Date() - WAR_START_GCC) / (7 * 24 * 3600 * 1000)));

const TABS = [
  { id: "overview",  label: "Fiscal overview — FY 2026", component: Tab1_Overview },
  { id: "scenarios", label: "War scenarios",              component: Tab2_Scenarios },
  { id: "countries", label: "Country deep dives",         component: Tab3_Countries },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                GCC Fiscal War Impact Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Hormuz closure impact on GCC sovereign finances · FY 2026 · War started 28 Feb 2026 · Updated {data.meta.lastUpdated}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-600">Hormuz effectively closed — Day {conflictDayLive} · Week {weeksNowGCC}</span>
              </div>
              <p className="text-xs text-gray-400">
                Brent <span className="font-semibold text-gray-700">${data.meta.oilCurrentPrice}</span>
                {" "}· Qatar LNG force majeure · Ras Laffan 17% offline
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-0 border-b border-gray-200 mb-8">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm border-b-2 -mb-px transition-all ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div>{ActiveComponent && <ActiveComponent />}</div>
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-medium text-gray-500">Sources:</span>{" "}
            {data.meta.sources.join(" · ")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            UAE consolidated (Abu Dhabi + Dubai + Federal). Scenario deficits gross before financing.
            Hydrocarbon revenue used throughout — Qatar exports LNG (gas), not crude oil.
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Built by <span className="text-gray-500 font-medium">Vincent K.</span> ·{" "}
            <a href="mailto:Vincent.khoury@oliverwyman.com" className="text-gray-500 hover:text-gray-700 transition-colors">
              Vincent.khoury@oliverwyman.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
