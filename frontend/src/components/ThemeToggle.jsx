import { useTheme } from '../context/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      aria-label={isDark ? 'Usar modo claro' : 'Usar modo escuro'}
      title={isDark ? 'Usar modo claro' : 'Usar modo escuro'}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M20.4 14.4A8.5 8.5 0 0 1 9.6 3.6 8.5 8.5 0 1 0 20.4 14.4Z" />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle
