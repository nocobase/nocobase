/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RequestBodyEditorKind, RequestContentType, RequestMethod } from './types';

export const REQUEST_METHODS: RequestMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const REQUEST_METHOD_OPTIONS = REQUEST_METHODS.map((value) => ({
  label: value,
  value,
}));

export const REQUEST_CONTENT_TYPES: RequestContentType[] = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'application/xml',
  'text/plain',
];

export const REQUEST_CONTENT_TYPE_OPTIONS = REQUEST_CONTENT_TYPES.map((value) => ({
  label: value,
  value,
}));

export const DEFAULT_REQUEST_METHOD: RequestMethod = 'POST';
export const DEFAULT_REQUEST_CONTENT_TYPE: RequestContentType = 'application/json';
export const DEFAULT_MULTIPART_VALUE_TYPE = 'text';
export const DEFAULT_TIMEOUT = 5000;

export const MULTIPART_VALUE_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'File', value: 'file' },
] as const;

export const REQUEST_BODY_EDITOR_KIND: Record<RequestContentType, RequestBodyEditorKind> = {
  'application/json': 'json',
  'application/x-www-form-urlencoded': 'pairs',
  'multipart/form-data': 'multipart',
  'application/xml': 'text',
  'text/plain': 'text',
};

type RequestFileMatchField = {
  target?: string;
};

type RequestFileMatchOptions = {
  collectionManager?: {
    getCollection?: (collection: string) => { template?: string } | undefined;
  };
};

export function isRequestFileVariableMatch(
  field: RequestFileMatchField,
  { collectionManager }: RequestFileMatchOptions,
) {
  if (!field?.target) {
    return false;
  }

  return field.target === 'attachments' || collectionManager?.getCollection(field.target)?.template === 'file';
}
