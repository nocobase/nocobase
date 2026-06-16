/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { DateFilterDynamicComponent } from '../../models/blocks/filter-form/fields/date-time/components/DateFilterDynamicComponent';
import { translateOptions } from './enumOptionsUtils';

type OperatorMeta = {
  value?: string;
  schema?: {
    'x-component'?: string;
    'x-component-props'?: Record<string, unknown>;
  };
};

type ComponentRegistry = {
  getComponent?: (name: string) => ComponentType<Record<string, unknown>> | undefined;
};

type OperatorComponentFieldModel = {
  props?: Record<string, unknown>;
  render?: () => ReactNode;
  __originalRender?: () => ReactNode;
  translate?: (text: string) => string;
};

type OperatorComponentRenderOptions = {
  app?: ComponentRegistry;
  fieldModel: unknown;
  operator: string;
  operators?: OperatorMeta[];
  propsPriority?: 'field' | 'operator';
  style?: CSSProperties;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function pickOperatorStyle(value: unknown): CSSProperties | undefined {
  return isRecord(value) ? (value as CSSProperties) : undefined;
}

function getFieldModel(fieldModel: unknown) {
  return fieldModel as OperatorComponentFieldModel & {
    _reactiveWrapperCache?: unknown;
    setupReactiveRender?: () => void;
  };
}

function rewrapReactiveRender(fieldModel: unknown) {
  const mutableFieldModel = getFieldModel(fieldModel);
  mutableFieldModel._reactiveWrapperCache = undefined;
  mutableFieldModel.setupReactiveRender?.();
}

/**
 * 根据操作符的 schema 定位组件及其 props。
 */
export function resolveOperatorComponent(
  app: ComponentRegistry | undefined,
  operator: string,
  operators?: OperatorMeta[],
) {
  if (!operators || !Array.isArray(operators)) return null;
  const op = operators.find((item) => item?.value === operator);
  const schema = op?.schema;
  const xComp = schema?.['x-component'];
  if (!xComp) return null;
  let Comp: ComponentType<Record<string, unknown>> | undefined;
  if (xComp === 'DateFilterDynamicComponent') {
    Comp = DateFilterDynamicComponent as ComponentType<Record<string, unknown>>;
  } else {
    Comp = app?.getComponent?.(xComp);
  }
  if (!Comp) return null;
  const props = isRecord(schema?.['x-component-props']) ? schema['x-component-props'] : {};
  return { Comp, props };
}

export function restoreOperatorComponentRender(fieldModel?: unknown) {
  const mutableFieldModel = getFieldModel(fieldModel);
  if (!mutableFieldModel || typeof mutableFieldModel.__originalRender !== 'function') {
    return false;
  }

  mutableFieldModel.render = mutableFieldModel.__originalRender;
  rewrapReactiveRender(mutableFieldModel);
  return true;
}

function translateComponentOptions(props: Record<string, unknown>, translate: ((text: string) => string) | undefined) {
  if (!Array.isArray(props.options) || typeof translate !== 'function') {
    return props;
  }

  return {
    ...props,
    options: translateOptions(props.options, translate),
  };
}

export function applyOperatorComponentRender({
  app,
  fieldModel,
  operator,
  operators,
  propsPriority = 'field',
  style,
}: OperatorComponentRenderOptions) {
  const mutableFieldModel = getFieldModel(fieldModel);
  const resolved = resolveOperatorComponent(app, operator, operators);
  if (!resolved) {
    restoreOperatorComponentRender(mutableFieldModel);
    return false;
  }

  if (!mutableFieldModel.__originalRender && typeof mutableFieldModel.render === 'function') {
    mutableFieldModel.__originalRender = mutableFieldModel.render;
  }

  const { Comp, props: operatorProps } = resolved;
  const operatorStyle = pickOperatorStyle(operatorProps.style);

  mutableFieldModel.render = () => {
    const fieldProps = mutableFieldModel.props || {};
    const fieldStyle = pickOperatorStyle(fieldProps.style);
    const mergedProps =
      propsPriority === 'operator' ? { ...fieldProps, ...operatorProps } : { ...operatorProps, ...fieldProps };
    const componentProps = translateComponentOptions(mergedProps, mutableFieldModel.translate);
    const componentStyle =
      propsPriority === 'operator' ? { ...fieldStyle, ...operatorStyle } : { ...operatorStyle, ...fieldStyle };
    const mergedStyle = { ...(style || {}), ...componentStyle };

    return React.createElement(Comp, {
      ...componentProps,
      ...(Object.keys(mergedStyle).length > 0 ? { style: mergedStyle } : {}),
      onCompositionStart: null,
      onCompositionEnd: null,
    });
  };

  rewrapReactiveRender(mutableFieldModel);
  return true;
}
