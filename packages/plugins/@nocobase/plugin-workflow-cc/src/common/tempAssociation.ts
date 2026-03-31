/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const TEMP_ASSOCIATION_PREFIX = 'ccTempAssoc_';

const sanitizeFieldKey = (value: string | number) => String(value ?? '').replace(/[^a-zA-Z0-9_]/g, '_');

export const buildTempAssociationFieldName = (nodeType: string, nodeKey: string | number) =>
  `${TEMP_ASSOCIATION_PREFIX}${nodeType}_${sanitizeFieldKey(nodeKey)}`;
