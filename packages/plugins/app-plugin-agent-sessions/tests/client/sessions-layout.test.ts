import { describe, expect, it } from 'vitest';

import {
  breakpointOf,
  MIN_CONVERSATION_WIDTH,
  sessionsLayout,
} from '../../client/sessions-layout.js';

describe('My sessions layout', () => {
  it('adds the regions as the width grows: the conversation, then the list, then the details', () => {
    expect(breakpointOf(1279)).toBe('md');
    expect(breakpointOf(1280)).toBe('lg');
    expect(breakpointOf(1599)).toBe('lg');
    expect(breakpointOf(1600)).toBe('xl');
    expect(breakpointOf(1000)).toBe('md');
    expect(breakpointOf(1300)).toBe('lg');
    expect(breakpointOf(1700)).toBe('xl');
    expect(sessionsLayout(1700, {}, false)).toEqual({
      breakpoint: 'xl',
      list: 'column',
      detailsOpen: true,
      right: 'column',
    });
    expect(sessionsLayout(1000, {}, false)).toEqual({
      breakpoint: 'md',
      list: 'column',
      detailsOpen: true,
      right: 'column',
    });
    // 980 - 264 - 296 = 420: exactly where all three fit.
    expect(sessionsLayout(980, {}, false)).toMatchObject({
      list: 'column',
      detailsOpen: true,
      right: 'column',
    });
    // Just below it the list keeps its place and the details wait.
    expect(sessionsLayout(979, {}, false)).toMatchObject({
      list: 'column',
      detailsOpen: false,
    });
    expect(sessionsLayout(900, {}, false)).toEqual({
      breakpoint: 'md',
      list: 'column',
      detailsOpen: false,
      right: 'column',
    });
    // 684 - 264 = 420: exactly where the list fits beside the conversation.
    expect(sessionsLayout(684, {}, false)).toMatchObject({
      list: 'column',
      detailsOpen: false,
    });
    expect(sessionsLayout(683, {}, false)).toMatchObject({
      list: 'rail',
      detailsOpen: false,
    });
    // Folding the list by hand leaves the details as they were: it does not open them.
    expect(sessionsLayout(900, { list: 'folded' }, false)).toMatchObject({
      list: 'rail',
      detailsOpen: false,
    });
    // With the list kept unfolded by hand, the details open only where they fit beside it too.
    expect(sessionsLayout(900, { list: 'unfolded' }, false)).toMatchObject({
      list: 'column',
      detailsOpen: false,
    });
    expect(sessionsLayout(1000, { details: 'closed' }, false)).toMatchObject({
      list: 'column',
      detailsOpen: false,
    });
  });

  it('folds the list by default when a right panel leaves the conversation too narrow', () => {
    // 900 - 264 - 296 < 420: the list folds, the details stay beside the conversation.
    expect(sessionsLayout(900, { details: 'open' }, false)).toMatchObject({
      list: 'rail',
      right: 'column',
    });
    // A task is wider: past the rail it still does not fit, so it covers the conversation.
    expect(sessionsLayout(900, {}, true)).toMatchObject({
      list: 'rail',
      right: 'sheet',
    });
  });

  it('keeps the person’s choice, giving way so the conversation never drops below its minimum', () => {
    const unfolded = sessionsLayout(
      900,
      { list: 'unfolded', details: 'open' },
      false,
    );
    // The list stays a column; the details become a sheet instead of squeezing the conversation.
    expect(unfolded).toMatchObject({ list: 'column', right: 'sheet' });
    expect(900 - 264).toBeGreaterThanOrEqual(MIN_CONVERSATION_WIDTH);
    // Too narrow even for the list alone: it unfolds over the conversation.
    expect(sessionsLayout(600, { list: 'unfolded' }, false)).toMatchObject({
      list: 'overlay',
    });
    // Folded by hand where it would fit: stays folded.
    expect(sessionsLayout(1700, { list: 'folded' }, false)).toMatchObject({
      list: 'rail',
    });
    // Details closed by hand at the widest breakpoint.
    expect(sessionsLayout(1700, { details: 'closed' }, false)).toMatchObject({
      detailsOpen: false,
    });
  });

  it('never leaves the conversation narrower than its minimum beside the columns', () => {
    for (const width of [
      768, 900, 1024, 1180, 1279, 1280, 1440, 1599, 1600, 1680,
    ])
      for (const choice of [
        {},
        { list: 'unfolded' as const },
        { details: 'open' as const },
        { list: 'unfolded' as const, details: 'open' as const },
      ])
        for (const task of [false, true]) {
          const layout = sessionsLayout(width, choice, task);
          const list =
            layout.list === 'column' ? 264 : layout.list === 'rail' ? 48 : 48;
          const right =
            layout.right === 'sheet'
              ? 0
              : task
                ? 500
                : layout.detailsOpen
                  ? 296
                  : 0;
          expect(width - list - right).toBeGreaterThanOrEqual(
            MIN_CONVERSATION_WIDTH,
          );
        }
  });
});
