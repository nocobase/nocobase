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
  setupReactiveRender?: () => void;
  _reactiveWrapperCache?: unknown;
  __originalRender?: () => ReactNode;
};

type OperatorComponentRenderOptions = {
  app?: ComponentRegistry;
  fieldModel: OperatorComponentFieldModel;
  operator: string;
  operators?: OperatorMeta[];
  propsPriority?: 'field' | 'operator';
  style?: CSSProperties;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getStyle(value: unknown): CSSProperties | undefined {
  return isRecord(value) ? (value as CSSProperties) : undefined;
}

function rewrapReactiveRender(fieldModel: OperatorComponentFieldModel) {
  fieldModel._reactiveWrapperCache = undefined;
  fieldModel.setupReactiveRender?.();
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

export function restoreOperatorComponentRender(fieldModel?: OperatorComponentFieldModel) {
  if (!fieldModel || typeof fieldModel.__originalRender !== 'function') {
    return false;
  }

  fieldModel.render = fieldModel.__originalRender;
  rewrapReactiveRender(fieldModel);
  return true;
}

export function applyOperatorComponentRender({
  app,
  fieldModel,
  operator,
  operators,
  propsPriority = 'field',
  style,
}: OperatorComponentRenderOptions) {
  const resolved = resolveOperatorComponent(app, operator, operators);
  if (!resolved) {
    restoreOperatorComponentRender(fieldModel);
    return false;
  }

  if (!fieldModel.__originalRender && typeof fieldModel.render === 'function') {
    fieldModel.__originalRender = fieldModel.render;
  }

  const { Comp, props: operatorProps } = resolved;
  const operatorStyle = getStyle(operatorProps.style);

  fieldModel.render = () => {
    const fieldProps = fieldModel.props || {};
    const fieldStyle = getStyle(fieldProps.style);
    const componentProps =
      propsPriority === 'operator' ? { ...fieldProps, ...operatorProps } : { ...operatorProps, ...fieldProps };
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

  rewrapReactiveRender(fieldModel);
  return true;
}
