/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Form, Spin } from 'antd';
import React, { lazy, Suspense, useMemo } from 'react';
import { COLLECTION_NAME } from '../../constant';
import { useNotificationTranslation, useT } from '../locale';
import PluginNotificationManagerClientV2 from '../plugin';
import type { MessageConfigFormProps } from '../notification-manager';

type ChannelOption = { name: string; title: string; notificationType: string };

export function MessageConfigForm({ variableOptions }: MessageConfigFormProps) {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);
  const channelName = Form.useWatch('channelName');

  const { data: channelDetail } = useRequest(
    async () => {
      if (!channelName) return null;
      const response = await ctx.api.request({
        url: `/${COLLECTION_NAME.channels}:get`,
        method: 'get',
        params: { filterByTk: channelName },
      });
      return (response as any)?.data?.data ?? null;
    },
    {
      refreshDeps: [channelName],
      ready: Boolean(channelName),
    },
  );

  const notificationType: string | undefined = channelDetail?.notificationType;

  const MessageConfigFormLoader = useMemo(
    () =>
      notificationType ? plugin?.channelTypes.get(notificationType)?.components?.MessageConfigFormLoader : undefined,
    [plugin, notificationType],
  );

  const Body = useMemo(
    () => (MessageConfigFormLoader ? lazy(MessageConfigFormLoader) : null),
    [MessageConfigFormLoader],
  );

  return (
    <>
      <Form.Item
        name="channelName"
        label={t('Channel')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <RemoteSelect<ChannelOption>
          request={async () => {
            const response = await ctx.api.resource(COLLECTION_NAME.channels).list();
            const payload = (response as any)?.data?.data;
            return Array.isArray(payload) ? payload : [];
          }}
          cacheKey={`@nocobase/plugin-notification-manager:${COLLECTION_NAME.channels}:list`}
          mapOptions={(item) => ({ label: compileT(item.title || item.name), value: item.name })}
        />
      </Form.Item>
      {Body ? (
        <Suspense fallback={<Spin />}>
          <Body variableOptions={variableOptions} />
        </Suspense>
      ) : null}
    </>
  );
}

export default MessageConfigForm;
