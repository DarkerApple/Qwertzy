import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item, NoteTimer } from '../types';
import type { NotebookStorage } from '../lib/storage';
import { newId } from '../lib/id';
import { splitIntoNotes } from '../lib/parse';
import { findTimerTokens, remainingMs } from '../lib/timer';

export interface RemovedItem {
  item: Item;
  /** Where it sat in the array, so undo restores the original order. */
  index: number;
}

/**
 * Timers follow the text: one per `time(...)` token, in token order. Writing a
 * timer starts it — that's the whole point of writing it — and editing a note
 * keeps any timer whose duration didn't move.
 */
function timersFor(text: string, previous: NoteTimer[] = [], now = Date.now()): NoteTimer[] {
  return findTimerTokens(text).map((token, i) => {
    const existing = previous[i];
    if (existing && existing.seconds === token.seconds) {
      return { ...existing, label: token.label };
    }
    return {
      id: newId(),
      seconds: token.seconds,
      label: token.label,
      endsAt: now + token.seconds * 1000,
      remainingMs: token.seconds * 1000,
      state: 'running' as const,
    };
  });
}

/**
 * The whole data layer for one notebook. Items live in React state and are
 * written back through the storage it was given on every change — plain
 * localStorage for the everyday notes, encrypted for the secret ones.
 */
export function useNotebook(storage: NotebookStorage) {
  const [items, setItems] = useState<Item[]>(storage.load);
  const [lastRemoved, setLastRemoved] = useState<RemovedItem | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => {
    storage.save(items);
  }, [items, storage]);

  useEffect(() => () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
  }, []);

  /** Capture what was written. A blank line between thoughts splits them. */
  const capture = useCallback((raw: string, parentId: string | null = null): number => {
    const lines = splitIntoNotes(raw);
    if (lines.length === 0) return 0;
    const now = Date.now();
    const created: Item[] = lines.map((text, i) => ({
      id: newId(),
      text,
      // Stagger by a millisecond so a pasted list keeps the order it was typed
      // in once the page is sorted oldest-first.
      createdAt: now + i,
      done: false,
      doneAt: null,
      replies: [],
      parentId,
      timers: timersFor(text, [], now),
    }));
    setItems((prev) => [...created, ...prev]);
    return created.length;
  }, []);

  /**
   * Ticking a note off stops its clocks. A timer paces the thing you're doing;
   * once the thing is done, letting it run on to ring later is just noise. The
   * time left is kept, so un-ticking and pressing play resumes from where it
   * stopped rather than starting over.
   */
  const toggle = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const now = Date.now();
        const done = !item.done;
        return {
          ...item,
          done,
          doneAt: done ? now : null,
          timers: done
            ? item.timers.map((timer) =>
                timer.state === 'running'
                  ? {
                      ...timer,
                      state: 'paused' as const,
                      remainingMs: remainingMs(timer, now),
                      endsAt: null,
                    }
                  : timer,
              )
            : item.timers,
        };
      }),
    );
  }, []);

  const edit = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, text: trimmed, timers: timersFor(trimmed, item.timers) }
          : item,
      ),
    );
  }, []);

  const updateTimer = useCallback(
    (id: string, timerId: string, change: (timer: NoteTimer, now: number) => NoteTimer) => {
      const now = Date.now();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                timers: item.timers.map((timer) =>
                  timer.id === timerId ? change(timer, now) : timer,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  /** Play/pause. A finished timer restarts from the top. */
  const toggleTimer = useCallback(
    (id: string, timerId: string) => {
      updateTimer(id, timerId, (timer, now) => {
        if (timer.state === 'running') {
          return { ...timer, state: 'paused', remainingMs: remainingMs(timer, now), endsAt: null };
        }
        const left = timer.state === 'done' ? timer.seconds * 1000 : Math.max(1000, timer.remainingMs);
        return { ...timer, state: 'running', remainingMs: left, endsAt: now + left };
      });
    },
    [updateTimer],
  );

  const resetTimer = useCallback(
    (id: string, timerId: string) => {
      updateTimer(id, timerId, (timer) => ({
        ...timer,
        state: 'paused',
        remainingMs: timer.seconds * 1000,
        endsAt: null,
      }));
    },
    [updateTimer],
  );

  /** Called by the tick loop the moment a running timer reaches zero. */
  const finishTimer = useCallback(
    (id: string, timerId: string) => {
      updateTimer(id, timerId, (timer) => ({
        ...timer,
        state: 'done',
        remainingMs: 0,
        endsAt: null,
      }));
    },
    [updateTimer],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      setLastRemoved({ item: prev[index], index });
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setLastRemoved(null), 8000);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const undoRemove = useCallback(() => {
    setLastRemoved((removed) => {
      if (!removed) return null;
      setItems((prev) => {
        const next = [...prev];
        next.splice(Math.min(removed.index, next.length), 0, removed.item);
        return next;
      });
      return null;
    });
  }, []);

  const dismissUndo = useCallback(() => setLastRemoved(null), []);

  /** Add a message to an item's thread. */
  const reply = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message = { id: newId(), text: trimmed, createdAt: Date.now() };
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, replies: [...item.replies, message] } : item)),
    );
  }, []);

  const removeReply = useCallback((id: string, replyId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, replies: item.replies.filter((r) => r.id !== replyId) } : item,
      ),
    );
  }, []);

  /**
   * Promote a thread message to its own checklist item. Elaborating on an idea
   * usually surfaces the actual next step — this is how that step escapes the
   * thread without retyping it.
   */
  const promoteReply = useCallback((id: string, replyId: string) => {
    setItems((prev) => {
      const parent = prev.find((item) => item.id === id);
      const message = parent?.replies.find((r) => r.id === replyId);
      if (!parent || !message) return prev;
      const promoted: Item = {
        id: newId(),
        text: message.text,
        createdAt: Date.now(),
        done: false,
        doneAt: null,
        replies: [],
        parentId: parent.id,
        timers: timersFor(message.text),
      };
      return [
        promoted,
        ...prev.map((item) =>
          item.id === id ? { ...item, replies: item.replies.filter((r) => r.id !== replyId) } : item,
        ),
      ];
    });
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.done));
  }, []);

  const replaceAll = useCallback((next: Item[]) => {
    setItems(next);
  }, []);

  return {
    items,
    capture,
    toggle,
    edit,
    remove,
    lastRemoved,
    undoRemove,
    dismissUndo,
    reply,
    removeReply,
    promoteReply,
    toggleTimer,
    resetTimer,
    finishTimer,
    clearDone,
    replaceAll,
  };
}
