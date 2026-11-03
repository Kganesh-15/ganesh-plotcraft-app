import React, { useEffect, useRef, useState } from "react";
import { BookOpen, MessageSquare, Image as ImageIcon, Video, Volume2, Palette, ChevronDown, Heart, Star } from "lucide-react";
import PlotCraftLogo from "./PlotCraftLogo";
import { fetchStats } from "../services/api";

const useCountUp = (target, run) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const duration = 1200;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return value;
};

function Stat({ label, value, decimals = 0, run }) {
  const v = useCountUp(value, run);
  return (
    <div className="text-center p-4 rounded-2xl bg-black/5 hover:-translate-y-1 hover:shadow-lg transition duration-300">
      <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        {v.toFixed(decimals)}
      </p>
      <p className="text-[11px] opacity-70 mt-1">{label}</p>
    </div>
  );
}

const FEATURES = [
  {
    id: "story",
    icon: BookOpen,
    title: "Story Studio",
    text: "Type a title and a hero's name, pick a genre, and get a complete story in seconds. Open it as a full page, listen to it, or download it.",
    tip: "Try: 'The Clever Rabbit and the Lion' with the hero 'Felix'.",
  },
  {
    id: "chat",
    icon: MessageSquare,
    title: "AI Chat",
    text: "Paste any story or idea and PlotChat tells you if it already exists or is original. It also checks files for errors and keeps every chat for you.",
    tip: "Try: 'Is Cinderella an original story?'",
  },
  {
    id: "image",
    icon: ImageIcon,
    title: "Script → Image",
    text: "Turn a scene from your story into a storybook-style picture you can download.",
    tip: "Describe the scene in one or two sentences.",
  },
  {
    id: "video",
    icon: Video,
    title: "Video Gen",
    text: "Send your scene to a free AI video engine. The finished clip comes back and plays right here.",
    tip: "Short clips take a minute or two to render.",
  },
  {
    id: "voice",
    icon: Volume2,
    title: "Read Aloud",
    text: "Every story and answer can be read out loud in any language your device has a voice for, even when English and Telugu are mixed together.",
    tip: "Tap the Read aloud button under any answer.",
  },
  {
    id: "themes",
    icon: Palette,
    title: "Themes & Dream Mode",
    text: "Seven moods, each with its own falling decorations, plus a soft Dream Mode that changes the whole layout and moves the logo.",
    tip: "Find the Dream Mode switch at the top right.",
  },
];

const FAQ = [
  { q: "Is PlotCraft free?", a: "Yes. It runs on free AI services, so very heavy use may sometimes have to wait a little." },
  { q: "Are my chats private?", a: "Chats are saved to your own account. Nobody else can open them. Without an account they stay on your device only." },
  { q: "Can the AI be wrong about whether a story already exists?", a: "Yes. It checks using what it knows, so treat the answer as a strong hint, not proof." },
  { q: "Why do I need an account?", a: "To save chats across devices, create images and videos, and leave a review that other visitors can see." },
];

export default function AboutPage({ currentStyle }) {
  const [active, setActive] = useState("story");
  const [open, setOpen] = useState(0);
  const [stats, setStats] = useState(null);
  const [inView, setInView] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const feature = FEATURES.find((f) => f.id === active);
  const FIcon = feature.icon;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <style>{`
        @keyframes topCornerSlide {
          0% {
            opacity: 0;
            transform: translate(120px, -120px) scale(0.7);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes globeOrbitEntrance {
          0% {
            opacity: 0;
            transform: rotate(-180deg) scale(0.3) translateY(100px);
          }
          60% {
            opacity: 0.8;
            transform: rotate(20deg) scale(1.05) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1) translateY(0);
          }
        }
        .animate-top-slide {
          animation: topCornerSlide 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-globe-orbit {
          animation: globeOrbitEntrance 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* hero */}
      <section className={`relative overflow-hidden p-8 md:p-12 rounded-[2rem] text-center ${currentStyle.bgCard} animate-top-slide`}>
        <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex justify-center">
            <div className="animate-[float_5s_ease-in-out_infinite]">
              <PlotCraftLogo size={76} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Where every <span className={currentStyle.logoTheme}>story</span> begins
          </h2>
          <p className="text-sm opacity-75 max-w-xl mx-auto leading-relaxed">
            PlotCraft helps students, teachers, parents and young storytellers write stories, check if an idea is truly new,
            turn scenes into pictures and videos, and listen to it all in their own language.
          </p>
        </div>
        <style>{`@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }`}</style>
      </section>

      {/* real numbers */}
      <section ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-globe-orbit">
        <Stat label="Stories written" value={stats?.stories ?? 0} run={inView && !!stats} />
        <Stat label="Creators" value={stats?.creators ?? 0} run={inView && !!stats} />
        <Stat label="Chats saved" value={stats?.chats ?? 0} run={inView && !!stats} />
        <Stat label="Average rating" value={stats?.rating ?? 0} decimals={1} run={inView && !!stats} />
      </section>
      {!stats && <p className="text-center text-[11px] opacity-50 -mt-3">Live numbers appear when the server is running.</p>}

      {/* feature explorer */}
      <section className={`p-6 md:p-8 rounded-[2rem] ${currentStyle.bgCard} space-y-5 animate-top-slide`}>
        <h3 className="font-extrabold text-base">Explore what you can do</h3>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  active === f.id ? "bg-purple-600 text-white shadow-md scale-105" : `${currentStyle.btnSecondary}`
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {f.title}
              </button>
            );
          })}
        </div>
        <div key={feature.id} className="p-5 rounded-2xl bg-black/5 flex gap-4 items-start animate-[fadeUp_.35s_ease]">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shrink-0">
            <FIcon className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm">{feature.title}</h4>
            <p className="text-xs leading-relaxed opacity-80">{feature.text}</p>
            <p className="text-[11px] font-semibold text-purple-500">{feature.tip}</p>
          </div>
        </div>
        <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`}</style>
      </section>

      {/* FAQ */}
      <section className={`p-6 md:p-8 rounded-[2rem] ${currentStyle.bgCard} space-y-3 animate-globe-orbit`}>
        <h3 className="font-extrabold text-base mb-2">Questions people ask</h3>
        {FAQ.map((item, i) => (
          <div key={item.q} className="rounded-2xl bg-black/5 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-xs font-bold cursor-pointer"
            >
              {item.q}
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="px-4 pb-3 text-xs opacity-75 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* creator */}
      <section className={`p-6 rounded-[2rem] ${currentStyle.bgCard} flex flex-wrap items-center justify-between gap-3 text-xs animate-top-slide`}>
        <span className="font-semibold flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Designed and developed by K.Ganesh
        </span>
        <span className="opacity-60 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Version 4.0
        </span>
      </section>
    </div>
  );
}