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
  useCollection,
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
    decoratorName: string;
    api: APIClient;
    collectionName: string;
    dataSource: string;
    option: string;
    t: (key: string) => string;
  },
) {
  const { decoratorName, collectionName, option, api, t } = options;
  const schema = {
    ['x-uid']: currentSchema['x-uid'],
  };

  if (decoratorName === 'DetailsBlockProvider') {
    const comKey = Object.keys(currentSchema.properties)[0];
    let paginationSchema: any = _.get(currentSchema, `properties.${comKey}.properties.pagination`);
    if (paginationSchema) {
      paginationSchema = paginationSchema.toJSON();
    }
    if (option === t('Current')) {
      schema['x-decorator-props'] = {
        action: 'get',
        collection: collectionName,
        association: null,
        dataSource: currentSchema['x-decorator-props'].dataSource,
        readPretty: true,
      };
      schema['x-acl-action'] = currentSchema['x-acl-action'].replace(':view', ':get');
      schema['x-settings'] = 'blockSettings:details';
      schema['x-use-decorator-props'] = 'useDetailsDecoratorProps';
    } else {
      if (!_.get(currentSchema, `properties.${comKey}.properties.pagination`)) {
        const properties = _.get(currentSchema, `properties.${comKey}.properties`);
        const maxIndex = _.max(Object.values(properties).map((property) => property['x-index']));
        paginationSchema = {
          type: 'void',
          name: 'pagination',
          'x-uid': uid(),
          'x-index': maxIndex + 1,
          version: currentSchema['version'],
          'x-app-version': currentSchema['x-app-version'],
          'x-component': 'Pagination',
          'x-use-component-props': 'useDetailsPaginationProps',
        };
        await api.request({
          url: `/uiSchemas:insertAdjacent/${currentSchema.properties[comKey]['x-uid']}?position=beforeEnd`,
          method: 'post',
          data: {
            schema: paginationSchema,
          },
        });
      }
      schema['x-decorator-props'] = {
        action: 'list',
        collection: collectionName,
        association: null,
        dataSource: currentSchema['x-decorator-props'].dataSource,
        readPretty: true,
        params: {
          pageSize: 1,
        },
      };
      schema['x-acl-action'] = currentSchema['x-acl-action'].replace(':get', ':view');
      schema['x-settings'] = 'blockSettings:detailsWithPagination';
      schema['x-use-decorator-props'] = 'useDetailsWithPaginationDecoratorProps';
      if (option !== t('None')) {
        schema['x-decorator-props']['collection'] = null;
        schema['x-decorator-props']['association'] = option;
      }
    }

    if (paginationSchema) {
      _.merge(schema, {
        properties: {
          [comKey]: {
            'x-uid': currentSchema.properties[comKey]['x-uid'],
            'x-use-component-props': option !== t('Current') ? 'useDetailsWithPaginationProps' : 'useDetailsProps',
            properties: {
              pagination: {
                ...paginationSchema,
              },
            },
          },
        },
      });
    }
  } else {
    if (option === t('Current')) {
      schema['x-decorator-props'] = {
        action: 'get',
        collection: collectionName,
        association: null,
        dataSource: currentSchema['x-decorator-props'].dataSource,
      };
    } else {
      schema['x-decorator-props'] = {
        action: 'list',
        collection: collectionName,
        association: null,
        dataSource: currentSchema['x-decorator-props'].dataSource,
      };
      if (option !== t('None')) {
        schema['x-decorator-props']['collection'] = null;
        schema['x-decorator-props']['association'] = option;
      }
    }
    if (currentSchema['x-use-decorator-props'] === 'useCreateFormBlockDecoratorProps') {
      schema['x-decorator-props']['action'] = null;
    }
  }
  return schema;
}

function showAssociationOptions(fieldSchema: Schema) {
  const decorator = fieldSchema['x-decorator'];
  const useDecoratorProps = fieldSchema['x-use-decorator-props'];
  if (decorator === 'FormBlockProvider' && useDecoratorProps === 'useUpdateFormBlockDecoratorProps') {
    return false;
  }
  return true;
}

