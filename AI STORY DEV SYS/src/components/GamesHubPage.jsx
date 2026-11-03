import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Brain, Sparkles, ArrowLeft, RotateCcw, 
  Trophy, Flame, Zap, Award, Play, ChevronRight 
} from 'lucide-react';

const MEMORY_ICONS = ['📖', '✍️', '💡', '🎨', '🚀', '⭐'];

export default function GamesHubPage({ currentTheme = 'dark', onBackToDashboard }) {
  const [activeGame, setActiveGame] = useState(null); // null | 'memory'

  // --- Memory Game States ---
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [bestScore, setBestScore] = useState(null);

  const initMemoryGame = () => {
    const shuffled = [...MEMORY_ICONS, ...MEMORY_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  useEffect(() => {
    if (activeGame === 'memory') {
      initMemoryGame();
    }
  }, [activeGame]);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        const updatedMatched = [...matched, first, second];
        setMatched(updatedMatched);
        setFlipped([]);
        
        // Check win
        if (updatedMatched.length === cards.length) {
          if (!bestScore || moves + 1 < bestScore) {
            setBestScore(moves + 1);
          }
        }
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  const isDark = currentTheme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 md:p-8 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 text-gray-900'
    }`}>
      
      {/* Top Navigation Bar inside Games Page */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800/80">
        <button 
          onClick={() => {
            if (activeGame) setActiveGame(null);
            else if (onBackToDashboard) onBackToDashboard();
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
            isDark 
              ? 'bg-gray-900 hover:bg-gray-800 text-indigo-400 border border-gray-800' 
              : 'bg-white hover:bg-gray-100 text-indigo-600 shadow-sm border border-gray-200'
          }`}
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>{activeGame ? 'Back to Games Hub' : 'Back to Dashboard'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 animate-pulse">
            <Gamepad2 size={22} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            PlotCraft Arcade
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* ================= VIEW 1: GAMES HUB DIRECTORY ================= */}
        {!activeGame && (
          <div className="animate-fadeIn space-y-8">
            
            {/* Hero Banner */}
            <div className={`relative overflow-hidden p-8 md:p-12 rounded-3xl border transition-all duration-500 ${
              isDark 
                ? 'bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-gray-900 border-indigo-500/20 shadow-2xl shadow-indigo-950/50' 
                : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200 shadow-xl'
            }`}>
              <div className="absolute -right-10 -bottom-10 opacity-10 dark:opacity-25 pointer-events-none">
                <Gamepad2 size={240} className="text-indigo-500 animate-spin-slow" />
              </div>

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={14} />
                  <span>Interactive Zone</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                  Unwind & Train Your Brain 🧠
                </h1>
                <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Take a break from writing plots. Play immersive mini-games designed to boost memory, spark creative ideas, and challenge your friends!
                </p>
              </div>
            </div>

            {/* Games Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <Flame size={20} className="text-orange-500" />
                  <span>Featured Mini-Games</span>
                </h2>
                <span className="text-xs opacity-60">1 Available • More Coming Soon</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Game Card 1: Memory Match */}
                <div 
                  onClick={() => setActiveGame('memory')}
                  className={`group relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    isDark 
                      ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500 hover:shadow-indigo-500/10' 
                      : 'bg-white border-gray-200 hover:border-indigo-500 hover:shadow-indigo-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                      <Brain size={28} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Playable
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                    Plot Memory Match
                  </h3>
                  <p className={`text-sm mb-6 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Test your concentration by matching iconic PlotCraft narrative symbols in minimal moves.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-800">
                    <span className="text-xs font-medium opacity-60 flex items-center space-x-1">
                      <Zap size={14} className="text-yellow-400" />
                      <span>Quick Session (~2 mins)</span>
                    </span>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {/* Coming Soon Card 1 */}
                <div className={`p-6 rounded-2xl border opacity-60 cursor-not-allowed flex flex-col justify-between ${
                  isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-gray-500/10 text-gray-400">
                        <Gamepad2 size={28} />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Narrative Quest</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      An interactive text-based adventure where your choices shape the unfolding storyline.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800 text-xs opacity-50 font-medium">
                    In Development 🚀
                  </div>
                </div>

                {/* Coming Soon Card 2 */}
                <div className={`p-6 rounded-2xl border opacity-60 cursor-not-allowed flex flex-col justify-between ${
                  isDark ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-gray-500/10 text-gray-400">
                        <Award size={28} />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Plot Trivia Blitz</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Test your storytelling knowledge and writing terminology against the clock!
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800 text-xs opacity-50 font-medium">
                    Planned for Next Update
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}


        {/* ================= VIEW 2: PLOT MEMORY MATCH GAME ================= */}
        {activeGame === 'memory' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 text-purple-400 mb-2">
                <Brain size={32} />
              </div>
              <h2 className="text-2xl font-black">Plot Memory Match</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Flip tiles and match identical narrative symbols!
              </p>
            </div>

            {/* Scoreboard Bar */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border mb-6 shadow-sm ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="text-center">
                <span className="block text-xs opacity-60 uppercase font-semibold">Moves</span>
                <span className="text-xl font-black text-indigo-500">{moves}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs opacity-60 uppercase font-semibold">Matches</span>
                <span className="text-xl font-black text-emerald-500">{matched.length / 2} / {MEMORY_ICONS.length}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs opacity-60 uppercase font-semibold">Best Score</span>
                <span className="text-xl font-black text-yellow-500">{bestScore !== null ? bestScore : '—'}</span>
              </div>
              <button 
                onClick={initMemoryGame}
                className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-300"
                title="Restart Game"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {cards.map((card, index) => {
                const isFlipped = flipped.includes(index) || matched.includes(index);
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    className={`h-28 rounded-2xl flex items-center justify-center text-4xl cursor-pointer transition-all duration-300 transform select-none shadow-sm ${
                      isFlipped 
                        ? (isDark 
                            ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border-2 border-indigo-500/50 scale-[1.02]' 
                            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-400 scale-[1.02]')
                        : (isDark 
                            ? 'bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700' 
                            : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300')
                    }`}
                  >
                    {isFlipped ? (
                      <span className="animate-scaleUp">{card.emoji}</span>
                    ) : (
                      <span className="text-xl opacity-30 font-bold">?</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Win Banner */}
            {matched.length === cards.length && (
              <div className={`p-6 rounded-2xl border text-center animate-bounce shadow-xl ${
                isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex justify-center mb-2 text-yellow-400">
                  <Trophy size={32} />
                </div>
                <h3 className="text-xl font-black mb-1">Victory! 🎉</h3>
                <p className="text-sm opacity-90 mb-4">You completed the puzzle in <strong className="text-indigo-400">{moves} moves</strong>!</p>
                <button
                  onClick={initMemoryGame}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                >
                  Play Again
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}