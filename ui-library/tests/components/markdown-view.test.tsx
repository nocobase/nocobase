import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarkdownView } from '../../registry/components/markdown-view';

function links(container: HTMLElement): (string | null)[][] {
  return [...container.querySelectorAll('a')].map((link) => [
    link.getAttribute('href'),
    link.textContent,
  ]);
}

describe('MarkdownView', () => {
  it('ends a bare URL at the first CJK character or full-width punctuation mark', () => {
    const { container } = render(
      <MarkdownView content='PR：https://github.com/nocobase/studio/pull/8（分支 `agent/PM-1`），见 www.example.com。' />,
    );
    expect(links(container)).toEqual([
      [
        'https://github.com/nocobase/studio/pull/8',
        'https://github.com/nocobase/studio/pull/8',
      ],
      ['http://www.example.com', 'www.example.com'],
    ]);
    expect(container).toHaveTextContent(
      'PR：https://github.com/nocobase/studio/pull/8（分支 agent/PM-1），见 www.example.com。',
    );
  });

  it('keeps a URL written in angle brackets whole', () => {
    const { container } = render(
      <MarkdownView content='<https://example.com/中文>' />,
    );
    expect(
      decodeURI(container.querySelector('a')?.getAttribute('href') ?? ''),
    ).toBe('https://example.com/中文');
  });
});
