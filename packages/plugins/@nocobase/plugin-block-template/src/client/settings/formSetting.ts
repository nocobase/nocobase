/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  APIClient,
  SchemaSettingsItemType,
  useAPIClient,
  useCurrentPopupRecord,
  useDesignable,
} from '@nocobase/client';
import { useT } from '../locale';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { uid } from '@nocobase/utils/client';
import { Schema } from '@nocobase/utils';
import { useIsInTemplate } from '../hooks/useIsInTemplate';

async function schemaPatch(
  currentSchema: Schema,
  options: {
    api: APIClient;
    collectionName: string;
    // dataSource: string;
    option: string;
    t: (key: string) => string;
  },
) {
  const { option, t } = options;
  const schema = {
    ['x-uid']: currentSchema['x-uid'],
  };

  const comKey = Object.keys(currentSchema.properties)[0];
  const actionKey = Object.keys(currentSchema['properties'][comKey]['properties']).find((key) => {
    return currentSchema['properties'][comKey]['properties'][key]['x-initializer']?.includes('configureActions');
  });
  const newActionBarSchemas = {};

  if (option === t('Edit')) {
    schema['x-decorator-props'] = {
      ...currentSchema['x-decorator-props'],
      action: 'get',
      collection: options.collectionName,
      association: null,
    };
    schema['x-data-templates'] = {
      ...currentSchema['x-data-templates'],
      display: false,
    };
    schema['x-acl-action'] = currentSchema['x-acl-action'].replace(':create', ':update');
    schema['x-settings'] = 'blockSettings:editForm';
    schema['x-use-decorator-props'] = 'useEditFormBlockDecoratorProps';
    schema['properties'] = {
      [comKey]: {
        'x-uid': currentSchema.properties[comKey]['x-uid'],
        'x-use-component-props': 'useEditFormBlockProps',
        properties: {
          [actionKey]: {
            'x-uid': currentSchema.properties[comKey]['properties'][actionKey]['x-uid'],
            'x-initializer': 'editForm:configureActions',
            properties: newActionBarSchemas,
          },
        },
      },
    };
    const actionBarSchema = currentSchema['properties'][comKey]['properties'][actionKey];
    for (const key in actionBarSchema.properties) {
      if (actionBarSchema.properties[key]['x-settings']?.includes('createSubmit')) {
        newActionBarSchemas[key] = {};
        newActionBarSchemas[key]['x-settings'] = 'actionSettings:updateSubmit';
        newActionBarSchemas[key]['x-use-component-props'] = 'useUpdateActionProps';
        newActionBarSchemas[key]['x-uid'] = actionBarSchema.properties[key]['x-uid'];
      }
      if (actionBarSchema.properties[key]['x-settings']?.includes('actionSettings:popup')) {
        actionBarSchema.properties[key]['x-hidden'] = false;
      }
    }
  } else {
    schema['x-decorator-props'] = {
      ...currentSchema['x-decorator-props'],
      action: null,
    };
    schema['x-data-templates'] = {
      ...currentSchema['x-data-templates'],
      display: currentSchema['x-data-templates']?.items?.length > 0,
    };
    schema['x-acl-action'] = currentSchema['x-acl-action'].replace(':update', ':create');
    schema['x-settings'] = 'blockSettings:createForm';
    schema['x-use-decorator-props'] = 'useCreateFormBlockDecoratorProps';
    schema['properties'] = {
      [comKey]: {
        'x-uid': currentSchema.properties[comKey]['x-uid'],
        'x-use-component-props': 'useCreateFormBlockProps',
        properties: {
          [actionKey]: {
            'x-uid': currentSchema.properties[comKey]['properties'][actionKey]['x-uid'],
            'x-initializer': 'createForm:configureActions',
            properties: newActionBarSchemas,
          },
        },
      },
    };
    const actionBarSchema = currentSchema['properties'][comKey]['properties'][actionKey];
    for (const key in actionBarSchema.properties) {
      if (actionBarSchema.properties[key]['x-settings']?.includes('updateSubmit')) {
        newActionBarSchemas[key] = {};
        newActionBarSchemas[key]['x-settings'] = 'actionSettings:createSubmit';
        newActionBarSchemas[key]['x-use-component-props'] = 'useCreateActionProps';
        newActionBarSchemas[key]['x-uid'] = actionBarSchema.properties[key]['x-uid'];
      }
      if (actionBarSchema.properties[key]['x-settings']?.includes('actionSettings:popup')) {
        actionBarSchema.properties[key]['x-hidden'] = true;
      }
    }
  }
  return schema;
}

export const formSettingItem: SchemaSettingsItemType = {
  name: 'template-form',
  type: 'select',
  useVisible() {
    const fieldSchema = useFieldSchema();
    const decorator = fieldSchema['x-decorator'];
    const isInTemplate = useIsInTemplate();
    const currentPopupRecord = useCurrentPopupRecord();
    const currentCollectionName =
      fieldSchema['x-decorator-props']?.collection || fieldSchema['x-decorator-props']?.association;
    if (!isInTemplate) {
      return false;
    }
    if (
      decorator === 'FormBlockProvider' &&
      currentPopupRecord?.value &&
      currentPopupRecord?.collection?.name === currentCollectionName
    ) {
      return true;
    }
    return false;
  },
  useComponentProps() {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const api = useAPIClient();
    const { refresh } = useDesignable();
    const currentOption =
      fieldSchema['x-use-decorator-props'] === 'useEditFormBlockDecoratorProps' ? t('Edit') : t('Add new');
    const options = [t('Add new'), t('Edit')];
    const currentPopupRecord = useCurrentPopupRecord();
    const currentCollectionName = fieldSchema['x-decorator-props']?.collection || currentPopupRecord?.collection?.name;

    return {
      title: t('Form type'),
      value: currentOption,
      options: options.map((v) => ({ value: v })),
      onChange: async (option) => {
        const schema = await schemaPatch(fieldSchema, {
          api,
          collectionName: currentCollectionName,
          // dataSource: decoratorProps.dataSource,
          option,
          t,
        });
        _.merge(fieldSchema, schema);
        field.decoratorProps = {
          ...fieldSchema['x-decorator-props'],
          ...schema['x-decorator-props'],
          key: uid(),
        };
        const schemaJSON = fieldSchema.toJSON();
        fieldSchema.toJSON = () => {
          const ret = _.merge(schemaJSON, schema);
          return ret;
        };
        await api.request({
          url: `/uiSchemas:patch`,
          method: 'post',
          data: {
            ...schema,
          },
        });

        refresh({
          refreshParentSchema: true,
        });
      },
    };
  },
};
