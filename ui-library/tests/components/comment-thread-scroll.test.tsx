import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import {
  CommentTimeline,
  type CommentTimelineEntry,
} from '../../registry/components/comment-thread';

it('keeps the list and its entries mounted across the virtualization threshold', () => {
  const entries: CommentTimelineEntry[] = Array.from(
    { length: 100 },
    (_, i) => ({ kind: 'custom', key: String(i), node: <p>Entry {i}</p> }),
  );
  const { container, rerender } = render(<CommentTimeline entries={entries} />);
  const list = container.querySelector('ul');
  const first = list?.firstElementChild;
  rerender(
    <CommentTimeline
      entries={[
        ...entries,
        { kind: 'custom', key: 'new', node: <p>New entry</p> },
      ]}
    />,
  );
  expect(container.querySelector('ul')).toBe(list);
  expect(list?.firstElementChild).toBe(first);
  expect(list?.children).toHaveLength(101);
});
