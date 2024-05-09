/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomRequestAction } from './components';
import { customRequestActionSettings } from './components/CustomRequestActionDesigner';
import { CustomRequestInitializer } from './initializer';
import { customizeCustomRequestActionSettings } from './schemaSettings';
import { CustomRequestConfigurationFieldsSchema } from './schemas';

const CustomRequestProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      scope={{
        CustomRequestConfigurationFieldsSchema,
      }}
      components={{ CustomRequestAction, CustomRequestInitializer }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

export class PluginActionCustomRequestClient extends Plugin {
  async load() {
    this.app.use(CustomRequestProvider);
    this.app.schemaSettingsManager.add(customizeCustomRequestActionSettings);

    // @deprecated
    this.app.schemaSettingsManager.add(customRequestActionSettings);
  }
}

export default PluginActionCustomRequestClient;
