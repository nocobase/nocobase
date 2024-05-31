/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderAppOptions, screen, userEvent, waitFor } from '@nocobase/test/client';
import { DataSourceCollectionCascader } from '../CollectionSelect';

describe('DataSourceCollectionCascader', () => {
  test('should works', async () => {
    await renderAppOptions({
      enableMultipleDataSource: true,
      schema: {
        type: 'string',
        'x-component': DataSourceCollectionCascader,
      },
    });

    await userEvent.click(document.querySelector('.ant-select-selector'));
    await waitFor(() => {
      expect(screen.queryByText('Main')).toBeInTheDocument();
      expect(screen.queryByText('Data Source 2')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Main'));

    await waitFor(() => {
      expect(screen.queryByText('Users')).toBeInTheDocument();
      expect(screen.queryByText('Roles')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(document.querySelector('.ant-select-selector')).toHaveTextContent('Main / Users');
    });
  });
});
