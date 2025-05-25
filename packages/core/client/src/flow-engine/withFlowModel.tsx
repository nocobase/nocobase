import React from 'react';
import { observer } from '@formily/react';
import { FlowModel } from '@nocobase/client';
import { useApplyDefaultFlows } from './hooks/useApplyFlow';
import { useContext } from './hooks/useContext';
import { UserContext } from './types';

type BaseFlowModelComponentProps<P extends React.ComponentProps<any>> = {
  model: FlowModel;
} & {
  [key in keyof P]?: P[key];
};

// HOC 选项接口
interface WithFlowModelOptions {
  applyDefaultFlows?: boolean; // 是否执行默认流程，默认为 true
  settings?: {
    component?: React.ComponentType<{ model: FlowModel; children: React.ReactNode; [key: string]: any }>; // 设置组件，作为wrapper
    props?: Record<string, any>; // 传递给设置组件的参数
  };
}

// 不应用默认流程的组件
function WithFlowModelWithoutFlows<P extends object>(
  props: BaseFlowModelComponentProps<P>, 
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptions
) {
  const { model, ...restPassthroughProps } = props;

  const modelProps = model.getProps();
  const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

  let wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果有设置组件，使用设置组件作为wrapper包装原始组件
  if (options?.settings?.component) {
    const SettingsComponent = options.settings.component;
    const settingsProps = {
      model,
      children: wrappedElement,
      ...options.settings.props
    };
    
    return <SettingsComponent {...settingsProps} />;
  } else {
    // 如果没有设置组件，直接返回原始组件
    return wrappedElement;
  }
}

// 应用默认流程的组件
function WithFlowModelWithFlows<P extends object>(
  props: BaseFlowModelComponentProps<P>, 
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptions
) {
  const { model, ...restPassthroughProps } = props;
  const flowContext = useContext();

  // 应用默认流程
  useApplyDefaultFlows(model, flowContext as UserContext);

  const modelProps = model.getProps();
  const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

  let wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果有设置组件，使用设置组件作为wrapper包装原始组件
  if (options?.settings?.component) {
    const SettingsComponent = options.settings.component;
    const settingsProps = {
      model,
      children: wrappedElement,
      ...options.settings.props
    };
    
    return <SettingsComponent {...settingsProps} />;
  } else {
    // 如果没有设置组件，直接返回原始组件
    return wrappedElement;
  }
}

// HOC，关联 FlowModel 并可选择是否执行默认流程
export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptions,
) {
  type PropsType = BaseFlowModelComponentProps<P>;

  // 默认应用默认流程
  const shouldApplyDefaultFlows = options?.applyDefaultFlows ?? true;

  // 根据配置选择不同的内部组件实现
  const WithFlowModel = shouldApplyDefaultFlows
    ? observer((props: PropsType) => WithFlowModelWithFlows(props, WrappedComponent, options))
    : observer((props: PropsType) => WithFlowModelWithoutFlows(props, WrappedComponent, options));

  WithFlowModel.displayName = `WithFlowModel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithFlowModel;
} 