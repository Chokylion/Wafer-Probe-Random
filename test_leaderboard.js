// ponytail: runnable check for the vote-tally logic. Helpers MUST stay identical
// to the ones inlined in index.html. Run: node test_leaderboard.js
const assert = require('assert');

// ---- helpers (keep identical to index.html) ----
const B_SEP = /(?:[\u00A0\uFFFD]\s*){2,}|\s{4,}/;
function bSplit(raw){
  let s = String(raw == null ? '' : raw).replace(/\r/g, ' ');
  let proj, people = '';
  const m = s.match(B_SEP);
  if (m) { proj = s.slice(0, m.index); people = s.slice(m.index + m[0].length); }
  else { let ci = s.search(/:\s/); if (ci < 0) ci = s.indexOf(':'); if (ci >= 0) { proj = s.slice(0, ci); people = s.slice(ci + 1); } else proj = s; }
  proj = proj.replace(/[\u00A0\uFFFD]/g, ' ').replace(/\s+/g, ' ').replace(/[\s:]+$/, '').trim();
  people = people.replace(/[\u00A0\uFFFD]/g, ' ').replace(/^[\s:]+|[\s:]+$/g, '').trim();
  return { proj, people };
}
function bMembers(p){ return p.split(/[,\/]/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean); }
function bCellParts(cell){
  // ponytail: one respondent can cheer many teams. Forms packs multi-pick as a
  // JSON array OR one cell joined by ; or newline. Member lists use , and /, so
  // teams split ONLY on ; / newline (never comma) to avoid eating member names.
  let s = String(cell == null ? '' : cell).trim();
  if (!s) return [];
  let arr;
  if (s[0] === '[') { try { arr = JSON.parse(s); } catch (e) { arr = [s]; } }
  else arr = [s];
  const opts = [];
  for (const a of arr) String(a).split(/[;\n]+/).forEach(x => { if (x.trim()) opts.push(x); });
  return opts.map(bSplit).filter(p => p.proj);
}
function bTally(rows, col){
  const map = new Map();
  for (const r of rows) for (const part of bCellParts(r[col])) {
    let e = map.get(part.proj);
    if (!e) { e = { name: part.proj, votes: 0, members: [] }; map.set(part.proj, e); }
    e.votes++;
    const mem = bMembers(part.people);
    if (mem.length > e.members.length) e.members = mem;
  }
  return [...map.values()].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}

// ---- NEW colon format (the three real cells the user pasted) ----
const c1 = 'Reduce Step for Recording and Create "Final Test Information Sheet" for Set New Standard to Record Data: Nattida J. / Natnicha S., Saowaros P./ Jumpa P., Wilailuk C. / Kullachat C., Pimnapa Y.';
const c2 = 'Reduce Setup Time on MT9928 by optimize KGU Generation process: Narathip C./Poonnavit D./Rudee H./, Wiratchanee P./Wilailuk C./Nichapat A.';
const c3 = 'Reduce number of sample reel: Pathomthorn Kamwong, Waraporn Nuesa-ard';

let p = bSplit(c1);
assert.strictEqual(p.proj, 'Reduce Step for Recording and Create "Final Test Information Sheet" for Set New Standard to Record Data', 'c1 project keeps quotes, drops trailing colon');
assert.deepStrictEqual(bMembers(p.people), ['Nattida J.', 'Natnicha S.', 'Saowaros P.', 'Jumpa P.', 'Wilailuk C.', 'Kullachat C.', 'Pimnapa Y.'], 'c1 members split on , and /');

p = bSplit(c2);
assert.strictEqual(p.proj, 'Reduce Setup Time on MT9928 by optimize KGU Generation process', 'c2 project');
assert.deepStrictEqual(bMembers(p.people), ['Narathip C.', 'Poonnavit D.', 'Rudee H.', 'Wiratchanee P.', 'Wilailuk C.', 'Nichapat A.'], 'c2 "/," empty entry dropped');

p = bSplit(c3);
assert.strictEqual(p.proj, 'Reduce number of sample reel', 'c3 project');
assert.deepStrictEqual(bMembers(p.people), ['Pathomthorn Kamwong', 'Waraporn Nuesa-ard'], 'c3 members');

// glued colon inside a title must NOT split (no following space):
assert.strictEqual(bSplit('Improvement on HT9046 with DOT400:B2L1: Phannakhom T., Chiraporn N.').proj,
  'Improvement on HT9046 with DOT400:B2L1', 'split on first ": " not glued colon');

// ---- tally: c2 appears twice -> 2 votes, members preserved ----
const rows = [{ v: c1 }, { v: c2 }, { v: c3 }, { v: c2 }, { v: '' }, { v: '   ' }];
const board = bTally(rows, 'v');
assert.strictEqual(board.length, 3, '3 distinct projects (blanks ignored)');
assert.strictEqual(board[0].name, 'Reduce Setup Time on MT9928 by optimize KGU Generation process', 'MT9928 top');
assert.strictEqual(board[0].votes, 2, 'MT9928 = 2');
assert.ok(board.every(b => !/[\u00A0\uFFFD:]\s*$/.test(b.name)), 'no trailing colon/gap leaks');

// ---- OLD NBSP format still works (backward compat) ----
const NB = '\u00A0';
const oldCell = 'HS97 resolved disabled site Bin77 ReadOnlyRegCheck.' + (NB + ' ').repeat(20) + 'Supphanut Sirikun, Kritwara Wawilai';
assert.strictEqual(bSplit(oldCell).proj, 'HS97 resolved disabled site Bin77 ReadOnlyRegCheck.', 'old NBSP gap still splits');
// embedded single NBSP inside an old-format name stays:
assert.strictEqual(bSplit('Yield DP25Y' + NB + 'and test program' + (NB + ' ').repeat(20) + 'A, B').proj,
  'Yield DP25Y and test program', 'single embedded NBSP kept');
// JSON multi-pick array still expands:
assert.strictEqual(bCellParts('["Proj A: X, Y","Proj B: Z"]').length, 2, 'JSON array = 2 picks');

// ---- one respondent, MANY teams in a single cell ----
// Forms joins multi-select with ; (or a newline). Commas/slashes stay member separators.
const multi = c3 + ';' + c2;                 // one person cheered two teams
let parts = bCellParts(multi);
assert.strictEqual(parts.length, 2, 'one cell, two teams -> 2 parts');
assert.strictEqual(parts[0].proj, 'Reduce number of sample reel', 'multi part0 project');
assert.strictEqual(parts[1].proj, 'Reduce Setup Time on MT9928 by optimize KGU Generation process', 'multi part1 project');
assert.deepStrictEqual(bMembers(parts[0].people), ['Pathomthorn Kamwong', 'Waraporn Nuesa-ard'], 'commas NOT eaten by team-split');
assert.strictEqual(bCellParts(c3 + '\n' + c1).length, 2, 'newline also splits teams');
// votes count per team, but the respondent is counted once:
const rows2 = [{ v: multi }, { v: c1 }];
assert.strictEqual(bTally(rows2, 'v').reduce((s, x) => s + x.votes, 0), 3, 'multi(2) + 1 = 3 total votes');
assert.strictEqual(rows2.filter(r => bCellParts(r.v).length).length, 2, 'still 2 respondents');

console.log('OK — all parser checks passed');
console.log(board.map((b, i) => `${i + 1}. [${b.votes}] ${b.name}\n      members: ${b.members.join(', ')}`).join('\n'));
