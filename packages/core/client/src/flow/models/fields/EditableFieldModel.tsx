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
import { FormGridModel, FormModel } from '../..';
import { JsonInput } from '../../components';
import { FieldModel } from '../base/FieldModel';

type FieldComponentTuple = [component: React.ElementType, props: Record<string, any>] | any[];

type Structure = {
  parent: FormGridModel | FormModel;
};

export class EditableFieldModel<T extends DefaultStructure = DefaultStructure> extends FieldModel<T> {
  static supportedFieldInterfaces = '*' as any;

  get form() {
    return this.context.form;
  }

  get component(): FieldComponentTuple {
    return [JsonInput, {}];
  }

  setProps(props) {
    this.props = {
      ...this.props,
      ...props,
    };
  }

  getProps() {
    return {
      style: { width: '100%' },
      ...this.props,
    };
  }

  render() {
    const [Component, props = {}] = this.component;
    return <Component {...props} {...this.getProps()} />;
  }
}
