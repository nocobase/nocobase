/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionProvider, SchemaTemplateManagerContext, useSchemaSettingsRender } from '@nocobase/client';
import { renderAppOptions, screen, showSettingsMenu } from '@nocobase/test/client';
import React from 'react';
import { bulkEditFormBlockSettings } from '../BulkEditFormBlockSettings';

async function openFormSettings(settings: string, templateKey?: string) {
  function SettingsMenu() {
    return useSchemaSettingsRender(settings).render();
  }

  await renderAppOptions({
    designable: true,
    schemaSettings: bulkEditFormBlockSettings,
    schema: { 'x-template-key': templateKey },
    Component: () => (
      <CollectionProvider name="users">
        <SchemaTemplateManagerContext.Provider value={{ templates: [{ key: 'saved-fields' }] }}>
          <SettingsMenu />
        </SchemaTemplateManagerContext.Provider>
      </CollectionProvider>
    ),
  });
  await showSettingsMenu();
}

it('hides Save as reference template in bulk edit form settings', async () => {
  await openFormSettings(bulkEditFormBlockSettings.name);
  expect(await screen.findByText('Edit block title & description')).toBeInTheDocument();
  expect(screen.queryByText('Save as reference template')).not.toBeInTheDocument();
});

it('keeps Convert reference to duplicate available for existing references', async () => {
  await openFormSettings(bulkEditFormBlockSettings.name, 'saved-fields');
  expect(await screen.findByText('Convert reference to duplicate')).toBeInTheDocument();
});

it('keeps Save as reference template available in regular create form settings', async () => {
  await openFormSettings('blockSettings:createForm');
  expect(await screen.findByText('Save as reference template')).toBeInTheDocument();
});
