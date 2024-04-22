import { waitFor, screen } from '@testing-library/react';
import { checkSettings } from '../settingsChecker';
import { expect } from 'vitest';

export async function checkFieldTitle(oldValue?: string) {
  const newValue = 'new test';
  await checkSettings([
    {
      type: 'modal',
      title: 'Edit field title',
      modalChecker: {
        modalTitle: 'Edit field title',
        formItems: [
          {
            type: 'input',
            label: 'Field title',
            oldValue,
            newValue,
          },
        ],
        async afterSubmit() {
          await waitFor(() => {
            expect(screen.queryByText(newValue)).toBeInTheDocument();
          });
        },
      },
    },
  ]);
}
