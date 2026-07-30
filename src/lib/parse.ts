/**
 * Turning what you wrote into notes.
 *
 * A blank line ends one note and starts the next, so a single note can run over
 * as many lines as it needs. The exception is a pasted list: when every line of
 * a block is bulleted, numbered or boxed, it was already a checklist and each
 * line becomes its own item with the marker stripped.
 */
const BULLET = /^\s*(?:[-*•+—–]|\d+[.)]|\(\d+\))\s+/;
const CHECKBOX = /^\s*\[[ xX]?\]\s*/;

function isListLine(line: string): boolean {
  return BULLET.test(line) || CHECKBOX.test(line);
}

export function cleanLine(line: string): string {
  // A line can carry both markers: "- [ ] buy milk".
  return line.trim().replace(BULLET, '').replace(CHECKBOX, '').trim();
}

/** Split what was written into the notes it should become, in written order. */
export function splitIntoNotes(raw: string): string[] {
  return raw
    .split(/\n\s*\n+/)
    .flatMap((block) => {
      const lines = block.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim());
      if (lines.length === 0) return [];

      if (lines.length > 1 && lines.every(isListLine)) return lines.map(cleanLine);

      // One note: strip a marker off the opening line, keep the rest as written.
      const [first, ...rest] = lines;
      return [[cleanLine(first), ...rest.map((line) => line.trim())].join('\n')];
    })
    .filter((note) => note.length > 0);
}

/** How many notes the current draft would produce — drives the writing hint. */
export function countNotes(raw: string): number {
  return splitIntoNotes(raw).length;
}
