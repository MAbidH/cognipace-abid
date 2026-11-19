/* THE WINTER SCHOOL AGREEMENT (3 Nov 2026, Abid: stricter rules from December). The rules are read and signed by HER,
   in her own words, before winter school (4 Dec) - people keep the rules they chose. Abid edits the list here; a new
   VERSION asks her to read and sign again. */
export const AGREEMENT_VERSION = "winter-2026";
export const AGREEMENT_TITLE = "My winter school - the rules we agree on";
export const HER_RULES = [
  "I start every school day with Start school, at my desk, on a chair - not on the bed.",
  "Both hands on the keyboard, eyes on the screen. Slow and right first, then fast.",
  "The warm-up comes first: six minutes of typing and my Python line. Quick maths and the key move are extras.",
  "Maths every day, in my first lesson block - and on winter days 25 minutes of my Grade 8 maths book on paper.",
  "Every 25 minutes I take the one-minute movement break: stand up, drink water, stretch, look far away.",
  "Mom may check now and then that I am at my desk with both hands. That is part of the deal, not a punishment.",
  "Recess is mine. I end every day with End school.",
  "On winter days my goal is 4 hours, in blocks, with recess and time outside. If I am in the middle of something I can go on, up to 6 - that is my choice.",
  "After 9:30 at night the tutor asks if I want to finish or stop. School closes at 11:30 at night.",
  "I can pause school for a day when I am sick, tired, or with family - I tell Mom or Abid, and I lose nothing.",
  "If the hours feel too much, we change them together.",
  "If something is too hard or not working, I say it - to the tutor, on my voice page, or to Abid. Saying it is not giving up.",
];
export const ABID_PROMISES = [
  "Abid celebrates every real step - and you show the family something you built.",
  "Abid delivers every reward on time, as promised on the rewards page.",
  "Abid has a call with you every week to see how it is going.",
  "Abid reads your voice page and changes the plan when something is not working.",
  "Nothing you have earned is ever taken away.",
];
export const MIN_WORDS = 12;
export function cleanAgreement(text) {
  const t = String(text || "").replace(/\r\n?/g, "\n").trim().slice(0, 1500);
  return t.split(/\s+/).filter(Boolean).length >= MIN_WORDS ? t : null;
}
