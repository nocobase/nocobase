/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import _, { debounce } from 'lodash';
import { CollectionBlockModel } from '../../../base/BlockModel';
import { EditableFieldModel } from '../../../fields/EditableField/EditableFieldModel';
import { FilterManager } from '../../filter-manager/FilterManager';

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

  addFilterGroupToTargetModels() {
    const filterManager: FilterManager = this.context.filterManager;
    const connectFieldsConfig = filterManager.getConnectFieldsConfig(this.uid);
    const operator = connectFieldsConfig?.operator || '$eq';
    const targets = connectFieldsConfig.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.targetModelUid);
      if (model) {
        const value = this.getFilterValue();
        if (value != null && value !== '' && !_.isEmpty(value) && target.targetFieldPaths?.length) {
          const targetFieldPaths = target.targetFieldPaths;

          if (targetFieldPaths.length === 1) {
            const path = targetFieldPaths[0];
            const targetField = model.collection.getField(path);

            // 如果是关系字段，则需拼接上 filterTargetKey
            if (targetField?.targetCollection) {
              model.resource.addFilterGroup(this.uid, {
                [`${path}.${targetField.targetCollection.filterTargetKey}`]: {
                  [operator]: value,
                },
              });
            } else {
              model.resource.addFilterGroup(this.uid, {
                [path]: {
                  [operator]: value,
                },
              });
            }
          } else {
            // 如果有多个目标字段，则使用 $or 连接
            const orConditions = targetFieldPaths.map((path) => {
              const targetField = model.collection.getField(path);

              // 如果是关系字段，则需拼接上 filterTargetKey
              if (targetField?.targetCollection) {
                return {
                  [`${path}.${targetField.targetCollection.filterTargetKey}`]: {
                    [operator]: value,
                  },
                };
              } else {
                return {
                  [path]: {
                    [operator]: value,
                  },
                };
              }
            });

            model.resource.addFilterGroup(this.uid, {
              $or: orConditions,
            });
          }
        } else {
          model.resource.removeFilterGroup(this.uid);
        }
      }
    });
  }

  removeFilterGroupFromTargetModels() {
    const filterManager: FilterManager = this.context.filterManager;
    const connectFieldsConfig = filterManager.getConnectFieldsConfig(this.uid);
    const operator = connectFieldsConfig.operator || '$eq';
    const targets = connectFieldsConfig.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.targetModelUid);
      if (model) {
        model.resource.removeFilterGroup(this.uid);
      }
    });
  }

  doFilter() {
    this.context.filterManager.refreshTargetsByFilter(this.uid);
  }

  doReset() {
    const filterManager: FilterManager = this.context.filterManager;
    const connectFieldsConfig = filterManager.getConnectFieldsConfig(this.uid);
    const targets = connectFieldsConfig?.targets || [];

    if (!targets.length) {
      return;
    }

    this.removeFilterGroupFromTargetModels();
    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.targetModelUid);
      if (model) {
        model.resource.refresh();
      }
    });
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
