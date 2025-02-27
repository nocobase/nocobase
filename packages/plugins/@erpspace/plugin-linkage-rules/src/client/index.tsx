/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Plugin,
  useSchemaToolbar,
  SchemaSettingsLinkageRules,
  useCollection_deprecated,
  useRefreshFieldSchema,
} from '@nocobase/client';
export class LinkageRulesClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const linkageRulesData = {
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
      useVisible() {
        // const fieldSchema = useRefreshFieldSchema();
        // return !(fieldSchema?.parent?.['x-initializer'] ?? []).includes('bulkEditForm');
        return true;
      },
    };

    // this.schemaSettingsManager.addItem('actionSettings:addNew', 'linkageRules', linkageRulesData);
    this.schemaSettingsManager.addItem('actionSettings:edit', 'linkageRules', linkageRulesData);
    this.schemaSettingsManager.addItem('actionSettings:createSubmit', 'linkageRules', linkageRulesData);
    this.schemaSettingsManager.addItem('actionSettings:updateSubmit', 'linkageRules', linkageRulesData);
  }
}

export default LinkageRulesClient;
