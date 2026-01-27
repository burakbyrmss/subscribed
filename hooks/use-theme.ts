import { getAllSettings, getCurrentDateTime, saveSetting } from "@/database";
import { reloadAppAsync } from "expo";
import { useCallback, useEffect, useState } from "react";
import { Appearance } from "react-native";

export type Theme = "light" | "dark";

export function getOsTheme(): Theme {
  return Appearance.getColorScheme() === "light" ? "light" : "dark";
}

async function getThemeFromStorage(): Promise<Theme> {
  const settings = await getAllSettings();
  const themeSetting = settings.find((s) => s.key === "theme");
  const value = themeSetting?.value;
  if (value === "light" || value === "dark") return value;
  return getOsTheme();
}

const listeners = new Set<(t: Theme) => void>();
let currentTheme: Theme = getOsTheme();
let loaded = false;

function setStoredTheme(newTheme: Theme): void {
  currentTheme = newTheme;
  loaded = true;
  listeners.forEach((fn) => fn(currentTheme));
}

export async function loadThemeFromStorage(): Promise<Theme> {
  const t = await getThemeFromStorage();
  setStoredTheme(t);
  return t;
}

export async function setThemeAndSave(newTheme: Theme): Promise<void> {
  currentTheme = newTheme;
  loaded = true;
  listeners.forEach((fn) => fn(currentTheme));
  await saveSetting({
    key: "theme",
    value: newTheme,
    updated_at: getCurrentDateTime(),
  }).catch((e) => console.error("Failed to save theme:", e));
}

export function subscribeToTheme(fn: (theme: Theme) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
} {
  const [state, setState] = useState<Theme>(currentTheme);
  const [isLoading, setIsLoading] = useState(!loaded);

  useEffect(() => {
    const unsubscribe = subscribeToTheme(setState);
    if (!loaded) {
      loadThemeFromStorage().then((t) => {
        setState(t);
        setIsLoading(false);
      });
    }
    return unsubscribe;
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeAndSave(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = state === "dark" ? "light" : "dark";
    setThemeAndSave(next).then(() => reloadAppAsync());
  }, [state]);

  return { theme: state, setTheme, toggleTheme, isLoading };
}
