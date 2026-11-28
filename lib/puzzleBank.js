/* The Saturday puzzle bank for the app (25 Nov 2026): curriculum/reasoning.json, cleaned by lib/puzzles.js. Kept apart
   from the pure helpers so the plain-node test can import those without a JSON import. */
import bank from "../curriculum/reasoning.json";
import { cleanBank } from "./puzzles";
export const PUZZLE_ITEMS = cleanBank(bank);
