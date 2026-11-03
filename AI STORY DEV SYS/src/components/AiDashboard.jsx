import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Search,
  LogOut,
  LogIn,
  Image as ImageIcon, 
  Video,
  BookOpen,
  Volume2,
  VolumeX,
  Loader2,
  LockKeyhole,
  X,
  Trash2,
  ChevronRight,
  Play,
  Pause,
  Download,
  Star,
  ExternalLink,
  Info,
  HelpCircle,
  Award,
  Palette,
  FileText,
  MessageSquare,
  Menu,
  ChevronLeft
} from "lucide-react";

import { generateStory, continueStory, generateImageWithInfo, generateVideo } from "../services/openai";
import { API_BASE } from "../services/config";
import { registerUser, loginUser, logoutUser, fetchMe, getToken, setToken } from "../services/api";
import { stopSpeaking } from "../services/speech";
import AiSearch from "./AiSearch";
import AboutPage from "./AboutPage";
import UsagePage from "./UsagePage";
import ReviewsSection from "./ReviewsSection";
import FallingBackground from "./FallingBackground";
import PlotCraftLogo from "./PlotCraftLogo";
import ReadAloudButton from "./ReadAloudButton";
import FreeVideoHelper from "./FreeVideoHelper";
import StoryViewer from "./StoryViewer";

