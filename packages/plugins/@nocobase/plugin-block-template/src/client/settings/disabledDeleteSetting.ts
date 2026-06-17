/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SchemaSettingItemComponentType } from '@nocobase/client';
import { useIsInTemplate } from '../hooks/useIsInTemplate';
import { DisabledDeleteItem } from '../components/DisabledDeleteItem';
import { tStr } from '../locale';

type BlockTemplateSettingItem = SchemaSettingItemComponentType & {
  title?: string;
};

export const disabledDeleteSettingItem: BlockTemplateSettingItem = {
  name: 'template-disabledDeleteItem',
  title: tStr('Delete'),
  Component: DisabledDeleteItem,
  useVisible: () => useIsInTemplate(false),
};
