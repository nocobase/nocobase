/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, GeneralField, isVoidField } from '@formily/core';
import { RenderPropsChildren, SchemaComponentsContext } from '@formily/react';
import { toJS } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import { FormPath, isFn } from '@formily/shared';
import React, { Fragment, useContext } from 'react';
interface IReactiveFieldProps {
  field: GeneralField;
  children?: RenderPropsChildren<GeneralField>;
}

const mergeChildren = (children: RenderPropsChildren<GeneralField>, content: React.ReactNode) => {
  if (!children && !content) return;
  if (isFn(children)) return;
  return (
    <Fragment>
      {children}
      {content}
    </Fragment>
  );
};

const isValidComponent = (target: any) => target && (typeof target === 'object' || typeof target === 'function');

const renderChildren = (children: RenderPropsChildren<GeneralField>, field?: GeneralField, form?: Form) =>
  isFn(children) ? children(field, form) : children;

const ReactiveInternal: React.FC<IReactiveFieldProps> = (props) => {
  const components = useContext(SchemaComponentsContext);
  if (!props.field) {
    return <Fragment>{renderChildren(props.children)}</Fragment>;
  }
  const field = props.field;
  const content = mergeChildren(
    renderChildren(props.children, field, field.form),
    field.content ?? field.componentProps.children,
  );
  if (field.display !== 'visible') return null;

  const getComponent = (target: any) => {
    return isValidComponent(target) ? target : FormPath.getIn(components, target) ?? target;
  };

  const renderDecorator = (children: React.ReactNode) => {
    if (!field.decoratorType) {
      return <Fragment>{children}</Fragment>;
    }

    return React.createElement(getComponent(field.decoratorType), toJS(field.decoratorProps), children);
  };

  const renderComponent = () => {
    if (!field.componentType) return content;
    const value = !isVoidField(field) ? field.value : undefined;
    const onChange = !isVoidField(field)
      ? (...args: any[]) => {
          field.onInput(...args);
          field.componentProps?.onChange?.(...args);
        }
      : field.componentProps?.onChange;
    const onFocus = !isVoidField(field)
      ? (...args: any[]) => {
          field.onFocus(...args);
          field.componentProps?.onFocus?.(...args);
        }
      : field.componentProps?.onFocus;
    const onBlur = !isVoidField(field)
      ? (...args: any[]) => {
          field.onBlur(...args);
          field.componentProps?.onBlur?.(...args);
        }
      : field.componentProps?.onBlur;
    const disabled = !isVoidField(field) ? field.pattern === 'disabled' || field.pattern === 'readPretty' : undefined;
    const readOnly = !isVoidField(field) ? field.pattern === 'readOnly' : undefined;
    return React.createElement(
      getComponent(field.componentType),
      {
        disabled,
        readOnly,
        ...toJS(field.componentProps),
        value,
        onChange,
        onFocus,
        onBlur,
      },
      content,
    );
  };

  return renderDecorator(renderComponent());
};

ReactiveInternal.displayName = 'ReactiveField';

export const ReactiveField = observer(ReactiveInternal, {
  forwardRef: true,
});