export const associationRecordSettingItem: SchemaSettingsItemType = {
  name: 'template-association-record',
  type: 'select',
  useVisible() {
    const fieldSchema = useFieldSchema();
    const currentCollection = useCollection();
    const t = useT();
    const currentPopupRecord = useCurrentPopupRecord();
    const isInTemplate = useIsInTemplate();

    if (!isInTemplate) {
      return false;
    }

    const decorator = fieldSchema['x-decorator'];
    const decoratorProps = fieldSchema['x-decorator-props'];
    const options = [t('None')];
    const currentCollectionName = decoratorProps?.collection || decoratorProps?.association?.split('.')?.pop();
    if (decorator === 'DetailsBlockProvider' && currentPopupRecord?.collection?.name === currentCollectionName) {
      options.push(t('Current'));
    }

    const currentPopupRecordFields = currentPopupRecord?.collection?.getAllFields?.();
    const associationFields = currentPopupRecordFields
      ?.filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
      .filter((field) => field.target === currentCollectionName);

    if (associationFields?.length && currentPopupRecord?.value && showAssociationOptions(fieldSchema)) {
      const associationOptions = associationFields.map((field) => `${field.collectionName}.${field.name}`);
      options.push(...associationOptions);
    }
    if (!currentCollection || options.length === 1) {
      return false;
    }
    if (_.get(fieldSchema, 'x-decorator-props.collection') || _.get(fieldSchema, 'x-decorator-props.association')) {
      return true;
    }
    return false;
  },
  useComponentProps() {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { refresh } = useDesignable();
    const currentPopupRecord = useCurrentPopupRecord();
    let currentOption = t('None');
    const options = [t('None')];
    const api = useAPIClient();
    const decorator = fieldSchema['x-decorator'];
    const decoratorProps = fieldSchema['x-decorator-props'];
    const currentCollectionName = decoratorProps?.collection || decoratorProps?.association?.split('.')?.pop();
    if (decorator === 'DetailsBlockProvider' && currentPopupRecord?.collection?.name === currentCollectionName) {
      options.push(t('Current'));
      if (decoratorProps.action === 'get') {
        currentOption = t('Current');
      }
    }

    const currentPopupRecordFields = currentPopupRecord?.collection?.getAllFields?.();
    const associationFields = currentPopupRecordFields
      ?.filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
      .filter((field) => field.target === currentCollectionName);

    if (associationFields?.length) {
      const associationOptions = associationFields.map((field) => `${field.collectionName}.${field.name}`);
      options.push(...associationOptions);
      if (decoratorProps.association) {
        currentOption = decoratorProps.association;
      }
    }

    return {
      title: t('Associate record'),
      value: currentOption,
      options: options.map((v) => ({ value: v })),
      onChange: async (option) => {
        const schema = await schemaPatch(fieldSchema, {
          decoratorName: decorator,
          api,
          collectionName: currentCollectionName,
          dataSource: decoratorProps.dataSource,
          option,
          t,
        });
        field.decoratorProps = {
          ...fieldSchema['x-decorator-props'],
          ...schema['x-decorator-props'],
          key: uid(),
        };
        field.componentProps = {
          ...fieldSchema['x-component-props'],
          ...schema['x-component-props'],
          key: uid(),
        };
        field.parent.componentProps = {
          ...fieldSchema.parent?.['x-component-props'],
          key: uid(),
        };
        field.parent.decoratorProps = {
          ...fieldSchema.parent?.['x-decorator-props'],
          key: uid(),
        };
        const schemaJSON = _.merge(fieldSchema.toJSON(), schema);
        fieldSchema.toJSON = () => {
          return schemaJSON;
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
        field.form.reset();
        field.form.clearFormGraph(field.address, true);
      },
    };
  },
};
