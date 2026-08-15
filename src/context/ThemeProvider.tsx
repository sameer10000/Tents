import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext } from './theme'
import type { Theme } from './theme'

function initialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  // index.html resolves this before first paint — read it back rather than
  // recomputing, so React never disagrees with the DOM.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Private browsing — the class on <html> is still correct for this session.
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}
