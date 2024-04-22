import { waitFor, screen } from '@testing-library/react';
import { checkSettings } from '../settingsChecker';
import { expectNoTsError } from '../utils';

export async function checkBlockTitle(oldValue?: string) {
  const newValue = 'new test';
  await checkSettings([
    {
      type: 'modal',
      title: 'Edit block title',
      modalChecker: {
        modalTitle: 'Edit block title',
        formItems: [
          {
            type: 'input',
            label: 'Block title',
            oldValue,
            newValue,
          },
        ],
        async afterSubmit() {
          await waitFor(() => {
            expectNoTsError(screen.queryByText(newValue)).toBeInTheDocument();
          });
        },
      },
    },
  ]);
}
