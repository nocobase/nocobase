/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useActionAvailable } from '@nocobase/client';
import { DuplicateAction } from './DuplicateAction';
import { deprecatedDuplicateActionSettings, duplicateActionSettings } from './DuplicateAction.Settings';
import { DuplicateActionDecorator } from './DuplicateActionDecorator';
import { DuplicateActionInitializer } from './DuplicateActionInitializer';
import { DuplicatePluginProvider } from './DuplicatePluginProvider';

export class PluginActionDuplicateClient extends Plugin {
  async load() {
    this.app.use(DuplicatePluginProvider);
    this.app.addComponents({
      DuplicateActionInitializer,
      DuplicateAction,
      DuplicateActionDecorator,
    });
    this.app.schemaSettingsManager.add(deprecatedDuplicateActionSettings);
    this.app.schemaSettingsManager.add(duplicateActionSettings);

    const initializerTableData = {
      title: '{{t("Duplicate")}}',
      Component: 'DuplicateActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'duplicate',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:duplicate',
        'x-decorator': 'DuplicateActionDecorator',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible: () => useActionAvailable('create'),
    };

    this.app.schemaInitializerManager.addItem('table:configureItemActions', 'actions.duplicate', initializerTableData);
  }
}

export default PluginActionDuplicateClient;
export * from './DuplicateAction';
