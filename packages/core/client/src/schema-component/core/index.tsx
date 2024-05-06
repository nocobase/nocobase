/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './DesignableSwitch';
export * from './FormProvider';
export * from './RemoteSchemaComponent';
export * from './SchemaComponent';
export * from './SchemaComponentOptions';
export * from './SchemaComponentProvider';
import { Plugin } from '../../application/Plugin';
import { DesignableSwitch } from './DesignableSwitch';

export class SchemaComponentPlugin extends Plugin {
  async load() {
    this.addComponents();
  }

  addComponents() {
    this.app.addComponents({
      DesignableSwitch,
    });
  }
}

export default SchemaComponentPlugin;
