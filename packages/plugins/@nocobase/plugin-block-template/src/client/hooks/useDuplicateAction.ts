/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useCollection,
  useCollectionRecordData,
  useBlockRequestContext,
  useDataBlockResource,
  useAPIClient,
  useActionContext,
} from '@nocobase/client';
import { useForm } from '@formily/react';
import { App as AntdApp } from 'antd';
import _ from 'lodash';
import { useState } from 'react';
import { uid } from '@nocobase/utils/client';

const duplicateSchema = (schema) => {
  if (!schema) {
    return null;
  }
  if (schema['x-component'] === 'CustomRequestAction') {
    schema['x-custom-request-id'] = schema['x-custom-request-id'] || schema['x-uid'];
  }
  schema['x-uid'] = uid();
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      duplicateSchema(schema.properties[key]);
    }
  }
  return schema;
};

export function useDuplicateAction() {
  const { message } = AntdApp.useApp();
  const api = useAPIClient();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { service } = useBlockRequestContext();
  const collection = useCollection();
  const form = useForm();
  const { setVisible } = useActionContext();
  const [loading, setLoading] = useState(false);
  return {
    async run() {
      if (loading) {
        return;
      }

      await form.submit();
      setLoading(true);
      const values = form.values;
      if (!collection) {
        throw new Error('collection does not exist');
      }
      const schemaUid = record.uid;
      const { data: schema } = await api.request({
        url: `uiSchemas:getJsonSchema/${schemaUid}`,
      });
      const duplicatedSchema = duplicateSchema(_.cloneDeep(schema?.data));
      const newSchemaUid = duplicatedSchema['x-uid'];
      const newKey = `t_${uid()}`;
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
          ...record,
          title: `${values.title}`,
          key: newKey,
          uid: newSchemaUid,
        },
      });
      await service.refresh();
      setVisible(false);
      setLoading(false);
      await form.reset();
      message.success('Duplicated!');
    },
  };
}
