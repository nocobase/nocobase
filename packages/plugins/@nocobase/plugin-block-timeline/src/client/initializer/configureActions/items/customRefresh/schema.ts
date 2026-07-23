/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionProps, useDataBlockRequest, ISchema } from '@nocobase/client';
import { customRefreshActionSettings } from './settings';
import { useT } from '../../../../locale';

export const useCustomRefreshActionProps = (props): ActionProps => {
  const { runAsync } = useDataBlockRequest();
  const t = useT();
  return {
    type: 'default',
    title: t(props.title || 'Custom Refresh'),
    // icon: 'ReloadOutlined',
    async onClick() {
      await runAsync();
    },
  };
};

export const customRefreshActionSchema: ISchema = {
  type: 'void',
  'x-component': 'Action',
  'x-action': 'refresh',
  'x-settings': customRefreshActionSettings.name,
  'x-toolbar': 'ActionSchemaToolbar',
  'x-component-props': {
    icon: 'ReloadOutlined',
  },
  'x-use-component-props': 'useCustomRefreshActionProps',
};
