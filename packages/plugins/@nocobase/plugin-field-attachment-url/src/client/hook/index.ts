/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useCollectionField, useDesignable, useRequest } from '@nocobase/client';
import { cloneDeep, uniqBy } from 'lodash';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

function useStorageRules(storage) {
  const name = storage ?? '';
  const { loading, data } = useRequest<any>(
    {
      url: `storages:getBasicInfo/${name}`,
    },
    {
      refreshDeps: [name],
    },
  );
  return (!loading && data?.data) || null;
}
export function useAttachmentUrlFieldProps(props) {
  const field = useCollectionField();
  const rules = useStorageRules(field?.storage);
  return {
    ...props,
    rules,
    action: `${field.target}:create${field.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''}`,
    toValueItem: (data) => {
      return data?.thumbnailRule ? `${data?.url}${data?.thumbnailRule}` : data?.url;
    },
    getThumbnailURL: (file) => {
      return file?.url;
    },
  };
}

export const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component, fieldSchema, insertAfterBegin],
  );
  return insert;
};

export const useAttachmentTargetProps = () => {
  const { t } = useTranslation();
  // TODO(refactor): whitelist should be changed to storage property，url is signed by plugin-s3-pro, this enmus is from plugin-file-manager
  const buildInStorage = ['local', 'ali-oss', 's3', 'tx-cos'];
  return {
    service: {
      resource: 'collections',
      params: {
        filter: {
          'options.template': 'file',
        },
        paginate: false,
      },
    },
    manual: false,
    fieldNames: {
      label: 'title',
      value: 'name',
    },
    mapOptions: (value) => {
      if (value.name === 'attachments') {
        return {
          ...value,
          title: t('Attachments'),
        };
      }
      return value;
    },
    toOptionsItem: (data) => {
      data.unshift({
        name: 'attachments',
        title: t('Attachments'),
      });
      return uniqBy(
        data.filter((v) => v.name),
        'name',
      );
    },
    optionFilter: (option) => {
      return !option.storage || buildInStorage.includes(option.storage);
    },
  };
};
