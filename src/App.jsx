import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Replace these with your actual Supabase project values
const SUPABASE_URL = "https://zxbrdxulriozaqggelrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YnJkeHVscmlvemFxZ2dlbHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzgwNTYsImV4cCI6MjA4OTUxNDA1Nn0.FijPssPN-n-_b4rIM9uN6l0EDWS82o8WVUV2u-5H4oM";

async function insertWaitlistEntry(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.details || "Submission failed");
  }
  return true;
}

// ─── MIGRATION SQL (paste into Supabase SQL Editor) ───────────────────────────
// CREATE TABLE public.waitlist (
//   id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
//   name             text        NOT NULL,
//   email            text        NOT NULL UNIQUE,
//   age              int,
//   country          text        NOT NULL,
//   suggested_case   text,
//   created_at       timestamptz NOT NULL DEFAULT now()
// );
// ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Anyone can insert waitlist"
//   ON public.waitlist FOR INSERT WITH CHECK (true);
// No SELECT policy — only you (via service role) can read entries.

// ─── DATA ─────────────────────────────────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahrain","Bangladesh","Belgium","Bolivia","Bosnia and Herzegovina",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Ecuador",
  "Egypt","Estonia","Ethiopia","Finland","France","Georgia","Germany","Ghana",
  "Greece","Guatemala","Honduras","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
  "Kenya","Kuwait","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Malaysia",
  "Mexico","Moldova","Morocco","Myanmar","Nepal","Netherlands","New Zealand",
  "Nigeria","North Korea","Norway","Oman","Pakistan","Palestine","Panama","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia",
  "Senegal","Serbia","Singapore","Slovakia","Slovenia","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland",
  "Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zimbabwe","Other",
];

const FAMOUS_CASES = [
  "Jessica Lal Murder Case (India, 1999)",
  "Priyadarshini Mattoo Case (India, 1996)",
  "Sheena Bora Murder Case (India, 2015)",
  "Aarushi Talwar Murder Case (India, 2008)",
  "Nithari Serial Killings (India, 2006)",
  "Amanda Knox Trial (Italy, 2009)",
  "Nuremberg Trials (Germany, 1945)",
  "Nelson Mandela Rivonia Trial (S. Africa, 1964)",
  "Jodi Arias Trial (USA, 2013)",
  "Oscar Pistorius Trial (South Africa, 2014)",
];

const STATS = [
  { number: "10", label: "Cases at launch" },
  { number: "5",  label: "Free to play" },
  { number: "AI", label: "Judge scores every argument" },
  { number: "∞",  label: "Ways to argue a case" },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const Noise = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
    opacity: 0.6,
  }} />
);

const Gavel = ({ style = {} }) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 36, height: 36, ...style }}>
    <rect x="8" y="22" width="28" height="12" rx="3" fill="#b49650" opacity="0.9" transform="rotate(-45 22 28)" />
    <rect x="34" y="34" width="20" height="5" rx="2" fill="#7a5a30" transform="rotate(-45 44 36)" />
    <circle cx="12" cy="44" r="6" fill="#4a3010" opacity="0.4" />
  </svg>
);

