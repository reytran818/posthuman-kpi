"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Founder } from "@/lib/kpi-engine";

const SAVE_DEBOUNCE = 3000;

export function useSharedFounders() {
  const [founders, setFoundersLocal] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSavingState] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const currentFounders = useRef<Founder[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/founders?t=" + Date.now(), { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          hasLoaded.current = true;
          currentFounders.current = data;
          setFoundersLocal(data);
        }
      } catch {
        // network error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const persistToServer = useCallback(async (data: Founder[]) => {
    if (!hasLoaded.current) return;
    if (data.length === 0) return;
    setIsSavingState(true);
    try {
      const res = await fetch("/api/founders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setLastSaved(result.updatedAt);
      }
    } catch {
      // will retry on next change
    } finally {
      setIsSavingState(false);
    }
  }, []);

  const setFounders = useCallback((newFounders: Founder[] | ((prev: Founder[]) => Founder[])) => {
    setFoundersLocal((prev) => {
      const resolved = typeof newFounders === "function" ? newFounders(prev) : newFounders;

      if (!hasLoaded.current && resolved.length === 0) {
        return prev;
      }

      currentFounders.current = resolved;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        persistToServer(resolved);
      }, SAVE_DEBOUNCE);

      return resolved;
    });
  }, [persistToServer]);

  const saveNow = useCallback(async () => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    await persistToServer(currentFounders.current);
  }, [persistToServer]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/founders?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        currentFounders.current = data;
        setFoundersLocal(data);
      }
    } catch {
      // keep local state
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetAll = useCallback(async () => {
    setFoundersLocal([]);
    currentFounders.current = [];
    setIsSavingState(true);
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
      setIsSavingState(false);
    }
  }, []);

  return { founders, setFounders, isLoading, isSaving, lastSaved, saveNow, refresh, resetAll };
}
