import { Activity } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { BodyPortal } from '../../registry/components/body-portal.js';

it('detaches a hidden Activity portal and restores its original input and draft', async () => {
  const view = (mode: 'visible' | 'hidden') => (
    <Activity mode={mode}>
      <section>
        <BodyPortal>
          <input aria-label='Draft' />
        </BodyPortal>
      </section>
    </Activity>
  );
  const { rerender } = render(view('visible'));
  const input = screen.getByRole('textbox', { name: 'Draft' });
  await userEvent.type(input, 'Unsaved draft');
  rerender(view('hidden'));
  expect(input).not.toBeInTheDocument();
  rerender(view('visible'));
  expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input);
  expect(input).toHaveValue('Unsaved draft');
});
