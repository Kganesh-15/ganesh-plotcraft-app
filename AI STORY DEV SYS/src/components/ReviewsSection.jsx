import React, { useEffect, useState } from "react";
import { Award, Star, Plus, X, Trash2, BookOpen, Loader2, Sparkles, ShieldCheck, Rocket } from "lucide-react";

// Mock API helpers to ensure self-contained runnable compilation
const fetchReviews = async () => {
  const saved = localStorage.getItem("plotcraft_reviews");
  if (saved) return JSON.parse(saved);
  const defaultReviews = {
    reviews: [
      { id: "1", userId: "u1", name: "Alex River", rating: 5, comment: "PlotCraft changed the way I write sci-fi tales. Absolutely stunning interface!", storyCount: 12 },
      { id: "2", userId: "u2", name: "Elena Frost", rating: 5, comment: "The AI audio narration and image generation are mind-blowing!", storyCount: 8 },
      { id: "3", userId: "u3", name: "Marcus Vance", rating: 4, comment: "Super smooth experience. Love the themes and dream mode!", storyCount: 5 }
    ],
    average: 4.7
  };
  return defaultReviews;
};

const postReview = async (form) => {
  const current = await fetchReviews();
  const newRev = {
    id: "rev_" + Date.now(),
    userId: "currentUser",
    name: "You (Creator)",
    rating: form.rating,
    comment: form.comment,
    storyCount: 3
  };
  const updatedReviews = [newRev, ...current.reviews.filter(r => r.userId !== "currentUser")];
  const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / updatedReviews.length;
  const data = { reviews: updatedReviews, average: avg };
  localStorage.setItem("plotcraft_reviews", JSON.stringify(data));
  return data;
};

const deleteReview = async (id) => {
  const current = await fetchReviews();
  const updatedReviews = current.reviews.filter(r => r.id !== id);
  const sum = updatedReviews.length ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) : 0;
  const avg = updatedReviews.length ? sum / updatedReviews.length : 0;
  const data = { reviews: updatedReviews, average: avg };
  localStorage.setItem("plotcraft_reviews", JSON.stringify(data));
  return data;
};

