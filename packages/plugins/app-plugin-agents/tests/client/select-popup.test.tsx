// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());

const { EffortSelect } =
  await import('../../client/components/agent-fields.js');

describe('select popups', () => {
  it('grow with their options and wrap a long one instead of cutting it off', async () => {
    render(
      <EffortSelect
        id='effort'
        efforts={['high']}
        value=''
        ariaLabel='Effort'
        onChange={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Effort' }));
    const popup = document.querySelector<HTMLElement>(
      '[data-slot=select-content]',
    );
    expect(popup).not.toBeNull();
    const classes = popup?.className.split(' ') ?? [];
    // The trigger's width is the floor, not the width.
    expect(classes).toContain('w-auto');
    expect(classes).toContain('min-w-(--anchor-width)');
    expect(classes).not.toContain('w-(--anchor-width)');
    expect(classes).not.toContain('min-w-36');
    // The selector the wrapping class uses reaches each option's text.
    const texts = popup?.querySelectorAll(
      '[data-slot=select-item]>:first-child',
    );
    expect([...(texts ?? [])].map((text) => text.textContent)).toEqual(
      expect.arrayContaining(['agentForm.efforts.high']),
    );
  });
});
