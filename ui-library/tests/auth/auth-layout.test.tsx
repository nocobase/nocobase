import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthCenteredLayout } from '../../registry/auth/auth-centered-layout/auth-centered-layout';
import { AuthSplitLayout } from '../../registry/auth/auth-split-layout/auth-split-layout';

describe('auth layouts', () => {
  it('centres the form in a card under the brand', () => {
    render(
      <AuthCenteredLayout
        description='Sign in to continue.'
        footer='Terms apply.'
        name='NocoBase'
        title='Welcome back'
      >
        <p>Form</p>
      </AuthCenteredLayout>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome back' }),
    ).toBeVisible();
    expect(screen.getByText('NocoBase')).toBeVisible();
    expect(screen.getByText('Sign in to continue.')).toBeVisible();
    expect(
      screen.getByText('Form').closest('[data-slot="card"]'),
    ).not.toBeNull();
    expect(screen.getByText('Terms apply.')).toBeVisible();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('gives the split layout an aside from the xl breakpoint up', () => {
    render(
      <AuthSplitLayout
        aside={<p>Highlights</p>}
        asideLabel='About NocoBase'
        title='Welcome back'
      >
        <p>Form</p>
      </AuthSplitLayout>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('Form');
    expect(
      screen.getByRole('complementary', { name: 'About NocoBase' }),
    ).toHaveClass('hidden', 'xl:block');
  });
});
