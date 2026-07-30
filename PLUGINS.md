# Writing a Qwertzy plugin

A plugin is one file of JavaScript that calls `qwertzy.plugin()` once. Paste it into
**Settings → Plugins → Add a plugin**, or host it anywhere that serves raw text and add it from the
link. The same guide is in the app behind the **?** on the Plugins page.

## The shape of one

```js
qwertzy.plugin({
  name: 'Shouty',
  description: 'Writes everything in capitals',
  version: '1.0.0',

  // Called with what you wrote, before it becomes a note.
  // Return a string, a list of strings, or nothing to leave it alone.
  onCapture(text) {
    return text.toUpperCase();
  },
});
```

`name`, `description` and `version` are shown on the Plugins page. Everything else is optional.

## Hooks

### `onCapture(text) → string | string[] | null`

Runs on every note as it's written, before it's saved.

- Return a **string** to replace what was written.
- Return a **list of strings** and each entry becomes its own note.
- Return `null`, `undefined`, or anything else to leave the text alone.

```js
qwertzy.plugin({
  name: 'Packing list',
  description: 'Turns "pack: a, b, c" into one note each',
  version: '1.0.0',
  onCapture(text) {
    if (!text.startsWith('pack:')) return null; // not mine — leave it
    return text
      .slice(5)
      .split(',')
      .map((s) => 'Pack ' + s.trim());
  },
});
```

Several plugins run in the order they were installed, each seeing what the previous one returned.

### `commands: [{ id, label, run }]`

Commands appear as buttons on the Plugins page. Whatever `run()` returns is added as notes on this
month's page.

```js
qwertzy.plugin({
  name: 'Morning',
  description: 'Adds the morning routine',
  version: '1.0.0',
  commands: [
    {
      id: 'routine',
      label: 'Add morning routine',
      run: () => ['Make the bed', 'Stretch time(5m)', 'Read 10 pages'],
    },
  ],
});
```

Notes a plugin returns are ordinary notes, so `time(5m)` in one starts a timer exactly as if you had
typed it, and a note with a blank line in it splits the usual way.

## What a plugin can and can't reach

Plugins run in a **Web Worker**. It has no DOM, no access to the page, and no access to the
localStorage your notes live in. Before any plugin code is evaluated, the worker's bootstrap removes:

| Removed | Why |
| --- | --- |
| `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` | nothing can be sent anywhere |
| `importScripts` | no pulling in more code at runtime |
| `Worker`, `SharedWorker` | a nested worker would come with a fresh global and the network back |

They're removed with `Object.defineProperty` **and** deleted from the prototype chain — plain
assignment silently fails against these, which is worth knowing if you're checking the claim
yourself. `eval('fetch')` comes back `undefined` too.

Every call is raced against a ~1.5 second timeout. A plugin that hangs delays a single capture and
is then ignored; what you wrote is kept either way, and a plugin that throws or returns nothing
usable leaves your text untouched.

**Be clear about what that is: a barrier, not a proof.** It closes the routes a plugin would
actually use, but it isn't a formal sandbox, and a plugin is still someone else's code running on
your machine. Read the source before installing — every plugin has a **View source** button for
exactly that.

## Sharing one

A plugin is just a file. Put it on a gist, a repo, a pastebin — anything that serves the raw text —
and share the link. **Add from a link** fetches it, shows you the source, and installs it only when
you say so. The source is copied into your browser, so it keeps working if the link later dies.

If a fetch fails it's usually the host not allowing cross-origin reads; paste the source instead.
