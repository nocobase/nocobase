/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRuntimeContext, useFlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { PropsWithChildren, useEffect } from 'react';

export type InjectableRendingEventTriggerProps = {
  mode?: 'runtime' | 'settings';
  name?: string;
};

export const InjectableRendingEventTrigger: React.FC<PropsWithChildren<InjectableRendingEventTriggerProps>> = ({
  children,
  mode,
  name,
}) => {
  if (React.Children.count(children) !== 1 || !React.isValidElement(children)) {
    throw new Error('InjectableRendingEventTrigger expects exactly one child element.');
  }

  return mode === 'runtime' ? (
    <RuntimeTrigger name={name}>{children}</RuntimeTrigger>
  ) : (
    <SettingsTrigger name={name}>{children}</SettingsTrigger>
  );
};

export const SettingsTrigger: React.FC<PropsWithChildren<{ name: string }>> = ({ children, name }) => {
  const ctx = useFlowSettingsContext();
  const props = useInjectableProps(ctx, name, children);
  return React.cloneElement(children, props);
};

export const RuntimeTrigger: React.FC<PropsWithChildren<{ name: string }>> = ({ children, name }) => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const props = useInjectableProps(ctx, name, children);
  return React.cloneElement(children, props);
};

const useInjectableProps = (ctx: FlowRuntimeContext, name: string, children: any) => {
  const [props, setProps] = React.useState({});

  useEffect(() => {
    if (ctx) {
      ctx.model.dispatchEvent('InjectableRending', {
        ctx,
        name,
        children,
        setProps,
      });
    }
  }, [ctx, name, children]);

  return props;
};