const ScaleIcon = () => (
  <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 60 }}>
    <line x1="40" y1="8" x2="40" y2="52" stroke="#b49650" strokeWidth="1.5" />
    <line x1="10" y1="14" x2="70" y2="14" stroke="#b49650" strokeWidth="1.5" />
    <line x1="10" y1="14" x2="10" y2="28" stroke="#b49650" strokeWidth="1" strokeDasharray="2,2" />
    <line x1="70" y1="14" x2="70" y2="28" stroke="#b49650" strokeWidth="1" strokeDasharray="2,2" />
    <ellipse cx="10" cy="30" rx="10" ry="4" fill="#b49650" opacity="0.25" stroke="#b49650" strokeWidth="1" />
    <ellipse cx="70" cy="30" rx="10" ry="4" fill="#b49650" opacity="0.25" stroke="#b49650" strokeWidth="1" />
    <line x1="28" y1="52" x2="52" y2="52" stroke="#b49650" strokeWidth="2" />
    <circle cx="40" cy="8" r="3" fill="#b49650" />
  </svg>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", age: "", country: "", suggested_case: "",
  });
  const [errors,    setErrors]    = useState({});
  const [status,    setStatus]    = useState("idle"); // idle | submitting | success | error
  const [errorMsg,  setErrorMsg]  = useState("");
  const [visible,   setVisible]   = useState({});
  const formRef   = useRef(null);
  const heroRef   = useRef(null);
  const featRef   = useRef(null);
  const howRef    = useRef(null);

  // Intersection observer for scroll reveals
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.reveal]: true }));
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const validate = () => {
    const e = {};
    if (!formData.name.trim())    e.name    = "Required";
    if (!formData.email.trim())   e.email   = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    if (formData.age && (isNaN(formData.age) || +formData.age < 13 || +formData.age > 99)) e.age = "Enter a valid age";
    if (!formData.country)        e.country = "Required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("submitting");
    try {
      await insertWaitlistEntry({
        name:           formData.name.trim(),
        email:          formData.email.trim().toLowerCase(),
        age:            formData.age ? parseInt(formData.age) : null,
        country:        formData.country,
        suggested_case: formData.suggested_case.trim() || null,
      });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message.includes("unique") ? "This email is already on the waitlist." : err.message);
      setStatus("error");
    }
  };

  const set = (field) => (e) => {
    setFormData(d => ({ ...d, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }));
  };

  // ── Design tokens ──
  const F = {
    display: "'Playfair Display', Georgia, serif",
    mono:    "'Special Elite', 'Courier New', monospace",
    fell:    "'IM Fell English', Georgia, serif",
    body:    "'IM Fell English', Georgia, serif",
  };
  const C = {
    bg:       "#0e0b06",
    surface:  "#161008",
    parchment:"#f0e8d0",
    cream:    "#e8dfc0",
    gold:     "#b49650",
    lgold:    "#d4b870",
    dgold:    "#7a5a30",
    dim:      "#7a6a50",
    dimmer:   "#4a3a20",
    border:   "rgba(180,150,80,0.18)",
    red:      "#8b1a1a",
  };

  const revealStyle = (key, delay = 0, dir = "up") => ({
    opacity:    visible[key] ? 1 : 0,
    transform:  visible[key] ? "none" : dir === "up" ? "translateY(24px)" : dir === "left" ? "translateX(-24px)" : "translateX(24px)",
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <div style={{ background: C.bg, color: C.parchment, fontFamily: F.body, minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=IM+Fell+English:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.dgold}; border-radius: 3px; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes stampIn  { 0%{transform:scale(1.8) rotate(-12deg);opacity:0;} 60%{transform:scale(0.95) rotate(-3deg);opacity:1;} 100%{transform:scale(1) rotate(-2deg);opacity:1;} }
        @keyframes flicker  { 0%,100%{opacity:1;} 92%{opacity:1;} 93%{opacity:0.7;} 94%{opacity:1;} 97%{opacity:0.85;} 98%{opacity:1;} }
        @keyframes scanline { from{background-position:0 0;} to{background-position:0 100%;} }
        @keyframes underlineGrow { from{width:0;} to{width:100%;} }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes rotateSlow { from{transform:rotate(0);} to{transform:rotate(360deg);} }
        @keyframes successStamp { 0%{transform:scale(3) rotate(-20deg);opacity:0;} 50%{transform:scale(0.92) rotate(-5deg);opacity:1;} 70%{transform:scale(1.04) rotate(-3deg);} 100%{transform:scale(1) rotate(-3deg);opacity:1;} }

        .inp-field {
          background: rgba(240,232,208,0.05);
          border: 1px solid rgba(180,150,80,0.2);
          border-radius: 2px;
          color: ${C.parchment};
          padding: 12px 14px;
          width: 100%;
          font-family: ${F.fell};
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          line-height: 1.5;
        }
        .inp-field:focus {
          border-color: rgba(180,150,80,0.55);
          background: rgba(240,232,208,0.08);
        }
        .inp-field::placeholder { color: #5a4a30; font-style: italic; }
        .inp-field option { background: #161008; }
        .inp-error { border-color: rgba(180,60,60,0.6) !important; }

        .cta-btn {
          background: rgba(180,150,80,0.12);
          border: 1px solid ${C.gold};
          color: ${C.lgold};
          font-family: ${F.mono};
          font-size: 13px;
          letter-spacing: 0.08em;
          padding: 13px 32px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cta-btn:hover {
          background: rgba(180,150,80,0.22);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(180,150,80,0.15);
        }
        .cta-btn:active { transform: translateY(0); }
        .cta-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .feature-card:hover { border-color: rgba(180,150,80,0.35) !important; transform: translateY(-3px); }
        .feature-card { transition: all 0.25s ease; }

        .step-num {
          font-family: ${F.display};
          font-size: 56px;
          font-weight: 900;
          color: rgba(180,150,80,0.12);
          line-height: 1;
          position: absolute;
          top: -8px;
          left: 0;
        }

        .nav-link {
          font-family: ${F.mono};
          font-size: 11px;
          letter-spacing: 0.12em;
          color: ${C.dim};
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover { color: ${C.lgold}; }

        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(180,150,80,0.3), transparent);
        }

        .case-chip {
          font-family: ${F.mono};
          font-size: 10px;
          padding: 4px 10px;
          border: 1px solid rgba(180,150,80,0.2);
          border-radius: 2px;
          color: ${C.dim};
          cursor: pointer;
          transition: all 0.15s;
          display: inline-block;
        }
        .case-chip:hover {
          border-color: rgba(180,150,80,0.45);
          color: ${C.lgold};
          background: rgba(180,150,80,0.06);
        }

        @media (max-width: 768px) {
          .hero-title { font-size: clamp(32px,9vw,56px) !important; }
          .hero-grid  { grid-template-columns: 1fr !important; }
          .stats-row  { gap: 24px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .form-row   { grid-template-columns: 1fr !important; }
          .footer-inner { flex-direction: column !important; gap: 16px !important; text-align: center !important; }
        }
      `}</style>

      <Noise />

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: `1px solid ${C.border}`, background: "rgba(14,11,6,0.92)", backdropFilter: "blur(12px)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, display: "flex", alignItems: "center", gap: 10 }}>
          <ScaleIcon />
          <span style={{ animation: "flicker 8s infinite" }}>BECOME A LAWYER</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <span className="nav-link" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How It Works</span>
          <span className="nav-link" onClick={() => document.getElementById("cases")?.scrollIntoView({ behavior: "smooth" })}>Cases</span>
          <button className="cta-btn" style={{ padding: "7px 18px", fontSize: 11 }} onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}>
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 32px 80px", position: "relative", maxWidth: 1100, margin: "0 auto" }}>

        {/* Background decorative text */}
        <div style={{ position: "absolute", top: "18%", right: -20, fontSize: "clamp(80px,14vw,180px)", fontFamily: F.display, fontWeight: 900, color: "rgba(180,150,80,0.03)", lineHeight: 1, userSelect: "none", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
          ORDER<br />IN THE<br />COURT
        </div>

        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", width: "100%", position: "relative" }}>
          <div>
            {/* Eyebrow */}
            <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.22em", color: C.dim, marginBottom: 18, animation: "fadeUp 0.7s ease 0.1s both", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 1, background: C.dgold }} />
              NOW ACCEPTING APPLICATIONS
              <div style={{ width: 28, height: 1, background: C.dgold }} />
            </div>

            <h1 className="hero-title" style={{ fontSize: "clamp(40px,5vw,68px)", fontWeight: 900, lineHeight: 1.05, fontFamily: F.display, animation: "fadeUp 0.7s ease 0.2s both", marginBottom: 24 }}>
              <span style={{ color: C.lgold }}>You've always had</span><br />
              an opinion about<br />
              the verdict.
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.9, color: C.dim, fontFamily: F.fell, fontStyle: "italic", marginBottom: 32, maxWidth: 460, animation: "fadeUp 0.7s ease 0.35s both" }}>
              History's most famous trials. Your arguments. An AI judge that scores every word honestly — and opposing counsel that fights back.
            </p>

            <div style={{ animation: "fadeUp 0.7s ease 0.45s both", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <button className="cta-btn" style={{ fontSize: 13 }} onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}>
                Secure Your Place in the Courtroom →
              </button>
            </div>

            <div className="stats-row" style={{ display: "flex", gap: 36, marginTop: 48, flexWrap: "wrap", animation: "fadeUp 0.7s ease 0.55s both" }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{s.number}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.1em", color: C.dim, marginTop: 3 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — newspaper-style case card */}
          <div style={{ animation: "fadeUp 0.8s ease 0.4s both", position: "relative" }}>
            {/* Torn paper effect behind */}
            <div style={{ position: "absolute", inset: -12, background: "rgba(180,150,80,0.04)", border: `1px solid ${C.border}`, borderRadius: 3, transform: "rotate(2deg)" }} />
            <div style={{ position: "absolute", inset: -6, background: "rgba(180,150,80,0.04)", border: `1px solid ${C.border}`, borderRadius: 3, transform: "rotate(-1deg)" }} />

            <div style={{ background: "linear-gradient(150deg, #f5f0e0 0%, #e8e0c8 100%)", borderRadius: 3, padding: "32px 36px", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {/* Newspaper header */}
              <div style={{ textAlign: "center", borderBottom: "3px double #3a2010", paddingBottom: 14, marginBottom: 18 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em", color: "#5a4020", marginBottom: 6 }}>THE DAILY COURT REPORTER · SPECIAL EDITION</div>
                <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 900, color: "#1a1008", lineHeight: 1.1 }}>BECOME A LAWYER</div>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: "#7a5a30", marginTop: 4, letterSpacing: "0.12em" }}>
                  "WHERE EVERY ARGUMENT IS YOUR OWN"
                </div>
              </div>

              {/* Case headline */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: "#8b1a1a", letterSpacing: "0.14em", marginBottom: 6 }}>◆ THE TRIAL OF THE CENTURY ◆</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#1a1008", lineHeight: 1.2, marginBottom: 8 }}>O.J. Simpson Acquitted: Nation Divided as Jury Returns Verdict After 4 Hours</div>
                <p style={{ fontSize: 11, color: "#3a2010", lineHeight: 1.65, fontFamily: F.fell }}>
                  The defence argued evidence was planted. The prosecution presented DNA placing the defendant at the scene. The jury saw it differently. Could <em>you</em> have argued it better?
                </p>
              </div>

              {/* Exhibit pill */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {["USA · 1995", "Criminal", "Intermediate", "5 Rounds"].map((t, i) => (
                  <span key={i} style={{ fontFamily: F.mono, fontSize: 8, padding: "2px 7px", border: "1px solid rgba(90,60,20,0.3)", borderRadius: 2, color: "#5a4020", letterSpacing: "0.08em" }}>{t}</span>
                ))}
              </div>

              {/* Score preview */}
              <div style={{ background: "rgba(90,60,20,0.06)", border: "1px solid rgba(90,60,20,0.15)", borderRadius: 2, padding: "10px 14px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 8, color: "#8a6a40", letterSpacing: "0.14em", marginBottom: 6 }}>SAMPLE AI JUDGE FEEDBACK</div>
                <p style={{ fontSize: 11, color: "#3a2010", fontStyle: "italic", fontFamily: F.fell, lineHeight: 1.6 }}>
                  "Your use of the Fuhrman tapes is effective, but you fail to address how the DNA evidence — collected by three separate scientists — could all be contaminated. Opposing counsel will exploit this gap."
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  {[["Relevance", "16/20"], ["Legal Logic", "18/25"], ["Evidence", "14/20"]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontFamily: F.mono, fontSize: 8, color: "#8a6a40", marginBottom: 2 }}>{l}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#3a2010" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VERDICT stamp */}
              <div style={{ position: "absolute", top: 20, right: 20, fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "#1a5a1a", border: "2px solid #1a5a1a", padding: "3px 8px", borderRadius: 2, transform: "rotate(-8deg)", opacity: 0.75, letterSpacing: "0.1em", animation: "stampIn 1.2s ease 0.9s both" }}>
                NOT GUILTY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="divider-line" />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" ref={howRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 32px" }}>
        <div data-reveal="how-header" {...{}} style={{ marginBottom: 56, ...revealStyle("how-header") }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", color: C.dim, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: C.dgold }} />
            PROCEDURE
          </div>
          <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: C.parchment, lineHeight: 1.1 }}>
            How a Trial Works
          </h2>
        </div>

        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {[
            { n: "01", title: "Read the Dossier", body: "Every case comes with a complete case file — evidence, witness list, timeline of events, and legal framework. Study it like the trial starts tomorrow.", icon: "📋" },
            { n: "02", title: "Choose Your Side", body: "Play prosecution or defence. Each side comes with your role, your strongest angle, and your biggest challenge. There's no easy side.", icon: "⚖" },
            { n: "03", title: "Argue Five Rounds", body: "Opening statement. Key evidence. Rebuttal. Legal framework. Closing argument. An AI judge scores every round. Opposing counsel fights back.", icon: "🎙" },
          ].map((step, i) => (
            <div key={i} data-reveal={`step-${i}`} {...{}} style={{ position: "relative", paddingLeft: 28, ...revealStyle(`step-${i}`, i * 0.15) }}>
              <span className="step-num">{step.n}</span>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 28, marginBottom: 14, marginTop: 24 }}>{step.icon}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.parchment, marginBottom: 10, lineHeight: 1.2 }}>{step.title}</div>
                <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.8, fontFamily: F.fell }}>{step.body}</p>
              </div>
              {i < 2 && <div style={{ position: "absolute", top: 50, right: -20, color: C.dimmer, fontFamily: F.mono, fontSize: 18 }}>→</div>}
            </div>
          ))}
        </div>

        {/* Scoring rubric */}
        <div data-reveal="rubric" {...{}} style={{ marginTop: 72, ...revealStyle("rubric", 0.1) }}>
          <div style={{ background: "rgba(180,150,80,0.04)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "32px 36px" }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.16em", color: C.dim, marginBottom: 20 }}>THE SCORING RUBRIC</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Relevance",     max: 20, desc: "Does the argument address the actual legal question?" },
                { label: "Legal Logic",   max: 25, desc: "Is it coherent? Does it follow sound legal structure?" },
                { label: "Evidence Use",  max: 20, desc: "Does it reference specific facts, witnesses, exhibits?" },
                { label: "Persuasiveness",max: 20, desc: "Would a reasonable judge find this convincing?" },
                { label: "Counter-Arg",   max: 15, desc: "Does it rebut points raised in prior rounds?" },
              ].map((r, i) => (
                <div key={i} style={{ flex: "1 1 140px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 2, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: C.lgold, letterSpacing: "0.08em" }}>{r.label}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dim }}>{r.max} pts</div>
                  </div>
                  <p style={{ fontSize: 11, color: C.dim, fontFamily: F.fell, fontStyle: "italic", lineHeight: 1.5 }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="divider-line" />
      </div>

      {/* ── CASES ── */}
      <section id="cases" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 32px" }}>
        <div data-reveal="cases-header" {...{}} style={{ marginBottom: 48, ...revealStyle("cases-header") }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", color: C.dim, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: C.dgold }} />
            LAUNCH CASE LIBRARY
          </div>
          <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: C.parchment, lineHeight: 1.1, marginBottom: 12 }}>10 Cases at Launch</h2>
          <p style={{ fontFamily: F.fell, fontStyle: "italic", color: C.dim, fontSize: 14, maxWidth: 500 }}>Five free. Five premium. Every case selected for maximum legal ambiguity and genuine contestability.</p>
        </div>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { name: "O.J. Simpson Murder Trial",   type: "Criminal",      country: "USA",           year: 1995, tier: "free",    tagline: "The most debated acquittal in history" },
            { name: "Liebeck v. McDonald's",        type: "Civil",         country: "USA",           year: 1994, tier: "free",    tagline: "Everyone has an opinion — most are wrong" },
            { name: "State v. Casey Anthony",       type: "Criminal",      country: "USA",           year: 2011, tier: "free",    tagline: "The verdict that shocked the nation" },
            { name: "Lindy Chamberlain Trial",      type: "Criminal",      country: "Australia",     year: 1982, tier: "free",    tagline: "A dingo took my baby" },
            { name: "Brown v. Board of Education",  type: "Constitutional",country: "USA",           year: 1954, tier: "free",    tagline: "The case that ended separate but equal" },
            { name: "USA v. Elizabeth Holmes",      type: "Business",      country: "USA",           year: 2022, tier: "premium", tagline: "Silicon Valley fraud" },
            { name: "State v. Oscar Pistorius",     type: "Criminal",      country: "South Africa",  year: 2014, tier: "premium", tagline: "Intent vs accident" },
            { name: "The Dreyfus Affair",           type: "Historical",    country: "France",        year: 1894, tier: "premium", tagline: "Wrongful conviction driven by antisemitism" },
            { name: "Apple Inc. v. Samsung",        type: "IP / Business", country: "USA",           year: 2012, tier: "premium", tagline: "The billion-dollar patent war" },
            { name: "R v. Jeremy Bamber",           type: "Criminal",      country: "UK",            year: 1986, tier: "premium", tagline: "Did he do it? Still contested today" },
          ].map((c, i) => (
            <div key={i} className="feature-card" data-reveal={`case-${i}`} {...{}}
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "18px 20px", position: "relative", ...revealStyle(`case-${i}`, (i % 5) * 0.08) }}>
              {c.tier === "premium" && (
                <div style={{ position: "absolute", top: 10, right: 10, fontFamily: F.mono, fontSize: 8, padding: "2px 6px", border: `1px solid rgba(180,150,80,0.35)`, borderRadius: 2, color: C.gold, letterSpacing: "0.1em" }}>PREMIUM</div>
              )}
              <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.mono, fontSize: 8, padding: "1px 6px", border: `1px solid ${C.border}`, borderRadius: 2, color: C.dim }}>{c.type}</span>
                <span style={{ fontFamily: F.mono, fontSize: 8, padding: "1px 6px", border: `1px solid ${C.border}`, borderRadius: 2, color: C.dim }}>{c.country} · {c.year}</span>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 700, color: C.parchment, marginBottom: 5, lineHeight: 1.25 }}>{c.name}</div>
              <div style={{ fontFamily: F.fell, fontSize: 11, color: C.dim, fontStyle: "italic" }}>{c.tagline}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div className="divider-line" />
      </div>

      {/* ── WAITLIST FORM ── */}
      <section ref={formRef} style={{ maxWidth: 780, margin: "0 auto", padding: "100px 32px 80px" }}>
        <div data-reveal="form-header" {...{}} style={{ marginBottom: 48, ...revealStyle("form-header") }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", color: C.dim, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: C.dgold }} />
            THE WITNESS STAND
          </div>
          <h2 style={{ fontFamily: F.display, fontSize: "clamp(28px,4vw,52px)", fontWeight: 900, lineHeight: 1.08, color: C.parchment, marginBottom: 14 }}>
            The Courtroom<br />
            <span style={{ color: C.lgold }}>Is Almost in Session.</span>
          </h2>
          <p style={{ fontFamily: F.fell, fontStyle: "italic", color: C.dim, fontSize: 15, lineHeight: 1.85, maxWidth: 520 }}>
            Sign the register below to secure your place at the bar. Early applicants will receive priority access — and we want to hear which cases from your country should be in the dock.
          </p>
        </div>

        {status === "success" ? (
          // ── SUCCESS STATE ──
          <div data-reveal="success" {...{}} style={{ textAlign: "center", padding: "60px 40px", background: "rgba(180,150,80,0.04)", border: `1px solid rgba(180,150,80,0.2)`, borderRadius: 3, ...revealStyle("success") }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⚖</div>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 28 }}>
              <div style={{ fontFamily: F.display, fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: C.parchment, lineHeight: 1.1 }}>
                Your testimony<br />has been recorded.
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#1a5a1a", border: "2px solid #1a5a1a", padding: "4px 10px", borderRadius: 2, transform: "rotate(-3deg)", display: "inline-block", marginTop: 16, animation: "successStamp 0.7s ease both", letterSpacing: "0.1em" }}>
                ADMITTED TO RECORD
              </div>
            </div>
            <p style={{ fontFamily: F.fell, fontStyle: "italic", color: C.dim, fontSize: 14, lineHeight: 1.85, maxWidth: 420, margin: "0 auto 28px" }}>
              You'll be among the first through the courtroom doors. We'll be in touch when the trial begins.
            </p>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dimmer, letterSpacing: "0.1em" }}>
              — THE BENCH
            </div>
          </div>
        ) : (
          // ── FORM ──
          <form onSubmit={handleSubmit} data-reveal="form" {...{}} style={{ ...revealStyle("form", 0.1) }}>
            <div style={{ background: "rgba(240,232,208,0.03)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "40px 40px 36px" }}>

              {/* Decorative heading */}
              <div style={{ textAlign: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 20, marginBottom: 32 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.2em", color: C.dimmer, marginBottom: 6 }}>STATEMENT OF INTEREST</div>
                <div style={{ fontFamily: F.display, fontSize: 18, color: C.parchment, fontWeight: 700 }}>Early Access Registration</div>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.12em", color: C.dimmer, marginTop: 5 }}>All information is held in the strictest confidence of the court</div>
              </div>

              {/* Name + Email */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: C.dim, marginBottom: 7 }}>
                    FULL NAME <span style={{ color: C.red }}>*</span>
                  </label>
                  <input className={`inp-field${errors.name ? " inp-error" : ""}`} type="text" placeholder="As it would appear in court records" value={formData.name} onChange={set("name")} />
                  {errors.name && <div style={{ fontFamily: F.mono, fontSize: 9, color: "#c0504a", marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: C.dim, marginBottom: 7 }}>
                    EMAIL ADDRESS <span style={{ color: C.red }}>*</span>
                  </label>
                  <input className={`inp-field${errors.email ? " inp-error" : ""}`} type="email" placeholder="For official court correspondence" value={formData.email} onChange={set("email")} />
                  {errors.email && <div style={{ fontFamily: F.mono, fontSize: 9, color: "#c0504a", marginTop: 4 }}>{errors.email}</div>}
                </div>
              </div>

              {/* Age + Country */}
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 18 }}>
                <div>
                  <label style={{ display: "block", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: C.dim, marginBottom: 7 }}>
                    AGE
                  </label>
                  <input className={`inp-field${errors.age ? " inp-error" : ""}`} type="number" placeholder="Optional" min="13" max="99" value={formData.age} onChange={set("age")} />
                  {errors.age && <div style={{ fontFamily: F.mono, fontSize: 9, color: "#c0504a", marginTop: 4 }}>{errors.age}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: C.dim, marginBottom: 7 }}>
                    COUNTRY OF RESIDENCE <span style={{ color: C.red }}>*</span>
                  </label>
                  <select className={`inp-field${errors.country ? " inp-error" : ""}`} value={formData.country} onChange={set("country")}>
                    <option value="">Select your jurisdiction…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.country && <div style={{ fontFamily: F.mono, fontSize: 9, color: "#c0504a", marginTop: 4 }}>{errors.country}</div>}
                </div>
              </div>

              {/* Case suggestion */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em", color: C.dim, marginBottom: 7 }}>
                  SUGGEST A CASE FROM YOUR COUNTRY
                </label>
                <div style={{ fontFamily: F.fell, fontStyle: "italic", color: C.dimmer, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
                  Every country has a trial that everyone has an opinion about — the verdict that shocked the nation, the conviction people still debate, the case that defined a generation. What's yours?
                </div>
                <textarea
                  className="inp-field"
                  rows={4}
                  placeholder={`e.g. "The Aarushi Talwar murder case (India, 2008) — a double murder where the parents were convicted, but the case remains deeply contested. The forensic evidence was disputed and the investigation widely criticised…"`}
                  value={formData.suggested_case}
                  onChange={set("suggested_case")}
                  style={{ resize: "vertical" }}
                />

                {/* Case suggestion chips */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9, color: C.dimmer, marginBottom: 7, letterSpacing: "0.1em" }}>EXAMPLES FROM OTHER COUNTRIES:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {FAMOUS_CASES.map((c, i) => (
                      <span key={i} className="case-chip" onClick={() => setFormData(d => ({ ...d, suggested_case: c }))}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              {status === "error" && (
                <div style={{ background: "rgba(139,26,26,0.1)", border: "1px solid rgba(139,26,26,0.3)", borderRadius: 2, padding: "10px 14px", marginBottom: 16, fontFamily: F.fell, fontSize: 13, color: "#f87171" }}>
                  {errorMsg || "Something went wrong. Please try again."}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: C.dimmer, letterSpacing: "0.08em", maxWidth: 280, lineHeight: 1.6 }}>
                  By submitting you agree to receive one email about launch. No spam. No selling your data. Cancel anytime.
                </div>
                <button type="submit" className="cta-btn" disabled={status === "submitting"} style={{ fontSize: 13, padding: "13px 28px" }}>
                  {status === "submitting" ? (
                    <><div style={{ width: 14, height: 14, border: "2px solid rgba(180,150,80,0.3)", borderTop: "2px solid #b49650", borderRadius: "50%", animation: "rotateSlow 0.8s linear infinite" }} /> Filing Deposition…</>
                  ) : (
                    "Submit to the Court →"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="footer-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.dimmer, letterSpacing: "0.12em" }}>
            ⚖ BECOME A LAWYER
          </div>
          <div style={{ fontFamily: F.fell, fontSize: 12, color: C.dimmer, fontStyle: "italic" }}>
            The court is a place where facts meet argument. We provide both.
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.dimmer }}>
            © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
