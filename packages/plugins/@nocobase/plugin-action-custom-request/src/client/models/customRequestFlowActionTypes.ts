/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RequestNameValue = {
  name: string;
  value: string;
};

export type CustomRequestStepParams = {
  key?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url?: string;
  headers?: RequestNameValue[];
  params?: RequestNameValue[];
  data?: unknown;
  timeout?: number;
  responseType?: 'json' | 'stream';
  roles?: string[];
};
