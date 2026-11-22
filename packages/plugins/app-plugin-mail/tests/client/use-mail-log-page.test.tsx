import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMailCursorLogPage } from '../../client/hooks/use-mail-log-page.js';
import type { MailPage } from '../../client/mail-client.js';

/** A newest-first log of numbered rows, paged by the last row's number as the settings logs page by time and id. */
function log(count: number) {
  const rows = Array.from({ length: count }, (_, index) => count - index);
  return {
    rows,
    add: () => rows.unshift(rows[0] + 1),
    load: async (
      pageToken: string | undefined,
      pageSize: number,
    ): Promise<MailPage<number>> => {
      const after = pageToken === undefined ? Infinity : Number(pageToken);
      const rest = rows.filter((row) => row < after);
      const items = rest.slice(0, pageSize);
      return {
        items,
        total: rows.length,
        ...(rest.length > pageSize ? { nextCursor: String(items.at(-1)) } : {}),
      };
    },
  };
}

describe('cursor-paged log hook', () => {
  it('drops the later pages a changed token derived from, and reaches them again in order', async () => {
    const source = log(65);
    const { result } = renderHook(() => useMailCursorLogPage(source.load));
    await waitFor(() => expect(result.current.items[0]).toBe(65));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.items[0]).toBe(45));
    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.items[0]).toBe(25));
    expect(result.current.maxPage).toBe(4);

    // A new row arrives; the first page now ends one row earlier, so the second page's token changes.
    source.add();
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.items[0]).toBe(66));
    // The pages reached stay offered although their tokens went stale.
    expect(result.current.maxPage).toBe(4);

    // Straight from the first page to the third: the second page is fetched again on the way, not shown.
    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.items[0]).toBe(26));
    expect(result.current.page).toBe(3);
    expect(result.current.items).toHaveLength(20);
    expect(result.current.hasNext).toBe(true);
  });

  it('shows a page past a list that shrank as empty and offers no further pages', async () => {
    const source = log(65);
    const { result } = renderHook(() => useMailCursorLogPage(source.load));
    await waitFor(() => expect(result.current.items[0]).toBe(65));
    for (const page of [2, 3, 4]) {
      act(() => result.current.setPage(page));
      await waitFor(() => expect(result.current.page).toBe(page));
      await waitFor(() => expect(result.current.loading).toBe(false));
    }
    expect(result.current.items).toEqual([5, 4, 3, 2, 1]);
    source.rows.splice(20);
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.items[0]).toBe(65));
    await waitFor(() => expect(result.current.maxPage).toBe(1));
    expect(result.current.hasNext).toBe(false);
  });
});
