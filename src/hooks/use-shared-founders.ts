"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Founder } from "@/lib/kpi-engine";

const POLL_INTERVAL = 3000;

export function useSharedFounders() {
  const [founders, setFoundersLocal] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchFounders() {
    try {
      const res = await fetch("/api/founders");
      if (res.ok) {
        const data = await res.json();
        setFoundersLocal(data);
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

  const setFounders = useCallback((newFounders: Founder[]) => {
    setFoundersLocal(newFounders);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/founders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newFounders),
        });
        if (res.ok) {
          const data = await res.json();
          setLastSaved(data.updatedAt);
        }
      } catch {
        // will retry on next save
      }
    }, 300);
  }, []);

  const resetAll = useCallback(async () => {
    setFoundersLocal([]);
    try {
      await fetch("/api/founders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      });
      setLastSaved(new Date().toISOString());
    } catch {
      // ignore
    }
  }, []);

  return { founders, setFounders, isLoading, lastSaved, resetAll };
}
