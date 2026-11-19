/* The student profile (19 Nov 2026): one codebase, two instances. Faiza's instance ships curriculum/student.json as
   written; Abid's own instance (cognipace-abid) ships its own student.json (mode "adult", America/St_Johns). The code
   asks this module - never the file - so a profile change is one file, not forty. In child mode nothing here changes a
   single byte of what the app did before this module existed. */
import profile from "../curriculum/student.json";

export const STUDENT = Object.freeze({
  name: profile.name || "Faiza",
  guardian: profile.guardian || "Abid",
  mode: profile.mode === "adult" ? "adult" : "child",
  timezone: profile.timezone || "Asia/Dhaka",
  home: profile.home || "Dhaka",
  pronoun: profile.pronoun || "she",
  english: profile.english || "B1",
  siteName: profile.siteName || "CogniPace",
  // Second instance only: the day the Python line starts (first completion in this module) and the map from the
  // line bank's module ids (lib/codelines.js `needs`) to this curriculum's module ids. Faiza's instance leaves both out.
  codeLineStart: profile.codeLineStart || null,
  codeLineModules: profile.codeLineModules || null,
});

/** Adult mode (Abid's instance): no night stop, no exam mode, no XP ladder prizes, no desk check / key move / quick
    maths; the warm-up keeps the Python line and the review. Child mode is Faiza's instance exactly as before. */
export const isAdult = () => STUDENT.mode === "adult";
