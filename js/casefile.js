// The case file: what Shiloh has pieced together, and where each house stands.
'use strict';

const CASE_PAGES = 2;
let casePage = 0,
  caseFrom = 'title';
function openCase() {
  caseFrom = mode;
  casePage = 0;
  mode = 'casefile';
}
function closeCase() {
  mode = caseFrom;
}
function houseMood(k) {
  const h = houses[k],
    M = TEXT.caseFile.mood;
  if (h.favor + h.fear + h.ruin === 0) return M.unaware;
  if (h.ruin >= 2) return M.ruined;
  if (h.fear > h.favor) return M.afraid;
  if (h.favor > h.fear) return M.owes;
  return M.watching;
}
function drawCaseFile() {
  const C = TEXT.caseFile;
  let lines;
  if (casePage === 0) {
    lines = C.clues.map(
      (clue, i) => LEVELS[i].name + ': ' + (stats.cleared.includes(i) ? clue : C.unknown)
    );
    if (stats.cleared.length === LEVELS.length) lines.push('', C.verdict);
  } else {
    lines = [];
    for (const k in HOUSE_NAMES) {
      const h = houses[k];
      lines.push(
        HOUSE_NAMES[k] + ': ' + houseMood(k) + ' (' + h.favor + '/' + h.fear + '/' + h.ruin + ')'
      );
    }
    lines.push('', C.stairsTitle);
    let any = false;
    for (let i = 1; i < LEVELS.length; i++) {
      if (perks[i] == null) continue;
      any = true;
      lines.push(LEVELS[i].name + ': ' + TEXT.stairs[i].options[perks[i]].short + '.');
    }
    if (!any) lines.push(C.unknown);
  }
  panel(C.title + '   ' + (casePage + 1) + ' / ' + CASE_PAGES, lines, C.foot);
}
