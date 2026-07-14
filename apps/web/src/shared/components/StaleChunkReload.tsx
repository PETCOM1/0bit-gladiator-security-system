"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "gladiator_stale_chunk_reload";

/**
 * After a deploy, Vercel stops serving the previous build's JS chunks. Any
 * tab that's been open since before that deploy still references the old
 * chunk hashes, so the next client-side navigation that needs one fails to
 * load it entirely (a plain script-load error, not a caught exception).
 * Guards dashboards are realistically left open all day, so this reloads
 * once automatically to pick up the current build instead of leaving the
 * user stuck looking at a broken page.
 */
export function StaleChunkReload() {
  useEffect(() => {
    const handleScriptError = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName !== "SCRIPT") return;

      const src = (target as HTMLScriptElement).src || "";
      if (!src.includes("/_next/")) return;

      // Only auto-reload once per tab session to avoid a reload loop if
      // something else is genuinely, persistently broken.
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");

      window.location.reload();
    };

    // Script load failures fire as an "error" event on the element itself
    // and don't bubble, so this must listen on the capture phase.
    window.addEventListener("error", handleScriptError, true);
    return () => window.removeEventListener("error", handleScriptError, true);
  }, []);

  return null;
}
