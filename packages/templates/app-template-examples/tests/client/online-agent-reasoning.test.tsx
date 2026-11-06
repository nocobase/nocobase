import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ReasoningPart } from '../../client/extensions/nocobase-agent-chat/reasoning-part.js';

it('opens live reasoning, closes at reasoning-end and never animates saved partial history', () => {
  const tree = render(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'Model reasoning', state: 'streaming' }}
      streaming
    />,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  tree.rerender(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'Model reasoning', state: 'done' }}
      streaming
    />,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  tree.rerender(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'Model reasoning', state: 'streaming' }}
      streaming={false}
    />,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  expect(
    tree.container.querySelector('[data-reasoning-streaming="true"]'),
  ).toBeNull();
});

it('preserves explicit user choice across deltas, end and history revision', () => {
  const tree = render(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'First', state: 'streaming' }}
      streaming
    />,
  );
  fireEvent.click(screen.getByRole('button'));
  tree.rerender(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'First delta', state: 'streaming' }}
      streaming
    />,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(screen.getByRole('button'));
  tree.rerender(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'First delta', state: 'done' }}
      streaming={false}
    />,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('First delta')).toBeVisible();
});

it.each(['', '  \n\t'])('does not render empty reasoning %j', (text) => {
  const tree = render(
    <ReasoningPart
      part={{ type: 'reasoning', text, state: 'streaming' }}
      streaming
    />,
  );
  expect(tree.container).toBeEmptyDOMElement();
});

it('keeps a manual collapse after reasoning-end and a revised historical part', () => {
  const tree = render(
    <ReasoningPart
      part={{ type: 'reasoning', text: 'Thinking', state: 'streaming' }}
      streaming
    />,
  );
  fireEvent.click(screen.getByRole('button'));
  for (const part of [
    {
      type: 'reasoning' as const,
      text: 'Thinking delta',
      state: 'done' as const,
    },
    {
      type: 'reasoning' as const,
      text: 'Historical correction',
      state: 'done' as const,
    },
  ]) {
    tree.rerender(<ReasoningPart part={part} streaming={false} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  }
});

it('renders reasoning as untrusted Markdown, not executable HTML', () => {
  const tree = render(
    <ReasoningPart
      part={{
        type: 'reasoning',
        text: '<script>window.reasoningExecuted = true</script>\n\n[unsafe](javascript:alert(1))',
        state: 'done',
      }}
      streaming={false}
    />,
  );
  fireEvent.click(screen.getByRole('button'));
  expect(tree.container.querySelector('script')).toBeNull();
  expect(tree.container.querySelector('a[href^="javascript:"]')).toBeNull();
});
