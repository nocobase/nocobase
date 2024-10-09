/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ComponentType } from 'react';
import { Registry } from '@nocobase/utils/client';

export type ChannelType = {
  title: string;
  key: string;
  components: {
    ChannelConfigForm?: ComponentType;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>;
  };
  meta?: {
    createable?: boolean;
    editable?: boolean;
    deletable?: boolean;
  };
};

export type ChannelTypes = Registry<ChannelType>;
export type NotificationType = 'mail' | 'SMS' | 'in-app';
