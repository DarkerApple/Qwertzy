# Qwertzy

Catch a thought, get a checklist.

Qwertzy is a web app for the thoughts that arrive at the wrong moment. You type one in, it becomes a
checkbox. If it turns out to be an idea rather than a task, you open a thread on it and keep
thinking. Each month is a single page you keep adding to, and you move between months with tabs or a
swipe.

Everything is stored in your browser's `localStorage`. No account, no server, no sync.

## The four ideas

**You just write.** There's no composer, no send button, no "new note" to press first — the last
line of the page is a live caret. `Enter` breaks the line, so a thought can run as long as it wants;
`Enter` twice ends that thought and starts the next, the way a blank line separates them on paper.
Whatever you've written is saved when you look away, so nothing is ever lost mid-sentence.

**Notes are already a checklist.** Every thought you finish is a checkbox; that's the automatic part.
Paste a bulleted list and each line becomes its own item, with leading bullets, numbers and `[ ]`
boxes stripped, in the order you wrote them.

**Ideas get threads.** Tapping any line opens its thread, where you can elaborate over time. When
the thinking produces an actual next step, one tap promotes that message into its own checklist item,
labelled with the thought it came from.

**A month is one page.** Not cards in a feed and not a stack of small notes — one continuous sheet,
headed by the month, its note count and a completion percentage. There are no day headings: every
line carries its own small grey time in the right margin, with the date underneath it only when that
line wasn't written today. A change of day just gets a little more air.

**Timers are something you write.** Put `time(10m)` in a note and it becomes a live clock, right
where you typed it, counting down and chiming when it's up.

## Navigating

Qwertzy opens on a contents page: every year you've written in, as a grid of months, with a note
count and a progress bar on each. Months you haven't written in aren't pages, so they sit greyed out
and don't invite a click. Above the years is the month you're in, and below them are the guide and
the secret notebook.

Inside a notebook, month tabs sit under the header, oldest on the left, each badged with how many
items are still open. The active tab always scrolls itself into view, and **Years** in the header
goes back to the contents page.

Routes live in the URL hash — `#/`, `#/m/2026-07`, `#/guide`, `#/secret` — so browser back and
forward retrace your steps and a reload lands where you were. Flicking between months replaces the
entry rather than stacking one per month.

| Move | How |
| --- | --- |
| Change month | Tap a tab, swipe the page left/right, or `←` / `→` |
| Filter the page | **All** / **To do** / **Done** on the sheet |
| Search every month | The 🔍 button, or `/` |
| Jump to the writing line | `N` (or `C`), or tap the empty page below the last note |
| Finish a note | `Enter` twice, `Ctrl`/`⌘`+`Enter`, or just look away |
| Start a timer | Write `time(10m)` in the note |
| Close a thread or search | `Esc` |

Writing always belongs to today, so older months are read-only pages with a `Write on July 2026's
page →` link at the bottom; `N` from anywhere takes you to the same place.

## Timers

Write the timer into the sentence and it starts when you finish the note:

```
Steep the tea time(3m, green tea) then take it off the heat
Bake the bread time(25m)
Stand up and stretch time(1h30m)
```

| Form | Means |
| --- | --- |
| `time(90)` | 90 seconds — a bare number is seconds |
| `time(90s)` `time(10m)` `time(2h)` | with a unit |
| `time(1h30m)` | combined units |
| `time(2:30)` | `mm:ss`, or `h:mm:ss` |
| `time(10m, steep)` | a label, used as the notification's title |

`timer(...)` works the same. Anything unreadable — `time(soon)` — is left alone as ordinary text.

The chip fills as the countdown drains, so a glance down the page shows how far along you are.
Click it to pause and resume, or reset it; when it's up it says **time's up** and clicking restarts
it. When one finishes you get a system notification (permission is asked once, on the keystroke that
starts your first timer), a two-note chime, and a banner in the app — so a blocked or muted
notification still reaches you.

Timers store an absolute end time, so a running one survives a reload and keeps the right time. They
only ring while the page is open, though: this app has no background worker, and a timer that
expired while the tab was closed is shown as finished rather than announced hours late.

## Using a line

Tap the text to open its thread. Inside are **Edit note**, **Delete** and **Close** — no action
depends on hovering, which is what makes the same layout work on a phone. Pointer users also get a
hover delete on the row and double-click to edit.

Deleting is undoable for 8 seconds. The ⋮ menu clears completed items and exports or imports a JSON
backup — worth doing occasionally, since clearing site data clears notes.

## Secret notes

