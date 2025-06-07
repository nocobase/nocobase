/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataBlockModel } from './dataBlockModel';
import { SingleRecordResource } from '../resources';
import { StepParams } from '../types';

// TODO: 未完成

export class FormBlockModel<TData = Record<string, any>> extends DataBlockModel {
  public declare resource: SingleRecordResource<TData>;

  constructor(options: { uid: string; stepParams?: StepParams; resource?: SingleRecordResource<TData> }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
      resource: options.resource,
    });
  }

  // 加载表单数据
  async load(params?: Record<string, any>): Promise<TData | null> {
    // TODO: 将 params 传递给 resource 的 refresh 方法
    console.log('FormBlockModel load 被调用，参数：', params);
    await this.resource.refresh();
    return this.resource.getData();
  }

  // 重载表单数据
  async reload(): Promise<TData | null> {
    await this.resource.refresh();
    return this.resource.getData();
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
    this.resource.setData({} as TData);
    // this.resource.refresh();
  }

  // 设置表单数据（部分或全部）
  setFormData(data: Partial<TData>) {
    const currentData = this.resource.getData();
    if (!currentData || Object.keys(currentData).length === 0) {
      this.resource.setData(data as TData);
    } else {
      // TODO: 合并现有数据和新数据
      this.resource.setData({
        ...currentData,
        ...data,
      } as TData);
    }
  }

  // 获取表单数据
  getFormData(): TData {
    return this.resource.getData();
  }

  // 获取表单值
  getFieldValue(fieldName: string): any {
    const data = this.resource.getData();
    if (!data) return undefined;
    return (data as any)[fieldName];
  }

  // 设置表单值
  setFieldValue(fieldName: string, value: any): void {
    const currentData = this.resource.getData();
    if (!currentData || Object.keys(currentData).length === 0) {
      const data: Record<string, any> = {};
      data[fieldName] = value;
      this.resource.setData(data as TData);
    } else {
      const updatedData = { ...(currentData as any) };
      updatedData[fieldName] = value;
      this.resource.setData(updatedData as TData);
    }
  }

  getProps() {
    return {
      initialValues: this.resource.getData() || {},
      onValuesChange: (changedValues: any) => {
        this.setFormData(changedValues as Partial<TData>);
      },
      onSubmit: async (values: TData) => {
        this.resource.setData(values);
        await this.resource.save();
        return true;
      },
      fields: this.fields,
    };
  }
}
