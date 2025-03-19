/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { checkModal, checkSettings, renderSettings, screen } from '@nocobase/test/client';
import { Page } from '../Page';
import { pageSettings } from '../Page.Settings';

describe('Page.Settings', () => {
  // It works normally in the actual runtime environment, but there's an error here. Additionally, this part is covered in the e2e tests.
  it.skip('should works', async () => {
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
      apis: {
        '/uiSchemas:insertAdjacent/test?position=beforeEnd': { data: { result: 'ok' } },
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
        type: 'modal',
        modalChecker: {
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
          await checkModal({
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
