/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { Spin } from 'antd';
import React, { lazy, Suspense, useMemo } from 'react';
import PluginNotificationManagerClientV2 from '../plugin';
import type { ContentConfigFormProps, LoaderOf, RegisterChannelOptions } from '../notification-manager';

type NotificationManagerLike = {
  channelTypes: {
    get: (key: string) => RegisterChannelOptions | undefined;
  };
};

export function ContentConfigForm(props: ContentConfigFormProps & { channelType?: string }) {
  const { variableOptions, channelType, namePrefix } = props;
  const ctx = useFlowContext();
  const plugin =
    (ctx.app.pm.get(PluginNotificationManagerClientV2) as NotificationManagerLike | undefined) ??
    (ctx.app.pm.get('notification-manager') as NotificationManagerLike | undefined);
  const registration = useMemo(
    () => (channelType ? plugin?.channelTypes.get(channelType) : undefined),
    [channelType, plugin],
  );
  const ContentConfigFormLoader = registration?.components?.ContentConfigFormLoader;
  const LegacyBody = registration?.components?.ContentConfigForm;

  const Body = useMemo(() => {
    if (ContentConfigFormLoader) {
      return lazy(ContentConfigFormLoader as LoaderOf<ContentConfigFormProps>);
    }
    return LegacyBody ?? null;
  }, [ContentConfigFormLoader, LegacyBody]);

  if (!Body) return null;

  return (
    <Suspense fallback={<Spin />}>
      <Body variableOptions={variableOptions} namePrefix={namePrefix} />
    </Suspense>
  );
}

export default ContentConfigForm;
