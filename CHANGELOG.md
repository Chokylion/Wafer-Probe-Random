# Changelog

## 2026-06-22 (6) — "Which dept joined the most" mini-dashboard

### Added — compact department strip on the 🏆 leaderboard page
- New strip above the vote list counts rows by the **department column** chosen
  in ⚙️ ตั้งค่า (one row = one respondent → participation per dept).
- Top 8 departments shown as ranked chips with mini bars; #1 highlighted gold.
  Many depts scroll horizontally — no vertical growth, stays in one viewport.
- Auto-refreshes with the board; hidden when no file / no dept column; cleared
  on reset and on paste-list (pasted names have no department).

Verified: `deptTally` counts, trims whitespace, skips blanks, sorts by count
then name; page script syntax OK.

---

## 2026-06-22 (5) — Multi-team voting (one person, many teams)

### Changed — a single cell can now hold several teams
- `bCellParts` splits one respondent's cell into multiple team picks when joined
  by **`;` or newline** (Microsoft Forms multi-select packing). Members still
  split on `,` and `/`, so commas in names are never mistaken for team breaks.
- Each picked team counts as **+1 vote**; the respondent is still counted once,
  so "โหวตทั้งหมด" can exceed "ผู้ตอบ" (board note already explains this).
- JSON-array multi-pick + old NBSP + colon single-team formats all still work.

Verified: `node test_leaderboard.js` — `;`-joined and newline-joined multi-team
cells parse to separate teams, member commas preserved, respondent counted once.

> ceiling: a literal `;` inside a project *title* would mis-split. Hasn't
> appeared in real data; swap to a rarer delimiter if it ever does.

---

## 2026-06-22 (4) — New "project: people" colon format

### Changed — parser handles the new delimiter
- New cell format is **`<project>: <people>`** (colon). Split happens on the
  **first `": "`** so a glued colon inside a title (`DOT400:B2L1`) stays with the
  project; a trailing colon is stripped.
- People still split on **both `,` and `/`**; `/,` and empty entries dropped.
- **Backward compatible**: old NBSP-gap exports and JSON multi-pick arrays still
  parse (format auto-detected per cell).

Verified: `node test_leaderboard.js` — the three real sample cells parse to the
correct project names + member lists; MT9928 (appearing twice) = 2 votes.

---

## 2026-06-22 (3) — Parser fix + member names + clearer counts

### The "doesn't make sense" was real-data confusion + one parser bug
- **Counts are correct** (verified): file now has **16 respondents → 18 selections → 10 projects**. One respondent cheered for **3 teams** (stored as a JSON array: Stuck-Up + MT9928 + Reduce sample reel), so total votes (18) > respondents (16). MT9928 = rows 1,5,8,12 = **4** votes.
- **Added a note** on the board so this is obvious: *“หนึ่งคนเชียร์ได้หลายทีม — โหวตทั้งหมดจึงมากกว่าผู้ตอบได้”*, plus a **ผู้ตอบ** stat next to **โหวตทั้งหมด**.

### Fixed — project name truncation
- Old split cut the name at the **first** NBSP. Two projects ("Yield Improvement DP25Y…") contain an **embedded single NBSP** (`…kelvin pins⍽and implement test program…`), so the name was chopped mid-sentence.
- New separator = a **run of 2+ NBSP** (or 4+ spaces) — the real project↔members gap. Single embedded NBSPs stay. Full names now display.

### Added — member names per project
- Each board row now lists the **people in that project** (👥 line under the name).
- Members are cleaned: split on `,` and `/`, empty entries dropped, whitespace collapsed, NBSP stripped. The most complete list across duplicate rows is kept.

### Other
- Vote-column auto-detect now prefers the real Thai header **ทีมที่คุณมาเชียร์** (the new .xlsx export has proper Thai), falling back to content detection.

Verified: `node test_leaderboard.js` → 16 respondents, 18 selections, 10 projects, all member lists populated, names untruncated.

---

## 2026-06-22 (2) — Leaderboard now reads the file loaded in Settings

### Changed
- **One upload, not two.** Removed the leaderboard's separate "โหลดไฟล์โหวต"
  button. The board now counts from the **same file loaded in ⚙️ ตั้งค่า**.
- **Vote-column picker in Settings** — new "คอลัมน์โหวต" dropdown next to the
  name/department selectors. Auto-selects the vote column (by content), and the
  board updates live when you change it. This was the cause of "count not match":
  the file loaded in Settings never fed the board.
- **Transparent stats** — board header now shows **ผู้ตอบ** (respondents) ·
  **โหวตทั้งหมด** (selections) · **โปรเจกต์**. Totals differ when someone cheers
  for several teams: in the sample file 11 respondents cast 13 selections (one
  person picked 3 teams), so total votes = 13, not 11. This is correct.

### Note — why Thai shows as "?"
The CSV was saved in a non-Unicode (ANSI/Latin-1) encoding that can't store Thai,
so every Thai character was replaced by a literal `?` at save time (74 `?` bytes,
zero UTF-8 Thai bytes in the file). It is not a display bug and cannot be decoded
back. Fix: re-export from Excel as **"CSV UTF-8 (Comma delimited)"** or use the
**.xlsx** export from Forms. (English project names were unaffected, so counts
are still correct.)

---

## 2026-06-22 — Added Leaderboard (Popular Vote) page

### New
- **🏆 ลีดเดอร์บอร์ด page** — a third page next to หมุนสุ่ม and ตั้งค่า.
  Counts votes per project from the **"ทีมที่คุณมาเชียร์"** column and shows a
  ranked board with vote bars, total-votes and project-count stats.
- **Upload from the board** — 📂 โหลดไฟล์โหวต button + drag-and-drop onto the
  list. Reads `.csv / .xlsx / .xls` via the bundled SheetJS.
- **`test_leaderboard.js`** — runnable check of the counting logic against the
  real form export (`node test_leaderboard.js`).

### How the counting works
- **Project name only.** Each answer is `"<project name>` + a big NBSP gap +
  `<member names>"`. The name is taken as the text **before the first NBSP gap**
  (split on `NBSP / � / 2+ spaces`), so members are dropped. Single spaces inside
  a name are kept.
- **Multi-votes.** Cells that are a JSON array (`["projA…","projB…"]`, when a
  person cheers for several teams) are split and each project counted once.
- **Column auto-detect.** The Thai header decodes to `?` in this export, so the
  vote column is found by content (JSON array / NBSP gap), falling back to the
  last column — no manual picking needed.
- Results are tallied (COUNTIF-style), sorted high→low; top 3 get gold/silver/
  bronze styling.

### Files changed
- `index.html` — nav button, `#page-board` markup, leaderboard CSS, tally +
  render JS. Existing gacha/settings pages untouched.
- `test_leaderboard.js` — new.

Verified: `node test_leaderboard.js` → 9 projects, 13 total votes.
