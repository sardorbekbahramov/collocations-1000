"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { ALL_LESSONS } from "../data/index";

/* ─── CONSTANTS ─────────────────────────────── */
const CARD_COLORS = [
  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.28)",   acc: "#22c55e" },
  { bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.28)",  acc: "#38bdf8" },
  { bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.28)",  acc: "#f97316" },
  { bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.28)",  acc: "#ec4899" },
  { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.28)",   acc: "#eab308" },
  { bg: "rgba(124,106,247,0.08)", border: "rgba(124,106,247,0.28)", acc: "#a78bfa" },
  { bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.28)",  acc: "#14b8a6" },
  { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.28)", acc: "#f87171" },
];

/* ─── HELPERS ───────────────────────────────── */
function lsGet(k, d) {
  if (typeof window === "undefined") return d;
  try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
}
function lsSet(k, v) {
  if (typeof window !== "undefined") localStorage.setItem(k, JSON.stringify(v));
}
function speak(word) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US"; u.rate = 0.82;
  window.speechSynthesis.speak(u);
}

/* ─── SMALL UI ──────────────────────────────── */
function GradText({ children, from, to, size = 18, serif = false }) {
  return (
    <span style={{ fontFamily: serif ? "'Playfair Display',serif" : "'DM Sans',sans-serif", fontSize: size, fontWeight: 700, background: `linear-gradient(90deg,${from},${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "inline-block" }}>
      {children}
    </span>
  );
}

function SecHeader({ icon, title, sub, from, to, ibg, ib }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: ibg, border: `1px solid ${ib}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div>
        <GradText from={from} to={to} size={18} serif>{title}</GradText>
        <div style={{ fontSize: 11, color: "#64648a", marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />;
}

/* ─── COLLOCATION MODAL ─────────────────────── */
function ColModal({ entry, onClose, isSaved, onToggleSave }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  if (!entry) return null;
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid #33335a", borderRadius: 20, padding: "24px", maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", animation: "fadeIn .25s ease" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#e8e8f0", marginBottom: 14 }}>{entry.phrase}</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#64648a", marginBottom: 5 }}>🇬🇧 English</div>
        <div style={{ fontSize: 14, color: "#d0d0e8", lineHeight: 1.65, marginBottom: 14 }}>{entry.en}</div>
        <Divider />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#64648a", marginTop: 10, marginBottom: 5 }}>🇺🇿 O'zbekcha</div>
        <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.6 }}>{entry.uz}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={() => speak(entry.phrase)} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.08)", color: "#38bdf8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🔊 Listen</button>
          <button onClick={onToggleSave} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${isSaved ? "rgba(234,179,8,0.4)" : "rgba(249,115,22,0.4)"}`, background: isSaved ? "rgba(234,179,8,0.08)" : "rgba(249,115,22,0.08)", color: isSaved ? "#eab308" : "#f97316", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{isSaved ? "★ Saqlangan" : "⭐ Saqlash"}</button>
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #26264a", background: "transparent", color: "#64648a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✕ Yopish</button>
        </div>
      </div>
    </div>
  );
}

/* ─── READ TAB ──────────────────────────────── */
function ReadTab({ savedPhrases, onToggleSave }) {
  const [lesson, setLesson] = useState(ALL_LESSONS[0]);
  const [modal, setModal] = useState(null);
  const [showUz, setShowUz] = useState(false);
  const topRef = useRef(null);
  const savedSet = new Set(savedPhrases.map(p => p.phrase.toLowerCase()));

  const selectLesson = (ls) => {
    setLesson(ls); setShowUz(false); setModal(null);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const renderText = (html) => {
    const parts = html.split(/(<b>.*?<\/b>)/g);
    return parts.map((part, i) => {
      const m = part.match(/^<b>(.*?)<\/b>$/);
      if (m) {
        const phrase = m[1];
        const entry = lesson.collocations.find(c => c.phrase.toLowerCase() === phrase.toLowerCase());
        return (
          <span key={i} onClick={() => entry && setModal(entry)}
            style={{ background: "rgba(124,106,247,0.15)", borderRadius: 4, padding: "0 3px", cursor: entry ? "pointer" : "default", borderBottom: "2px solid rgba(124,106,247,0.55)", fontWeight: 600, color: "#c0b4ff", transition: "background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,106,247,0.15)"; }}>
            {phrase}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div>
      {/* Lesson grid */}
      <SecHeader icon="📚" title="Passages" sub="30 ta lesson · 1000 collocations" from="#22c55e" to="#14b8a6" ibg="rgba(34,197,94,0.12)" ib="rgba(34,197,94,0.3)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 7, maxHeight: 210, overflowY: "auto", marginBottom: 18 }}>
        {ALL_LESSONS.map(ls => (
          <div key={ls.id} onClick={() => selectLesson(ls)}
            style={{ padding: "9px 11px", background: lesson.id === ls.id ? "rgba(34,197,94,0.06)" : "#13131f", border: `1px solid ${lesson.id === ls.id ? "#22c55e" : "#26264a"}`, borderRadius: 9, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 9, color: "#64648a", marginBottom: 3, fontFamily: "DM Mono,monospace", fontWeight: 600 }}>Lesson {ls.id}</div>
            <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: lesson.id === ls.id ? "#e8e8f0" : "#a0a0b8" }}>{ls.topic}</div>
          </div>
        ))}
      </div>

      {/* Lesson header */}
      <div ref={topRef} style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 10, background: "linear-gradient(90deg,#e8e8f0,#9090b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Lesson {lesson.id} – {lesson.topic}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowUz(!showUz)}
            style={{ padding: "8px 16px", borderRadius: 9, border: `1px solid ${showUz ? "rgba(34,197,94,0.4)" : "#26264a"}`, background: showUz ? "rgba(34,197,94,0.10)" : "#13131f", color: showUz ? "#22c55e" : "#a0a0b8", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            🇺🇿 {showUz ? "Hide Uzbek" : "Show Uzbek"}
          </button>
        </div>
      </div>

      {/* Passage text */}
      <div style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 14, padding: 20, lineHeight: 1.95, fontSize: 15, color: "#c0c0d8", marginBottom: 10 }}>
        {renderText(lesson.text)}
        <div style={{ marginTop: 10, fontSize: 11, color: "#44446a", fontStyle: "italic" }}>
          💡 Qalin so'zlarga bosing → ta'rif va o'zbekcha chiqadi
        </div>
      </div>

      {/* Uzbek translation */}
      {showUz && (
        <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: 20, lineHeight: 1.9, fontSize: 14, color: "#6ee7b7", marginBottom: 6, animation: "fadeIn .3s ease" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64648a", marginBottom: 10 }}>🇺🇿 O'zbekcha tarjima</div>
          {lesson.translation_uz}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ColModal entry={modal} onClose={() => setModal(null)}
          isSaved={savedSet.has(modal.phrase.toLowerCase())}
          onToggleSave={() => onToggleSave({ phrase: modal.phrase, en: modal.en, uz: modal.uz })} />
      )}
    </div>
  );
}

/* ─── VOCABULARY TAB ────────────────────────── */
function VocabTab({ savedPhrases, onToggleSave }) {
  const [lesson, setLesson] = useState(ALL_LESSONS[0]);
  const [modal, setModal] = useState(null);
  const savedSet = new Set(savedPhrases.map(p => p.phrase.toLowerCase()));

  return (
    <div>
      <SecHeader icon="✨" title="Vocabulary" sub="Har bir lessondagi collocations · Bosing → ta'rif" from="#f97316" to="#eab308" ibg="rgba(249,115,22,0.12)" ib="rgba(249,115,22,0.3)" />

      {/* Lesson selector */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 18 }}>
        {ALL_LESSONS.map(ls => (
          <button key={ls.id} onClick={() => setLesson(ls)}
            style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${lesson.id === ls.id ? "rgba(249,115,22,0.4)" : "#26264a"}`, background: lesson.id === ls.id ? "rgba(249,115,22,0.10)" : "#13131f", color: lesson.id === ls.id ? "#f97316" : "#64648a", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: lesson.id === ls.id ? 600 : 400 }}>
            {ls.id}. {ls.topic}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 14, color: "#e8e8f0" }}>
        Lesson {lesson.id} – {lesson.topic}
        <span style={{ fontSize: 12, color: "#64648a", fontFamily: "'DM Sans',sans-serif", marginLeft: 10, fontWeight: 400 }}>{lesson.collocations.length} ta collocation</span>
      </div>

      {lesson.collocations.map((col, i) => {
        const c = CARD_COLORS[i % CARD_COLORS.length];
        const saved = savedSet.has(col.phrase.toLowerCase());
        return (
          <div key={col.phrase} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: 14, marginBottom: 10, animation: "fadeIn .3s ease", cursor: "pointer" }}
            onClick={() => setModal(col)}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: c.acc }}>{col.phrase}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); speak(col.phrase); }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  🔊 Listen
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleSave({ phrase: col.phrase, en: col.en, uz: col.uz }); }}
                  style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${saved ? "rgba(234,179,8,0.4)" : "#26264a"}`, background: "transparent", color: saved ? "#eab308" : "#64648a", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {saved ? "★" : "☆"}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: c.acc, marginBottom: 3 }}>🇬🇧 English</div>
            <div style={{ fontSize: 13, color: "#d0d0e8", lineHeight: 1.55, marginBottom: 8 }}>{col.en}</div>
            <Divider />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#22c55e", marginBottom: 3 }}>🇺🇿 O'zbekcha</div>
            <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.5 }}>{col.uz}</div>
          </div>
        );
      })}

      {modal && (
        <ColModal entry={modal} onClose={() => setModal(null)}
          isSaved={savedSet.has(modal.phrase.toLowerCase())}
          onToggleSave={() => onToggleSave({ phrase: modal.phrase, en: modal.en, uz: modal.uz })} />
      )}
    </div>
  );
}

/* ─── QUIZ TAB ──────────────────────────────── */
function QuizTab() {
  const [lesson, setLesson] = useState(ALL_LESSONS[0]);
  const [qIdx, setQIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0, total: 0 });
  const [mode, setMode] = useState("all"); // "all" | "lesson"

  const allQ = ALL_LESSONS.flatMap(ls => ls.quiz.map(q => ({ ...q, lessonId: ls.id, topic: ls.topic })));
  const lessonQ = lesson.quiz.map(q => ({ ...q, lessonId: lesson.id, topic: lesson.topic }));
  const pool = mode === "lesson" ? lessonQ : allQ;

  const q = pool[qIdx % pool.length];

  const answer = (idx) => {
    if (answered !== null) return;
    const ok = idx === q.answer;
    setAnswered(idx);
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1), total: s.total + 1 }));
  };

  const next = () => {
    setAnswered(null);
    setQIdx(i => (i + 1) % pool.length);
  };

  return (
    <div>
      <SecHeader icon="🧠" title="Quiz" sub="Bilimingizni sinab ko'ring!" from="#f97316" to="#eab308" ibg="rgba(249,115,22,0.12)" ib="rgba(249,115,22,0.3)" />

      {/* Mode + Lesson selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[{ id: "all", l: "🌐 Barcha savollar" }, { id: "lesson", l: "📖 Lesson bo'yicha" }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setQIdx(0); setAnswered(null); }}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${mode === m.id ? "rgba(249,115,22,0.5)" : "#26264a"}`, background: mode === m.id ? "rgba(249,115,22,0.10)" : "#13131f", color: mode === m.id ? "#f97316" : "#64648a", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {m.l}
          </button>
        ))}
      </div>

      {mode === "lesson" && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {ALL_LESSONS.map(ls => (
            <button key={ls.id} onClick={() => { setLesson(ls); setQIdx(0); setAnswered(null); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${lesson.id === ls.id ? "rgba(249,115,22,0.4)" : "#26264a"}`, background: lesson.id === ls.id ? "rgba(249,115,22,0.10)" : "#13131f", color: lesson.id === ls.id ? "#f97316" : "#64648a", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {ls.id}. {ls.topic}
            </button>
          ))}
        </div>
      )}

      {/* Score */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18, flexWrap: "wrap" }}>
        {[{ n: score.correct, l: "To'g'ri", c: "#22c55e" }, { n: score.wrong, l: "Noto'g'ri", c: "#f87171" }, { n: score.total, l: "Jami", c: "#f97316" }].map(({ n, l, c }) => (
          <div key={l} style={{ padding: "10px 16px", background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 11, textAlign: "center", minWidth: 72 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: c }}>{n}</div>
            <div style={{ fontSize: 10, color: "#64648a", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Question */}
      <div style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 16, padding: 22, animation: "fadeIn .3s ease" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#f97316", fontFamily: "DM Mono,monospace", marginBottom: 10 }}>
          🎯 Lesson {q.lessonId} – {q.topic}
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, lineHeight: 1.5, marginBottom: 18, color: "#e8e8f0" }}>{q.q}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {q.options.map((opt, i) => {
            let bg = "#13131f", border = "#26264a", col = "#e8e8f0";
            if (answered !== null) {
              if (i === q.answer) { bg = "rgba(34,197,94,0.09)"; border = "#22c55e"; col = "#22c55e"; }
              else if (i === answered && i !== q.answer) { bg = "rgba(248,113,113,0.09)"; border = "#f87171"; col = "#f87171"; }
            }
            return (
              <button key={i} disabled={answered !== null} onClick={() => answer(i)}
                style={{ padding: "12px 16px", borderRadius: 11, border: `1px solid ${border}`, background: bg, color: col, fontSize: 13, textAlign: "left", cursor: answered !== null ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 10, transition: "all .15s" }}>
                <span style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${col}`, opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "DM Mono,monospace", flexShrink: 0 }}>
                  {["A", "B", "C", "D"][i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {answered !== null && (
          <div style={{ marginTop: 14, padding: "13px 16px", borderRadius: 11, background: answered === q.answer ? "rgba(34,197,94,0.09)" : "rgba(248,113,113,0.09)", border: `1px solid ${answered === q.answer ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`, color: answered === q.answer ? "#22c55e" : "#f87171", fontSize: 13 }}>
            {answered === q.answer ? "✅ To'g'ri!" : `❌ Noto'g'ri. To'g'ri javob: ${q.options[q.answer]}`}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={next} style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(249,115,22,0.4)", background: "rgba(249,115,22,0.10)", color: "#f97316", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Keyingi savol →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CARDS TAB ─────────────────────────────── */
function CardsTab({ savedPhrases, onToggleSave }) {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setDeck([...savedPhrases].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false);
  }, [savedPhrases]);

  const card = deck[idx];
  const prog = deck.length ? ((idx + 1) / deck.length) * 100 : 0;

  const rate = (r) => {
    if (r === "easy" && card) {
      const learned = lsGet("col_learned", []);
      if (!learned.includes(card.phrase)) { lsSet("col_learned", [...learned, card.phrase]); }
    }
    setFlipped(false);
    setTimeout(() => setIdx(i => (i + 1) % Math.max(deck.length, 1)), 120);
  };

  const shuffle = () => {
    setDeck([...savedPhrases].sort(() => Math.random() - 0.5));
    setIdx(0); setFlipped(false);
  };

  return (
    <div>
      <SecHeader icon="🃏" title="Flashcards" sub="Saqlangan so'zlarni kartochkada o'rganing" from="#22c55e" to="#14b8a6" ibg="rgba(34,197,94,0.12)" ib="rgba(34,197,94,0.3)" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {/* Progress */}
        <div style={{ width: "100%", maxWidth: 500, height: 4, background: "#26264a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${prog}%`, height: "100%", background: "linear-gradient(90deg,#22c55e,#14b8a6)", transition: "width .4s ease" }} />
        </div>
        <div style={{ fontSize: 11, color: "#64648a", fontFamily: "DM Mono,monospace" }}>{deck.length ? `${idx + 1} / ${deck.length}` : "0 / 0"}</div>

        {/* Card */}
        <div onClick={() => deck.length && setFlipped(f => !f)} style={{ width: "100%", maxWidth: 500, height: 300, cursor: deck.length ? "pointer" : "default", perspective: 1000 }}>
          <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform .55s cubic-bezier(.4,0,.2,1)", transform: flipped ? "rotateY(180deg)" : "none" }}>
            {/* Front */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, backfaceVisibility: "hidden", background: "#1a1a2e", border: "1px solid #26264a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64648a", marginBottom: 14, fontFamily: "DM Mono,monospace" }}>English Collocation</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, background: "linear-gradient(135deg,#e8e8f0,#a0a0d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
                {card ? card.phrase : "So'z yo'q"}
              </div>
              <div style={{ fontSize: 12, color: "#64648a", fontStyle: "italic" }}>{card ? "" : "⭐ So'zlarni saqlang"}</div>
              <div style={{ position: "absolute", bottom: 12, fontSize: 10, color: "#44446a" }}>👆 Bosib ta'rifni ko'ring</div>
            </div>
            {/* Back */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, backfaceVisibility: "hidden", background: "linear-gradient(135deg,rgba(34,197,94,0.09),rgba(20,184,166,0.06))", border: "1px solid rgba(34,197,94,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 26, textAlign: "center", transform: "rotateY(180deg)" }}>
              {card && <>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64648a", marginBottom: 10, fontFamily: "DM Mono,monospace" }}>🇬🇧 English Definition</div>
                <div style={{ fontSize: 14, color: "#e8e8f0", lineHeight: 1.6, marginBottom: 10 }}>{card.en}</div>
                <Divider />
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#64648a", marginTop: 8, marginBottom: 6, fontFamily: "DM Mono,monospace" }}>🇺🇿 O'zbekcha</div>
                <div style={{ fontSize: 13, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.5, marginBottom: 10 }}>{card.uz}</div>
                <button onClick={(e) => { e.stopPropagation(); speak(card.phrase); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(56,189,248,0.35)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🔊 Listen</button>
              </>}
              <div style={{ position: "absolute", bottom: 12, fontSize: 10, color: "#44446a" }}>👆 Orqaga</div>
            </div>
          </div>
        </div>

        {/* Rate buttons */}
        {flipped && deck.length > 0 && (
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 500 }}>
            {[
              { id: "hard", e: "😓", l: "Qiyin", bg: "rgba(248,113,113,0.10)", b: "rgba(248,113,113,0.35)", c: "#f87171" },
              { id: "medium", e: "🤔", l: "Ok", bg: "rgba(234,179,8,0.10)", b: "rgba(234,179,8,0.35)", c: "#eab308" },
              { id: "easy", e: "✅", l: "Oson", bg: "rgba(34,197,94,0.10)", b: "rgba(34,197,94,0.35)", c: "#22c55e" },
            ].map(b => (
              <button key={b.id} onClick={() => rate(b.id)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${b.b}`, background: b.bg, color: b.c, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                {b.e} {b.l}
              </button>
            ))}
          </div>
        )}

        {!deck.length && (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#64648a", fontSize: 13 }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>⭐</div>
            Vocabulary bo'limidan so'zlarni ⭐ bilan saqlang
          </div>
        )}

        <button onClick={shuffle} style={{ padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.10)", color: "#22c55e", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          🔄 Return Back
        </button>
      </div>
    </div>
  );
}

/* ─── SAVED TAB ─────────────────────────────── */
function SavedTab({ savedPhrases, onToggleSave }) {
  const [search, setSearch] = useState("");
  const learnedSet = new Set(lsGet("col_learned", []));
  const filtered = savedPhrases.filter(p =>
    p.phrase.toLowerCase().includes(search.toLowerCase()) ||
    p.en.toLowerCase().includes(search.toLowerCase())
  );
  const exportWords = () => {
    const txt = savedPhrases.map(p => `${p.phrase}\nEN: ${p.en}\nUZ: ${p.uz}\n`).join("\n---\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([txt], { type: "text/plain" })),
      download: "collocations.txt"
    });
    a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <SecHeader icon="⭐" title="Saqlangan" sub={savedPhrases.length ? `${savedPhrases.length} ta collocation saqlangan` : "Hali hech narsa saqlanmagan"} from="#38bdf8" to="#14b8a6" ibg="rgba(56,189,248,0.12)" ib="rgba(56,189,248,0.3)" />
        {savedPhrases.length > 0 && (
          <button onClick={exportWords} style={{ padding: "6px 12px", borderRadius: 9, border: "1px solid #26264a", background: "#13131f", color: "#e8e8f0", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>📤 Export</button>
        )}
      </div>

      {savedPhrases.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Qidirish..."
          style={{ width: "100%", padding: "9px 14px", borderRadius: 9, border: "1px solid #26264a", background: "#13131f", color: "#e8e8f0", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 14 }} />
      )}

      {!savedPhrases.length ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#64648a" }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 17, fontFamily: "'Playfair Display',serif", color: "#e8e8f0", marginBottom: 6 }}>Hech narsa yo'q</div>
          <div style={{ fontSize: 13 }}>Vocabulary bo'limidan ⭐ bosib saqlang</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {filtered.map((p, i) => {
            const col = CARD_COLORS[i % CARD_COLORS.length];
            const learned = learnedSet.has(p.phrase);
            return (
              <div key={p.phrase} style={{ background: "#1a1a2e", border: "1px solid #26264a", borderRadius: 12, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: col.acc }} />
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: col.acc, marginBottom: 5 }}>{p.phrase}</div>
                <div style={{ fontSize: 12, color: "#a0a0c0", lineHeight: 1.5, marginBottom: 6 }}>{p.en}</div>
                <div style={{ fontSize: 11, color: "#6ee7b7", fontStyle: "italic", lineHeight: 1.4, marginBottom: 10 }}>🇺🇿 {p.uz}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {learned && <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "DM Mono,monospace", background: "rgba(56,189,248,0.09)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>✅ learned</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => speak(p.phrase)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🔊</button>
                  <button onClick={() => onToggleSave(p)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #26264a", background: "transparent", color: "#64648a", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────── */
export default function CollApp() {
  const [tab, setTab] = useState("read");
  const [savedPhrases, setSavedPhrases] = useState(() => lsGet("col_saved", []));
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("col_last_visit");
    let s = parseInt(localStorage.getItem("col_streak") || "0");
    if (last !== today) {
      s = last === new Date(Date.now() - 86400000).toDateString() ? s + 1 : 1;
      localStorage.setItem("col_streak", String(s));
      localStorage.setItem("col_last_visit", today);
    }
    setStreak(s);
  }, []);

  const toggleSave = useCallback((entry) => {
    setSavedPhrases(prev => {
      const exists = prev.some(p => p.phrase.toLowerCase() === entry.phrase.toLowerCase());
      const updated = exists
        ? prev.filter(p => p.phrase.toLowerCase() !== entry.phrase.toLowerCase())
        : [...prev, entry];
      lsSet("col_saved", updated);
      return updated;
    });
  }, []);

  const learnedCount = lsGet("col_learned", []).length;
  const totalCollocations = ALL_LESSONS.reduce((s, ls) => s + ls.collocations.length, 0);

  const TABS = [
    { id: "read",   label: "📖 Reading"   },
    { id: "vocab",  label: "✨ Vocabulary"     },
    { id: "quiz",   label: "🧠 Quiz"      },
    { id: "cards",  label: "🃏 Cards"  },
    { id: "saved",  label: "⭐ Saved" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", color: "#e8e8f0", fontFamily: "'DM Sans',sans-serif" }}>
      {/* HEADER */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,13,20,0.97)", borderBottom: "1px solid #26264a", padding: "12px 16px 10px", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7c6af7,#f97316)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📘</div>
          <div>
            <GradText from="#a78bfa" to="#fb923c" size={14} serif>1000 English Collocations</GradText>
            <div style={{ fontSize: 10, color: "#64648a", textTransform: "uppercase", letterSpacing: "0.5px" }}>10 Minutes a Day · Lessons 1–30</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {[
            { dot: "#22c55e", label: `${savedPhrases.length} saved` },
            { dot: "#38bdf8", label: `${learnedCount} learned` },
            { dot: "#f97316", label: `${streak} day streak` },
            { dot: "#a78bfa", label: `${totalCollocations} collocations` },
          ].map(({ dot, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "#13131f", border: "1px solid #26264a", borderRadius: 20, fontSize: 11, fontFamily: "DM Mono,monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />{label}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 14px 50px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "#13131f", border: "1px solid #26264a", borderRadius: 12, padding: 3, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "9px 6px", borderRadius: 9, border: "none", background: tab === t.id ? "#1a1a2e" : "transparent", color: tab === t.id ? "#e8e8f0" : "#64648a", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", transition: "all .2s", boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,.4)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "read"  && <ReadTab  savedPhrases={savedPhrases} onToggleSave={toggleSave} />}
        {tab === "vocab" && <VocabTab savedPhrases={savedPhrases} onToggleSave={toggleSave} />}
        {tab === "quiz"  && <QuizTab />}
        {tab === "cards" && <CardsTab savedPhrases={savedPhrases} onToggleSave={toggleSave} />}
        {tab === "saved" && <SavedTab savedPhrases={savedPhrases} onToggleSave={toggleSave} />}
      </div>
    </div>
  );
}
