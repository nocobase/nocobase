import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { LayoutHeader } from '../../client/layouts/components/layout-header.js';

it('renders arbitrary header content and native attributes without providers', () => {
  render(
    <LayoutHeader aria-label='Tools' className='justify-end'>
      <input aria-label='Search' />
    </LayoutHeader>,
  );
  expect(screen.getByRole('banner', { name: 'Tools' })).toHaveClass(
    'justify-end',
  );
  expect(screen.getByRole('textbox', { name: 'Search' })).toBeVisible();
});
