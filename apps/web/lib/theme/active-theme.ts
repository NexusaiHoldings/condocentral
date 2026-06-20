/**
 * active-theme — the resolved ThemeContract this company wears.
 * Written by provisioning (_step_substrate_install): an approved mood
 * board's derived theme wins, else the CMO's authored ThemeContract
 * (company-theme-authoring-001 / visual phase 3b). Do NOT hand-edit.
 */
import type { ThemeContract } from "./contract";

export const activeTheme: ThemeContract = {
  "type": {
    "fontBody": "system-sans",
    "fontHeading": "source-serif"
  },
  "color": {
    "bg": "#ffffff",
    "text": "#1a2332",
    "accent": "#1e3a5f",
    "border": "#dde3ec",
    "danger": "#a32d2d",
    "success": "#1a5e3a",
    "surface": "#f5f7fa",
    "textMuted": "#52637a",
    "accentText": "#ffffff",
    "surfaceAlt": "#edf0f5",
    "borderStrong": "#b8c4d4"
  },
  "shape": {
    "radius": 6
  }
};
