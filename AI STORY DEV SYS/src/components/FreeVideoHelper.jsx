import React, { useRef, useState } from "react";
import { ExternalLink, Upload, Copy, Check, Loader2, ChevronDown, AlertTriangle } from "lucide-react";

// Expanded 7 Free video generation sites list
const SITES = [
  { name: "Upsampler (No Sign-Up)", url: "https://upsampler.com/free-video-generator-no-signup" },
  { name: "LTX Video (Hugging Face)", url: "https://huggingface.co/spaces/Lightricks/ltx-video-distilled" },
  { name: "SANA Video (Hugging Face)", url: "https://huggingface.co/spaces/Efficient-Large-Model/sana-video2-5b-720p-demo" },
  { name: "Hunyuan Video (Hugging Face)", url: "https://huggingface.co/spaces/tencent/HunyuanVideo" },
  { name: "CogVideoX (Hugging Face)", url: "https://huggingface.co/spaces/THUDM/CogVideoX-Fun" },
  { name: "Kling AI Free Web", url: "https://klingai.org/" },
  { name: "Luma Dream Machine", url: "https://lumalabs.ai/dream-machine" },
];

const MAX_BYTES = 80 * 1024 * 1024; // 80 MB limit

export default function FreeVideoHelper({ 
  currentStyle = {}, 
  prompt = "", 
  message = "", 
  defaultOpen = false, 
  currentUser = null, 
  onRequireLogin = () => {}, 
  onUploaded = () => {} 
}) {
  const [open, setOpen] = useState(!!defaultOpen || !!message);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const btnSecondary = currentStyle?.btnSecondary || "bg-black/10 hover:bg-black/20 text-black dark:bg-white/10 dark:hover:bg-white/20 dark:text-white";
  const btnPrimary = currentStyle?.btnPrimary || "bg-purple-600 hover:bg-purple-700 text-white";

  React.useEffect(() => {
    if (defaultOpen || message) {
      setOpen(true);
    }
  }, [defaultOpen, message]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const openSite = async (url) => {
    await copyPrompt();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");

    if (!file.type.startsWith("video/")) {
      return setError("Dayachesi valid video file (.mp4, .webm, .mov) ni select cheyandi.");
    }
    if (file.size > MAX_BYTES) {
      return setError("Video file chala peddaga undi (Maximum allowed 80 MB).");
    }
    if (!currentUser) {
      return onRequireLogin();
    }

    setBusy(true);
    try {
      if (typeof onUploaded === "function") {
        await onUploaded(file);
      }
    } catch (err) {
      setError(err?.message || "Video file upload avvatledu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 overflow-hidden shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-bold cursor-pointer transition hover:bg-amber-500/20 text-amber-900 dark:text-amber-200"
      >
        <span className="flex items-center gap-2 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {message || "Video engines busy ga unnaya? Free sites nunchi generate chesi ikkada upload cheyandi."}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs border-t border-amber-500/20 pt-3 bg-black/5 dark:bg-white/5">
          <p className="opacity-80 leading-relaxed font-medium">
            Free GPU quotas limit crossinaappudu, kinda unna 7 free platforms lo edokati use chesi instant ga video create chesukovachu[cite: 6]:
          </p>

          <div className="space-y-1 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
            <p className="font-bold opacity-90">Quick Steps:</p>
            <p className="opacity-75 leading-relaxed">
              1. Kinda unna edokati free platform click cheyandi (prompt automatic ga copy avuthundi)[cite: 6].<br />
              2. Prompt paste chesi video render ayyaka download chesukondi[cite: 6].<br />
              3. Kinda button tho download chesina video upload cheste ikkada play avuthundi[cite: 6]!
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {SITES.map((site) => (
              <button
                key={site.url}
                type="button"
                onClick={() => openSite(site.url)}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition hover:scale-105 ${btnSecondary}`}
              >
                <ExternalLink className="w-3.5 h-3.5" /> {site.name}
              </button>
            ))}
            <button
              type="button"
              onClick={copyPrompt}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition hover:scale-105 ${btnSecondary}`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} 
              {copied ? "Prompt Copied!" : "Copy Prompt"}
            </button>
          </div>

          <input ref={inputRef} type="file" accept="video/*" onChange={handleFilePick} className="hidden" />
          
          <button
            type="button"
            disabled={busy}
            onClick={() => (currentUser ? inputRef.current?.click() : onRequireLogin())}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition shadow-md ${btnPrimary}`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {currentUser ? "Upload Your Generated Video File" : "Log in to Upload Video"}
          </button>

          {error && <p className="text-red-500 font-semibold">{error}</p>}
        </div>
      )}
    </div>
  );
}