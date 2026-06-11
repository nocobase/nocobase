/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { screen, userEvent, act, render, waitFor } from '@nocobase/test/client';

import { SchemaSettingsItemType, SchemaSettings, Application, useSchemaSettingsRender } from '@nocobase/client';

export async function createAndHover(items: SchemaSettingsItemType[], appOptions: any = {}) {
  const testSettings = new SchemaSettings({
    name: 'test',
    items,
  });
  const Demo = () => {
    const { render } = useSchemaSettingsRender('test');

    return <div data-testid="render">{render()}</div>;
  };
  const app = new Application({
    providers: [Demo],
    schemaSettings: [testSettings],
    designable: true,
    ...appOptions,
  });
  const Root = app.getRootComponent();
  render(<Root />);
  await waitFor(() => {
    expect(screen.getByTestId('render')).toBeInTheDocument();
  });

  const user = userEvent.setup();

  await act(async () => {
    await user.hover(screen.getByRole('button'));
  });

  await waitFor(() => {
    expect(document.body.querySelector('.ant-dropdown-menu')).toBeInTheDocument();
  });
}
