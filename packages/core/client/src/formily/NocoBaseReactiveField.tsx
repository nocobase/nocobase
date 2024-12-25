/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, GeneralField } from '@formily/core';
import { RenderPropsChildren, SchemaComponentsContext } from '@formily/react';
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

/**
 * To maintain high performance of Table, this component removes Formily-related code
 */
const NocoBaseReactiveInternal: React.FC<IReactiveFieldProps> = (props) => {
  const components = useContext(SchemaComponentsContext);
  const field: any = props.field;
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

    return React.createElement(getComponent(field.decoratorType), field.decoratorProps, children);
  };

  const renderComponent = () => {
    if (!field.componentType) return content;

    return React.createElement(
      getComponent(field.componentType),
      {
        ...field.componentProps,
        value: field.value,
      },
      content,
    );
  };

  return renderDecorator(renderComponent());
};

NocoBaseReactiveInternal.displayName = 'NocoBaseReactiveInternal';

/**
 * Based on @formily/react v2.3.2 NocoBaseReactiveField component
 * Modified to better adapt to NocoBase's needs
 */
export const NocoBaseReactiveField = NocoBaseReactiveInternal;

NocoBaseReactiveField.displayName = 'NocoBaseReactiveField';
