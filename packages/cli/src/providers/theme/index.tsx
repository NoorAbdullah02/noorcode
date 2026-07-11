import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { ThemeColors, Theme } from "../../theme";
import { DEFAULT_THEME, THEMES } from "../../theme";

const CONFIG_DIR = join(homedir(), ".noorcode");
const THEME_PREFERENCES_PATH = join(CONFIG_DIR, "preferences.json");

// On Windows, terminals often only support 16 ANSI colors. Any hex color gets
// quantized to the nearest ANSI slot, causing surface colors (slightly lighter
// than background) to map to bright gray (slot 7/8), creating ugly gray boxes.
// We detect this at startup and let every component skip surface backgrounds.
const IS_WIN32 = process.platform === "win32";

type ThemePreferences = {
  themeName: string;
};

function getInitialTheme(): Theme {
  try {
    const preferences = JSON.parse(
      readFileSync(THEME_PREFERENCES_PATH, "utf8"),
    ) as Partial<ThemePreferences>;
    const savedTheme = THEMES.find((theme) => theme.name === preferences.themeName);
    return savedTheme ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function persistTheme(theme: Theme) {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(
      THEME_PREFERENCES_PATH,
      JSON.stringify({ themeName: theme.name } satisfies ThemePreferences, null, 2),
      "utf8",
    );
  } catch {
    // Ignore preference write failures so theme switching still works for this session.
  }
}

type ThemeContextValue = {
  colors: ThemeColors;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  /** True when running on Windows — use to skip surface backgroundColor props */
  isWin32: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return value;
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    persistTheme(theme);
  }, []);

  // On Windows, surface/dialogSurface map to the same ANSI slot as background
  // but sometimes render as a different (brighter) terminal color. Overriding
  // them to be identical to background prevents visible color differences when
  // the terminal quantizes hex values to the 16-color ANSI palette.
  const colors: ThemeColors = IS_WIN32
    ? {
        ...currentTheme.colors,
        surface: currentTheme.colors.background,
        dialogSurface: currentTheme.colors.background,
      }
    : currentTheme.colors;

  return (
    <ThemeContext.Provider 
      value={{ colors, currentTheme, setTheme, isWin32: IS_WIN32 }}>
      {children}
    </ThemeContext.Provider>
  );
}

