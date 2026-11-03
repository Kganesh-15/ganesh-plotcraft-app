import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Rows3, BookOpen } from "lucide-react";
import ReadAloudButton from "./ReadAloudButton";

const wordCount = (t) => (String(t).match(/\S+/g) || []).length;

// Shows EVERY page of a story. Nothing is cut: one page at a time with numbered buttons,
// or "All pages" to read the whole story in one scroll.
export default function StoryViewer({ pages, currentStyle, dark = false, writing = false, writingTotal = 0, tall = false }) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const list = pages && pages.length ? pages : [];
  const total = list.length;

  // keep the index inside the list when a new story replaces the old one
  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1));
  }, [total, index]);

  if (total === 0) return null;

  const words = list.reduce((sum, p) => sum + wordCount(p), 0);
  const btn = dark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-purple-600 text-white hover:bg-purple-500";
  const box = dark ? "bg-white/10 border border-white/20" : "bg-black/5 border border-black/10";
  const height = tall ? "max-h-[60vh]" : "max-h-[360px]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-70">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {writing && writingTotal > total ? `${total} of ${writingTotal} pages written` : `${total} ${total === 1 ? "page" : "pages"}`} · {words.toLocaleString()} words
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${dark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}
          >
            <Rows3 className="w-3.5 h-3.5" /> {showAll ? "One page at a time" : "Show all pages"}
          </button>
        )}
      </div>

      {showAll ? (
        <div className={`${height} overflow-y-auto p-4 rounded-2xl text-sm leading-7 space-y-6 ${box}`}>
          {list.map((page, i) => (
            <section key={i}>
              {total > 1 && <p className="text-[11px] font-black uppercase tracking-wider opacity-50 mb-2">Page {i + 1}</p>}
              <p className="whitespace-pre-wrap">{page}</p>
            </section>
          ))}
        </div>
      ) : (
        <div className={`${height} overflow-y-auto p-4 rounded-2xl text-sm leading-7 whitespace-pre-wrap ${box}`}>{list[index]}</div>
      )}

      {!showAll && total > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer ${btn}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-bold">Page {index + 1} of {writing && writingTotal > total ? writingTotal : total}</span>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer ${btn}`}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {total > 2 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {list.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    i === index ? "bg-purple-600 text-white scale-110" : dark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ReadAloudButton
          text={list[showAll ? 0 : index]}
          label={showAll ? "Read page 1" : `Read page ${index + 1}`}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${dark ? "bg-white/10 hover:bg-white/20 text-white" : currentStyle?.btnSecondary || "bg-black/5"}`}
        />
        {total > 1 && (
          <ReadAloudButton
            text={list.join("\n\n")}
            label="Read whole story"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${dark ? "bg-white/10 hover:bg-white/20 text-white" : currentStyle?.btnSecondary || "bg-black/5"}`}
          />
        )}
      </div>
    </div>
  );
}