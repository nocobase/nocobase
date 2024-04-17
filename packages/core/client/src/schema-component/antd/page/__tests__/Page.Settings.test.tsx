import { screen, checkSettings, renderSettings, checkDialog } from '@nocobase/test/client';
import { Page } from '../Page';
import { pageSettings } from '../Page.Settings';

describe('Page.Settings', () => {
  it('should works', async () => {
    const title = 'title test';
    await renderSettings({
      schema: {
        title,
        'x-component': Page,
      },
      schemaSettings: pageSettings,
      appOptions: {
        designable: true,
      },
    });

    await checkSettings([
      {
        title: 'Enable page header',
        type: 'switch',
        beforeClick() {
          expect(screen.getByTitle(title)).toBeInTheDocument();
        },
        afterFirstClick() {
          expect(screen.queryByText(title)).not.toBeInTheDocument();
          expect(screen.queryByText('Display page title')).not.toBeInTheDocument();
          expect(screen.queryByText('Edit page title')).not.toBeInTheDocument();
          expect(screen.queryByText('Enable page tabs')).not.toBeInTheDocument();
        },
        afterSecondClick() {
          expect(screen.getByTitle(title)).toBeInTheDocument();
          expect(screen.getByText('Display page title')).toBeInTheDocument();
          expect(screen.getByText('Edit page title')).toBeInTheDocument();
          expect(screen.getByText('Enable page tabs')).toBeInTheDocument();
        },
      },
      {
        title: 'Display page title',
        type: 'switch',
        beforeClick() {
          expect(screen.getByTitle(title)).toBeInTheDocument();
        },
        afterFirstClick() {
          expect(screen.queryByText(title)).not.toBeInTheDocument();
        },
        afterSecondClick() {
          expect(screen.getByTitle(title)).toBeInTheDocument();
        },
      },
      {
        title: 'Edit page title',
        type: 'dialog',
        dialogChecker: {
          modalTitle: 'Edit page title',
          formItems: [
            {
              type: 'input',
              label: 'Title',
              newValue: 'new title',
            },
          ],
          afterSubmit() {
            expect(screen.queryByTitle('new title')).toBeInTheDocument();
          },
        },
      },
      {
        title: 'Enable page tabs',
        type: 'switch',
        beforeClick() {
          expect(screen.queryByText('Add tab')).not.toBeInTheDocument();
        },
        async afterFirstClick() {
          await checkDialog({
            triggerText: 'Add tab',
            modalTitle: 'Add tab',
            formItems: [
              {
                label: 'Tab name',
                type: 'input',
                newValue: 'Tab 1',
              },
            ],
            afterSubmit() {
              expect(screen.queryByRole('tab')).toBeInTheDocument();
              expect(screen.getByRole('tab')).toHaveTextContent('Tab 1');
            },
          });
        },
        afterSecondClick() {
          expect(screen.queryByTitle('Add tab')).not.toBeInTheDocument();
        },
      },
    ]);
  });
});
