/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';
import { NAMESPACE } from '../../locale';
export const setDefaultZoomLevel = defineAction({
  name: 'setDefaultZoomLevel',
  title: escapeT('Set default zoom level', { ns: NAMESPACE }),
  uiSchema: {
    zoom: {
      title: escapeT('Zoom', { ns: NAMESPACE }),
      'x-component': 'NumberPicker',
      'x-decorator': 'FormItem',
      'x-component-props': {
        precision: 0,
      },
    },
  },
  defaultParams: {
    zoom: 13,
  },
  async handler(ctx, params) {
    ctx.model.setProps('zoom', params.zoom);
  },
});
