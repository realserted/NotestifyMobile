import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? (dark as unknown as Theme) : light;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
