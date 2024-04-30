/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen, userEvent, waitFor } from '@nocobase/test/client';

import { createApp } from '../../fixures/createApp';
import { SchemaInitializerItemType } from '@nocobase/client';

export async function createAndHover(items: SchemaInitializerItemType[], appOptions: any = {}) {
  await createApp({ items }, appOptions);
  await userEvent.hover(screen.getByText('Test'));

  await waitFor(async () => {
    expect(screen.queryByRole('tooltip')).toBeInTheDocument();
  });
}
