import React from 'react';
import { buildColors, Colors } from '../constants/tokens';
import type { PaletteName } from '../constants/tokens';

type ThemeColors = typeof Colors;

const ThemeContext = React.createContext<ThemeColors>(Colors);

export function ThemeProvider({ palette, children }: { palette: PaletteName; children: React.ReactNode }) {
  const colors = React.useMemo(() => buildColors(palette), [palette]);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return React.useContext(ThemeContext);
}