export function AiDashboard() {
  const [theme, setTheme] = useState("standard");
  const [isNavOpen, setIsNavOpen] = useState(true);

  const [dream, setDream] = useState(() => {
    try {
      return localStorage.getItem("plotcraft_dream") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("plotcraft_dream", dream ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [dream]);

  const getThemeClasses = () => {
    if (dream) {
      return {
        isDream: true,
        bgMain: "bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-cyan-100",
        bgHeader: "bg-black/60 backdrop-blur-xl border border-cyan-500/40 text-cyan-200 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)]",
        bgSidebar: "bg-slate-950/90 backdrop-blur-2xl border-r border-cyan-500/40 text-cyan-100 shadow-2xl",
        bgCard: "bg-gradient-to-br from-slate-900/90 via-purple-950/80 to-slate-950/90 backdrop-blur-2xl border-2 border-cyan-400/60 text-cyan-100 shadow-[0_10px_50px_rgba(6,182,212,0.3)] animate-slide-in",
        bgInput: "bg-black/70 border-2 border-cyan-400/60 text-cyan-100 placeholder-cyan-300/60 focus:border-yellow-300 focus:ring-2 focus:ring-cyan-400/50 font-bold",
        btnPrimary: "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.6)] uppercase text-xs",
        btnSecondary: "bg-slate-900/80 hover:bg-slate-800 text-cyan-200 border-2 border-cyan-500/50 font-extrabold shadow",
        badgeBg: "bg-gradient-to-r from-cyan-400 to-yellow-300 text-slate-950 font-black shadow-md",
        scrollCard: "bg-slate-900/80 border border-cyan-500/40 text-cyan-100",
        footerBg: "bg-black/80 backdrop-blur-md border-t border-cyan-500/40 text-cyan-200 font-bold",
        logoTheme: "text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]",
        logoRing: "",
        navHover: "hover:bg-cyan-500/20 hover:text-cyan-200 font-bold",
        panelBg: "bg-indigo-950/80 border border-cyan-500/50",
        userBubble: "bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-bold"
      };
    }
    switch (theme) {
      case "rgbclr":
        return {
          bgMain: "bg-black text-white",
          bgHeader: "bg-neutral-950/90 border-b-2 border-transparent backdrop-blur-md text-white shadow-lg shadow-red-500/10",
          bgSidebar: "bg-neutral-950 border-r border-red-500/30 text-white",
          bgCard: "bg-neutral-900/90 border-2 border-purple-500/40 text-white shadow-xl shadow-cyan-500/10",
          bgInput: "bg-black border border-green-500/50 text-white placeholder-green-400/50 focus:border-red-500",
          btnPrimary: "bg-gradient-to-r from-red-600 via-green-600 to-blue-600 hover:opacity-90 text-white font-black shadow-lg shadow-blue-500/30",
          btnSecondary: "bg-neutral-900 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/40",
          badgeBg: "bg-gradient-to-r from-pink-500 to-yellow-500 text-black font-black",
          scrollCard: "bg-neutral-900 border border-purple-500/40 text-white",
          footerBg: "bg-neutral-950 border-t border-purple-500/30 text-pink-400",
          logoTheme: "text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]",
          logoRing: "p-[2px] rounded-2xl bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-spin shadow-[0_0_15px_rgba(239,68,68,0.8)]"
        };
      case "cyberpunk":
        return {
          bgMain: "bg-slate-950 text-cyan-400",
          bgHeader: "bg-slate-900/90 border-b border-cyan-500/40 text-cyan-300",
          bgSidebar: "bg-slate-900 border-r border-cyan-500/30 text-cyan-100",
          bgCard: "bg-slate-900/80 border border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/20",
          bgInput: "bg-slate-950 border border-cyan-500/60 text-cyan-300 placeholder-cyan-700",
          btnPrimary: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-md shadow-cyan-500/50",
          btnSecondary: "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-600",
          badgeBg: "bg-cyan-950 text-cyan-300 border border-cyan-500",
          scrollCard: "bg-slate-900 border border-cyan-500/30 text-cyan-200",
          footerBg: "bg-slate-950 border-t border-cyan-500/40 text-cyan-400",
          logoTheme: "text-amber-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]",
          logoRing: "p-[2px] rounded-2xl bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.9)]"
        };
      case "emerald":
        return {
          bgMain: "bg-emerald-950 text-emerald-100",
          bgHeader: "bg-emerald-900/90 border-b border-emerald-700 text-emerald-200",
          bgSidebar: "bg-emerald-900 border-r border-emerald-800 text-emerald-100",
          bgCard: "bg-emerald-900/40 border border-emerald-700/50 text-emerald-100 shadow-xl",
          bgInput: "bg-emerald-950/80 border border-emerald-600 text-emerald-100 placeholder-emerald-400/60",
          btnPrimary: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950",
          btnSecondary: "bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-600",
          badgeBg: "bg-emerald-950 text-emerald-300 border border-emerald-600",
          scrollCard: "bg-emerald-900/50 border border-emerald-700 text-emerald-100",
          footerBg: "bg-emerald-950 border-t border-emerald-800 text-emerald-300",
          logoTheme: "text-lime-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]",
          logoRing: "p-[2px] rounded-2xl bg-emerald-400 animate-bounce shadow-[0_0_12px_rgba(16,185,129,0.8)]"
        };
      case "sunset":
        return {
          bgMain: "bg-gradient-to-br from-rose-950 via-orange-950 to-amber-950 text-orange-100",
          bgHeader: "bg-orange-950/80 border-b border-orange-800/50 text-orange-200",
          bgSidebar: "bg-orange-950 border-r border-orange-900 text-orange-100",
          bgCard: "bg-orange-900/30 border border-orange-700/40 text-orange-100 shadow-xl",
          bgInput: "bg-orange-950/70 border border-orange-700 text-orange-100 placeholder-orange-400/50",
          btnPrimary: "bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 text-white font-bold shadow-lg",
          btnSecondary: "bg-orange-900/50 hover:bg-orange-800 text-orange-200 border border-orange-700",
          badgeBg: "bg-orange-900 text-orange-300 border border-orange-700",
          scrollCard: "bg-orange-900/40 border border-orange-800 text-orange-100",
          footerBg: "bg-rose-950 border-t border-orange-900 text-orange-300",
          logoTheme: "text-yellow-300 drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]",
          logoRing: "p-[2px] rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.9)]"
        };
      case "party":
        return {
          bgMain: "bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white",
          bgHeader: "bg-white/20 backdrop-blur-md border-white/20 text-white",
          bgSidebar: "bg-black/30 backdrop-blur-md border-white/10 text-white",
          bgCard: "bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl",
          bgInput: "bg-white/20 border-white/30 text-white placeholder-pink-200 focus:border-yellow-300",
          btnPrimary: "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white font-extrabold shadow-lg",
          btnSecondary: "bg-white/20 hover:bg-white/30 text-white border border-white/30",
          badgeBg: "bg-yellow-400 text-purple-950 font-black",
          scrollCard: "bg-white/15 backdrop-blur-sm border-white/20 text-white",
          footerBg: "bg-black/40 border-white/10 text-pink-200",
          logoTheme: "text-yellow-300 drop-shadow-[0_0_15px_rgba(234,179,8,1)]",
          logoRing: "p-[2px] rounded-2xl bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-spin shadow-[0_0_15px_rgba(234,179,8,0.9)]"
        };
      case "rainy":
        return {
          bgMain: "bg-slate-900 text-blue-100",
          bgHeader: "bg-slate-800/90 border-b border-blue-500/30 text-blue-200",
          bgSidebar: "bg-slate-950 border-r border-blue-900 text-blue-100",
          bgCard: "bg-slate-800/50 border border-blue-500/30 text-blue-100 shadow-xl",
          bgInput: "bg-slate-950/80 border border-blue-700 text-blue-100 placeholder-blue-400/50",
          btnPrimary: "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950",
          btnSecondary: "bg-slate-800 hover:bg-slate-700 text-blue-200 border border-blue-600",
          badgeBg: "bg-blue-950 text-blue-300 border border-blue-600",
          scrollCard: "bg-slate-800/60 border border-blue-700 text-blue-100",
          footerBg: "bg-slate-950 border-t border-blue-900 text-blue-300",
          logoTheme: "text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]",
          logoRing: "p-[2px] rounded-2xl bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]"
        };
      default:
        return {
          bgMain: "bg-slate-50 text-slate-900",
          bgHeader: "bg-white border-b border-slate-200 text-slate-900 font-bold",
          bgSidebar: "bg-white border-r border-slate-200 text-slate-900 shadow-lg",
          bgCard: "bg-white border border-slate-200 shadow-md text-slate-900 font-medium",
          bgInput: "bg-white border-2 border-slate-300 text-slate-900 focus:border-purple-600 placeholder-slate-500 font-semibold",
          btnPrimary: "bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md",
          btnSecondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold",
          badgeBg: "bg-purple-100 text-purple-900 border border-purple-300 font-bold",
          scrollCard: "bg-white border border-slate-200 text-slate-900",
          footerBg: "bg-slate-100 border-t border-slate-200 text-slate-800 font-bold",
          logoTheme: "text-purple-700 drop-shadow-[0_0_8px_rgba(147,51,234,0.4)]",
          logoRing: "border-2 border-slate-300 rounded-2xl p-0.5",
          navHover: "hover:bg-purple-100 text-slate-900 font-bold",
          panelBg: "bg-purple-50 border border-purple-200 text-slate-900",
          userBubble: "bg-purple-600 text-white font-bold"
        };
    }
  };

  const currentStyle = {
    isDream: false,
    navHover: "hover:bg-white/10",
    panelBg: "bg-white/10 border border-white/10",
    userBubble: "bg-purple-600 text-white",
    ...getThemeClasses()
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("plotcraft_user");
      return saved && getToken() ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem("plotcraft_user", JSON.stringify(user));
      })
      .catch((err) => {
        if (err.status === 401) {
          setToken("");
          setCurrentUser(null);
          localStorage.removeItem("plotcraft_user");
        }
      });
  }, []);

  const finishAuth = (user) => {
    setCurrentUser(user);
    localStorage.setItem("plotcraft_user", JSON.stringify(user));
    setShowAuthModal(false);
    setAuthForm({ name: "", email: "", password: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      finishAuth(await loginUser({ email: authForm.email, password: authForm.password }));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!authForm.name || !authForm.email || !authForm.password) {
      setAuthError("Please fill all fields!");
      return;
    }
    setAuthBusy(true);
    try {
      finishAuth(await registerUser(authForm));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    localStorage.removeItem("plotcraft_user");
    if (currentTab === "image" || currentTab === "video") setCurrentTab("story");
  };

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("plotcraft_stories_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    setStoryTitle("");
    setHeroName("");
    setGeneratedStory("");
    setStoryPages([]);
    setStoryPlace("");
    setStoryJob({ id: "", canContinue: false, error: "" });
    setStoryUrl("");
    setScriptInput("");
    setGeneratedImage("");
    setVideoInputContent("");
    setVideoUrl("");
    setAiVideoUrl("");
    setVideoError("");
    setCurrentTab("story");
  };

  const handleDeleteHistory = (id) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem("plotcraft_stories_history", JSON.stringify(updated));
  };

  const [currentTab, setCurrentTab] = useState("story");
  const [selectedGenre, setSelectedGenre] = useState("Moral Story with a good lesson for kids");
  const [storyTitle, setStoryTitle] = useState("");
  const [heroName, setHeroName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  
  const [generatedStory, setGeneratedStory] = useState("");
  const [storyUrl, setStoryUrl] = useState("");
  const [selectedDocStory, setSelectedDocStory] = useState(null);

  const [storyPages, setStoryPages] = useState([]);

  // long stories: how many pages, where it happens, and how far the writer has got
  const [pageCount, setPageCount] = useState(5);
  const [storyPlace, setStoryPlace] = useState("");
  const [storyProgress, setStoryProgress] = useState({ done: 0, total: 0, message: "" });
  const [storyJob, setStoryJob] = useState({ id: "", canContinue: false, error: "" });

  const [scriptInput, setScriptInput] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageStyle, setImageStyle] = useState("3d");
  const [imageInfo, setImageInfo] = useState({ provider: "", style: "" });

  const [videoInputContent, setVideoInputContent] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [aiVideoUrl, setAiVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");
  const videoCanvasRef = useRef(null);

  const genres = [
    { name: "Moral Story 🦁", val: "Moral Story with a good lesson for kids" },
    { name: "Space Adventure 🚀", val: "Fun Space Adventure for children" },
    { name: "Magic World 🧙‍♂️", val: "Magical Fantasy story for kids" },
    { name: "Animal Tale 🐶", val: "Cute Animal story for kids" },
    { name: "Mythological 🔱", val: "Extensive authentic mythological epic story from Ramayana or Mahabharata with deep elaborate descriptions and sacred details" }
  ];

  // Saves the finished story in the history list (this device) and shows it
  const finishStory = (pages) => {
    const text = pages.join("\n\n");
    setGeneratedStory(text);
    setStoryPages(pages);
    setStoryUrl(`${API_BASE}/api/stories/start`);

    const newStoryObj = {
      id: Date.now(),
      title: storyTitle,
      heroName: heroName || "Hero",
      genre: selectedGenre,
      place: storyPlace,
      storyText: text,
      pages, // real pages, nothing cut
      storyUrl: `${API_BASE}/api/stories/start`,
      createdAt: new Date().toLocaleString()
    };
    const updatedHistory = [newStoryObj, ...history.filter((h) => h.title !== storyTitle)];
    setHistory(updatedHistory);
    try {
      localStorage.setItem("plotcraft_stories_history", JSON.stringify(updatedHistory));
    } catch {
      /* storage full: the story is still on screen and on the server */
    }
  };

  const onStoryProgress = (p) => {
    setStoryPages(p.pages);
    setStoryProgress({ done: p.done, total: p.total, message: p.message });
    setLoadingMsg(p.message || "Writing your story...");
  };

  const handleGenerateStory = async (e) => {
    e.preventDefault();
    if (!storyTitle.trim()) {
      alert("Please enter a story title!");
      return;
    }

    setLoading(true);
    setLoadingMsg("Planning your story...");
    setGeneratedStory("");
    setStoryPages([]);
    setStoryProgress({ done: 0, total: pageCount, message: "Planning your story..." });
    setStoryJob({ id: "", canContinue: false, error: "" });

    try {
      // The server plans the story, then writes it page by page using several AI providers.
      const result = await generateStory(
        {
          storyTitle: storyTitle.trim(),
          heroName: heroName?.trim() || "Hero",
          genre: selectedGenre || "Moral Story",
          place: storyPlace.trim(),
          pages: pageCount
        },
        { onProgress: onStoryProgress }
      );
      setStoryJob({ id: result.jobId, canContinue: false, error: "" });
      finishStory(result.pages);
    } catch (err) {
      console.error("Story generation error:", err);
      if (err.canContinue) {
        // engines were busy: the finished pages stay on screen and can be continued
        setStoryPages(err.pages || []);
        setStoryJob({ id: err.jobId, canContinue: true, error: err.message });
      } else {
        alert(err?.message || "Story generation failed. Please make sure the server is running on port 5000.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStory = async () => {
    if (!storyJob.id) return;
    setLoading(true);
    setLoadingMsg("Continuing your story...");
    setStoryJob((j) => ({ ...j, canContinue: false, error: "" }));
    try {
      const result = await continueStory(storyJob.id, storyPages, { onProgress: onStoryProgress });
      setStoryJob({ id: result.jobId, canContinue: false, error: "" });
      finishStory(result.pages);
    } catch (err) {
      setStoryPages(err.pages || storyPages);
      setStoryJob({ id: err.jobId || storyJob.id, canContinue: !!err.canContinue, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // text file with a clear heading for every page
  const storyToFileText = (pages, fallbackText) =>
    pages && pages.length > 1 ? pages.map((p, i) => `--- Page ${i + 1} of ${pages.length} ---\n\n${p}`).join("\n\n") : fallbackText;

  const handleDownloadStoryTxtFile = (title, text) => {
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'story'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRequireLoginForVisuals = (targetTab) => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      setCurrentTab(targetTab);
    }
  };

  const handleScriptToImage = async () => {
    const finalPrompt = scriptInput || storyTitle || generatedStory.substring(0, 100);
    if (!finalPrompt) {
      alert("Please enter a script or prompt to generate an image!");
      return;
    }

    setLoading(true);
    setLoadingMsg(`Creating your ${imageStyle === "2d" ? "2D" : "3D"} image...`);
    try {
      const result = await generateImageWithInfo(finalPrompt, { style: imageStyle });
      setGeneratedImage(result.imageUrl);
      setImageInfo({ provider: result.provider, style: imageStyle });
    } catch (err) {
      alert(err?.message || "Image creation failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = 'plotcraft_image.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleGenerateVideo = async () => {
    const promptText =
      videoInputContent.trim() || scriptInput.trim() || storyTitle.trim() || generatedStory.substring(0, 200);

    if (!promptText && !generatedImage) {
      alert("Please enter a text prompt to generate a video!");
      return;
    }

    setLoading(true);
    setLoadingMsg("Sending your scene to the free AI video engine...");
    setAiVideoUrl("");
    setVideoError("");

    try {
      const url = await generateVideo(`${promptText}, cinematic, smooth camera motion`, {
        duration: videoDuration,
        onProgress: (msg) => setLoadingMsg(msg),
      });
      setAiVideoUrl(url);
      setVideoUrl(url);
    } catch (err) {
      setVideoError(err?.message || "AI video failed.");
      if (generatedImage) {
        setVideoUrl("generated_video_active");
        setIsVideoPlaying(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoCanvasRef.current) return;
    const canvas = videoCanvasRef.current;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement('a');
    a.href = url;
    a.download = `plotcraft_video_frame_${videoDuration}s.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    if (!videoUrl || !videoCanvasRef.current || !generatedImage) return;

    const canvas = videoCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = generatedImage;

    let animationFrameId;
    let startTime = null;

    img.onload = () => {
      const render = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) / 1000;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = 1 + Math.sin(elapsed * 0.8) * 0.08;
        const dx = Math.sin(elapsed * 0.5) * 15;
        const dy = Math.cos(elapsed * 0.5) * 10;

        ctx.save();
        ctx.translate(canvas.width / 2 + dx, canvas.height / 2 + dy);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        if (isVideoPlaying) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      if (isVideoPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    return () => cancelAnimationFrame(animationFrameId);
  }, [videoUrl, generatedImage, isVideoPlaying, videoDuration]);

  const closeDocModal = () => {
    stopSpeaking();
    setSelectedDocStory(null);
  };

  return (
    <div className={`relative flex flex-col h-screen ${currentStyle.bgMain} font-sans overflow-hidden transition-colors duration-300`}>
      <style>{`
        @keyframes slideFromLeft {
          0% { opacity: 0; transform: translateX(-80px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideFromRight {
          0% { opacity: 0; transform: translateX(80px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideFromTop {
          0% { opacity: 0; transform: translateY(-80px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-in-left {
          animation: slideFromLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-right {
          animation: slideFromRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-top {
          animation: slideFromTop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .nav-stagger-item {
          opacity: 0;
          transform: translateY(-15px);
          animation: navItemReveal 0.5s ease forwards;
        }
        .nav-stagger-item:nth-child(1) { animation-delay: 0.05s; }
        .nav-stagger-item:nth-child(2) { animation-delay: 0.1s; }
        .nav-stagger-item:nth-child(3) { animation-delay: 0.15s; }
        .nav-stagger-item:nth-child(4) { animation-delay: 0.2s; }
        .nav-stagger-item:nth-child(5) { animation-delay: 0.25s; }
        .nav-stagger-item:nth-child(6) { animation-delay: 0.3s; }
        .nav-stagger-item:nth-child(7) { animation-delay: 0.35s; }

        @keyframes navItemReveal {
          0% {
            opacity: 0;
            transform: translateY(-15px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <FallingBackground theme={theme} dream={dream} />

      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        title={isNavOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/30 flex items-center justify-center cursor-pointer"
      >
        {isNavOpen ? <X className="w-5 h-5 transition-transform duration-300 rotate-90" /> : <Menu className="w-5 h-5 transition-transform duration-300 rotate-0" />}
      </button>

      <div className="flex flex-1 overflow-hidden z-10 relative">
        {isNavOpen && (
          <div
            onClick={() => setIsNavOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
          />
        )}

        <aside
          className={`fixed md:relative z-40 h-full w-72 ${currentStyle.bgSidebar} flex flex-col justify-between shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isNavOpen ? "translate-x-0 opacity-100 shadow-[10px_0_40px_rgba(0,0,0,0.5)]" : "-translate-x-full md:-ml-72 opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 pt-14 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-3 px-1 py-1 nav-stagger-item">
              <PlotCraftLogo size={40} />
              <div>
                <h2 className="font-extrabold text-sm tracking-wide flex items-center gap-1">
                  <span className={`${theme === "standard" ? "text-slate-900" : "text-white"}`}>Plot</span>
                  <span className={currentStyle.logoTheme}>Craft</span>
                  <span className="text-yellow-500">ai✨</span>
                </h2>
                <p className="text-[10px] opacity-70 font-semibold">AI Story & Media Engine</p>
              </div>
            </div>

            <div className="nav-stagger-item">
              <button
                onClick={handleNewChat}
                className={`w-full ${currentStyle.btnPrimary} text-xs py-3 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
              >
                <Plus className="w-4 h-4" />
                <span>New Story / Chat</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-300/30 dark:border-purple-500/25 nav-stagger-item">
              <p className="text-[10px] font-black uppercase opacity-70 tracking-wider px-2 mb-1">
                Creation Steps
              </p>

              <button
                onClick={() => setCurrentTab("story")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "story" ? "bg-purple-600 text-white shadow-md" : currentStyle.navHover
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Story Creator 📖</span>
              </button>

              <button
                onClick={() => handleRequireLoginForVisuals("image")}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "image" ? "bg-purple-600 text-white shadow-md" : currentStyle.navHover
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">2. Script → Image 🎨</span>
                </div>
                {!currentUser && <LockKeyhole className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />}
              </button>

              <button
                onClick={() => handleRequireLoginForVisuals("video")}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "video" ? "bg-purple-600 text-white shadow-md" : currentStyle.navHover
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Video className="w-4 h-4 shrink-0" />
                  <span className="truncate">3. Video Gen 🎬</span>
                </div>
                {!currentUser && <LockKeyhole className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />}
              </button>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-300/30 dark:border-purple-500/25 nav-stagger-item">
              <p className="text-[10px] font-black uppercase opacity-70 tracking-wider px-2 mb-1">
                Navigation
              </p>
              <button
                onClick={() => setCurrentTab("search")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "search" ? "bg-purple-600 text-white" : currentStyle.navHover
                }`}
              >
                <MessageSquare className="w-4 h-4" /> AI Chat
                <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500 text-slate-950">NEW</span>
              </button>
              <button
                onClick={() => setCurrentTab("about")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "about" ? "bg-purple-600 text-white" : currentStyle.navHover
                }`}
              >
                <Info className="w-4 h-4" /> About Us
              </button>
              <button
                onClick={() => setCurrentTab("usage")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "usage" ? "bg-purple-600 text-white" : currentStyle.navHover
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Usage Guidelines
              </button>
              <button
                onClick={() => setCurrentTab("toprated")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  currentTab === "toprated" ? "bg-purple-600 text-white" : currentStyle.navHover
                }`}
              >
                <Award className="w-4 h-4" /> Top Rated Content
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-300/30 dark:border-purple-500/25 nav-stagger-item">
              <p className="text-[10px] font-black uppercase opacity-70 tracking-wider px-2 mb-1">
                Appearance & Theme
              </p>
              <div className="px-2 space-y-2">
                <button
                  onClick={() => setDream(!dream)}
                  aria-pressed={dream}
                  className={`w-full px-3 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md ${
                    dream ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-yellow-500 text-white" : currentStyle.btnSecondary
                  }`}
                >
                  <span>🌸 Dream Glow Active</span>
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <Palette className="w-4 h-4 shrink-0" />
                  <select
                    value={theme}
                    disabled={dream}
                    onChange={(e) => setTheme(e.target.value)}
                    className={`w-full p-2 text-xs font-black rounded-xl ${currentStyle.bgInput} cursor-pointer ${dream ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <option value="standard">☀️ Standard Light</option>
                    <option value="rgbclr">🌈 RGB Neon Gamer</option>
                    <option value="cyberpunk">⚡ Cyberpunk Neon</option>
                    <option value="emerald">🌲 Emerald Forest</option>
                    <option value="sunset">🌅 Sunset Gold</option>
                    <option value="party">🎉 Party Vibe</option>
                    <option value="rainy">🌧️ Rainy Mood</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="relative pt-2 nav-stagger-item">
              <Search className="w-3.5 h-3.5 absolute left-3 top-5 opacity-70" />
              <input
                type="text"
                placeholder="Search History..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${currentStyle.bgInput} text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none`}
              />
            </div>

            <div className="space-y-1 nav-stagger-item">
              <p className="text-[10px] font-black uppercase opacity-70 tracking-wider px-2 mb-1">
                Recent Stories
              </p>
              {filteredHistory.length === 0 ? (
                <p className="text-xs opacity-60 font-semibold px-2 py-1">No history found</p>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { 
                      if (item.storyText) {
                        setSelectedDocStory(item);
                      } else {
                        setStoryTitle(item.title);
                        setCurrentTab("story");
                      }
                    }}
                    className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-purple-500/20 cursor-pointer transition border border-transparent hover:border-purple-500/40"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate font-bold">{item.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 border-t border-slate-300/30 dark:border-purple-500/25 space-y-2">
            {currentUser ? (
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${currentStyle.panelBg}`}>
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 bg-purple-600 text-white font-black rounded-full flex items-center justify-center text-xs shrink-0 shadow">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black truncate">{currentUser.name}</p>
                    <p className="text-[10px] opacity-70 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} title="Logout" className="hover:text-red-500 p-1 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                className={`w-full ${currentStyle.btnSecondary} text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer font-black shadow-md`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 w-full">
          <header className={`px-6 py-3.5 pl-14 flex items-center justify-between ${currentStyle.isDream ? "" : "border-b"} gap-3 ${currentStyle.bgHeader} animate-slide-in-top`}>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider">
                <span className={`${theme === "standard" ? "text-slate-900" : "text-white"}`}>Plot</span>
                <span className={currentStyle.logoTheme}>Craft</span>
                <span className="text-yellow-500">✨</span> Studio
              </span>
            </div>

            {dream && (
              <div className="hidden xl:flex items-center gap-2 pointer-events-none">
                <PlotCraftLogo size={28} />
                <span className="font-black text-base text-yellow-400">
                  <span className="text-white">Plot</span>
                  <span className={currentStyle.logoTheme}>Craft</span>
                  <span className="text-yellow-500">✨</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-600 text-white shadow">
                Tab: {currentTab}
              </span>
            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-y-auto w-full items-center justify-start">
            <main className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto w-full flex-1">
              {currentTab === "story" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                  <form onSubmit={handleGenerateStory} className={`md:col-span-5 p-6 rounded-3xl ${currentStyle.bgCard} space-y-4 animate-slide-in-left`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" /> Story Creator
                      </h3>
                      <span className={`text-[10px] font-black pl-2 pr-3 py-1 rounded-full flex items-center gap-1.5 ${currentStyle.badgeBg}`}>
                        <Sparkles className="w-3 h-3 text-purple-600 animate-spin" />
                        STUDIO
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1 tracking-wide">Story Topic / Title</label>
                      <input
                        type="text"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        placeholder="e.g. The Clever Rabbit, Ramayana, or any topic"
                        className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1 tracking-wide">Hero Name</label>
                      <input
                        type="text"
                        value={heroName}
                        onChange={(e) => setHeroName(e.target.value)}
                        placeholder="e.g. Arjuna / Rama / Felix"
                        className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1 tracking-wide">Place / setting (optional)</label>
                      <input
                        type="text"
                        value={storyPlace}
                        onChange={(e) => setStoryPlace(e.target.value)}
                        placeholder="e.g. a village near Tirupati, a space station, Ayodhya"
                        className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1 tracking-wide">
                        Story length: <span className="text-yellow-500">{pageCount} {pageCount === 1 ? "page" : "pages"}</span>
                        <span className="opacity-60 font-bold"> (about {(pageCount * 300).toLocaleString()} words)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 3, 5, 10, 15, 20].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPageCount(n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                              pageCount === n
                                ? "bg-purple-600 text-white border-yellow-500 shadow"
                                : `${currentStyle.bgInput} hover:border-purple-500`
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={pageCount}
                          onChange={(e) => setPageCount(Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                          aria-label="Number of pages"
                          className={`w-16 px-2 py-1.5 rounded-lg text-xs font-black text-center focus:outline-none ${currentStyle.bgInput}`}
                        />
                      </div>
                      <p className="text-[10px] opacity-60 mt-1.5 leading-snug">
                        Every page is written one by one, so the whole story is complete. Longer stories take longer (about 20 to 40 seconds per page).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1 tracking-wide">Genre</label>
                      <div className="grid grid-cols-2 gap-2">
                        {genres.map((g) => (
                          <button
                            key={g.name}
                            type="button"
                            onClick={() => setSelectedGenre(g.val)}
                            className={`p-2.5 rounded-xl text-xs font-bold text-left transition border cursor-pointer ${
                              selectedGenre === g.val
                                ? "bg-purple-600 text-white border-yellow-500 shadow-lg"
                                : `${currentStyle.bgInput} hover:border-purple-500`
                            }`}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full ${currentStyle.btnPrimary} py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                          <span>{loadingMsg}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          <span>Write {pageCount}-Page Story</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className={`md:col-span-7 p-6 rounded-3xl ${currentStyle.bgCard} flex flex-col justify-between animate-slide-in-right`}>
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-300/30 dark:border-purple-500/30">
                        <h3 className="font-black text-sm flex items-center gap-2 truncate pr-2">
                          <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
                          <span className="truncate">{storyTitle || "Your story"}</span>
                        </h3>
                      </div>

                      {storyPages.length > 0 ? (
                        <div className="space-y-4">
                          {loading && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" /> {loadingMsg}
                                </span>
                                <span>{storyProgress.done} / {storyProgress.total} pages</span>
                              </div>
                              <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-yellow-400 transition-all duration-500"
                                  style={{ width: `${storyProgress.total ? (storyProgress.done / storyProgress.total) * 100 : 0}%` }}
                                />
                              </div>
                              <p className="text-[10px] opacity-60">You can start reading while the next pages are being written.</p>
                            </div>
                          )}

                          {storyJob.error && (
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2">
                              <p className="font-bold text-amber-600">{storyJob.error}</p>
                              {storyJob.canContinue && (
                                <button
                                  type="button"
                                  onClick={handleContinueStory}
                                  disabled={loading}
                                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer disabled:opacity-50 ${currentStyle.btnPrimary}`}
                                >
                                  Continue writing (page {storyPages.length + 1} onwards)
                                </button>
                              )}
                            </div>
                          )}

                          {/* every page is shown: one at a time with page numbers, or all pages in one scroll */}
                          <StoryViewer
                            pages={storyPages}
                            currentStyle={currentStyle}
                            writing={loading}
                            writingTotal={storyProgress.total}
                          />

                          {!loading && generatedStory && (
                            <div className="pt-1">
                              <button
                                onClick={() => setSelectedDocStory({ title: storyTitle || "Generated Story", heroName, genre: selectedGenre, storyText: generatedStory, pages: storyPages, storyUrl })}
                                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-yellow-500 text-white font-black text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer uppercase"
                              >
                                <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                                <span>Get Full Story (Open Colorful Web Page)</span>
                                <ExternalLink className="w-4 h-4 ml-1" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                          <p className="text-xs font-bold">{loadingMsg}</p>
                          <p className="text-[11px] opacity-60">Planning the story, then writing page 1...</p>
                        </div>
                      ) : storyJob.error ? (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs space-y-2">
                          <p className="font-bold text-amber-600">{storyJob.error}</p>
                        </div>
                      ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-center opacity-70 space-y-2 font-bold">
                          <BookOpen className="w-12 h-12 stroke-2 text-purple-600 animate-pulse" />
                          <p className="text-xs">Choose how many pages you want, then press the button. A 15 page request gives you all 15 pages.</p>
                        </div>
                      )}
                    </div>

                    {generatedStory && (
                      <div className="pt-3 mt-3 border-t border-slate-300/30 dark:border-purple-500/30 flex justify-between items-center font-bold">
                        <span className="text-[11px] opacity-70">Use 'Get Full Story' to read the whole story, listen to it or download the TXT.</span>
                        <button
                          onClick={() => handleRequireLoginForVisuals("image")}
                          className={`px-4 py-2.5 text-xs font-black rounded-xl ${currentStyle.btnPrimary} flex items-center gap-2 cursor-pointer shadow-md`}
                        >
                          <span>Convert to Image & Video</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTab === "search" && <AiSearch currentStyle={currentStyle} currentUser={currentUser} />}

              {currentTab === "about" && <AboutPage currentStyle={currentStyle} />}

              {currentTab === "usage" && <UsagePage currentStyle={currentStyle} />}

              {currentTab === "toprated" && (
                <ReviewsSection
                  currentStyle={currentStyle}
                  currentUser={currentUser}
                  onRequireLogin={() => { setAuthMode("login"); setShowAuthModal(true); }}
                  onOpenStory={(story) => setSelectedDocStory(story)}
                />
              )}

              {currentTab === "image" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full animate-slide-in-left">
                  <div className={`md:col-span-5 p-6 rounded-3xl ${currentStyle.bgCard} space-y-4`}>
                    <h3 className="font-black text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" /> Script to Image Generator
                    </h3>
                    <p className="text-xs font-bold opacity-80">
                      Transform your script into breathtaking visual art. Select either a 2D Storybook style or a 3D Cinematic Render.
                    </p>

                    <div>
                      <label className="text-xs font-black block mb-1.5">Image Style Engine</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "3d", title: "3D Cinematic", note: "Pixar & 3D Render" },
                          { id: "2d", title: "2D Storybook", note: "Hand-drawn illustration" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setImageStyle(opt.id)}
                            aria-pressed={imageStyle === opt.id}
                            className={`p-3 rounded-2xl text-left transition cursor-pointer border ${
                              imageStyle === opt.id
                                ? "bg-purple-600 text-white border-yellow-500 shadow-lg"
                                : `${currentStyle.bgInput} hover:border-purple-500`
                            }`}
                          >
                            <p className="text-sm font-black">{opt.title}</p>
                            <p className="text-[11px] font-bold opacity-80">{opt.note}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1">Detailed Scene Prompt</label>
                      <textarea
                        rows={5}
                        value={scriptInput}
                        onChange={(e) => setScriptInput(e.target.value)}
                        placeholder="Describe your scene lighting, mood, characters..."
                        className={`w-full p-3 text-xs rounded-2xl focus:outline-none resize-none ${currentStyle.bgInput}`}
                      />
                    </div>

                    <button
                      onClick={handleScriptToImage}
                      disabled={loading}
                      className={`w-full ${currentStyle.btnPrimary} py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                          <span>{loadingMsg}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          <span>Create {imageStyle === "2d" ? "2D" : "3D"} Artwork</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`md:col-span-7 p-6 rounded-3xl ${currentStyle.bgCard} flex flex-col items-center justify-center min-h-[380px] animate-slide-in-right`}>
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        <p className="text-xs font-bold">{loadingMsg}</p>
                      </div>
                    ) : generatedImage ? (
                      <div className="w-full space-y-3">
                        <div className="rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl">
                          <img src={generatedImage} alt="Generated scene" className="w-full h-auto object-cover max-h-[340px]" />
                        </div>

                        {imageInfo.provider && (
                          <p className="text-[11px] font-bold opacity-80">
                            {imageInfo.style === "2d" ? "2D Storybook" : imageInfo.style === "3d" ? "3D Cinematic" : ""} Artwork powered by {imageInfo.provider}
                          </p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={handleDownloadImage}
                            className={`px-4 py-2 text-xs font-black rounded-xl ${currentStyle.btnSecondary} flex items-center gap-1.5 cursor-pointer shadow`}
                          >
                            <Download className="w-4 h-4 text-yellow-500" /> Save Image
                          </button>
                          <button
                            onClick={() => handleRequireLoginForVisuals("video")}
                            className={`px-4 py-2 text-xs font-black rounded-xl ${currentStyle.btnPrimary} flex items-center gap-1.5 cursor-pointer shadow`}
                          >
                            <Video className="w-4 h-4 text-yellow-500" /> Proceed to Video Gen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center opacity-70 font-bold space-y-2">
                        <ImageIcon className="w-12 h-12 stroke-2 mx-auto text-purple-600 animate-pulse" />
                        <p className="text-xs">Your AI generated masterpiece will appear here in high definition</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTab === "video" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full animate-slide-in-left">
                  <div className={`md:col-span-5 p-6 rounded-3xl ${currentStyle.bgCard} space-y-4`}>
                    <h3 className="font-black text-sm flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" /> AI Motion Video Studio
                    </h3>
                    <p className="text-xs font-bold opacity-80">
                      Animate your images or text prompt into an immersive cinematic motion sequence with smooth camera moves.
                    </p>

                    <div>
                      <label className="text-xs font-black block mb-1">Cinematic Motion Direction</label>
                      <textarea
                        rows={3}
                        value={videoInputContent}
                        onChange={(e) => setVideoInputContent(e.target.value)}
                        placeholder="Describe lighting, camera tracking, pan speed..."
                        className={`w-full p-3 text-xs rounded-2xl focus:outline-none resize-none ${currentStyle.bgInput}`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black block mb-1">Sequence Duration: {videoDuration} Seconds</label>
                      <div className="flex gap-2">
                        {[5, 7, 10].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setVideoDuration(sec)}
                            className={`flex-1 py-2 text-xs font-black rounded-xl border transition cursor-pointer shadow ${
                              videoDuration === sec
                                ? "bg-purple-600 text-white border-yellow-500"
                                : `${currentStyle.bgInput} hover:border-purple-500`
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateVideo}
                      disabled={loading}
                      className={`w-full ${currentStyle.btnPrimary} py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                          <span>{loadingMsg}</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 text-yellow-400" />
                          <span>Render {videoDuration}s Video Sequence</span>
                        </>
                      )}
                    </button>

                    <FreeVideoHelper
                      currentStyle={currentStyle}
                      prompt={videoInputContent.trim() || scriptInput.trim() || storyTitle.trim() || generatedStory.substring(0, 200)}
                      message={videoError}
                      defaultOpen={!!videoError}
                      currentUser={currentUser}
                      onRequireLogin={() => { setAuthMode("login"); setShowAuthModal(true); }}
                      onUploaded={(url) => { setAiVideoUrl(url); setVideoUrl(url); setVideoError(""); }}
                    />
                  </div>

                  <div className={`md:col-span-7 p-6 rounded-3xl ${currentStyle.bgCard} flex flex-col items-center justify-center min-h-[380px] animate-slide-in-right`}>
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        <p className="text-xs font-bold">{loadingMsg}</p>
                      </div>
                    ) : videoUrl ? (
                      <div className="w-full space-y-3 flex flex-col items-center">
                        <div className="rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl relative bg-black w-full max-w-lg aspect-video flex items-center justify-center">
                          {aiVideoUrl ? (
                            <video
                              src={aiVideoUrl}
                              controls
                              autoPlay
                              loop
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <>
                              <canvas
                                ref={videoCanvasRef}
                                width={640}
                                height={360}
                                className="w-full h-full object-contain"
                              />
                              <button
                                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                                className="absolute bottom-4 left-4 p-3 rounded-full bg-slate-950/80 backdrop-blur-md text-white hover:bg-purple-600 transition cursor-pointer shadow-lg border border-purple-500/40"
                              >
                                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 w-full max-w-lg pt-1">
                          {aiVideoUrl ? (
                            <a
                              href={aiVideoUrl}
                              download="plotcraft_video.mp4"
                              className={`px-4 py-2 text-xs font-black rounded-xl ${currentStyle.btnSecondary} flex items-center gap-1.5 cursor-pointer shadow`}
                            >
                              <Download className="w-4 h-4 text-yellow-500" /> Download Video File
                            </a>
                          ) : (
                            <button
                              onClick={handleDownloadVideo}
                              className={`px-4 py-2 text-xs font-black rounded-xl ${currentStyle.btnSecondary} flex items-center gap-1.5 cursor-pointer shadow`}
                            >
                              <Download className="w-4 h-4 text-yellow-500" /> Download Video Frame
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center opacity-70 font-bold space-y-2">
                        <Video className="w-12 h-12 stroke-2 mx-auto text-purple-600 animate-pulse" />
                        <p className="text-xs">Generate or provide visual inputs to preview cinematic motion video</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>

            <footer className={`py-6 px-8 mt-auto text-center text-xs ${currentStyle.footerBg} flex flex-col md:flex-row items-center justify-between gap-4 w-full border-t border-slate-300/30 dark:border-purple-500/30`}>
              <div className="flex items-center gap-2">
                <PlotCraftLogo size={24} />
                <span className="font-black">
                  <span className={`${theme === "standard" ? "text-slate-900" : "text-white"}`}>Plot</span>
                  <span className={currentStyle.logoTheme}>Craft</span>
                  <span className="text-yellow-500">✨</span> AI Engine
                </span>
              </div>

              <div className="flex items-center gap-4">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="p-2 rounded-full bg-purple-950/20 hover:bg-purple-600 hover:text-white transition duration-300 shadow cursor-pointer border border-purple-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram" className="p-2 rounded-full bg-purple-950/20 hover:bg-purple-600 hover:text-white transition duration-300 shadow cursor-pointer border border-purple-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube" className="p-2 rounded-full bg-purple-950/20 hover:bg-purple-600 hover:text-white transition duration-300 shadow cursor-pointer border border-purple-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136c-1.871-.505-9.376-.505-9.376-.505s-7.505 0-9.377.505a3.017 3.017 0 0 0-2.122 2.136c-.505 1.873-.505 5.814-.505 5.814s0 3.941.505 5.814c.276 1.026 1.096 1.846 2.122 2.136 1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136c.505-1.873.505-5.814.505-5.814s0-3.941-.505-5.814zM9.545 15.568v-7.136l6.364 3.568-6.364 3.568z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Twitter / X" className="p-2 rounded-full bg-purple-950/20 hover:bg-purple-600 hover:text-white transition duration-300 shadow cursor-pointer border border-purple-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn" className="p-2 rounded-full bg-purple-950/20 hover:bg-purple-600 hover:text-white transition duration-300 shadow cursor-pointer border border-purple-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>

              <div className="text-center md:text-right space-y-1">
                <p className="font-bold">© 2026 PlotCraft Studio. All rights reserved.</p>
                <p className="text-[11px] opacity-70">Designed and Developed with passion by K.Ganesh. Unauthorized duplication of intellectual content is strictly prohibited.</p>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {selectedDocStory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white p-8 rounded-3xl shadow-2xl border-2 border-purple-500/50 relative space-y-6 my-8 animate-slide-in-top">
            <button
              onClick={closeDocModal}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 border-b border-white/20 pb-5">
              <h2 className="text-3xl font-black text-yellow-400">
                {selectedDocStory.title}
              </h2>
            </div>

            <StoryViewer
              pages={selectedDocStory.pages && selectedDocStory.pages.length ? selectedDocStory.pages : [selectedDocStory.storyText || ""]}
              currentStyle={currentStyle}
              dark
              tall
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="file-actions flex items-center gap-2">
                <ReadAloudButton
                  text={selectedDocStory.storyText || (selectedDocStory.pages || []).join("\n\n")}
                  label="Read whole story"
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer transition shadow-md"
                />

                <button
                  onClick={() => handleDownloadStoryTxtFile(selectedDocStory.title, storyToFileText(selectedDocStory.pages, selectedDocStory.storyText))}
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 cursor-pointer transition shadow-md"
                >
                  <Download className="w-4 h-4" /> Download (.txt)
                </button>
              </div>

              <button
                onClick={closeDocModal}
                className="px-6 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-purple-600 to-yellow-500 text-white hover:opacity-90 cursor-pointer shadow-lg"
              >
                Close Story Page
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl ${currentStyle.bgCard} space-y-5 relative shadow-2xl animate-slide-in-top`}>
            <button
              onClick={() => { setShowAuthModal(false); setAuthError(""); }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:opacity-100 opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base">
                {authMode === "login" ? "Welcome Back to PlotCraft" : "Create Your PlotCraft Account"}
              </h3>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs text-center font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="text-xs font-black block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-black block mb-1">Email Address</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                />
              </div>

              <div>
                <label className="text-xs font-black block mb-1">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="Enter password"
                  className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${currentStyle.bgInput}`}
                />
              </div>

              <button
                type="submit"
                disabled={authBusy}
                className={`w-full ${currentStyle.btnPrimary} py-3.5 rounded-2xl text-xs font-black cursor-pointer transition disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {authBusy && <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />}
                {authMode === "login" ? "Login" : "Sign Up"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError("");
                  }}
                  className="text-xs font-bold text-purple-600 dark:text-yellow-400 hover:underline cursor-pointer"
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


  