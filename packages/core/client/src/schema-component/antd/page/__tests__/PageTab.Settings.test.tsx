/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, checkSettings, renderSettings } from '@nocobase/test/client';
import { Page } from '../Page';
import { pageTabSettings } from '../PageTab.Settings';

describe('PageTab.Settings', () => {
  test('should works', async () => {
    await renderSettings({
      container: () => screen.getByRole('tab'),
      schema: {
        title: 'page title',
        'x-component': Page,
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          tab1: {
            'x-component': 'div',
            title: 'tab1 title',
          },
        },
      },
      schemaSettings: pageTabSettings,
    });

    await checkSettings([
      {
        title: 'Edit',
        type: 'modal',
        modalChecker: {
          modalTitle: 'Edit tab',
          formItems: [
            {
              type: 'input',
              label: 'Tab name',
              oldValue: 'tab1 title',
              newValue: 'new tab1 title',
            },
          ],
          afterSubmit: () => {
            expect(screen.queryByText('new tab1 title')).toBeInTheDocument();
          },
        },
      },
      {
        title: 'Delete',
        type: 'delete',
        modalChecker: {
          confirmTitle: 'Delete block',
        },
        deletedText: 'new tab1 title',
      },
    ]);
  });
});
