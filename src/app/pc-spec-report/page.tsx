"use client";

import { useMemo, useState } from "react";

interface PcSpecs {
  manufacturer: string;
  model: string;
  cpu: string;
  cores: string;
  threads: string;
  gpu: string;
  vram: string;
  ram: string;
  storage: string;
  os: string;
  directx: string;
}

interface GameRequirement {
  title: string;
  minRam: number;
  minVram: number;
  recommendedRam: number;
  recommendedVram: number;
  directx: string;
}

type CompatibilityLevel = "ready" | "limited" | "blocked";

const emptySpecs: PcSpecs = {
  manufacturer: "",
  model: "",
  cpu: "",
  cores: "",
  threads: "",
  gpu: "",
  vram: "",
  ram: "",
  storage: "",
  os: "",
  directx: "",
};

const sampleGames: GameRequirement[] = [
  {
    title: "Valorant",
    minRam: 4,
    minVram: 1,
    recommendedRam: 8,
    recommendedVram: 2,
    directx: "DirectX 11",
  },
  {
    title: "Cyberpunk 2077",
    minRam: 8,
    minVram: 4,
    recommendedRam: 16,
    recommendedVram: 8,
    directx: "DirectX 12",
  },
  {
    title: "Elden Ring",
    minRam: 12,
    minVram: 3,
    recommendedRam: 16,
    recommendedVram: 8,
    directx: "DirectX 12",
  },
  {
    title: "Forza Horizon 5",
    minRam: 8,
    minVram: 4,
    recommendedRam: 16,
    recommendedVram: 8,
    directx: "DirectX 12",
  },
  {
    title: "Grand Theft Auto V",
    minRam: 4,
    minVram: 1,
    recommendedRam: 8,
    recommendedVram: 2,
    directx: "DirectX 11",
  },
];

