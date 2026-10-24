// dexsins Delluna config — loaded right after delluna.js.
// Same global default as dekxitty ('plasma'); the menu button uses 'og' like
// dekxitty's topbar icons, so it stays crisp at 24px.
if (window.Delluna) {
  window.Delluna.configure({
    variant: 'og',
    icons: {
      'menu-right': { variant: 'og' },
      x: { variant: 'og' },
      bug_report: { variant: 'hud' }
    }
  });
}
