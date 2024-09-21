/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ComponentType } from 'react';

export type ChannelType = {
  title: string;
  name: string;
  components: {
    ChannelConfigForm: ComponentType;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>;
  };
  meta?: {
    createable?: boolean;
    eidtable?: boolean;
    deletable?: boolean;
  };
};

export type NotificationType = 'mail' | 'SMS' | 'in-app';
