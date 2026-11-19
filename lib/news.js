/* This week in the cyber world (3 Nov 2026): curriculum/news.json, newest first. */
import data from "../curriculum/news.json";

export const NEWS = (data.items || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
export const NEWS_MADE = data.made || null;
export const newsVideoUrl = (id) => (/^[A-Za-z0-9_-]{6,20}$/.test(String(id || "")) ? `https://www.youtube-nocookie.com/embed/${id}` : null);
