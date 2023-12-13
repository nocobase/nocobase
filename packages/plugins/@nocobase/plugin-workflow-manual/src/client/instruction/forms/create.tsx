import React, { useMemo, useState } from 'react';

import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataTemplates,
  SchemaSettingsDivider,
  SchemaSettingsLinkageRules,
  SchemaSettingsRemove,
  useCollection,
  useMenuSearch,
} from '@nocobase/client';

import _ from 'lodash';
import { NAMESPACE } from '../../../locale';
import { FormBlockInitializer } from '../FormBlockInitializer';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

function CreateFormDesigner() {
  const { name, title } = useCollection();

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
    useInitializer({ collections }) {
      const childItems = useMemo(
        () =>
          collections.map((item) => ({
            name: _.camelCase(`createRecordForm-child-${item.name}`),
            type: 'item',
            title: item.title,
            label: item.label,
            schema: {
              collection: item.name,
              title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
              formType: 'create',
              'x-designer': 'CreateFormDesigner',
            },
            Component: FormBlockInitializer,
          })),
        [collections],
      );
      const [isOpenSubMenu, setIsOpenSubMenu] = useState(false);
      const searchedChildren = useMenuSearch(childItems, isOpenSubMenu, true);
      return {
        name: 'createRecordForm',
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
        componentProps: {
          onOpenChange(keys) {
            setIsOpenSubMenu(keys.length > 0);
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
        forms[formKey] = {
          type: 'create',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
          ),
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
