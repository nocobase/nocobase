/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { useCollectionRecord } from '@nocobase/client';
import React, { useContext } from 'react';
import { NotificationTypesContext } from '../context';

export const ConfigForm = observer(
  () => {
    const form = useForm();
    const record = useCollectionRecord<Record<string, any>>();
    const notificationType = form.values.notificationType || record?.data?.notificationType;
    const { channelTypes } = useContext(NotificationTypesContext);
    const channel = channelTypes.find((channelType) => channelType.type === notificationType);
    return channel.components?.ChannelConfigForm ? <channel.components.ChannelConfigForm /> : null;
  },
  { displayName: 'ConfigForm' },
);
