/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/react';
import { FlowModel } from './models';
import { useApplyAutoFlows } from './hooks/useApplyFlow';
import { useFlowContext } from './hooks/useFlowContext';
import { useFlowModel } from './hooks/useFlowModel';
import { UserContext } from './types';

// 基础组件props类型
type BaseFlowModelComponentProps<P extends React.ComponentProps<any>> = {
  model?: FlowModel;
} & {
  [key in keyof P]?: P[key];
};

// 当不提供model创建选项时的props类型，model 必须提供且类型为 FlowModel
type PropsWithRequiredModel<P extends React.ComponentProps<any>> = {
  model: FlowModel;
} & {
  [key in keyof P]?: P[key];
};

// 当提供model创建选项时的props类型，model 不能提供（类型为never）
type PropsWithNeverModel<P extends React.ComponentProps<any>> = {
  model?: never;
} & {
  [key in keyof P]?: P[key];
};

// HOC 选项接口，使用条件类型确保正确的依赖关系
interface WithFlowModelOptionsBase {
  settings?: {
    component?: React.ComponentType<{
      model?: FlowModel;
      uid?: string;
      children?: React.ReactNode;
      [key: string]: any;
    }>; // 设置组件，作为wrapper
    props?: Record<string, any>; // 传递给设置组件的参数
  };
}

// 当提供use时，uid可选
interface WithFlowModelOptionsWithUse extends WithFlowModelOptionsBase {
  use: string; // 模型类名，如 'MarkdownModel'
  uid?: string; // 模型uid，可选
}

// 当不提供use但提供uid时，use必填
interface WithFlowModelOptionsWithUid extends WithFlowModelOptionsBase {
  use: string; // 模型类名，当提供uid时必填
  uid: string; // 模型uid
}

// 当都不提供时
interface WithFlowModelOptionsWithoutModel extends WithFlowModelOptionsBase {
  use?: never;
  uid?: never;
}

// 联合类型
type WithFlowModelOptions =
  | WithFlowModelOptionsWithUse
  | WithFlowModelOptionsWithUid
  | WithFlowModelOptionsWithoutModel;

// 当已经有模型时的组件
function WithExistingModel<P extends object>({
  model,
  WrappedComponent,
  options,
  ...restProps
}: {
  model: FlowModel;
  WrappedComponent: React.ComponentType<P>;
  options?: WithFlowModelOptions;
} & P) {
  const flowContext = useFlowContext();

  // 始终应用默认流程
  useApplyAutoFlows(model, flowContext as UserContext);

  const modelProps = model?.getProps();
  const combinedProps = { ...restProps, ...modelProps } as unknown as P;

  const wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果有设置组件，使用设置组件作为wrapper包装原始组件
  if (options?.settings?.component) {
    const SettingsComponent = options.settings.component;
    const settingsProps = {
      model,
      children: wrappedElement,
      ...options.settings.props,
    };

    return <SettingsComponent {...settingsProps} />;
  } else {
    // 如果没有设置组件，直接返回原始组件
    return wrappedElement;
  }
}

// 当需要创建模型时的组件
function WithCreatedModel<P extends object>({
  uid,
  use,
  WrappedComponent,
  options,
  ...restProps
}: {
  uid: string;
  use: string;
  WrappedComponent: React.ComponentType<P>;
  options?: WithFlowModelOptions;
} & P) {
  const flowContext = useFlowContext();

  // 使用 useFlowModel 创建模型
  const model = useFlowModel(uid, use);

  // 始终应用默认流程
  useApplyAutoFlows(model, flowContext as UserContext);

  const modelProps = model?.getProps();
  const combinedProps = { ...restProps, ...modelProps } as unknown as P;

  const wrappedElement = <WrappedComponent {...combinedProps} />;

  // 如果有设置组件，使用设置组件作为wrapper包装原始组件
  if (options?.settings?.component) {
    const SettingsComponent = options.settings.component;
    const settingsProps = {
      model,
      children: wrappedElement,
      ...options.settings.props,
    };

    return <SettingsComponent {...settingsProps} />;
  } else {
    // 如果没有设置组件，直接返回原始组件
    return wrappedElement;
  }
}

// 内部组件实现 - 根据条件渲染不同的组件
function WithFlowModelInternal<P extends object>(
  props: BaseFlowModelComponentProps<P>,
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptions,
) {
  const { model: propModel, ...restPassthroughProps } = props;

  // 如果已经有模型，使用现有模型组件
  if (propModel) {
    // 当提供了 use 和 uid 时，不应该同时提供 model
    if (options?.use && options?.uid) {
      throw new Error(
        'Cannot provide both model prop and use/uid options. When use and uid are provided, model should not be provided.',
      );
    }

    return (
      <WithExistingModel
        model={propModel}
        WrappedComponent={WrappedComponent}
        options={options}
        {...(restPassthroughProps as P)}
      />
    );
  }

  // 如果需要创建模型且提供了必要参数
  if (options?.use && options?.uid) {
    return (
      <WithCreatedModel
        uid={options.uid}
        use={options.use}
        WrappedComponent={WrappedComponent}
        options={options}
        {...(restPassthroughProps as P)}
      />
    );
  }

  // 如果既没有模型也没有创建参数，抛出错误
  throw new Error('Model is required. Either provide model prop or specify use and uid in options.');
}

// HOC函数重载，提供不同的类型签名
export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithFlowModelOptionsWithUse & { uid: string },
): React.ComponentType<PropsWithNeverModel<P>>;

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithFlowModelOptionsWithUid,
): React.ComponentType<PropsWithNeverModel<P>>;

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithFlowModelOptionsWithUse & { uid?: undefined },
): React.ComponentType<PropsWithRequiredModel<P>>;

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptionsWithoutModel,
): React.ComponentType<PropsWithRequiredModel<P>>;

export function withFlowModel<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithFlowModelOptions,
) {
  const WithFlowModel = observer((props: BaseFlowModelComponentProps<P>) =>
    WithFlowModelInternal(props, WrappedComponent, options),
  );

  WithFlowModel.displayName = `WithFlowModel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithFlowModel;
}
