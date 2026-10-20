// dexsins Delluna config — loaded right after delluna.js.
// Same global default as dekxitty ('plasma'); the menu button uses 'og' like
// dekxitty's topbar icons, so it stays crisp at 24px.
if (window.Delluna) {
  window.Delluna.configure({
    variant: 'plasma',
    icons: {
      'menu-right': { variant: 'og' },
      x: { variant: 'og' },
      tick: { variant: 'orbit' },
      expand_more: { variant: 'orbit' },
      arrow_forward: { variant: 'orbit' },
      arrow_back: { variant: 'orbit' },
      chev: { variant: 'orbit' },
      description: { variant: 'hud' },
      category: { variant: 'hud' },
      bug_report: { variant: 'hud' }
    }
  });
}