const fetchMyStories = async () => {
  const saved = localStorage.getItem("plotcraft_my_stories");
  if (saved) return JSON.parse(saved);
  const defaults = [
    { id: "s1", title: "The Crystal Kingdom", heroName: "Lyra", genre: "Fantasy", storyText: "Deep within the shimmering peaks of Eldoria, Lyra discovered the ancient crystal...", createdAt: new Date().toISOString() },
    { id: "s2", title: "Cyber Protocol 2099", heroName: "Kax", genre: "Sci-Fi", storyText: "Neon rain soaked the asphalt as Kax unlocked the master terminal...", createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];
  localStorage.setItem("plotcraft_my_stories", JSON.stringify(defaults));
  return defaults;
};

const deleteMyStory = async (id) => {
  const current = await fetchMyStories();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem("plotcraft_my_stories", JSON.stringify(updated));
  return updated;
};

const SHOWCASE = [
  { title: "Magical Enchanted Forest", genre: "Fantasy", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop", badge: "Epic Tale" },
  { title: "Neon Cyber City 2099", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop", badge: "Futuristic" },
  { title: "Dragon & Crystal Castle", genre: "Adventure", img: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&auto=format&fit=crop", badge: "Best Seller" },
  { title: "Deep Underwater Kingdom", genre: "Mystery", img: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600&auto=format&fit=crop", badge: "Deep Dive" },
  { title: "Interstellar Space Odyssey", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop", badge: "Masterpiece" },
  { title: "Steampunk Airship Haven", genre: "Steampunk", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop", badge: "3D HD" },
  { title: "Floating Celestial Islands", genre: "Fantasy", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop", badge: "Dreamscape" },
  { title: "Cyberpunk Hacker Den", genre: "Cyberpunk", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop", badge: "Underground" },
  { title: "Mystical Phoenix Realm", genre: "Mythology", img: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop", badge: "Legendary" },
  { title: "Quantum Portal Gateway", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop", badge: "Futuristic" },
  { title: "Elven Tree Sanctuary", genre: "Fantasy", img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop", badge: "Nature" },
  { title: "Neon Mecha Mech Warrior", genre: "Mecha", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop", badge: "Action 3D" },
  { title: "Lost Temple of Ancients", genre: "Adventure", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop", badge: "Mystery" },
  { title: "Bioluminescent Deep Abyss", genre: "Sci-Fi", img: "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=600&auto=format&fit=crop", badge: "Neon HD" },
  { title: "Starlight Galaxy Nebula", genre: "Cosmos", img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop", badge: "Universe" }
];

function Stars({ value, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-slate-400 opacity-40"}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection({ currentStyle, currentUser, onRequireLogin, onOpenStory }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [myStories, setMyStories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const load = async () => {
    try {
      const data = await fetchReviews();
      setReviews(data.reviews);
      setAverage(data.average);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    }
  };

  useEffect(() => {
    load();
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 400); // Capsule split opening delay
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMyStories([]);
      return;
    }
    fetchMyStories().then(setMyStories).catch(() => setMyStories([]));
  }, [currentUser]);

  const mine = currentUser ? reviews.find((r) => r.userId === currentUser.id) : null;

  const openModal = () => {
    if (!currentUser) return onRequireLogin();
    setForm(mine ? { rating: mine.rating, comment: mine.comment } : { rating: 5, comment: "" });
    setFormError("");
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) return setFormError("Please write a few words about your experience.");
    setSaving(true);
    try {
      await postReview(form);
      setShowModal(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteReview(id);
      await load();
    } catch {}
  };

  const removeStory = async (e, id) => {
    e.stopPropagation();
    try {
      const updated = await deleteMyStory(id);
      setMyStories(updated);
    } catch {}
  };

  const doubledReviews = reviews.length > 0 ? [...reviews, ...reviews, ...reviews] : [];

  return (
    <div className="relative w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-10 space-y-12 text-slate-100 bg-slate-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      
      {/* ---------- CAPSULE SPLIT INTRO OVERLAY ---------- */}
      <div
        className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-700 ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Top Half Capsule */}
        <div
          className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-b border-purple-500/30 flex flex-col items-center justify-end pb-4 transition-transform duration-1000 cubic-bezier(0.77, 0, 0.175, 1) shadow-2xl ${
            isOpen ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
            <Rocket className="w-6 h-6 text-pink-400 animate-spin" />
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              CREATOR UNIVERSE
            </span>
          </div>
        </div>

        {/* Bottom Half Capsule */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-tr from-slate-950 via-purple-950 to-indigo-950 border-t border-purple-500/30 flex flex-col items-center justify-start pt-4 transition-transform duration-1000 cubic-bezier(0.77, 0, 0.175, 1) shadow-2xl ${
            isOpen ? "translate-y-full" : "translate-y-0"
          }`}
        >
          <p className="text-xs tracking-widest text-purple-300/60 uppercase font-semibold">Unleashing Gallery & Community...</p>
        </div>
      </div>

      <style>{`
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: scrollMarquee 45s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 bg-slate-900/90 text-white border border-white/15 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-black tracking-wide shadow-sm">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" /> Community Masterpiece Hub
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Explore & <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Showcase</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Immerse yourself in top-tier creator stories, HD/3D visual artwork galleries, and trusted community feedback.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-xl">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg">
              <Star className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-pink-300 font-bold">Community Trust</div>
              <div className="text-lg font-black text-amber-300">{average.toFixed(1)} / 5.0 Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Creations Section */}
      {currentUser && (
        <section className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-8 bg-slate-900/80 text-white border border-purple-500/40 shadow-2xl space-y-6">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-sm">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Personal Library
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                My Story Creations <span className="text-cyan-400 font-bold">({myStories.length})</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">Click any card to read or delete your tale!</p>
          </div>

          {myStories.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative z-10">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-white">No stories created yet while logged in.</p>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">Head over to the Story Hub, generate your first tale, and it will automatically sync here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {myStories.slice(0, 9).map((st) => (
                <div
                  key={st.id}
                  onClick={() => onOpenStory({ title: st.title, heroName: st.heroName, genre: st.genre, storyText: st.storyText })}
                  className="group text-left p-5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-cyan-400 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 shadow-xl relative overflow-hidden text-white"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform"></div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/40">
                        {st.genre || "Epic"}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(st.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">{st.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{st.storyText}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Read Immersive →
                    </span>
                    <button
                      onClick={(e) => removeStory(e, st.id)}
                      title="Delete story"
                      className="p-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 cursor-pointer shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured Gallery Marquee Section */}
      <section className="space-y-6 overflow-hidden">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Featured Gallery
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">HD & 3D Creations Showcase</h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Smooth continuous marquee scrolling inspiration</span>
        </div>

        <div className="w-full relative py-2 overflow-hidden">
          <div className="animate-marquee flex gap-6">
            {[...SHOWCASE, ...SHOWCASE, ...SHOWCASE].map((item, idx) => (
              <div 
                key={idx} 
                className="w-[300px] sm:w-[340px] rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900 shadow-xl flex flex-col hover:border-pink-500/50 transition-all duration-500 group shrink-0"
              >
                <div className="relative h-44 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-70"></div>
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <span className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 text-[11px] font-black tracking-wider uppercase border border-amber-400/50 shadow-2xl">
                    {item.badge}
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between bg-slate-900 relative z-20">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">{item.genre}</span>
                    <h4 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors line-clamp-1">{item.title}</h4>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Reviews Marquee Section */}
      <section className="rounded-[2.5rem] p-6 md:p-8 bg-slate-900/90 border border-white/10 shadow-2xl space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Community Love
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">What Creators Say</h3>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-3xl font-black bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                  {average.toFixed(1)}
                </span>
                <div className="space-y-0.5">
                  <Stars value={Math.round(average)} size="w-4 h-4" />
                  <p className="text-xs text-slate-400 font-medium">Trusted by {reviews.length} passionate storytellers</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={openModal}
            className="px-6 py-3 text-xs font-bold rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {mine ? "Edit Your Review" : currentUser ? "Write a Review" : "Log In to Review"}
          </button>
        </div>

        {loadError && (
          <p className="text-xs text-red-400 p-4 rounded-xl bg-red-500/10 border border-red-500/20">Could not load reviews: {loadError}</p>
        )}

        <div className="w-full relative py-2 overflow-hidden">
          <div className="animate-marquee flex gap-6">
            {doubledReviews.map((rev, idx) => (
              <div
                key={`${rev.id}-${idx}`}
                className="w-[320px] sm:w-[360px] p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-white/25 transition-all duration-300 shadow-xl shrink-0 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-sm font-bold shadow-md shrink-0">
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{rev.name}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                          <ShieldCheck className="w-3 h-3" /> Verified Creator
                        </div>
                      </div>
                    </div>
                    <Stars value={rev.rating} size="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-black/20 p-4 rounded-2xl border border-white/5">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-purple-300">
                    {rev.storyCount > 0 ? `${rev.storyCount} ${rev.storyCount === 1 ? "story" : "stories"} created` : "PlotCraft Enthusiast"}
                  </span>
                  {currentUser && rev.userId === currentUser.id && (
                    <button 
                      onClick={() => remove(rev.id)} 
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg p-8 rounded-[2.5rem] bg-slate-900 border border-white/15 space-y-6 relative shadow-2xl text-white">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/25 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> Share Your Thoughts
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {mine ? "Edit Your Review" : "Rate PlotCraft"}
              </h3>
              <p className="text-xs text-slate-400">
                Posting as <span className="text-purple-400 font-bold">{currentUser?.name || "Creator"}</span>. Your review will be visible to all visitors.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Select Rating</label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setForm({ ...form, rating: n })}
                      className="p-1 cursor-pointer hover:scale-125 transition-transform"
                      aria-label={`${n} stars`}
                    >
                      <Star className={`w-8 h-8 ${n <= form.rating ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" : "text-slate-400 opacity-40"}`} />
                    </button>
                  ))}
                  <span className="ml-auto text-sm font-bold text-amber-400 px-3 py-1 rounded-xl bg-amber-400/10">
                    {form.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Your Experience & Feedback</label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="What do you love about PlotCraft? How has it helped your storytelling?"
                  className="w-full p-4 text-xs rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none shadow-inner"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20">{formError}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-bold shadow-xl hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {mine ? "Update Review" : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}