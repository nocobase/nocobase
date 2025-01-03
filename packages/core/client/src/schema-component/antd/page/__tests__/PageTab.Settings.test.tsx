/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { checkSettings, renderSettings, screen } from '@nocobase/test/client';
import { Page } from '../Page';
import { pageTabSettings } from '../PageTab.Settings';

describe('PageTab.Settings', () => {
  // 菜单重构后，该测试就不适用了。并且我们现在有 e2e，这种测试应该交给 e2e 测，这样会简单的多
  test.skip('should works', async () => {
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
