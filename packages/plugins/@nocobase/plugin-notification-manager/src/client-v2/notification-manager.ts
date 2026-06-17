/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import type { ComponentType } from 'react';

export type LoaderOf<P = Record<string, never>> = () => Promise<{ default: ComponentType<P> }>;

export type FormNamePrefix = Array<string | number>;
export type MessageConfigFormProps = { variableOptions?: MetaTreeNode[]; namePrefix?: FormNamePrefix };
export type ContentConfigFormProps = {
  variableOptions?: MetaTreeNode[];
  channelType?: string;
  namePrefix?: FormNamePrefix;
};

export type RegisterChannelOptions = {
  title: string;
  type: string;
  components: {
    ChannelConfigFormLoader?: LoaderOf;
    MessageConfigFormLoader?: LoaderOf<MessageConfigFormProps>;
    ContentConfigFormLoader?: LoaderOf<ContentConfigFormProps>;
    ChannelConfigForm?: ComponentType;
    MessageConfigForm?: ComponentType<MessageConfigFormProps>;
    ContentConfigForm?: ComponentType<ContentConfigFormProps>;
  };
  meta?: {
    creatable?: boolean;
    editable?: boolean;
    deletable?: boolean;
  };
};

export default class NotificationManager {
  channelTypes = new Registry<RegisterChannelOptions>();
  registerChannelType(options: RegisterChannelOptions) {
    this.channelTypes.register(options.type, options);
  }
}
