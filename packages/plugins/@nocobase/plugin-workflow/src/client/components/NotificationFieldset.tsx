/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext } from 'react';
import { useForm } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';
import { Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { css, SchemaComponent, useRequest } from '@nocobase/client';

import { NAMESPACE } from '../../common/constants';
import { lang } from '../locale';
import { Fieldset } from './Fieldset';
import { useWorkflowExecuted } from '../hooks';

function NotificationAddition() {
  const disabled = useWorkflowExecuted();
  const array = ArrayItems.useArray();
  const { values } = useForm();
  const data = useChannelsContext() ?? [];
  const onAddSelect = useCallback(
    (value) => {
      array.field.push({ channel: value });
    },
    [array.field],
  );

  const selectedChannels = (values.notifications || []).map((item) => item.channel);
  const options = data.filter((item) => !selectedChannels.includes(item.name));

  return disabled ? null : (
    <Select
      value={null}
      placeholder={lang('Add channel')}
      fieldNames={{
        label: 'title',
        value: 'name',
      }}
      options={options}
      onChange={onAddSelect}
      style={{
        width: '12em',
      }}
    />
  );
}

const ChannelsContext = createContext<Record<string, any>[]>([]);

function ChannelsContextProvider(props) {
  const { loading, data } = useRequest<any>({
    resource: 'notificationChannels',
    action: 'list',
  });
  // NOTE: 'options' field of channel record will cause options of Select component erorr, so filter it out.
  const options = (data?.data ?? []).map(({ options, ...item }) => item);
  if (loading) {
    return <LoadingOutlined spin />;
  }
  return <ChannelsContext.Provider value={options}>{props.children}</ChannelsContext.Provider>;
}

function useChannelsContext() {
  return useContext(ChannelsContext);
}

function useChannelType() {
  const allChannels = useChannelsContext();
  const { channel } = ArrayItems.useRecord();
  return allChannels.find((item) => item.name === channel)?.notificationType;
}

export default function ({ type }) {
  // const option = ApprovalNotificationTypeOptionsMap[type];
  return (
    <ChannelsContextProvider>
      <SchemaComponent
        components={{
          ChannelsContextProvider,
          NotificationAddition,
          Fieldset,
        }}
        scope={{
          useChannelType,
          useChannelsContext,
        }}
        schema={{
          name: 'notifications',
          type: 'array',
          // title: option.label,
          // description: option.description,
          'x-decorator': 'FormItem',
          'x-component': 'ArrayItems',
          items: {
            type: 'object',
            'x-component': 'Space',
            'x-component-props': {
              className: css`
                width: 100%;
                &.ant-space.ant-space-horizontal {
                  flex-wrap: nowrap;
                }
                > .ant-space-item:nth-child(1) {
                  width: 12em;
                }
                > .ant-space-item:nth-child(2) {
                  flex-grow: 1;
                }
              `,
            },
            properties: {
              channel: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  placeholder: `{{t("Notification channel", { ns: "${NAMESPACE}" })}}`,
                  fieldNames: {
                    label: 'title',
                    value: 'name',
                  },
                  // manual: false,
                  // service: {
                  //   resource: 'notificationChannels',
                  // },
                },
                enum: '{{useChannelsContext()}}',
                'x-disabled': true,
              },
              template: {
                type: 'number',
                'x-decorator': 'FormItem',
                'x-component': 'RemoteSelect',
                'x-component-props': {
                  placeholder: `{{t("Message template", { ns: "${NAMESPACE}" })}}`,
                  fieldNames: {
                    label: 'title',
                    value: 'id',
                  },
                  manual: false,
                  service: {
                    resource: 'approvalMsgTpls',
                    params: {
                      filter: {
                        notificationType: '{{ useChannelType() }}',
                        type,
                      },
                    },
                  },
                },
                required: true,
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
          properties: {
            add: {
              type: 'void',
              'x-component': 'NotificationAddition',
            },
          },
        }}
      />
    </ChannelsContextProvider>
  );
}
