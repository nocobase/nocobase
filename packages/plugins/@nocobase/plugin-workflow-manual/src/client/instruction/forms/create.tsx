/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';

import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataTemplates,
  SchemaSettingsDivider,
  SchemaSettingsLinkageRules,
  SchemaSettingsRemove,
  useCollection_deprecated,
  useGetSchemaInitializerMenuItems,
  useMenuSearch,
} from '@nocobase/client';

import _ from 'lodash';
import { NAMESPACE } from '../../../locale';
import { FormBlockInitializer } from '../FormBlockInitializer';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

function CreateFormDesigner() {
  const { name, title } = useCollection_deprecated();

  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsLinkageRules collectionName={name} />
      <SchemaSettingsDataTemplates collectionName={name} />
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
  title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
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
              name: _.camelCase(`createRecordForm-child-${item.name}`),
              type: 'item',
              title: item.title || item.tableName,
              schema: {
                collection: item.name,
                dataSource: key,
                title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
                formType: 'create',
                'x-designer': 'CreateFormDesigner',
              },
              Component: FormBlockInitializer,
            })),
          })),
        [allCollections],
      );
      const [openMenuKeys, setOpenMenuKeys] = useState([]);
      const searchedChildren = useMenuSearch({ data: childItems, openKeys: openMenuKeys });

      return {
        name: 'createRecordForm',
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
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
      CreateFormDesigner,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(
        root,
        (item) => item['x-decorator'] === 'FormBlockProvider' && item['x-decorator-props'].formType === 'create',
      );
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        //获取actionBar的schemakey
        const actionKey =
          Object.entries(formSchema.properties).find(([key, f]) => f['x-component'] === 'ActionBar')?.[0] || 'actions';
        forms[formKey] = {
          type: 'create',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties[actionKey], (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
          ),
          dataSource: formBlock['x-decorator-props'].dataSource,
          collection: formBlock['x-decorator-props'].collection,
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
} as ManualFormType;
