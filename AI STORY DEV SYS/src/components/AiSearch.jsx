import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  X,
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  FileText,
  Plus,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  HelpCircle,
  History,
  Trash2,
  Cloud,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { chatAI, generateImage } from "../services/openai";
import { listChats, getChat, saveChat, deleteChat } from "../services/api";
// import ReadAloudButton from "./ReadAloudButton";
import ReadAloudButton from "./ReadAloudButton";
import PlotCraftLogo from "./PlotCraftLogo";

/* ---------- tiny markdown renderer (no dependencies, no innerHTML) ---------- */
const renderInline = (text) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-black/10 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });

function Markdown({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={blocks.length} className="my-3 p-4 rounded-2xl bg-black/80 text-green-200 text-xs font-mono overflow-x-auto leading-relaxed">
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const size = ["text-xl", "text-lg", "text-base", "text-sm"][h[1].length - 1];
      blocks.push(
        <h3 key={blocks.length} className={`${size} font-extrabold mt-5 mb-1.5`}>
          {renderInline(h[2])}
        </h3>
      );
      i++;
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={blocks.length} className={`my-2 pl-6 space-y-1 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, k) => (
            <li key={k}>{renderInline(it)}</li>
          ))}
        </Tag>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={blocks.length} className="my-2">
        {renderInline(para.join(" "))}
      </p>
    );
  }

  return <div className="text-sm leading-7">{blocks}</div>;
}

/* ---------- story verdict ---------- */
const VERDICTS = {
  ORIGINAL: {
    label: "Original imagination",
    note: "No existing story matched this.",
    icon: ShieldCheck,
    cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
  },
  EXISTING: {
    label: "Already exists",
    note: "This matches a story that is already out there.",
    icon: BookOpen,
    cls: "bg-amber-500/15 text-amber-500 border-amber-500/40",
  },
  INSPIRED: {
    label: "Inspired by an existing story",
    note: "Original in parts, but it borrows from a known work.",
    icon: Lightbulb,
    cls: "bg-sky-500/15 text-sky-500 border-sky-500/40",
  },
  UNSURE: {
    label: "Couldn't verify",
    note: "Not enough to say for certain.",
    icon: HelpCircle,
    cls: "bg-slate-500/15 text-slate-400 border-slate-500/40",
  },
};

// The server asks the model to start story replies with:
//   VERDICT: EXISTING | CONFIDENCE: 90
//   SOURCE: The Tortoise and the Hare (Aesop's Fables)
const parseVerdict = (raw) => {
  const m = raw.match(/^\s*VERDICT:\s*([A-Za-z]+)\s*(?:\|\s*CONFIDENCE:\s*(\d+))?/i);
  if (!m) return { body: raw };
  const key = m[1].toUpperCase();
  if (!VERDICTS[key]) return { body: raw };
  const src = raw.match(/^\s*SOURCE:\s*(.*)$/im);
  const body = raw
    .replace(/^\s*VERDICT:.*$/im, "")
    .replace(/^\s*SOURCE:.*$/im, "")
    .trim();
  return {
    verdict: key,
    confidence: m[2] ? Math.min(100, Number(m[2])) : null,
    source: src ? src[1].trim() : "",
    body,
  };
};

/* ---------- file helpers ---------- */
const TEXT_EXT = /\.(js|jsx|ts|tsx|json|py|java|c|cpp|cs|go|rb|php|html|css|scss|md|txt|csv|xml|yml|yaml|sql|sh|env|ini|log)$/i;
const MAX_TEXT_BYTES = 300 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const isImage = file.type.startsWith("image/");
    const isText = file.type.startsWith("text/") || TEXT_EXT.test(file.name) || file.type === "application/json";

    if (!isImage && !isText) return reject(new Error("Unsupported file. Attach a code/text file or an image."));
    if (isImage && file.size > MAX_IMAGE_BYTES) return reject(new Error("Image is too large (max 4 MB)."));
    if (isText && file.size > MAX_TEXT_BYTES) return reject(new Error("File is too large (max 300 KB)."));

    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, kind: isImage ? "image" : "text", content: reader.result });
    reader.onerror = () => reject(new Error("Could not read the file."));
    if (isImage) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });

const IMAGE_RE = /^\s*(\/image|image:|draw\b|(generate|create|make|paint)\s+(me\s+)?(an?\s+)?(image|picture|illustration)\b)/i;

const SUGGESTIONS = [
  { text: "Is 'The Tortoise and the Hare' an original story?", icon: BookOpen },
  { text: "Check my idea: a robot who is afraid of the dark", icon: Lightbulb },
  { text: "Draw a tiny dragon learning to fly, storybook style", icon: ImageIcon, image: true },
  { text: "Attach a code file and I'll find the errors in it", icon: Paperclip, attach: true },
];

/* ---------- capsule opening animation + look of the chat ---------- */
// All keyframe names start with "pcx" so they never clash with other components.
const CHAT_CSS = `
@keyframes pcxCapsuleIn { 0% { opacity: 0; transform: scale(.4) rotate(-8deg) } 60% { opacity: 1; transform: scale(1.07) rotate(1deg) } 100% { opacity: 1; transform: scale(1) rotate(0) } }
@keyframes pcxMark { 0% { opacity: 0; transform: rotate(-200deg) scale(.2) } 100% { opacity: 1; transform: none } }
@keyframes pcxTagline { 0%, 55% { opacity: 0; transform: translateY(6px) } 100% { opacity: 1; transform: none } }
@keyframes pcxGlow { 0%, 100% { filter: drop-shadow(0 0 16px rgba(217,70,239,.45)) } 50% { filter: drop-shadow(0 0 40px rgba(139,92,246,.9)) } }
@keyframes pcxShake { 0%, 100% { transform: translateX(0) } 20% { transform: translateX(-3px) } 40% { transform: translateX(3px) } 60% { transform: translateX(-2px) } 80% { transform: translateX(2px) } }
@keyframes pcxUp { to { transform: translateY(-100%) } }
@keyframes pcxDown { to { transform: translateY(100%) } }
@keyframes pcxSeam { 0% { opacity: 0; transform: scaleX(0) } 25% { opacity: 1 } 65% { opacity: 1; transform: scaleX(1) } 100% { opacity: 0; transform: scaleX(1.15) } }
@keyframes pcxReveal { from { opacity: 0; transform: scale(.965); filter: blur(8px) } to { opacity: 1; transform: none; filter: blur(0) } }
@keyframes pcxRise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes pcxFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes pcxDrift { 0%, 100% { transform: translate(0, 0) scale(1) } 50% { transform: translate(34px, -22px) scale(1.15) } }

.pcx-stage { background: radial-gradient(ellipse at center, #3b0764 0%, #14072f 45%, #07030f 100%); }
.pcx-capsule-glow { animation: pcxGlow 2.2s ease-in-out infinite; }
.pcx-capsule { animation: pcxCapsuleIn 1s cubic-bezier(.2,.9,.3,1.2) both; }
.pcx-mark { display: inline-flex; animation: pcxMark 1s ease-out .15s both; }
.pcx-tagline { animation: pcxTagline 1.1s ease-out both; }
.pcx-half-top { animation: pcxShake .3s linear .9s, pcxUp .95s cubic-bezier(.76,0,.24,1) 1.2s forwards; }
.pcx-half-bottom { animation: pcxShake .3s linear .9s, pcxDown .95s cubic-bezier(.76,0,.24,1) 1.2s forwards; }
.pcx-seam { height: 2px; background: linear-gradient(90deg, transparent, #fff 20%, #f0abfc 50%, #fff 80%, transparent); box-shadow: 0 0 26px 7px rgba(244,114,182,.85); animation: pcxSeam 1s ease-out 1.05s both; }
.pcx-rise { animation: pcxRise .4s ease-out both; }
.pcx-float { animation: pcxFloat 4.5s ease-in-out infinite; }
.pcx-aurora-a { animation: pcxDrift 14s ease-in-out infinite; }
.pcx-aurora-b { animation: pcxDrift 18s ease-in-out -6s infinite reverse; }

@media (prefers-reduced-motion: reduce) {
  .pcx-capsule-glow, .pcx-capsule, .pcx-mark, .pcx-tagline, .pcx-half-top, .pcx-half-bottom, .pcx-seam,
  .pcx-rise, .pcx-float, .pcx-aurora-a, .pcx-aurora-b { animation: none !important; }
}
`;

// The capsule drawing. It is rendered twice (top half and bottom half) and the two copies line up exactly.
function CapsuleArt() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
      <div className="pcx-capsule-glow">
        <div className="pcx-capsule rounded-full p-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400">
          <div className="rounded-full bg-[#0d0524] pl-5 pr-9 py-4 flex items-center gap-4">
            <span className="pcx-mark">
              <PlotCraftLogo size={60} />
            </span>
            <span className="text-3xl font-black tracking-tight text-white whitespace-nowrap">
              Plot<span className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-transparent">Chat</span>
            </span>
          </div>
        </div>
      </div>
      <p className="pcx-tagline text-[11px] tracking-[0.35em] uppercase text-violet-200/80">AI Story Studio</p>
    </div>
  );
}

// 1) the capsule logo pops in  2) it cracks in the middle  3) the top half flies up, the bottom half flies down
// 4) the whole chat is revealed. Click anywhere to skip.
function CapsuleIntro({ onDone }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => doneRef.current(), 2350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 z-30 overflow-hidden cursor-pointer" onClick={() => doneRef.current()} aria-hidden="true">
      <div className="pcx-half-top absolute inset-x-0 top-0 h-1/2 overflow-hidden">
        <div className="pcx-stage absolute inset-x-0 top-0 h-[200%]">
          <CapsuleArt />
        </div>
      </div>
      <div className="pcx-half-bottom absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
        <div className="pcx-stage absolute inset-x-0 bottom-0 h-[200%]">
          <CapsuleArt />
        </div>
      </div>
      <div className="pcx-seam absolute left-0 right-0 z-10" style={{ top: "calc(50% - 1px)" }} />
    </div>
  );
}

let uid = 0;
const nextId = () => `m${Date.now()}_${uid++}`;
const newChatId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Guests: chats are kept on this device. Logged-in users: chats are kept on the server (their account).
const GUEST_KEY = "plotcraft_guest_chats";
const readGuestChats = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeGuestChats = (chats) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(chats.slice(0, 30)));
  } catch {
    /* storage full or unavailable */
  }
};
const chatTitle = (messages) => {
  const first = messages.find((m) => m.role === "user");
  return (first?.content || "New chat").slice(0, 60);
};
// generated pictures are big, so only the text of an image message is saved
const stripImages = (messages) => messages.map(({ imageUrl, ...rest }) => rest);

export default function AiSearch({ currentStyle, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(null); // null | "chat" | "image"
  const [fileError, setFileError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  // ----- saved chats -----
  const [chatId, setChatId] = useState(newChatId);
  const [chatList, setChatList] = useState([]);
  const [showHistory, setShowHistory] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saved", "error"
  const lastSaved = useRef(""); // what is already stored, so opening an old chat does not re-save it
  const userId = currentUser?.id || null;

  // opening animation: plays every time this tab is opened (skipped for people who turned animations off)
  const [intro, setIntro] = useState(() => {
    try {
      if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "done";
    } catch {
      /* matchMedia unavailable */
    }
    return "playing";
  });

  const refreshList = async () => {
    try {
      if (userId) {
        setChatList(await listChats());
      } else {
        setChatList(
          readGuestChats()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
        );
      }
    } catch {
      setChatList([]);
    }
  };

  // load the list again whenever someone logs in or out, and start a clean chat
  useEffect(() => {
    lastSaved.current = "";
    setMessages([]);
    setChatId(newChatId());
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // auto-save a moment after the answer has finished
  useEffect(() => {
    if (loading || messages.length === 0) return;
    const toSave = stripImages(messages);
    const signature = JSON.stringify(toSave);
    if (signature === lastSaved.current) return;
    const timer = setTimeout(async () => {
      try {
        if (userId) {
          await saveChat(chatId, toSave);
        } else {
          const others = readGuestChats().filter((c) => c.id !== chatId);
          writeGuestChats([{ id: chatId, title: chatTitle(toSave), messages: toSave, updatedAt: Date.now() }, ...others]);
        }
        lastSaved.current = signature;
        setSaveStatus("saved");
        refreshList();
      } catch {
        setSaveStatus("error");
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading]);

  const openChat = async (id) => {
    if (loading) return;
    try {
      let chat;
      if (userId) chat = await getChat(id);
      else chat = readGuestChats().find((c) => c.id === id);
      if (!chat) return;
      lastSaved.current = JSON.stringify(stripImages(chat.messages));
      setChatId(chat.id);
      setMessages(chat.messages);
      setSaveStatus("");
      setFile(null);
      if (typeof window !== "undefined" && window.innerWidth < 768) setShowHistory(false);
    } catch {
      setSaveStatus("error");
    }
  };

  const removeChat = async (id) => {
    try {
      if (userId) await deleteChat(id);
      else writeGuestChats(readGuestChats().filter((c) => c.id !== id));
    } catch {
      /* ignore */
    }
    if (id === chatId) newChat();
    refreshList();
  };

  const regenerateImage = async (m) => {
    if (loading) return;
    setLoading("image");
    try {
      const url = await generateImage(m.content);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, imageUrl: url } : x)));
    } catch (err) {
      add({ role: "assistant", kind: "text", error: true, content: err?.message || "Image generation failed." });
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const add = (msg) => setMessages((prev) => [...prev, { id: nextId(), ...msg }]);

  const handleFile = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    setFileError("");
    try {
      setFile(await readFile(picked));
    } catch (err) {
      setFileError(err.message);
    }
  };

  const runImage = async (prompt, shown) => {
    add({ role: "user", kind: "text", content: shown || prompt });
    setLoading("image");
    try {
      const url = await generateImage(prompt);
      add({ role: "assistant", kind: "image", imageUrl: url, content: prompt });
    } catch (err) {
      add({ role: "assistant", kind: "text", error: true, content: err?.message || "Image generation failed." });
    } finally {
      setLoading(null);
    }
  };

  const runChat = async (text, attached) => {
    const history = messages
      .filter((m) => !m.error)
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.kind === "image" ? `[Generated an image of: ${m.content}]` : m.raw || m.content,
      }));

    add({ role: "user", kind: "text", content: text || `Check ${attached.name} for errors`, fileName: attached?.name });
    setLoading("chat");
    try {
      const raw = await chatAI({
        messages: [...history, { role: "user", content: text || "Find every error and bug in the attached file." }],
        file: attached || undefined,
      });
      const parsed = parseVerdict(raw);
      add({ role: "assistant", kind: "text", raw, ask: text, ...parsed, content: parsed.body });
    } catch (err) {
      add({
        role: "assistant",
        kind: "text",
        error: true,
        content: err?.message || "Something went wrong. Is the server running on port 5000?",
      });
    } finally {
      setLoading(null);
    }
  };

  const send = (override) => {
    const text = (override ?? input).trim();
    if (loading) return;
    if (!text && !file) return;

    const wantsImage = !file && (imageMode || IMAGE_RE.test(text));
    setInput("");
    setFileError("");

    if (wantsImage) {
      const prompt = text.replace(IMAGE_RE, "").trim() || text;
      setImageMode(false);
      runImage(prompt, text);
    } else {
      const attached = file;
      setFile(null);
      runChat(text, attached);
    }
  };

  const copyText = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadImage = async (url) => {
    try {
      // works for data URLs and for normal image links
      const blob = await (await fetch(url)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "plotchat_image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };

  const newChat = () => {
    lastSaved.current = "";
    setChatId(newChatId());
    setSaveStatus("");
    setMessages([]);
    setInput("");
    setFile(null);
    setImageMode(false);
    setFileError("");
  };

  const pickSuggestion = (s) => {
    if (s.attach) return fileInputRef.current?.click();
    if (s.image) {
      setImageMode(false);
      return send(s.text);
    }
    send(s.text);
  };

  return (
    <div className="rounded-[2rem] p-[1.5px] bg-gradient-to-br from-violet-500/70 via-fuchsia-500/40 to-amber-400/70 shadow-[0_24px_80px_-24px_rgba(168,85,247,0.6)]">
      <style>{CHAT_CSS}</style>
      <div className={`relative flex h-[calc(100vh-9.5rem)] min-h-[480px] rounded-[1.9rem] overflow-hidden ${currentStyle.bgCard}`}>
        {/* soft moving light behind everything */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="pcx-aurora-a absolute -top-24 -left-20 w-80 h-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pcx-aurora-b absolute -bottom-28 -right-16 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        {intro === "playing" && <CapsuleIntro onDone={() => setIntro("done")} />}

        <div
          className="relative z-10 flex flex-1 min-w-0"
          style={intro === "playing" ? { animation: "pcxReveal .9s ease-out 1.2s both" } : undefined}
        >
      {/* saved chats */}
      <aside className={`${showHistory ? "flex" : "hidden"} w-56 shrink-0 flex-col border-r border-black/10 bg-black/[0.03]`}>
        <div className="p-3 border-b border-black/10">
          <button
            onClick={newChat}
            className={`w-full px-3 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition ${currentStyle.btnPrimary}`}
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 py-1">Your chats</p>
          {chatList.length === 0 ? (
            <p className="text-[11px] opacity-50 px-2">Chats you have will be saved here.</p>
          ) : (
            chatList.map((c) => (
              <div
                key={c.id}
                onClick={() => openChat(c.id)}
                className={`group flex items-center justify-between gap-1 px-3 py-2 rounded-full text-xs cursor-pointer transition ${
                  c.id === chatId ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 font-bold" : "hover:bg-black/5"
                }`}
              >
                <span className="truncate">{c.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChat(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 cursor-pointer"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
        <p className="text-[10px] opacity-60 p-3 border-t border-black/10 flex items-start gap-1.5 leading-snug">
          {userId ? <Cloud className="w-3 h-3 shrink-0 mt-0.5" /> : <HardDrive className="w-3 h-3 shrink-0 mt-0.5" />}
          {userId ? "Saved to your account. Open them on any device." : "Saved on this device only. Log in to keep them on your account."}
        </p>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
      {/* top bar (capsule shaped, like the logo) */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3 pl-2 pr-2 py-2 rounded-full bg-black/5 border border-black/10 backdrop-blur">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="p-2 rounded-full hover:bg-black/10 cursor-pointer"
              title="Saved chats"
            >
              <History className="w-4 h-4" />
            </button>
            <PlotCraftLogo size={28} />
            <span className="font-black text-sm tracking-tight">
              Plot<span className={currentStyle.logoTheme}>Chat</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
            </span>
            {saveStatus === "saved" && <span className="text-[10px] opacity-50">Saved</span>}
            {saveStatus === "error" && <span className="text-[10px] text-red-500">Could not save</span>}
          </div>
          <button
            onClick={newChat}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] transition ${currentStyle.btnSecondary}`}
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
        </div>
      </div>

      {/* conversation */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto gap-7">
            <div className="pcx-float">
              <div className="rounded-full p-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 shadow-[0_0_40px_rgba(168,85,247,0.45)]">
                <div className="rounded-full bg-[#0d0524] pl-3 pr-6 py-2.5 flex items-center gap-2.5">
                  <PlotCraftLogo size={38} />
                  <span className="text-lg font-black text-white tracking-tight">
                    Plot<span className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-transparent">Chat</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                Hello! What story shall we explore?
              </h1>
              <p className="text-xs opacity-60 max-w-md mx-auto leading-relaxed">
                Paste a story or an idea and I'll tell you if it already exists or is truly original. I can also draw it, or check a file for errors.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => pickSuggestion(s)}
                    style={{ animationDelay: `${(intro === "playing" ? 1.5 : 0.1) + i * 0.08}s` }}
                    className={`pcx-rise group text-left p-4 rounded-3xl text-xs leading-relaxed flex items-start gap-3 transition cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/20 ${currentStyle.btnSecondary}`}
                  >
                    <span className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white flex items-center justify-center group-hover:scale-110 transition">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="pt-1.5">{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-7">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="pcx-rise flex justify-end">
                  <div className="max-w-[85%] space-y-1.5">
                    {m.fileName && (
                      <div className="flex justify-end">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1.5 ${currentStyle.badgeBg}`}>
                          <FileText className="w-3 h-3" /> {m.fileName}
                        </span>
                      </div>
                    )}
                    <div className={`${currentStyle.userBubble || "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"} rounded-3xl rounded-br-lg px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-lg shadow-purple-500/25`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="pcx-rise flex gap-3">
                  <div className="shrink-0 mt-1">
                    <PlotCraftLogo size={30} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.error ? (
                      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{m.content}</span>
                      </div>
                    ) : m.kind === "image" && !m.imageUrl ? (
                      <div className="p-3 rounded-2xl bg-black/5 text-xs flex flex-wrap items-center gap-3">
                        <ImageIcon className="w-4 h-4 opacity-60" />
                        <span className="opacity-70 max-w-md truncate">Image not kept in history: "{m.content}"</span>
                        <button
                          onClick={() => regenerateImage(m)}
                          disabled={!!loading}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${currentStyle.btnSecondary}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Create again
                        </button>
                      </div>
                    ) : m.kind === "image" ? (
                      <div className="space-y-2">
                        <img src={m.imageUrl} alt={m.content} className="w-full max-w-xl rounded-2xl shadow-lg" />
                        <button
                          onClick={() => downloadImage(m.imageUrl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${currentStyle.btnSecondary}`}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-3xl rounded-tl-lg bg-black/[0.04] border border-black/10 px-4 py-3">
                        {m.verdict && (
                          <div className={`mb-3 p-4 rounded-2xl border ${VERDICTS[m.verdict].cls}`}>
                            <div className="flex items-center gap-2 font-extrabold text-sm">
                              {React.createElement(VERDICTS[m.verdict].icon, { className: "w-4 h-4" })}
                              {VERDICTS[m.verdict].label}
                              {m.confidence !== null && m.confidence !== undefined && (
                                <span className="ml-auto text-[11px] font-bold opacity-80">{m.confidence}% sure</span>
                              )}
                            </div>
                            <p className="text-xs mt-1 opacity-90">{VERDICTS[m.verdict].note}</p>
                            {m.source && m.source.toLowerCase() !== "none found" && m.source.toLowerCase() !== "none" && (
                              <p className="text-xs mt-2 font-semibold">Found in: {m.source}</p>
                            )}
                          </div>
                        )}
                        <Markdown text={m.content} />
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <button
                            onClick={() => copyText(m)}
                            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 transition cursor-pointer"
                            title="Copy"
                          >
                            {copiedId === m.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <ReadAloudButton
                            text={m.verdict ? `${VERDICTS[m.verdict].label}. ${m.content}` : m.content}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${currentStyle.btnSecondary}`}
                          />
                          {m.verdict && m.ask && (
                            <button
                              disabled={!!loading}
                              onClick={() => runImage(`Children's storybook illustration of this story: ${m.ask.slice(0, 400)}`, "Draw this story")}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${currentStyle.btnSecondary}`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Draw this story
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0 mt-1 animate-pulse">
                  <PlotCraftLogo size={30} />
                </div>
                <div className="flex-1 min-w-0">
                  {loading === "image" ? (
                    <div className="w-full max-w-xl aspect-video rounded-2xl bg-black/10 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
                      <p className="text-xs opacity-70">Creating your image…</p>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-black/5 border border-black/10">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* composer */}
      <div className="px-4 md:px-8 pb-5 pt-2">
        <div className="max-w-3xl mx-auto space-y-2">
          {(file || fileError) && (
            <div className="flex flex-wrap items-center gap-2">
              {file && (
                <span className={`pl-3 pr-1.5 py-1 rounded-full text-xs flex items-center gap-2 ${currentStyle.badgeBg}`}>
                  {file.kind === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="max-w-[200px] truncate">{file.name}</span>
                  <button onClick={() => setFile(null)} className="p-1 rounded-full hover:bg-black/10 cursor-pointer" title="Remove file">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {fileError && <span className="text-xs text-red-500">{fileError}</span>}
            </div>
          )}

          <div className={`flex items-end gap-1.5 pl-3 pr-2 py-2 rounded-[1.75rem] border border-white/10 shadow-[0_12px_40px_-16px_rgba(168,85,247,0.55)] focus-within:ring-2 focus-within:ring-fuchsia-500/50 transition ${currentStyle.bgInput}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.js,.jsx,.ts,.tsx,.json,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.html,.css,.scss,.md,.txt,.csv,.xml,.yml,.yaml,.sql,.sh,.log"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full hover:bg-black/10 transition cursor-pointer shrink-0"
              title="Attach a file to check for errors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setImageMode((v) => !v)}
              className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                imageMode ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/40" : "hover:bg-black/10"
              }`}
              title="Generate an image with OpenAI"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Create image</span>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={Math.min(5, Math.max(1, input.split("\n").length))}
              placeholder={
                imageMode
                  ? "Describe the image you want…"
                  : file
                  ? "What should I check? (optional)"
                  : "Paste a story or ask anything…"
              }
              className="flex-1 bg-transparent outline-none resize-none text-sm py-2.5 min-w-0"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!!loading || (!input.trim() && !file)}
              className={`p-3 rounded-full shrink-0 transition cursor-pointer disabled:opacity-40 hover:scale-105 shadow-lg shadow-purple-500/30 ${currentStyle.btnPrimary}`}
              title="Send"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-center opacity-50">
            Story checks come from the AI's knowledge and can be wrong. Treat them as a strong hint, not proof.
          </p>
        </div>
      </div>
      </div>
        </div>
      </div>
    </div>
  );
}