"use client";
/* The tutor's face (Abid, 5 Oct 2026: "give the AI tutor a face so it feels more lively to her").
   An original little lab robot drawn in SVG, in the room's palette. It blinks on its own, looks around while it thinks,
   talks while the reply streams in, beams when a step lands, and tilts its head kindly when she is stuck.
   Moods: idle | thinking | talking | happy | puzzled | sleepy | drawing. Pure CSS animation; no library. */
import { createContext, useContext, useEffect, useState } from "react";

export const FaceMoodCtx = createContext(() => {});
export const useFaceMood = () => useContext(FaceMoodCtx);

export default function Face({ mood = "idle", size = 34, title = "the tutor", style }) {
  // A random blink rhythm so two faces on screen do not blink in step.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t;
    const loop = () => { t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 140); loop(); }, 2200 + Math.random() * 3200); };
    loop();
    return () => clearTimeout(t);
  }, []);
  const happy = mood === "happy", puzzled = mood === "puzzled", sleepy = mood === "sleepy", thinking = mood === "thinking", talking = mood === "talking", drawing = mood === "drawing";
  const eyeScale = blink || sleepy ? 0.12 : happy ? 0.55 : 1;
  const glow = happy ? "var(--lime)" : puzzled ? "var(--amber)" : thinking || talking ? "var(--cyan)" : sleepy ? "var(--ink-mute)" : "var(--cyan)";
  return (
    <svg className={`face face-${mood}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${title} - ${mood}`} style={{ ["--glow"]: glow, ...style }}>
      <defs>
        <linearGradient id="face-head" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2740" /><stop offset="1" stopColor="#101828" /></linearGradient>
      </defs>
      <g className="head" style={{ transformOrigin: "32px 40px", transform: puzzled ? "rotate(-8deg)" : "none", transition: "transform 300ms ease" }}>
        {/* antenna: the little light every page already knows from the brand dot */}
        <line x1="32" y1="6" x2="32" y2="13" stroke="var(--line-2)" strokeWidth="2.5" />
        <circle className="lamp" cx="32" cy="5" r="3.2" fill="var(--glow)" style={{ filter: "drop-shadow(0 0 4px var(--glow))" }} />
        {/* ears */}
        <rect x="6" y="28" width="5" height="12" rx="2" fill="#1b2740" stroke="var(--line-2)" />
        <rect x="53" y="28" width="5" height="12" rx="2" fill="#1b2740" stroke="var(--line-2)" />
        {/* head */}
        <rect x="10" y="13" width="44" height="42" rx="12" fill="url(#face-head)" stroke="var(--glow)" strokeWidth="1.6" style={{ transition: "stroke 300ms" }} />
        {/* screen */}
        <rect x="15" y="19" width="34" height="30" rx="8" fill="#070b12" />
        {/* eyes */}
        <g className="eyes" style={{ transformOrigin: "32px 31px", transition: "transform 250ms ease", transform: thinking ? "translate(2px,-1.5px)" : "none" }}>
          <g style={{ transformOrigin: "24px 31px", transform: `scaleY(${eyeScale})`, transition: "transform 120ms" }}>
            <circle cx="24" cy="31" r={happy ? 4.2 : 3.8} fill="var(--glow)" />
            {!happy && <circle cx="25" cy="30" r="1.1" fill="#070b12" />}
          </g>
          <g style={{ transformOrigin: "40px 31px", transform: `scaleY(${drawing ? 0.12 : eyeScale})`, transition: "transform 120ms" }}>
            <circle cx="40" cy="31" r={happy ? 4.2 : 3.8} fill="var(--glow)" />
            {!happy && !drawing && <circle cx="41" cy="30" r="1.1" fill="#070b12" />}
          </g>
          {/* one raised eyebrow: curious, never cross */}
          {puzzled && <path d="M36 23.5 Q40 20.5 44 22.5" stroke="var(--amber)" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
        </g>
        {/* cheeks */}
        {happy && <><circle cx="19.5" cy="38" r="2" fill="var(--rose)" opacity=".7" /><circle cx="44.5" cy="38" r="2" fill="var(--rose)" opacity=".7" /></>}
        {/* mouth */}
        {happy ? <path d="M24 40 Q32 47 40 40" stroke="var(--lime)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          : puzzled ? <path d="M26 42 Q32 39 38 42" stroke="var(--amber)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          : sleepy ? <path d="M27 42 L37 42" stroke="var(--ink-mute)" strokeWidth="2" strokeLinecap="round" />
          : <rect className={talking ? "mouth talk" : "mouth"} x="26" y="40" width="12" height="3.2" rx="1.6" fill="var(--glow)" style={{ transformOrigin: "32px 41.5px" }} />}
        {/* thinking dots float up from the screen */}
        {thinking && <g className="dots"><circle cx="46" cy="22" r="1.4" fill="var(--cyan)" /><circle cx="50" cy="18" r="1.8" fill="var(--cyan)" /><circle cx="55" cy="13" r="2.2" fill="var(--cyan)" /></g>}
        {/* a tiny pencil when drawing */}
        {drawing && <g transform="translate(44 44) rotate(-35)"><rect x="-2" y="-9" width="4" height="12" rx="1" fill="var(--amber)" /><path d="M-2 3 L0 7 L2 3 Z" fill="#f3d9a4" /></g>}
      </g>
    </svg>
  );
}

/* The strip under the room title: the face at a readable size and one short line about what it is doing. */
export function FaceStrip({ mood }) {
  const line = { idle: "ready", thinking: "thinking…", talking: "explaining", happy: "that landed!", puzzled: "let's look again, slowly", sleepy: "waiting for you", drawing: "drawing…" }[mood] || "";
  return (
    <div className="facestrip" title="Your tutor">
      <Face mood={mood} size={56} />
      <span className="small mute" aria-live="polite">{line}</span>
    </div>
  );
}
