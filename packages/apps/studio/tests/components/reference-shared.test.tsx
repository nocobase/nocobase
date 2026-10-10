import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ExamplePage,
  ExampleSection,
} from '../../client/pages/reference/shared';

describe('reference page frame', () => {
  it('renders the header and docs link around its sections', () => {
    render(
      <ExamplePage
        title='Button'
        description='Triggers an action.'
        docs='https://ui.shadcn.com/docs/components/button'
      >
        <ExampleSection title='Variants' description='Six variants.'>
          <button type='button'>Save</button>
        </ExampleSection>
      </ExamplePage>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Button' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Triggers an action.')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://ui.shadcn.com/docs/components/button',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Variants' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('omits the header actions when nothing is given', () => {
    render(
      <ExamplePage title='Orders'>
        <ExampleSection title='Table'>rows</ExampleSection>
      </ExamplePage>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
