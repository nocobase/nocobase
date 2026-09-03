/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { TypedConstantSpec } from '@nocobase/client-v2';

export const CONTENT_TYPE_HTML = 'html';
export const CONTENT_TYPE_TEXT = 'text';

export const EMAIL_VALUE_TYPES: TypedConstantSpec[] = ['string'];
export const SMTP_HOST_VALUE_TYPES: TypedConstantSpec[] = ['string'];
export const SMTP_USER_VALUE_TYPES: TypedConstantSpec[] = ['string'];
export const SMTP_PASSWORD_VALUE_TYPES: TypedConstantSpec[] = [['string', { type: 'password' }]];
export const SMTP_PORT_VALUE_TYPES: TypedConstantSpec[] = [['number', { min: 1, max: 65535, step: 1 }]];
export const SMTP_SECURE_VALUE_TYPES: TypedConstantSpec[] = ['boolean'];

type CollectionLike = {
  template?: string;
  options?: {
    template?: string;
  };
};

type CollectionManagerLike = {
  getCollection?: (name: string) => CollectionLike | undefined;
};

type WorkflowFieldLike = {
  target?: string;
  isForeignKey?: boolean;
};

export function isFileRecordVariableMatch(
  field: WorkflowFieldLike,
  { collectionManager }: { collectionManager?: CollectionManagerLike },
) {
  if (!field.target || field.isForeignKey) {
    return false;
  }

  const targetCollection = collectionManager?.getCollection?.(field.target);

  return targetCollection?.template === 'file' || targetCollection?.options?.template === 'file';
}
