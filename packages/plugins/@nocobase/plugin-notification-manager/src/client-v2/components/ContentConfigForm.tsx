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
import type { ContentConfigFormProps } from '../notification-manager';

export function ContentConfigForm(props: ContentConfigFormProps & { channelType?: string }) {
  const { variableOptions, channelType } = props;
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginNotificationManagerClientV2);

  const ContentConfigFormLoader = useMemo(
    () => (channelType ? plugin?.channelTypes.get(channelType)?.components?.ContentConfigFormLoader : undefined),
    [plugin, channelType],
  );

  const Body = useMemo(
    () => (ContentConfigFormLoader ? lazy(ContentConfigFormLoader) : null),
    [ContentConfigFormLoader],
  );

  if (!Body) return null;

  return (
    <Suspense fallback={<Spin />}>
      <Body variableOptions={variableOptions} />
    </Suspense>
  );
}

export default ContentConfigForm;
