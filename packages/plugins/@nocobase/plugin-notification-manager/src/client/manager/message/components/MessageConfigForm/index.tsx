/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useContext, useEffect } from 'react';
import { ArrayItems } from '@formily/antd-v5';
import { SchemaComponent, css } from '@nocobase/client';
import { onFieldValueChange } from '@formily/core';
import { observer, useField, useForm, useFormEffects } from '@formily/react';

import { useAPIClient, Variable } from '@nocobase/client';
import { useChannelTypeMap } from '../../../../hooks';
import { useNotificationTranslation } from '../../../../locale';
import { COLLECTION_NAME } from '../../../../../constant';
import { UsersAddition } from '../ReceiverConfigForm/Users/UsersAddition';
import { UsersSelect } from '../ReceiverConfigForm/Users/Select';
export const MessageConfigForm = observer<{ variableOptions: any }>(
  ({ variableOptions }) => {
    const field = useField();
    const form = useForm();
    const { channelId, receiverType } = field.form.values;
    const [providerName, setProviderName] = useState(null);
    const { t } = useNotificationTranslation();
    const api = useAPIClient();
    useEffect(() => {
      const onChannelChange = async () => {
        if (!channelId) {
          setProviderName(null);
          return;
        }
        const { data } = await api.request({
          url: `/${COLLECTION_NAME.channels}:get`,
          method: 'get',
          params: {
            filterByTk: channelId,
          },
        });
        setProviderName(data.data.notificationType);
      };
      onChannelChange();
    }, [channelId, api]);

    useFormEffects(() => {
      onFieldValueChange('receiverType', (value) => {
        field.form.values.receivers = [];
      });
    });

    // useEffect(() => {
    //   field.form.values.receivers = [];
    // }, [field.form.values, receiverType]);
    const providerMap = useChannelTypeMap();
    const { ContentConfigForm = () => null } = (providerMap[providerName] ?? {}).components || {};

    const ReceiverInputComponent = receiverType === 'user' ? 'UsersSelect' : 'VariableInput';
    const ReceiverAddition = receiverType === 'user' ? UsersAddition : ArrayItems.Addition;
    const createMessageFormSchema = {
      type: 'void',
      properties: {
        channelId: {
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
          'x-component': 'ContentConfigForm',
          'x-component-props': {
            variableOptions,
          },
        },
      },
    };
    return (
      <SchemaComponent
        schema={createMessageFormSchema}
        components={{ ContentConfigForm, ReceiverAddition, UsersSelect, ArrayItems, VariableInput: Variable.Input }}
        scope={{ t }}
      />
    );
  },
  { displayName: 'MessageConfigForm' },
);
