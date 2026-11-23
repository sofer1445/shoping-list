// Keep authentication usable in browsers that block persistent storage.
export const createSafeAuthStorage = () => {
  const memory = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      try { return localStorage.getItem(key); } catch { return memory.get(key) ?? null; }
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
      try { localStorage.setItem(key, value); } catch { /* current page session only */ }
    },
    removeItem(key: string) {
      memory.delete(key);
      try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    },
  };
};