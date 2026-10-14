import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TypographyH1,
  TypographyInlineCode,
  TypographyList,
  TypographyMuted,
} from '../../client/components/typography';

describe('Typography', () => {
  it('renders a level-one heading with the heading font', () => {
    render(<TypographyH1 className='mb-2'>Title</TypographyH1>);

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    expect(heading).toHaveClass('font-heading', 'text-4xl', 'mb-2');
  });

  it('switches between bulleted and ordered lists', () => {
    const { rerender } = render(
      <TypographyList>
        <li>One</li>
      </TypographyList>,
    );
    expect(screen.getByRole('list')).toHaveClass('list-disc');

    rerender(
      <TypographyList ordered>
        <li>One</li>
      </TypographyList>,
    );
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getByRole('list')).toHaveClass('list-decimal');
  });

  it('styles inline code and muted text with theme tokens', () => {
    render(
      <>
        <TypographyInlineCode>pnpm dev</TypographyInlineCode>
        <TypographyMuted>Hint</TypographyMuted>
      </>,
    );

    expect(screen.getByText('pnpm dev')).toHaveClass('bg-muted', 'font-mono');
    expect(screen.getByText('Hint')).toHaveClass('text-muted-foreground');
  });
});
