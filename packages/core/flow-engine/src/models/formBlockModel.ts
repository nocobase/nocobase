/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataBlockModel } from './dataBlockModel';
import { ObjectResource } from '../resources';
import { StepParams } from '../types';

// TODO: 未完成

export class FormBlockModel<TData = Record<string, any>> extends DataBlockModel {
  public declare resource: ObjectResource<TData>;

  constructor(options: { uid: string; stepParams?: StepParams; resource?: ObjectResource<TData> }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
      resource: options.resource,
    });
  }

  // 加载表单数据
  async load(params?: Record<string, any>): Promise<TData | null> {
    // TODO: 将 params 传递给 resource 的 load 方法
    console.log('FormBlockModel load 被调用，参数：', params);
    return this.resource.load();
  }

  // 重载表单数据
  async reload(): Promise<TData | null> {
    return this.resource.reload();
  }

  // // 保存表单数据
  // async save(): Promise<boolean> {
  //   try {
  //     // TODO: 调用 api 保存数据

  //     console.log('FormBlockModel save 被调用，数据：', this.resource.data);
  //     return true;
  //   } catch (error) {
  //     console.error('保存表单数据失败：', error);
  //     return false;
  //   }
  // }

  // 重置表单数据
  reset(): void {
    // TODO: 根据情况决定如何重置
    // 可能是清空数据
    // 或者重新加载初始数据
    this.resource.setData(null);
    // this.resource.reload();
  }

  // 设置表单数据（部分或全部）
  setFormData(data: Partial<TData>) {
    if (this.resource.data === null) {
      this.resource.setData(data as TData);
    } else {
      // TODO: 合并现有数据和新数据
      this.resource.setData({
        ...this.resource.data,
        ...data,
      } as TData);
    }
  }

  // 获取表单数据
  getFormData(): TData | null {
    return this.resource.data;
  }

  // 获取表单值
  getFieldValue(fieldName: string): any {
    if (!this.resource.data) return undefined;
    return (this.resource.data as any)[fieldName];
  }

  // 设置表单值
  setFieldValue(fieldName: string, value: any): void {
    if (!this.resource.data) {
      const data: Record<string, any> = {};
      data[fieldName] = value;
      this.resource.setData(data as TData);
    } else {
      const updatedData = { ...(this.resource.data as any) };
      updatedData[fieldName] = value;
      this.resource.setData(updatedData as TData);
    }
  }

  getProps() {
    return {
      ...super.getProps(),
      initialValues: this.resource.data || {},
      onValuesChange: (changedValues: any) => {
        this.setFormData(changedValues as Partial<TData>);
      },
      onSubmit: async (values: TData) => {
        this.resource.setData(values);
        return this.save();
      },
      actions: this.actions,
      fields: this.fields,
    };
  }
}
