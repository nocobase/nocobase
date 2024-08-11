/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import {
  GeneralSchemaDesigner,
  SchemaSettingsActionModalItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDivider,
  SchemaSettingsLinkageRules,
  SchemaSettingsRemove,
  useCollection_deprecated,
  useCollectionFilterOptions,
  useDesignable,
  useMenuSearch,
} from '@nocobase/client';
import { isValidFilter } from '@nocobase/utils/client';
import { FilterDynamicComponent } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../../../locale';
import { FormBlockInitializer } from '../FormBlockInitializer';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

function UpdateFormDesigner() {
  const { name, title } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsActionModalItem
        title={t('Filter settings', { ns: NAMESPACE })}
        schema={{
          name: 'filter',
          type: 'object',
          title: `{{t("Filter")}}`,
          'x-component': 'Filter',
          'x-use-component-props': () => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const options = useCollectionFilterOptions(fieldSchema?.['x-decorator-props']?.collection);
            return {
              options,
            };
          },
          'x-component-props': {
            dynamicComponent: 'FilterDynamicComponent',
          },
        }}
        initialValues={fieldSchema?.['x-decorator-props']}
        onSubmit={({ filter }) => {
          fieldSchema['x-decorator-props'].filter = filter;
          dn.emit('patch', {
            schema: {
              // ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          dn.refresh();
        }}
        width="60%"
      />
      <SchemaSettingsLinkageRules collectionName={name} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
}

export default {
  title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer({ allCollections }) {
      const childItems = useMemo(
        () =>
          allCollections.map(({ key, displayName, collections }) => ({
            key: key,
            name: key,
            label: displayName,
            type: 'subMenu',
            children: collections.map((item) => ({
              name: _.camelCase(`updateRecordForm-child-${item.name}`),
              type: 'item',
              title: item.title || item.tableName,
              schema: {
                collection: item.name,
                dataSource: key,
                title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
                formType: 'update',
                'x-designer': 'UpdateFormDesigner',
              },
              Component: FormBlockInitializer,
            })),
          })),
        [allCollections],
      );
      const [openMenuKeys, setOpenMenuKeys] = useState([]);
      const searchedChildren = useMenuSearch({ data: childItems, openKeys: openMenuKeys });
      return {
        name: 'updateRecordForm',
        key: 'updateRecordForm',
        type: 'subMenu',
        title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
        componentProps: {
          onOpenChange(keys) {
            setOpenMenuKeys(keys);
          },
        },
        children: searchedChildren,
      } as any;
    },
    initializers: {
      // AddCustomFormField
    },
    components: {
      FilterDynamicComponent,
      UpdateFormDesigner,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(
        root,
        (item) => item['x-decorator'] === 'FormBlockProvider' && item['x-decorator-props'].formType === 'update',
      );
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        //获取actionBar的schemakey
        const actionKey =
          Object.entries(formSchema.properties).find(([key, f]) => f['x-component'] === 'ActionBar')?.[0] || 'actions';
        forms[formKey] = {
          ...formBlock['x-decorator-props'],
          type: 'update',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties[actionKey], (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
          ),
        };
      });
      return forms;
    },
  },
  block: {
    scope: {
      // useFormBlockProps
    },
    components: {},
  },
  validate({ filter }) {
    if (!filter || !isValidFilter(filter)) {
      return 'Please check one of your update record form, and add at least one filter condition in form settings.';
    }

    return null;
  },
} as ManualFormType;
