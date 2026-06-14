"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Founder } from "@/lib/kpi-engine";

const POLL_INTERVAL = 5000;
const SAVE_DEBOUNCE = 1000;

export function useSharedFounders() {
  const [founders, setFoundersLocal] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSavingState] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const savingLock = useRef(false);
  const lastFetchHash = useRef("");
  const currentFounders = useRef<Founder[]>([]);

  async function fetchFounders() {
    if (savingLock.current) return;
    try {
      const res = await fetch("/api/founders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const hash = JSON.stringify(data);
        if (hash !== lastFetchHash.current) {
          lastFetchHash.current = hash;
          setFoundersLocal(data);
          currentFounders.current = data;
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

  const persistToServer = useCallback(async (data: Founder[]) => {
    savingLock.current = true;
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
        lastFetchHash.current = JSON.stringify(data);
      }
    } catch {
      // will retry
    } finally {
      savingLock.current = false;
      setIsSavingState(false);
    }
  }, []);

  const setFounders = useCallback((newFounders: Founder[] | ((prev: Founder[]) => Founder[])) => {
    setFoundersLocal((prev) => {
      const resolved = typeof newFounders === "function" ? newFounders(prev) : newFounders;

      if (resolved.length === 0 && !hasLoaded.current) {
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

  const resetAll = useCallback(async () => {
    setFoundersLocal([]);
    currentFounders.current = [];
    lastFetchHash.current = JSON.stringify([]);
    savingLock.current = true;
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
      savingLock.current = false;
      setIsSavingState(false);
    }
  }, []);

  return { founders, setFounders, isLoading, isSaving, lastSaved, saveNow, resetAll };
}
