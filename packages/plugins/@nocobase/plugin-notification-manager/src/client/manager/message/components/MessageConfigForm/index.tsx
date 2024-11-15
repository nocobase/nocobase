/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { ArrayItems } from '@formily/antd-v5';
import { SchemaComponent } from '@nocobase/client';
import { observer, useField } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
import { useChannelTypeMap } from '../../../../hooks';
import { useNotificationTranslation } from '../../../../locale';
import { COLLECTION_NAME } from '../../../../../constant';
export const MessageConfigForm = observer<{ variableOptions: any }>(
  ({ variableOptions }) => {
    const field = useField();
    const { channelName } = field.form.values;
    const [channelType, setChannelType] = useState(null);
    const { t } = useNotificationTranslation();
    const api = useAPIClient();
    useEffect(() => {
      const onChannelChange = async () => {
        if (!channelName) {
          setChannelType(null);
          return;
        }
        const { data } = await api.request({
          url: `/${COLLECTION_NAME.channels}:get`,
          method: 'get',
          params: {
            filterByTk: channelName,
          },
        });
        setChannelType(data?.data?.notificationType);
      };
      onChannelChange();
    }, [channelName, api]);

    const channelTypeMap = useChannelTypeMap();
    const { MessageConfigForm = () => null } = (channelType ? channelTypeMap[channelType] : {}).components || {};
    const createMessageFormSchema = {
      type: 'void',
      properties: {
        channelName: {
          type: 'string',
          title: '{{t("Channel")}}',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'RemoteSelect',
          'x-component-props': {
            multiple: false,
            manual: false,
            fieldNames: {
              label: 'title',
              value: 'name',
            },
            service: {
              resource: COLLECTION_NAME.channels,
              action: 'list',
            },
            style: {
              width: '100%',
            },
          },
        },
        message: {
          type: 'void',
          'x-component': 'MessageConfigForm',
          'x-component-props': {
            variableOptions,
          },
        },
      },
    };
    return (
      <SchemaComponent schema={createMessageFormSchema} components={{ MessageConfigForm, ArrayItems }} scope={{ t }} />
    );
  },
  { displayName: 'MessageConfigForm' },
);
