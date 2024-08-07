/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '../../../application/schema-settings';
import { useCollection_deprecated } from '../../../collection-manager';
import { SchemaSettingsTemplate } from '../../../schema-settings/SchemaSettingsTemplate';
import { useBlockTemplateContext } from '../../../schema-templates/BlockTemplateProvider';

/**
 * @deprecated
 */
export const formV1Settings = new SchemaSettings({
  name: 'FormV1Settings',
  items: [
    {
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { componentNamePrefix } = useBlockTemplateContext();
        return {
          componentName: `${componentNamePrefix}Form`,
          collectionName: name,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
