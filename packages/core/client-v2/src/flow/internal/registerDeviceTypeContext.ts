/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import { deviceType } from 'react-device-detect';

export const registerDeviceTypeContext = (flowEngine: FlowEngine) => {
  flowEngine.context.defineProperty('deviceType', {
    get: () => (deviceType === 'browser' ? 'computer' : deviceType),
    cache: false,
    meta: {
      type: 'string',
      title: flowEngine.translate('Current device type'),
      interface: 'select',
      uiSchema: {
        enum: [
          { label: flowEngine.translate('Computer'), value: 'computer' },
          { label: flowEngine.translate('Mobile'), value: 'mobile' },
          { label: flowEngine.translate('Tablet'), value: 'tablet' },
          { label: flowEngine.translate('SmartTv'), value: 'smarttv' },
          { label: flowEngine.translate('Console'), value: 'console' },
          { label: flowEngine.translate('Wearable'), value: 'wearable' },
          { label: flowEngine.translate('Embedded'), value: 'embedded' },
        ],
        'x-component': 'Select',
      },
    },
    info: {
      description: 'Current device type (computer/mobile/tablet/...).',
      detail: 'string',
    },
  });
};
