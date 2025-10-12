/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FilterFormCustomItemModel } from '../FilterFormCustomItemModel';
import { escapeT, FieldModelRenderer, FormItem, useFlowEngine } from '@nocobase/flow-engine';
import { FieldComponentProps } from './FieldComponentProps';
import { debounce } from 'lodash';
import { Cascader } from 'antd';

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  fieldModelInstance = null;

  operator: string;

  private debouncedDoFilter: ReturnType<typeof debounce>;

  get defaultTargetUid(): string {
    return this.getStepParams('filterFormItemSettings', 'init').defaultTargetUid;
  }

  onInit(options) {
    super.onInit(options);
    // 创建防抖的 doFilter 方法，延迟 300ms
    this.debouncedDoFilter = debounce(this.doFilter.bind(this), 300);
  }

  onUnmount() {
    super.onUnmount();
    // 取消防抖函数的执行
    this.debouncedDoFilter.cancel();
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
    return this.context.form?.getFieldValue(this.props.name);
  }

  /**
   * 处理回车事件
   * 当用户在输入框中按下回车键时触发筛选
   */
  handleEnterPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // 防止表单提交等默认行为
      this.doFilter(); // 立即执行筛选
    }
  };

  getValueProps(value) {
    if (this.context.blockModel.autoTriggerFilter) {
      this.debouncedDoFilter(); // 当值发生变化时，触发一次筛选
    }

    return {
      value,
      onKeyDown: this.handleEnterPress.bind(this), // 添加回车事件监听
    };
  }

  render() {
    if (!this.fieldModelInstance) {
      return null;
    }

    return (
      <FormItem {...this.props} getValueProps={this.getValueProps.bind(this)}>
        <FieldModelRenderer model={this.fieldModelInstance} />
      </FormItem>
    );
  }
}

FilterFormCustomFieldModel.define({
  label: '{{t("Custom field")}}',
  sort: 1,
});

FilterFormCustomFieldModel.registerFlow({
  key: 'formItemSettings',
  title: escapeT('Form item settings'),
  steps: {
    fieldSettings: {
      preset: true,
      title: escapeT('Field Settings'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Field title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        source: {
          type: 'array',
          title: escapeT('Field source'),
          'x-decorator': 'FormItem',
          'x-component': SourceCascader,
          'x-component-props': {
            placeholder: escapeT('Select a source field to use metadata of the field'),
          },
          description: escapeT('Select a source field to use metadata of the field'),
        },
        fieldModel: {
          type: 'string',
          title: escapeT('Field model'),
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: escapeT('Input'), value: 'InputFieldModel' },
            { label: escapeT('Number'), value: 'NumberFieldModel' },
            { label: escapeT('Date'), value: 'DateTimeFilterFieldModel' },
            { label: escapeT('Select'), value: 'SelectFieldModel' },
            { label: escapeT('Radio group'), value: 'RadioGroupFieldModel' },
            { label: escapeT('Checkbox group'), value: 'CheckboxGroupFieldModel' },
            { label: escapeT('Record select'), value: 'RecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: escapeT('Please select'),
          },
        },
        fieldModelProps: {
          type: 'object',
          title: escapeT('Component properties'),
          'x-component': FieldComponentProps,
          'x-reactions': [
            {
              dependencies: ['fieldModel'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                  },
                },
              },
            },
          ],
        },
      },
      handler(ctx, params) {
        const { fieldModel, fieldModelProps = {}, title } = params;
        ctx.model.setProps({
          label: title,
          name: ctx.model.uid,
        });

        if (!ctx.model.fieldModelInstance) {
          ctx.model.fieldModelInstance = ctx.model.flowEngine.createModel({
            use: fieldModel,
            props: { allowClear: true, ...fieldModelProps },
          });
        } else {
          ctx.model.fieldModelInstance.setProps({ allowClear: true, ...fieldModelProps });
        }
      },
    },
    connectFields: {
      use: 'connectFields',
    },
  },
});

function SourceCascader(props) {
  const flowEngine = useFlowEngine();

  const buildDataSourceOptions = useCallback(() => {
    const manager = flowEngine?.dataSourceManager;
    if (!manager) {
      return [];
    }
    const dataSources = manager.getDataSources();
    return dataSources.map((dataSource) => ({
      value: dataSource.key,
      label: dataSource.displayName ?? dataSource.key,
      isLeaf: false,
      meta: {
        type: 'dataSource',
        dataSourceKey: dataSource.key,
      },
    }));
  }, [flowEngine]);

  const [options, setOptions] = useState(() => buildDataSourceOptions());

  useEffect(() => {
    setOptions(buildDataSourceOptions());
  }, [buildDataSourceOptions]);

  const loadData = useCallback(
    (selectedOptions) => {
      const target = selectedOptions[selectedOptions.length - 1];
      if (!target || target.children?.length) {
        return;
      }

      const manager = flowEngine?.dataSourceManager;
      if (!manager) {
        return;
      }

      let children = [];

      if (selectedOptions.length === 1) {
        const dataSourceKey = target.value as string;
        const dataSource = manager.getDataSource(dataSourceKey);
        const collections = dataSource?.getCollections() ?? [];
        children = collections.map((collection) => ({
          value: collection.name,
          label: collection.title,
          isLeaf: false,
          meta: {
            type: 'collection',
            dataSourceKey,
            collectionName: collection.name,
            fullPath: collection.name,
          },
        }));
      } else {
        const meta = target.meta || {};
        const dataSourceKey = meta.dataSourceKey;
        const dataSource = manager.getDataSource(dataSourceKey);
        const collectionManager = dataSource?.collectionManager;

        if (!dataSource || !collectionManager) {
          target.isLeaf = true;
          setOptions((prev) => [...prev]);
          return;
        }

        if (meta.type === 'collection') {
          const collection = collectionManager.getCollection(meta.collectionName);
          const fields = collection?.getFields() ?? [];
          children = fields
            .filter((field) => field.filterable)
            .map((field) => {
              const fullPath = `${meta.fullPath}.${field.name}`;
              const hasTarget = !!field.targetCollection;
              return {
                value: field.name,
                label: field.title,
                isLeaf: !hasTarget,
                meta: {
                  type: 'field',
                  dataSourceKey,
                  fullPath,
                },
              };
            })
            .sort((a, b) => (b.isLeaf ? 0 : -1)); // 把叶子节点排在上面
        } else if (meta.type === 'field') {
          const field = dataSource.getCollectionField(meta.fullPath);
          const targetCollection = field?.targetCollection;
          const fields = targetCollection?.getFields() ?? [];
          children = fields
            .filter((field) => field.filterable)
            .map((childField) => {
              const fullPath = `${meta.fullPath}.${childField.name}`;
              const hasTarget = !!childField.targetCollection;
              return {
                value: childField.name,
                label: childField.title,
                isLeaf: !hasTarget,
                meta: {
                  type: 'field',
                  dataSourceKey,
                  fullPath,
                },
              };
            })
            .sort((a, b) => (b.isLeaf ? 0 : -1)); // 把叶子节点排在上面;
        }
      }

      if (!children.length) {
        target.isLeaf = true;
      } else {
        target.children = children;
      }

      setOptions((prev) => [...prev]);
    },
    [flowEngine],
  );

  return <Cascader {...props} options={options} loadData={loadData} />;
}
