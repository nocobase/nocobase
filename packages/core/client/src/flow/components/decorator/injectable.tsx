/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRuntimeContext, useFlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { ComponentType, PropsWithChildren, useEffect } from 'react';

export const bindInjectableRendingEvent = (C: ComponentType<any>, options?: InjectableRendingEventTriggerProps) => {
  return (props) => (
    <InjectableRendingEventTrigger {...options}>
      <C {...props} />
    </InjectableRendingEventTrigger>
  );
};

export type InjectableRendingEventTriggerProps = {
  mode?: 'runtime' | 'settings';
  name?: string;
  language?: string;
  scene?: string;
};

export const InjectableRendingEventTrigger: React.FC<PropsWithChildren<InjectableRendingEventTriggerProps>> = ({
  children,
  mode,
  ...props
}) => {
  if (React.Children.count(children) !== 1 || !React.isValidElement(children)) {
    throw new Error('InjectableRendingEventTrigger expects exactly one child element.');
  }

  return mode === 'runtime' ? (
    <RuntimeTrigger {...props}>{children}</RuntimeTrigger>
  ) : (
    <SettingsTrigger {...props}>{children}</SettingsTrigger>
  );
};

export const SettingsTrigger: React.FC<PropsWithChildren<Omit<InjectableRendingEventTriggerProps, 'mode'>>> = ({
  children,
  name,
  language,
  scene,
}) => {
  const ctx = useFlowSettingsContext();
  const props = useInjectableProps(ctx, name, language, scene, children);
  return React.cloneElement(children, props);
};

export const RuntimeTrigger: React.FC<PropsWithChildren<Omit<InjectableRendingEventTriggerProps, 'mode'>>> = ({
  children,
  name,
  language,
  scene,
}) => {
  const ctx = useFlowContext<FlowRuntimeContext>();
  const props = useInjectableProps(ctx, name, language, scene, children);
  return React.cloneElement(children, props);
};

const useInjectableProps = (ctx: FlowRuntimeContext, name: string, language: string, scene: string, children: any) => {
  const [props, setProps] = React.useState({});

  useEffect(() => {
    if (ctx) {
      ctx.model.dispatchEvent('InjectableRending', {
        ctx,
        name,
        language,
        scene,
        children,
        setProps,
      });
    }
  }, [ctx, name, language, scene, children]);

  return props;
};
