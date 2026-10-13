import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AskAgent } from '../../client/agents/ask-agent';

const mocks = vi.hoisted(() => ({
  panel: { available: true, openChat: vi.fn() },
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  useChatPanel: () => mocks.panel,
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const ENTRY = { kind: 'issue', id: 'i1', label: 'Issue' } as const;

describe('AskAgent', () => {
  it('on the issue page, renders both a full-text and an icon-only button, switched by the header container width', () => {
    render(<AskAgent placement='issue' entry={ENTRY} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    // Shown once the issue header's own container (not the viewport) reaches `@md`.
    expect(buttons[0]).toHaveClass('hidden');
    expect(buttons[0]).toHaveClass('@md/issue-header:inline-flex');
    // Shown below that width; this is the one that keeps the issue title from being squeezed.
    expect(buttons[1]).toHaveClass('@md/issue-header:hidden');
  });

  it('on other placements, renders a single button as before', () => {
    render(<AskAgent placement='project' entry={ENTRY} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('renders nothing without an entry the panel can pin', () => {
    const { container } = render(
      <AskAgent placement='issue' entry={undefined} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
