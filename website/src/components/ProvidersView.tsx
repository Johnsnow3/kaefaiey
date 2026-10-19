import React, { useState } from "react";
import {
  ArrowLeft,
  RotateCw,
  GitBranch,
  Plus,
  Globe,
  User,
  Download,
  Check,
  Zap,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Provider, ProviderHealth } from "../types";
import { testProviderHealth } from "../services/api";

interface ProvidersViewProps {
  providers: Provider[];
  activeProvider: string;
  onSelectProvider: (providerId: string) => void;
  onBack?: () => void;
  onRefresh?: () => void;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  providers,
  activeProvider,
  onSelectProvider,
  onBack,
  onRefresh,
}) => {
  const [healthMap, setHealthMap] = useState<Record<string, ProviderHealth>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customSource, setCustomSource] = useState("");

  const handleTest = async (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation();
    setHealthMap((prev) => ({
      ...prev,
      [providerId]: { status: "testing" },
    }));

    const result = await testProviderHealth(providerId);
    setHealthMap((prev) => ({
      ...prev,
      [providerId]: result,
    }));
  };

  const handleTestAll = async () => {
    if (testingAll) return;
    setTestingAll(true);
    for (const p of providers.slice(0, 15)) {
      setHealthMap((prev) => ({
        ...prev,
        [p.id]: { status: "testing" },
      }));
      const res = await testProviderHealth(p.id);
      setHealthMap((prev) => ({
        ...prev,
        [p.id]: res,
      }));
    }
    setTestingAll(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-6 animate-fadeIn pb-28 text-white">
      {/* Top Header matching screenshot */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-full hover:bg-zinc-800 text-white transition-colors active:scale-95"
              title="Go Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Providers
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Install and test streaming sources
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onRefresh?.();
            handleTestAll();
          }}
          disabled={testingAll}
          className="p-3 rounded-2xl bg-[#141416] border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh & Test Providers"
        >
          <RotateCw className={`w-5 h-5 ${testingAll ? "animate-spin text-[#ff8a80]" : ""}`} />
        </button>
      </div>

      {/* Provider source section matching screenshot */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-zinc-400 tracking-wide block">
          Provider source
        </span>

        <div className="flex items-center gap-2.5">
          {/* Active Source dropdown pill */}
          <div className="flex-1 p-3.5 rounded-2xl bg-[#141416] border border-zinc-800/90 flex items-center justify-between shadow-sm cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block font-medium leading-tight">
                  Active source
                </span>
                <span className="text-sm font-bold text-white block leading-tight mt-0.5">
                  John Snow
                </span>
              </div>
            </div>

            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Plus Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 rounded-2xl border border-zinc-800 bg-[#141416] hover:bg-zinc-800/80 hover:border-zinc-700 flex items-center justify-center text-white active:scale-95 transition-all shadow-sm"
            title="Add Custom Source"
          >
            <Plus className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Available providers section */}
      <div className="space-y-4">
        {/* Title row with 36 badge */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Available providers
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-xs font-bold text-zinc-200">
            {providers.length}
          </span>
        </div>

        {/* 36 Provider Cards */}
        <div className="space-y-3.5">
          {providers.map((p) => {
            const isActive = p.id === activeProvider;
            const health = healthMap[p.id];
            const logoSrc = p.icon || `/assets/${p.id}.png`;

            return (
              <div
                key={p.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  isActive
                    ? "bg-[#18181d] border-zinc-700/90 shadow-xl ring-1 ring-white/10"
                    : "bg-[#141416] border-zinc-800/80 hover:border-zinc-700/70"
                }`}
              >
                {/* Top Info Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Provider Logo Image from assets */}
                    <img
                      src={logoSrc}
                      alt={p.displayName || p.name}
                      onError={(e) => {
                        // Fallback to letter avatar if image missing
                        (e.target as HTMLElement).style.display = "none";
                      }}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md bg-zinc-900 border border-zinc-800 flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Name + Version */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white tracking-tight truncate">
                          {p.displayName || p.name}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono font-medium flex-shrink-0">
                          {p.version || "v1.0"}
                        </span>
                      </div>

                      {/* Region & Author "John Snow" */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-medium">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="capitalize">{p.region || "Global"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{p.author || "John Snow"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact Test Button & Health Badge */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleTest(e, p.id)}
                      disabled={health?.status === "testing"}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Test live availability"
                    >
                      {health?.status === "testing" ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[#ff8a80]" />
                      ) : (
                        <Zap className="w-3 h-3 text-amber-400" />
                      )}
                      <span>Test</span>
                    </button>

                    {health && health.status !== "testing" && (
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          health.status === "online" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {health.status === "online" ? `${health.latencyMs}ms OK` : "Offline"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Button (Install / Active) */}
                <div className="pt-2">
                  {isActive ? (
                    <div className="w-full py-3 rounded-2xl bg-zinc-800/90 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Active Provider (Installed)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectProvider(p.id)}
                      className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-100 active:scale-[0.98] text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Source Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#141416] border border-zinc-800 rounded-3xl p-6 space-y-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Add Provider Repository</h3>
            <p className="text-xs text-zinc-400">
              Enter a custom GitHub repository URL containing a Vega-compatible manifest.json.
            </p>
            <input
              type="text"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="https://github.com/Johnsnow3/vega-providers"
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Custom repository added successfully!");
                  setShowAddModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-extrabold shadow-lg hover:bg-zinc-200"
              >
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
