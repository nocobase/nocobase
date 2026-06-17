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
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { COLLECTION_NAME } from '../../constant';
import { useNotificationTranslation, useT } from '../locale';
import PluginNotificationManagerClientV2 from '../plugin';
import type { LoaderOf, MessageConfigFormProps, RegisterChannelOptions } from '../notification-manager';

type ChannelOption = { name: string; title: string; notificationType: string };
type ChannelDetail = { notificationType?: string };
type ResourceResponse<T> = { data?: { data?: T } };
type ChannelNameValue = string | { value?: string } | null | undefined;
type NotificationManagerLike = {
  channelTypes: {
    get: (key: string) => RegisterChannelOptions | undefined;
  };
};

function withPrefix(namePrefix: Array<string | number> | undefined, name: string) {
  return [...(namePrefix ?? []), name];
}

function normalizeChannelName(value: ChannelNameValue) {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && typeof value.value === 'string') {
    return value.value;
  }
  return undefined;
}

function mergeChannelTypes(prev: Record<string, string>, items: ChannelOption[]) {
  let next = prev;
  for (const item of items) {
    if (!item?.name || !item?.notificationType || prev[item.name] === item.notificationType) {
      continue;
    }
    if (next === prev) {
      next = { ...prev };
    }
    next[item.name] = item.notificationType;
  }
  return next;
}

export function MessageConfigForm({ variableOptions, namePrefix }: MessageConfigFormProps) {
  const { t } = useNotificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const plugin =
    (ctx.app.pm.get(PluginNotificationManagerClientV2) as NotificationManagerLike | undefined) ??
    (ctx.app.pm.get('notification-manager') as NotificationManagerLike | undefined);
  const form = Form.useFormInstance();
  const [knownChannelTypes, setKnownChannelTypes] = useState<Record<string, string>>({});
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const channelNamePath = useMemo(() => withPrefix(namePrefix, 'channelName'), [namePrefix]);
  const watchedChannelName = Form.useWatch(channelNamePath, form);
  const channelName = normalizeChannelName(watchedChannelName);
  const notificationType = channelName ? knownChannelTypes[channelName] : undefined;

  useRequest(
    async () => {
      if (!channelName || notificationType) return null;
      const response = await ctx.api.request({
        url: `/${COLLECTION_NAME.channels}:get`,
        method: 'get',
        params: { filterByTk: channelName },
      });
      return (response as ResourceResponse<ChannelDetail>)?.data?.data ?? null;
    },
    {
      refreshDeps: [channelName, notificationType],
      ready: Boolean(channelName && channelsLoaded && !notificationType),
      onSuccess: (detail) => {
        if (!channelName || !detail?.notificationType) {
          return;
        }
        setKnownChannelTypes((prev) =>
          prev[channelName] === detail.notificationType ? prev : { ...prev, [channelName]: detail.notificationType },
        );
      },
    },
  );

  const registration = useMemo(
    () => (notificationType ? plugin?.channelTypes.get(notificationType) : undefined),
    [notificationType, plugin],
  );
  const MessageConfigFormLoader = registration?.components?.MessageConfigFormLoader;
  const LegacyBody = registration?.components?.MessageConfigForm;

  const Body = useMemo(() => {
    if (MessageConfigFormLoader) {
      return lazy(MessageConfigFormLoader as LoaderOf<MessageConfigFormProps>);
    }
    return LegacyBody ?? null;
  }, [LegacyBody, MessageConfigFormLoader]);

  return (
    <>
      <Form.Item
        name={channelNamePath}
        label={t('Channel')}
        rules={[{ required: true, message: t('The field value is required') }]}
      >
        <RemoteSelect<ChannelOption>
          request={async () => {
            const response = await ctx.api.resource(COLLECTION_NAME.channels).list();
            const payload = (response as ResourceResponse<ChannelOption[]>)?.data?.data;
            return Array.isArray(payload) ? payload : [];
          }}
          cacheKey={`@nocobase/plugin-notification-manager:${COLLECTION_NAME.channels}:list`}
          onLoaded={(items) => {
            setChannelsLoaded(true);
            setKnownChannelTypes((prev) => mergeChannelTypes(prev, items));
          }}
          mapOptions={(item) => ({ label: compileT(item.title || item.name), value: item.name })}
        />
      </Form.Item>
      {Body ? (
        <Suspense fallback={<Spin />}>
          <Body variableOptions={variableOptions} namePrefix={namePrefix} />
        </Suspense>
      ) : null}
    </>
  );
}

export default MessageConfigForm;
