/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useSchemaSettings } from '@nocobase/client';
import { SaveAsTemplateSetting } from '../components/SaveAsTemplateSetting';
import { useIsPageBlock } from '../hooks/useIsPageBlock';

export const saveAsTemplateSetting = {
  name: 'saveAsTemplateSetting',
  Component: SaveAsTemplateSetting,
  useVisible: () => {
    const isPageBlock = useIsPageBlock();
    const { template: deprecatedTemplate } = useSchemaSettings();
    return isPageBlock && !deprecatedTemplate;
  },
};
