/**
 * The issue page over the issues list: the covering layer stacks above what the list raises (an issue card's marks
 * sit at `z-10` over the card's stretched link), so a board card's pull request and deployment marks no longer paint
 * through the issue page.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const { IssueCard } = await import('../../client/components/issue-card.js');
const { RouteChildPage } =
  await import('../../client/components/route-child-page.js');

/** The `z-*` utility of a class list, as its number; 0 without one. */
const zOf = (element: Element): number =>
  Number(/(?:^|\s)z-(\d+)(?:\s|$)/u.exec(element.className)?.[1] ?? 0);

describe('the issue page over the issues list', () => {
  it('stacks the covering layer at least as high as the marks of the cards it covers, after them', () => {
    const { container } = render(
      <div className='relative'>
        <IssueCard
          issue={{ id: 'i1', identifier: 'PM-1', title: 'Board card' }}
          size='card'
          href='/issues/i1'
          marks={<span data-testid='mark'>PR</span>}
        />
        <RouteChildPage>issue page</RouteChildPage>
      </div>,
    );
    const markSlot = screen.getByTestId('mark').parentElement;
    const layer = container.querySelector('[data-slot="route-child-page"]');
    if (!markSlot || !layer) throw new Error('missing parts');
    expect(zOf(markSlot)).toBeGreaterThan(0);
    // Equal z-indexes paint in document order, and the layer comes after what it covers.
    expect(zOf(layer)).toBeGreaterThanOrEqual(zOf(markSlot));
    expect(
      markSlot.compareDocumentPosition(layer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
