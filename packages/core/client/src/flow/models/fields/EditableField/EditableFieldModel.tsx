/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure } from '@nocobase/flow-engine';
import React from 'react';
import { FormFieldGridModel, FormModel } from '../..';
import { FieldModel } from '../../base/FieldModel';
import { JsonInput } from '../../common/JsonInput';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

type Structure = {
  parent: FormFieldGridModel | FormModel;
};

export class EditableFieldModel<T extends DefaultStructure = DefaultStructure> extends FieldModel<T> {
  static supportedFieldInterfaces = '*' as any;

  get form() {
    return this.context.form;
  }

  get component(): FieldComponentTuple {
    return [JsonInput, {}];
  }

  setProps(componentProps) {
    this.props = {
      ...this.props,
      ...componentProps,
    };
  }

  getProps() {
    return {
      style: { width: '100%' },
      ...this.collectionField.getComponentProps(),
      ...this.props,
    };
  }

  render() {
    const [Component, props = {}] = this.component;
    return <Component {...this.getProps()} {...props} />;
  }
}