function getLineValue(report: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = report.match(new RegExp(`^${escaped}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function getFirstMatchingLine(report: string, labels: string[]) {
  for (const label of labels) {
    const value = getLineValue(report, label);
    if (value) return value;
  }
  return "";
}

function getLargestNumber(value: string) {
  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches) return 0;
  return Math.max(...matches.map(Number));
}

function parsePcReport(report: string): PcSpecs {
  const gpuMatches = Array.from(report.matchAll(/^GPU Name:\s*(.+)$/gim)).map((match) => match[1].trim());
  const vramMatches = Array.from(report.matchAll(/^VRAM:\s*(.+)$/gim)).map((match) => match[1].trim());
  const driveMatches = Array.from(report.matchAll(/^Drive Name:\s*(.+)$/gim)).map((match) => match[1].trim());
  const driveSizeMatches = Array.from(report.matchAll(/^Size:\s*(.+)$/gim)).map((match) => match[1].trim());

  return {
    manufacturer: getLineValue(report, "Manufacturer"),
    model: getLineValue(report, "Model"),
    cpu: getLineValue(report, "Name"),
    cores: getLineValue(report, "Cores"),
    threads: getLineValue(report, "Threads"),
    gpu: gpuMatches.join(", "),
    vram: vramMatches.join(", "),
    ram: getLineValue(report, "Total RAM"),
    storage: driveMatches
      .map((drive, index) => `${drive}${driveSizeMatches[index] ? ` (${driveSizeMatches[index]})` : ""}`)
      .join(", "),
    os: getLineValue(report, "OS"),
    directx: getFirstMatchingLine(report, ["DirectX Version"]),
  };
}

function buildReport(specs: PcSpecs) {
  return [
    "========================================",
    "         GAMEVERSE PC SPEC REPORT",
    "========================================",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "=== SYSTEM ===",
    `Manufacturer: ${specs.manufacturer || "Not provided"}`,
    `Model: ${specs.model || "Not provided"}`,
    "",
    "=== CPU ===",
    `Name: ${specs.cpu || "Not provided"}`,
    `Cores: ${specs.cores || "Not provided"}`,
    `Threads: ${specs.threads || "Not provided"}`,
    "",
    "=== GPU ===",
    `GPU Name: ${specs.gpu || "Not provided"}`,
    `VRAM: ${specs.vram || "Not provided"}`,
    "",
    "=== MEMORY ===",
    `Total RAM: ${specs.ram || "Not provided"}`,
    "",
    "=== STORAGE ===",
    `Drives: ${specs.storage || "Not provided"}`,
    "",
    "=== WINDOWS ===",
    `OS: ${specs.os || "Not provided"}`,
    "",
    "=== DIRECTX ===",
    `DirectX Version: ${specs.directx || "Not provided"}`,
    "",
    "========================================",
    "END OF REPORT",
    "========================================",
  ].join("\n");
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getCompatibility(specs: PcSpecs, requirement: GameRequirement) {
  const ram = getLargestNumber(specs.ram);
  const vram = getLargestNumber(specs.vram);

  let level: CompatibilityLevel = "blocked";
  if (ram >= requirement.recommendedRam && vram >= requirement.recommendedVram) {
    level = "ready";
  } else if (ram >= requirement.minRam && vram >= requirement.minVram) {
    level = "limited";
  }

  return {
    level,
    ram,
    vram,
    missing: [
      ram < requirement.minRam ? `${requirement.minRam} GB RAM minimum` : "",
      vram < requirement.minVram ? `${requirement.minVram} GB VRAM minimum` : "",
    ].filter(Boolean),
  };
}

export default function PcSpecReportPage() {
  const [specs, setSpecs] = useState<PcSpecs>(emptySpecs);
  const [rawReport, setRawReport] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const generatedReport = useMemo(() => buildReport(specs), [specs]);
  const hasSpecs = Object.values(specs).some((value) => value.trim().length > 0);

  const updateSpec = (key: keyof PcSpecs, value: string) => {
    setSpecs((current) => ({ ...current, [key]: value }));
  };

  const importReport = () => {
    if (!rawReport.trim()) return;
    setSpecs(parsePcReport(rawReport));
  };

  const autoDetectSpecs = async () => {
    let osName = "Unknown OS";
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") !== -1) osName = "Windows";
    else if (ua.indexOf("Mac") !== -1) osName = "macOS";
    else if (ua.indexOf("Linux") !== -1) osName = "Linux";
    else if (ua.indexOf("Android") !== -1) osName = "Android";
    else if (ua.indexOf("like Mac") !== -1) osName = "iOS";

    const threadsCount = navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : "Unknown";
    const devMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const ramSize = devMem ? `${devMem} GB` : "Unknown (Sandbox)";

    let gpuName = "Unknown GPU";
    const navGpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<{ name?: string; info?: { device?: string } } | null> } }).gpu;
    if (navGpu) {
      try {
        const adapter = await navGpu.requestAdapter();
        if (adapter) {
          const info = (adapter as unknown as { info?: { device?: string } }).info;
          if (info && info.device) {
            gpuName = info.device;
          } else {
            gpuName = adapter.name || "WebGPU Adapter";
          }
        }
      } catch {}
    }
    
    if (gpuName === "Unknown GPU") {
      try {
        const canvas = document.createElement("canvas");
        const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            gpuName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown GPU";
          }
        }
      } catch {}
    }

    if (gpuName && gpuName !== "Unknown GPU") {
      const match = gpuName.match(/(NVIDIA GeForce [A-Za-z0-9 ]+|AMD Radeon [A-Za-z0-9 ]+|Intel[A-Za-z0-9 ]+)/i);
      if (match) {
        gpuName = match[0];
      }
    }

    let storageVal = "Unknown";
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota) {
          const quotaGb = Math.round(estimate.quota / (1024 * 1024 * 1024));
          storageVal = `Browser Quota: ~${quotaGb} GB`;
        }
      } catch {}
    }

    const directxVal = osName === "Windows" ? "DirectX 12" : "N/A";

    setSpecs({
      manufacturer: "Auto-detected",
      model: "Browser Client",
      cpu: `${threadsCount}-Thread CPU`,
      cores: "Unknown",
      threads: threadsCount,
      gpu: gpuName,
      vram: "Unknown",
      ram: ramSize,
      storage: storageVal,
      os: osName,
      directx: directxVal,
    });
  };

  const shareReport = async () => {
    setShareMessage("");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Gameverse PC Spec Report",
          text: generatedReport,
        });
        setShareMessage("Share sheet opened.");
        return;
      } catch {
        setShareMessage("Share cancelled.");
        return;
      }
    }

    await navigator.clipboard.writeText(generatedReport);
    setShareMessage("Report copied to clipboard.");
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-border/40 pb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Gameverse hardware lab</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              PC Spec Report
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Create a hardware report, share it with other players, export it for support, and compare it with game requirements before adding a title to your backlog.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadFile("Gameverse_PC_Spec_Report.txt", generatedReport, "text/plain")}
              disabled={!hasSpecs}
              className="rounded-xl border border-border bg-slate-950/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-accent/30 hover:bg-slate-900/50 disabled:pointer-events-none disabled:opacity-50"
            >
              Export TXT
            </button>
            <button
              type="button"
              onClick={() => downloadFile("Gameverse_PC_Spec_Report.json", JSON.stringify(specs, null, 2), "application/json")}
              disabled={!hasSpecs}
              className="rounded-xl border border-border bg-slate-950/50 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:border-accent/30 hover:bg-slate-900/50 disabled:pointer-events-none disabled:opacity-50"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={shareReport}
              disabled={!hasSpecs}
              className="glow-btn rounded-xl px-5 py-2.5 text-xs font-bold disabled:pointer-events-none disabled:opacity-50"
            >
              Share Report
            </button>
          </div>
        </div>
        {shareMessage && <p className="mt-3 text-xs font-semibold text-accent">{shareMessage}</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="glass-panel rounded-2xl p-5 shadow-xl">
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground">Build Or Import Report</h2>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Run the automated JS script (<code className="bg-slate-950/80 px-1 py-0.5 rounded text-accent">node scripts/fetch-specs.js</code>) on your PC and paste the generated file content below, use the browser-based auto-detector, or fill the fields manually.
              </p>
            </div>

            <textarea
              value={rawReport}
              onChange={(event) => setRawReport(event.target.value)}
              rows={7}
              className="mb-3 w-full rounded-xl border border-border bg-slate-950/50 px-3 py-3 font-mono text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              placeholder="Paste PC_Spec_Report.txt content here..."
            />
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={importReport}
                disabled={!rawReport.trim()}
                className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold text-accent transition-all hover:bg-accent hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Parse Pasted Report
              </button>
              <button
                type="button"
                onClick={autoDetectSpecs}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500 hover:text-slate-950"
              >
                Auto-Detect (Browser JS)
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["manufacturer", "Manufacturer"],
                ["model", "Model"],
                ["cpu", "CPU"],
                ["cores", "CPU Cores"],
                ["threads", "CPU Threads"],
                ["gpu", "GPU"],
                ["vram", "VRAM"],
                ["ram", "Total RAM"],
                ["storage", "Storage"],
                ["os", "Operating System"],
                ["directx", "DirectX"],
              ].map(([key, label]) => (
                <label key={key} className={key === "storage" ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
                  <input
                    type="text"
                    value={specs[key as keyof PcSpecs]}
                    onChange={(event) => updateSpec(key as keyof PcSpecs, event.target.value)}
                    className="w-full rounded-md border border-border bg-slate-950/50 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    placeholder={label}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="glass-panel sticky top-24 rounded-2xl p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-base font-bold text-foreground">Run Check</h2>
              <p className="mt-1 text-xs text-muted">
                Compatibility uses RAM and VRAM from the report against starter game profiles.
              </p>
            </div>

            <div className="space-y-3">
              {sampleGames.map((game) => {
                const compatibility = getCompatibility(specs, game);
                const styles: Record<CompatibilityLevel, string> = {
                  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                  limited: "border-amber-500/30 bg-amber-500/10 text-amber-300",
                  blocked: "border-rose-500/30 bg-rose-500/10 text-rose-300",
                };
                const label: Record<CompatibilityLevel, string> = {
                  ready: "Recommended",
                  limited: "Minimum",
                  blocked: "Upgrade Needed",
                };

                return (
                  <div key={game.title} className="rounded-xl border border-border/50 bg-slate-950/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{game.title}</h3>
                        <p className="mt-1 text-[10px] text-muted">
                          Min {game.minRam} GB RAM / {game.minVram} GB VRAM
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[compatibility.level]}`}>
                        {label[compatibility.level]}
                      </span>
                    </div>
                    {compatibility.missing.length > 0 ? (
                      <p className="mt-3 text-xs text-muted">
                        Missing: {compatibility.missing.join(", ")}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-muted">
                        Detected {compatibility.ram || 0} GB RAM and {compatibility.vram || 0} GB VRAM.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-8 glass-panel rounded-2xl p-5 shadow-xl">
        <h2 className="text-base font-bold text-foreground">Report Preview</h2>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-border bg-slate-950/60 p-4 text-xs leading-relaxed text-muted">
          {generatedReport}
        </pre>
      </section>
    </div>
  );
}
