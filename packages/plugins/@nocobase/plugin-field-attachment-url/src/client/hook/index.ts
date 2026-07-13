/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema, useField } from '@formily/react';
import { matchMimetype, useCollectionField, useDesignable, useRequest } from '@nocobase/client';
import { cloneDeep, uniqBy } from 'lodash';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const FILE_ACCESS_SEGMENT = 'files';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const getPermanentFilePreviewUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.href);
    const segments = url.pathname.split('/').filter(Boolean);
    const filesIndex = segments.indexOf(FILE_ACCESS_SEGMENT);
    if (filesIndex === -1) {
      return '';
    }
    const filePathSegments = segments.length - filesIndex;
    if (filePathSegments !== 5) {
      return '';
    }
    if (url.searchParams.has('temporaryAccessToken')) {
      return '';
    }
    url.searchParams.set('preview', '1');
    return value.startsWith('http://') || value.startsWith('https://')
      ? url.href
      : `${url.pathname}${url.search}${url.hash}`;
  } catch (error) {
    return '';
  }
};

const getResponseFileRecord = (response: unknown) => {
  if (!isPlainObject(response)) {
    return null;
  }

  const candidate = isPlainObject(response.data) ? response.data : response;
  return ['id', 'url', 'preview', 'filename', 'extname', 'mimetype'].some((key) => key in candidate) ? candidate : null;
};

const normalizeAttachmentUrlFileRecord = (record: Record<string, unknown>, url: string) => {
  const preview = typeof record.preview === 'string' ? record.preview : getPermanentFilePreviewUrl(url);
  const mimetype = typeof record.mimetype === 'string' ? record.mimetype : undefined;
  const isImage = matchMimetype({ ...record, url }, 'image/*');
  return {
    ...record,
    ...(mimetype ? { type: mimetype } : {}),
    uid: record.id ?? url,
    id: record.id ?? url,
    url,
    ...(isImage && preview ? { preview, thumbUrl: preview } : {}),
  };
};

export const normalizeAttachmentUrlValue = (
  value: unknown,
  fileMetaByUrl: Map<string, Record<string, unknown>> = new Map(),
) => {
  if (typeof value === 'string') {
    const cachedFile = fileMetaByUrl.get(value);
    if (cachedFile) {
      return normalizeAttachmentUrlFileRecord(cachedFile, value);
    }
    const preview = getPermanentFilePreviewUrl(value);
    if (!preview) {
      return value;
    }
    const isImage = matchMimetype({ url: value }, 'image/*');
    return {
      uid: value,
      id: value,
      url: value,
      ...(isImage && preview ? { preview, thumbUrl: preview } : {}),
    };
  }
  return value;
};

export const toAttachmentUrlValueItem = (data: unknown) => {
  const record = getResponseFileRecord(data);
  if (!record) {
    return undefined;
  }

  const url = record.thumbnailRule ? `${record.url}${record.thumbnailRule}` : record.url;
  if (typeof url !== 'string') {
    return undefined;
  }

  return url;
};

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
  const fileMetaByUrlRef = useRef(new Map<string, Record<string, unknown>>());
  return {
    ...props,
    value: normalizeAttachmentUrlValue(props.value, fileMetaByUrlRef.current),
    rules,
    action: `${field.target}:create${field.storage ? `?attachmentField=${field.collectionName}.${field.name}` : ''}`,
    fileCollection: field?.target
      ? {
          dataSourceKey: 'main',
          collectionName: field.target,
        }
      : undefined,
    toValueItem: (data) => {
      const url = toAttachmentUrlValueItem(data);
      const record = getResponseFileRecord(data);
      if (url && record) {
        fileMetaByUrlRef.current.set(url, record);
      }
      return url;
    },
    getThumbnailURL: (file) => {
      return file?.thumbUrl || file?.preview || getPermanentFilePreviewUrl(file?.url) || file?.url;
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
  const field = useField();
  return {
    service: {
      resource: 'collections:listFileCollectionsWithPublicStorage',
      params: {
        paginate: false,
      },
    },
    manual: false,
    fieldNames: {
      label: 'title',
      value: 'name',
    },
    onSuccess: (data) => {
      field.data = field.data || {};
      field.data.options = data?.data;
    },
  };
};
