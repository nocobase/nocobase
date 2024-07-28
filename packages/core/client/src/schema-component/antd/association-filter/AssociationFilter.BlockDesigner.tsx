/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection_deprecated } from '../../../collection-manager';
import { FilterBlockType } from '../../../filter-provider/utils';
import { GeneralSchemaDesigner, SchemaSettingsDivider, SchemaSettingsRemove } from '../../../schema-settings';
import { SchemaSettingsBlockTitleItem } from '../../../schema-settings/SchemaSettingsBlockTitleItem';
import { SchemaSettingsConnectDataBlocks } from '../../../schema-settings/SchemaSettingsConnectDataBlocks';
import { SchemaSettingsTemplate } from '../../../schema-settings/SchemaSettingsTemplate';
import { useSchemaTemplate } from '../../../schema-templates';
import { useBlockTemplateContext } from '../../../schema-templates/BlockTemplateProvider';

export const AssociationFilterBlockDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { componentNamePrefix } = useBlockTemplateContext();
  const defaultResource =
    fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsTemplate
        componentName={`${componentNamePrefix}FilterCollapse`}
        collectionName={name}
        resourceName={defaultResource}
      />
      <SchemaSettingsConnectDataBlocks type={FilterBlockType.COLLAPSE} emptyDescription={t('No blocks to connect')} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
