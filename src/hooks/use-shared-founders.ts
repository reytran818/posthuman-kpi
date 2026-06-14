"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Founder } from "@/lib/kpi-engine";

const POLL_INTERVAL = 5000;
const SAVE_DEBOUNCE = 1000;

export function useSharedFounders() {
  const [founders, setFoundersLocal] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const isSaving = useRef(false);
  const lastFetchHash = useRef("");

  async function fetchFounders() {
    if (isSaving.current) return;
    try {
      const res = await fetch("/api/founders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const hash = JSON.stringify(data);
        if (hash !== lastFetchHash.current) {
          lastFetchHash.current = hash;
          setFoundersLocal(data);
        }
        if (!hasLoaded.current) {
          hasLoaded.current = true;
        }
      }
    } catch {
      // network error, keep local state
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFounders();
    const interval = setInterval(fetchFounders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const setFounders = useCallback((newFounders: Founder[] | ((prev: Founder[]) => Founder[])) => {
    setFoundersLocal((prev) => {
      const resolved = typeof newFounders === "function" ? newFounders(prev) : newFounders;

      // Don't save empty arrays unless explicitly resetting
      if (resolved.length === 0 && !hasLoaded.current) {
        return prev;
      }

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        isSaving.current = true;
        try {
          const res = await fetch("/api/founders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resolved),
          });
          if (res.ok) {
            const data = await res.json();
            setLastSaved(data.updatedAt);
            lastFetchHash.current = JSON.stringify(resolved);
          }
        } catch {
          // will retry on next save
        } finally {
          isSaving.current = false;
        }
      }, SAVE_DEBOUNCE);

      return resolved;
    });
  }, []);

  const resetAll = useCallback(async () => {
    setFoundersLocal([]);
    lastFetchHash.current = JSON.stringify([]);
    isSaving.current = true;
    try {
      await fetch("/api/founders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-confirm-reset": "true",
        },
        body: JSON.stringify([]),
      });
      setLastSaved(new Date().toISOString());
    } catch {
      // ignore
    } finally {
      isSaving.current = false;
    }
  }, []);

  return { founders, setFounders, isLoading, lastSaved, resetAll };
}
