/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionProps,
  useCollection,
  useCollectionRecordData,
  useBlockRequestContext,
  useDataBlockResource,
  useAPIClient,
} from '@nocobase/client';
import { uid } from '@nocobase/utils/client';
import { App as AntdApp } from 'antd';
import _ from 'lodash';

const duplicateSchema = (schema) => {
  if (!schema) {
    return null;
  }
  schema['x-uid'] = uid();
  // TODO: some id reference will be lost
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      duplicateSchema(schema.properties[key]);
    }
  }
  return schema;
};

export function useDuplicateActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const api = useAPIClient();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { service } = useBlockRequestContext();
  const collection = useCollection();
  return {
    async onClick() {
      if (!collection) {
        throw new Error('collection does not exist');
      }
      const schemaUid = record.uid;
      const { data: schema } = await api.request({
        url: `uiSchemas:getJsonSchema/${schemaUid}`,
      });
      const duplicatedSchema = duplicateSchema(_.cloneDeep(schema?.data));
      const newSchemaUid = duplicatedSchema['x-uid'];
      const newKey = uid();
      await api.resource('uiSchemas').insert({
        values: {
          type: 'void',
          name: newKey,
          'x-uid': `template-${newSchemaUid}`,
          _isJSONSchemaObject: true,
          properties: {
            template: duplicatedSchema,
          },
        },
      });
      await resource.create({
        values: {
          title: `${record.title}_copy`,
          description: record.description,
          key: newKey,
          uid: newSchemaUid,
        },
      });
      await service.refresh();
      message.success('Duplicated!'); // TODO: translate
    },
  };
}
