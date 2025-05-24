import React from 'react';
import { observer } from '@formily/react';
import { FlowModel } from '@nocobase/client';
import { useApplyDefaultFlows } from './hooks/useApplyFlow';
import { useContext } from './hooks/useContext';
import { UserContext } from './types';
import FlowsContextMenu from '../../docs/zh-CN/core/event-and-filter/demos/settings/menu/FlowsContextMenu';

type BaseFlowModelComponentProps<P extends React.ComponentProps<any>> = {
  model: FlowModel;
} & {
  [key in keyof P]?: P[key];
};

// HOC 选项接口
interface WithFlowModelOptions {
  applyDefaultFlows?: boolean; // 是否执行默认流程，默认为 true
  enableFlowsContextMenu?: boolean; // 是否启用flows右键菜单，默认为 true
  flowsMenuPosition?: 'right' | 'left'; // 右键菜单位置，默认为 'right'
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

  const wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果启用了flows右键菜单，包装在FlowsContextMenu中
  if (options?.enableFlowsContextMenu !== false) {
    return (
      <FlowsContextMenu 
        model={model} 
        enabled={true}
        position={options?.flowsMenuPosition}
      >
        {wrappedElement}
      </FlowsContextMenu>
    );
  }

  return wrappedElement;
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

  const wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果启用了flows右键菜单，包装在FlowsContextMenu中
  if (options?.enableFlowsContextMenu !== false) {
    return (
      <FlowsContextMenu 
        model={model} 
        enabled={true}
        position={options?.flowsMenuPosition}
      >
        {wrappedElement}
      </FlowsContextMenu>
    );
  }

  return wrappedElement;
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