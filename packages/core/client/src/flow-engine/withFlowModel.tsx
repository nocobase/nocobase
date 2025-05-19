import React from 'react';
import { observer } from '@formily/react';
import { FlowModel } from '@nocobase/client';
import { useApplyFlow } from './hooks/useApplyFlow';
import { useContext } from './hooks/useContext';
import { UserContext } from './types';

type FlowModelComponentProps<P extends React.ComponentProps<any>> = 
  {
    model: FlowModel;
  } & P;

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { defaultFlow?: string; }
) {
  const defaultFlowKey = options.defaultFlow || '';

  // 根据是否提供 defaultFlow 选择不同的增强组件
  if (defaultFlowKey) {
    // 带有默认 flow 的增强组件
    const WithFlowModelAndApply = observer((props: FlowModelComponentProps<P>) => {
      const { model, ...restPassthroughProps } = props;
      const flowContext = useContext();
      // 始终应用默认流程
      useApplyFlow(defaultFlowKey, model, flowContext as UserContext);

      const modelProps = model.getProps();
      const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

      return <WrappedComponent {...combinedProps} />;
    });

    WithFlowModelAndApply.displayName = `WithFlowModelAndApply(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithFlowModelAndApply;
  } else {
    // 不带默认 flow 的简单增强组件
    const WithFlowModelOnly = observer((props: FlowModelComponentProps<P>) => {
      const { model, ...restPassthroughProps } = props;
      const modelProps = model.getProps();
      const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

      return <WrappedComponent {...combinedProps} />;
    });

    WithFlowModelOnly.displayName = `WithFlowModelOnly(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithFlowModelOnly;
  }
} 