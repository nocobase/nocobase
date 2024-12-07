/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IFieldProps } from '@formily/core';
import { JSXComponent, Schema } from '@formily/react';
import { toArr } from '@formily/shared';
import _ from 'lodash';

export function createNocoBaseField<Decorator extends JSXComponent, Component extends JSXComponent>(props: any) {
  return new NocoBaseField(props);
}

/**
 * Compared to the Field class, NocoBaseField has better performance
 */
class NocoBaseField<
  Decorator extends JSXComponent = any,
  Component extends JSXComponent = any,
  TextType = any,
  ValueType = any,
> {
  props: IFieldProps<Decorator, Component, TextType, ValueType> & {
    schema: Schema;
    compile: (source: any) => any;
  };
  initialized: boolean;
  loading: boolean;
  validating: boolean;
  submitting: boolean;
  selfModified: boolean;
  active: boolean;
  visited: boolean;
  mounted: boolean;
  unmounted: boolean;
  inputValues: any[];
  inputValue: any;
  feedbacks: any[];
  title: string;
  description: string;
  display: string;
  pattern: string;
  editable: boolean;
  disabled: boolean;
  readOnly: boolean;
  readPretty: boolean;
  visible: boolean;
  hidden: boolean;
  dataSource: any[];
  validator: any;
  required: boolean;
  content: string;
  initialValue: any;
  value: any;
  data: any;
  decorator: any[];
  component: any[];
  decoratorProps: any;
  componentProps: any;
  decoratorType: any;
  componentType: any;
  path: any;
  form: any;
  address: any;

  constructor(props: any) {
    this.props = props;
    this.initialize();
    // this.makeObservable();
  }

  protected initialize() {
    const compile = this.props.compile;

    this.pattern = 'readPretty';
    this.readPretty = true;

    this.initialized = true;
    this.loading = false;
    this.validating = false;
    this.submitting = false;
    this.selfModified = false;
    this.active = false;
    this.visited = true;
    this.mounted = true;
    this.unmounted = false;
    this.inputValues = [];
    this.inputValue = null;
    this.feedbacks = [];
    this.title = compile(this.props.title || this.props.schema?.title);
    this.description = compile(this.props.description || this.props.schema?.['description']);
    this.display = 'visible';
    this.editable = this.props.editable || this.props.schema?.['x-editable'];
    this.disabled = this.props.disabled || this.props.schema?.['x-disabled'];
    this.readOnly = this.props.readOnly || this.props.schema?.['x-read-only'];
    this.visible = this.props.visible || this.props.schema?.['x-visible'];
    this.hidden = this.props.hidden || this.props.schema?.['x-hidden'];
    this.dataSource = compile(this.props.dataSource || (this.props.schema?.enum as any));
    this.validator = this.props.validator;
    this.required = this.props.required || !!this.props.schema?.required;
    this.content = compile(this.props.content || this.props.schema?.['x-content']);
    this.initialValue = compile(this.props.initialValue || this.props.schema?.default);
    this.value = compile(this.props.value);
    this.data = this.props.data || this.props.schema?.['x-data'];
    this.decorator = this.props.decorator
      ? toArr(this.props.decorator)
      : [this.props.schema?.['x-decorator'], this.props.schema?.['x-decorator-props']];
    this.component = this.props.component
      ? toArr(this.props.component)
      : [this.props.schema?.['x-component'], this.props.schema?.['x-component-props']];
    this.decoratorProps = this.props.schema?.['x-decorator-props'] || {};
    this.componentProps = this.props.schema?.['x-component-props'] || {};
    this.decoratorType = this.props.schema?.['x-decorator'];
    this.componentType = this.props.schema?.['x-component'];

    this.path = {};
    this.form = {};
    this.address = {
      concat: _.noop,
    };
  }

  // protected makeObservable() {
  //   define(this, {
  //     componentProps: observable,
  //   });
  // }
}
