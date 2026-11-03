import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speakText, stopSpeaking, isSpeechSupported } from "../services/speech";

// Works for any language. Mixed text (e.g. Telugu + English) is read part by part with the right voice.
export default function ReadAloudButton({ text, className = "", compact = false, label = "Read aloud" }) {
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  // stop talking if this button disappears (chat switched, modal closed...)
  useEffect(() => () => { if (speakingRef.current) stopSpeaking(); }, []);

  if (!isSpeechSupported() || !text) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setNotice("");
    setSpeaking(true);
    speakText(text, {
      onEnd: () => setSpeaking(false),
      onMissingVoice: (langs) =>
        setNotice(
          `No ${langs.join(", ")} voice on this device. Install it in your system settings (Windows: Settings → Time & language → Speech) or try Microsoft Edge, which has many extra voices.`
        ),
    });
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        title={speaking ? "Stop" : label}
        className={
          className ||
          "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-black/5 hover:bg-black/10 transition"
        }
      >
        {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {!compact && <span>{speaking ? "Stop" : label}</span>}
      </button>
      {notice && <span className="text-[11px] text-amber-500 max-w-xs leading-snug">{notice}</span>}
    </span>
  );
}