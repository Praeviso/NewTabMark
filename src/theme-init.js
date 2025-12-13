(() => {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      return;
    }

    const isSystemDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
  } catch {
    // Ignore (e.g., storage not available)
  }
})();

