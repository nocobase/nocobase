import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '../../registry/components/kanban';

const COLUMNS = [
  { id: 'todo', name: 'To do' },
  { id: 'done', name: 'Done' },
];
const ITEMS = [{ id: 'a', column: 'todo', title: 'Write the brief' }];

function board() {
  const { container } = render(
    <KanbanProvider columns={COLUMNS} items={ITEMS} onMove={() => undefined}>
      {(column) => (
        <KanbanBoard key={column.id} id={column.id}>
          <KanbanHeader>{column.name}</KanbanHeader>
          <KanbanCards<(typeof ITEMS)[number]> id={column.id}>
            {(item) => (
              <KanbanCard key={item.id} id={item.id}>
                {item.title}
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>,
  );
  return container.querySelector<HTMLElement>('.scroll-shown')!;
}

function press(target: Element, clientX: number) {
  fireEvent.pointerDown(target, {
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
    clientX,
  });
}

describe('KanbanProvider', () => {
  it('pans the board sideways from its empty space', () => {
    const scroller = board();
    press(screen.getByText('Done'), 200);
    expect(scroller).toHaveAttribute('data-panning');
    fireEvent.pointerMove(scroller, { pointerId: 1, clientX: 150 });
    expect(scroller.scrollLeft).toBe(50);
    fireEvent.pointerUp(scroller, { pointerId: 1, clientX: 150 });
    expect(scroller).not.toHaveAttribute('data-panning');
    fireEvent.pointerMove(scroller, { pointerId: 1, clientX: 100 });
    expect(scroller.scrollLeft).toBe(50);
  });

  it('leaves a press on a card to the card', () => {
    const scroller = board();
    press(screen.getByText('Write the brief'), 200);
    expect(scroller).not.toHaveAttribute('data-panning');
  });
});
