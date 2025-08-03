/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import { debounce } from 'lodash';
import { EditableFieldModel } from '../../../fields/EditableField/EditableFieldModel';

export class FilterFormEditableFieldModel extends EditableFieldModel {
  enableOperator = true;

  private dispose: Function;
  private debouncedDoFilter: ReturnType<typeof debounce>;

  onMount() {
    super.onMount();
    // 创建防抖的 doFilter 方法，延迟 300ms
    this.debouncedDoFilter = debounce(this.doFilter.bind(this), 300);
    this.dispose = reaction(
      () => this.field.value, // 追踪器函数：返回要监听的值
      () => {
        if (this.context.blockModel.autoTriggerFilter) {
          this.debouncedDoFilter(); // 响应器函数：值变化时执行
        }
      },
      {
        fireImmediately: false, // 首次不执行
      },
    );

    this.field.componentProps.onKeyDown = this.handleEnterPress.bind(this); // 添加回车事件监听
  }

  onUnmount() {
    super.onUnmount();
    this.dispose();
    // 取消防抖函数的执行
    this.debouncedDoFilter.cancel();
  }

  createField() {
    return this.form.createField({
      name: `${this.collectionField.name}_${this.uid}`, // 确保每个字段的名称唯一
      ...this.props,
      decorator: this.decorator,
      component: this.component,
    });
  }

  doFilter() {
    this.context.filterManager.refreshTargetsByFilter(this.uid);
  }

  doReset() {
    this.context.filterManager.refreshTargetsByFilter(this.uid);
  }

  /**
   * 获取用于显示在筛选条件中的字段值
   * @returns
   */
  getFilterValue() {
    return this.field.value;
  }

  /**
   * 处理回车事件
   * 当用户在输入框中按下回车键时触发筛选
   */
  handleEnterPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.preventDefault(); // 防止表单提交等默认行为
      this.doFilter(); // 立即执行筛选
    }
  };
}

FilterFormEditableFieldModel.registerFlow({
  key: 'filterFormItemSettings',
  title: 'Filter form item settings',
  steps: {
    connectFields: {
      use: 'connectFields',
    },
  },
});
