/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'application/xml'
  | 'text/plain';

export type RequestBodyEditorKind = 'json' | 'pairs' | 'multipart' | 'text';

export type RequestHeaderPair = {
  name?: string;
  value?: string;
};

export type RequestMultipartTextValue = {
  valueType: 'text';
  name?: string;
  text?: string;
};

export type RequestMultipartFileValue = {
  valueType: 'file';
  name?: string;
  file?: string;
};

export type RequestMultipartValue = RequestMultipartTextValue | RequestMultipartFileValue;
