/** The writing-a-plugin guide, shown from the ? on the Plugins page. */
export function PluginGuide() {
  return (
    <div className="animate-slide-up surface hairline mt-3 rounded-2xl border p-4 sm:p-5">
      <h2 className="font-display text-[20px] tracking-tight">Writing a plugin</h2>
      <p className="muted mt-1.5 text-[13px] leading-relaxed">
        A plugin is one file of JavaScript that calls <Code>qwertzy.plugin()</Code> once. Paste it
        in and it runs from then on.
      </p>

      <Block title="The shape of one">
        <Pre>{`qwertzy.plugin({
  name: 'Shouty',
  description: 'Writes everything in capitals',
  version: '1.0.0',

  // Called with what you wrote, before it becomes a note.
  // Return a string, a list of strings, or nothing to leave it alone.
  onCapture(text) {
    return text.toUpperCase();
  },
});`}</Pre>
      </Block>

      <Block title="Splitting one note into several">
        <p className="muted mb-2 text-[13px] leading-relaxed">
          Return a list and each entry becomes its own note — the same as writing them out.
        </p>
        <Pre>{`qwertzy.plugin({
  name: 'Packing list',
  description: 'Turns "pack: a, b, c" into one note each',
  version: '1.0.0',
  onCapture(text) {
    if (!text.startsWith('pack:')) return null;      // not mine — leave it
    return text.slice(5).split(',').map((s) => 'Pack ' + s.trim());
  },
});`}</Pre>
      </Block>

      <Block title="Commands">
        <p className="muted mb-2 text-[13px] leading-relaxed">
          Commands appear as buttons on this page. Whatever they return is added as notes.
        </p>
        <Pre>{`qwertzy.plugin({
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
});`}</Pre>
        <p className="muted mt-2 text-[12px] leading-relaxed">
          Notes a plugin returns are ordinary notes, so <Code>time(5m)</Code> in one starts a timer
          just as if you'd typed it.
        </p>
      </Block>

      <Block title="What a plugin can and can't do">
        <ul className="muted space-y-1.5 text-[13px] leading-relaxed">
          <li>
            It runs in a <strong className="font-medium">Web Worker</strong>: no access to the page,
            the screen, or your saved notes.
          </li>
          <li>
            The network is taken away before it runs — <Code>fetch</Code>,{' '}
            <Code>XMLHttpRequest</Code>, <Code>WebSocket</Code>, <Code>EventSource</Code> and{' '}
            <Code>sendBeacon</Code> — along with <Code>importScripts</Code> and <Code>Worker</Code>,
            so it can't fetch more code or start a fresh worker to get them back.
          </li>
          <li>It sees only the text passed to a hook, and returns text back.</li>
          <li>
            Every call is given about a second and a half. A slow or stuck plugin delays one
            capture and is then ignored — your writing is kept either way.
          </li>
        </ul>
        <p className="muted mt-2 text-[12px] leading-relaxed">
          Be clear about what that is, though: a barrier, not a proof. It closes the doors a plugin
          would actually use, but it isn't a formal sandbox, and a plugin is still someone else's
          code running on your machine. Read the source before you install it — every plugin here
          has a <strong className="font-medium">View source</strong> button for exactly that.
        </p>
      </Block>

      <Block title="Sharing one">
        <p className="muted text-[13px] leading-relaxed">
          A plugin is just a file. Put it anywhere that serves raw text — a gist, a repo, a
          pastebin — and share the link. <strong className="font-medium">Add from a link</strong>{' '}
          fetches it, shows you the source, and installs it. The source is stored in your browser,
          so it keeps working if the link later dies.
        </p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-[14px] font-medium">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre
      className="hairline overflow-x-auto rounded-xl border p-3 text-[12px] leading-relaxed"
      style={{ backgroundColor: 'rgb(var(--row))' }}
    >
      <code>{children}</code>
    </pre>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="hairline surface rounded border px-1 py-0.5 text-[11px]">{children}</code>
  );
}
