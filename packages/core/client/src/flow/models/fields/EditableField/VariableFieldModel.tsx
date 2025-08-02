/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Space } from 'antd';
import React from 'react';
import { FieldContext } from '@formily/react';
import { ReactiveField } from '../../../formily/ReactiveField';
import { EditableFieldModel } from './EditableFieldModel';
import { VariableSelector } from '../../../components/VariableSelector';
import { VariableTag } from '../../../components/VariableTag';

export class VariableFieldModel extends EditableFieldModel {
  // 它能够接受外部传过来的 value, onChange, metaTree, model 四个参数，由于它不需要序列化，因此可以直接model.setProps传递过来

  get component() {
    return null; // 不设置默认组件
  }

  render() {
    return (
      <FieldContext.Provider value={this.field}>
        <ReactiveField key={this.uid} field={this.field}>
          {this.renderVariableContent()}
        </ReactiveField>
      </FieldContext.Provider>
    );
  }

  renderVariableContent() {
    // 从props中获取参数
    const value = this.props.value;
    const onChange = this.props.onChange;
    const metaTree = this.props.metaTree;
    const originalModel = this.props.originalModel;

    console.log('🎨 VariableFieldModel.renderVariableContent called:', {
      value,
      uid: this.uid,
      allProps: this.props,
      hasOriginalModel: !!originalModel,
    });

    // value 有两种可能，一种是 /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/, 一种是普通字符串
    const variablePattern = /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/;
    const isVariable = typeof value === 'string' && variablePattern.test(value);

    console.log('🔍 Variable detection:', { value, isVariable, pattern: variablePattern.toString() });

    // return <span>222</span>;

    if (isVariable) {
      // 一个变量渲染的组件，这个组件外观也是一个输入框，但是它会把变量用一整个antd tag的方式渲染
      // 即类似于 [ctx/aaa/bbb][变量选择组件], 这两个组件应该用antd 里的Compact包一下
      return (
        <Space.Compact style={{ width: '100%' }}>
          <VariableTag
            value={value}
            metaTree={metaTree}
            onClear={() => {
              // 点击清除按钮时，切换到常量模式
              onChange?.('');
              this.setProps({ value: '' });
            }}
          />
          <VariableSelector
            metaTree={metaTree}
            value={value}
            onChange={(newValue: any) => {
              onChange?.(newValue);
              // 当选择"Null"或"Constant"时，除了清空value，还要切换至普通的model对应的组件
              if (newValue === null || newValue === '') {
                // 重新渲染整个VariableFieldModel
                this.setProps({ value: newValue });
              }
            }}
          />
        </Space.Compact>
      );
    } else {
      // model 对应的原始组件，可以手动输入: [可以通过 model.component获得][变量选择组件], 这两个组件应该用antd 里的Compact包一下
      const [OriginalComponent, originalProps] = originalModel?.component || [() => <input />, {}];

      return (
        <Space.Compact style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <OriginalComponent
              {...originalProps}
              value={value}
              onChange={(eventOrValue: any) => {
                // 关键修复：检查是否是事件对象，如果是则提取 target.value
                let actualValue = eventOrValue;
                if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
                  actualValue = eventOrValue.target.value;
                }
                console.log('🖊️ User input in OriginalComponent:', { oldValue: value, eventOrValue, actualValue });
                onChange?.(actualValue);
              }}
            />
          </div>
          <VariableSelector
            metaTree={metaTree}
            value={value}
            onChange={(newValue: any) => {
              onChange?.(newValue);
              // 当选择变量时，重新渲染
              if (newValue && typeof newValue === 'string' && /^\{\{\s*ctx\.([^}]+?)\s*\}\}$/.test(newValue)) {
                this.setProps({ value: newValue });
              }
            }}
          />
        </Space.Compact>
      );
    }
  }
}
