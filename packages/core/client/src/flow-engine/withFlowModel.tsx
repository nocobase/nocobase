import React from 'react';
import { observer } from '@formily/react';
import { FlowModel } from '@nocobase/client';
import { useApplyFlow } from './hooks/useApplyFlow';
import { useContext } from './hooks/useContext';
import { UserContext } from './types';

type BaseFlowModelComponentProps<P extends React.ComponentProps<any>> = {
  model: FlowModel;
} & {
  [key in keyof P]?: P[key];
};

// 根据是否有默认flow来确定defaultFlow属性是否必填
type FlowModelComponentProps<P extends React.ComponentProps<any>> = 
  BaseFlowModelComponentProps<P> & {
    defaultFlow?: string;
  };

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { defaultFlow?: string; }
) {
  const defaultFlowKey = options.defaultFlow || '';
  const hasDefaultFlow = !!defaultFlowKey;

  // 使用条件类型确定props类型
  type PropsType = FlowModelComponentProps<P>;

  const WithFlowModelAndApply = observer((props: PropsType) => {
    const { model, defaultFlow, ...restPassthroughProps } = props;
    const flowContext = useContext();
    useApplyFlow(defaultFlow || defaultFlowKey || model.defaultFlow, model, flowContext as UserContext);

    const modelProps = model.getProps();
    const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

    return <WrappedComponent {...combinedProps} />;
  });

  WithFlowModelAndApply.displayName = `WithFlowModelAndApply(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithFlowModelAndApply;
} 