A second notebook behind a password. Inside, it is the everyday notebook — same month pages, same
writing line, same timers, threads and search — over different storage.

The password is the key, not a curtain. Notes are encrypted with **AES-GCM** under a key derived by
**PBKDF2** (SHA-256, 310,000 iterations, random 16-byte salt), and only ciphertext is written to
disk: `{ salt, iv, data }` and nothing else. A fresh nonce is generated on every save.

Consequences worth stating plainly:

- Nothing derived from the password is stored, so **there is no reset**. A forgotten password means
  those notes are gone; the lock screen can delete them so you can start over, and that's all.
- A wrong password fails authentication rather than returning garbage, so "wrong password" is a real
  answer rather than a guess.
- The key is held in memory only. Reload the page, and it's locked again — as is the **Lock**
  button in the header.
- The ⋮ menu offers no export inside it, since that would write the notes to disk in the clear.
- Web Crypto needs a secure context, so this works over https or on localhost. The gate says so
  rather than pretending to encrypt.

What it is not: protection against someone who already controls your browser or machine. It keeps
secret notes out of a shoulder-surf, a shared laptop, or a casual look through localStorage.

## Mobile

Built for a phone first: 44px touch targets around every control, 16px inputs so iOS never zooms on
focus, horizontal swipe between months (ignored when the gesture is really a scroll), sticky day
headings, the writing line scrolled clear of a rising keyboard, and no horizontal page scroll at any
width.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
```

## Deploying

`.github/workflows/deploy.yml` builds the app on every branch and publishes to GitHub Pages from the
repo's **default branch**. One-time setup: **Settings → Pages → Source = GitHub Actions**. The
workflow passes `BASE_PATH=/<repo>/` so assets resolve on a project site.

The deploy job is skipped on other branches deliberately. The `github-pages` environment only
accepts deployments from the default branch, and a deploy from anywhere else is rejected before the
job is given a runner — it fails in about a second with no logs, which looks like a broken workflow
but is a branch policy. So: to publish a branch, make it the default (Settings → Branches) or merge
it into the default one.

## How it's built

React 18 + TypeScript + Vite + Tailwind. No state library, no UI kit, no icon package — two runtime
dependencies in total.

```
src/
  App.tsx              the shell: routes, theme, and who holds the vault key
  types.ts             Item + Reply + NoteTimer
  hooks/useNotebook.ts every mutation, written back through a storage adapter
  hooks/useRoute.ts    the current hash route
  hooks/useTheme.ts    light/dark, applied pre-paint in index.html
  lib/route.ts         four routes, parsed and built
  lib/vault.ts         PBKDF2 + AES-GCM behind the same storage interface
  lib/parse.ts         what you wrote -> notes (blank line splits, lists split)
  lib/group.ts         month summaries, page order, filtering, search
  lib/time.ts          month/day keys and the short margin stamps
  lib/timer.ts         time(...) tokens, durations, countdown formatting
  lib/notify.ts        permission, system notification, chime
  lib/storage.ts       the storage interface, plus export/import and validation
  components/
    Home.tsx           the contents page: years, months, guide, secret notes
    Guide.tsx          how it works, in four steps
    Notebook.tsx       a whole notebook — used for both the everyday and secret one
    VaultGate.tsx      set a password, or enter it
    MonthTabs.tsx      the navigation
    MonthNote.tsx      the month sheet: title, progress, the page itself
    NoteRow.tsx        one line + its expanded panel
    NoteText.tsx       note text with time(...) swapped for live clocks
    TimerChip.tsx      the clock: countdown, fill, play/pause/reset
    InlineComposer.tsx the live last line of the page
    QuartzMark.tsx     the crystal, in the header and the favicon
    Thread.tsx         elaboration, and promoting a message to an item
    FilterTabs, SearchBar, EmptyState, UndoToast, TimerToast, Menu, icons
```

Notes live under `qwertzy.v1`, and are read from the older `listify.v1` key when that's all that's
there — GitHub Pages serves every project site from one origin, so notes written before the rename
are still in the same localStorage and carry over on first load. The old entry is read, not moved,
so an older build still opens its own data.

A notebook is a screen over a `NotebookStorage` — `{ load, save }`. The everyday notes use
localStorage directly and the secret ones encrypt on the way through, which is why one component
serves both and neither knows the difference.

Surfaces are CSS variables (`--paper`, `--card`, `--line`, `--row`), so light and dark are one
definition rather than two sets of classes. Stored data is validated field-by-field when read, so a
corrupt or hand-edited `localStorage` entry degrades to an empty list instead of a blank screen.
