/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cascader, Input, Space, Spin, Tag, Button } from 'antd';
import { debounce, last } from 'lodash';
import { CollectionField, EditableItemModel, escapeT, MultiRecordResource } from '@nocobase/flow-engine';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AssociationFieldModel } from './AssociationFieldModel';
import { transformNestedData } from '../ClickableFieldModel';

function buildTree(data, idField = 'id', parentField = 'parentId') {
  const map = new Map();
  const tree = [];
  // 1. 初始化每个节点，并给每个节点加一个 children 数组
  data.forEach((item) => {
    map.set(item[idField], { ...item, children: [] });
  });
  // 2. 遍历每个节点，找父节点，把自己放到父节点的 children 中
  map.forEach((node) => {
    if (node[parentField] != null && map.has(node[parentField])) {
      map.get(node[parentField]).children.push(node);
    } else {
      // 没有父节点，就是顶层节点
      tree.push(node);
    }
  });

  return tree;
}
interface Props {
  value: any[]; // 当前选中数组，每一项是 Cascader 的 value
  onChange?: (val: any[]) => void;
  options: any[]; // Cascader 数据源
  fieldNames?: any; // Cascader fieldNames
  disabled?: boolean;
  [key: string]: any;
}

const SortableItem: React.FC<{
  id: string;
  item: any;
  index: number;
  onChange: (index: number, val: any) => void;
  onRemove: (index: number) => void;
  options: any[];
  fieldNames?: any;
  disabled?: boolean;
  others?: any;
}> = ({ id, item, index, onChange, onRemove, options, fieldNames, disabled, others }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 8,
  };
  const initOptions = buildTree(transformNestedData(item));

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Space
        className={css`
          width: 100%;
          display: flex;

          .ant-space-item:nth-child(1) {
            flex: 0.1;
            display: flex;
            align-items: center;
            cursor: grab;
          }

          .ant-space-item:nth-child(2) {
            flex: 3;
          }

          .ant-space-item:nth-child(3) {
            flex: 0.2;
          }
        `}
      >
        <div {...listeners}>
          <DragOutlined style={{ color: 'GrayText' }} />
        </div>
        <Cascader
          key={id}
          options={options || initOptions}
          fieldNames={fieldNames}
          onChange={(value, item) => {
            const val = last(item);
            onChange(index, val);
          }}
          changeOnSelect
          disabled={disabled}
          showSearch
          defaultValue={transformNestedData(item).map((v) => {
            return v['id'];
          })}
          {...others}
        />
        <div>
          <DeleteOutlined onClick={() => onRemove(index)} style={{ color: 'GrayText' }} />
        </div>
      </Space>
    </div>
  );
};

const DynamicCascadeList: React.FC<Props> = ({ value = [], onChange, options, fieldNames, disabled, ...others }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = value.findIndex((_, i) => `item-${i}` === over.id);
      const newValue = arrayMove(value, oldIndex, newIndex);
      onChange?.(newValue);
    }
  };

  const handleChange = (index: number, val: any) => {
    const newValue = [...value];
    newValue[index] = val;
    onChange?.(newValue);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange?.(newValue);
  };

  const handleAdd = () => {
    onChange?.([...value, []]);
  };
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
          {value.map((item, index) => (
            <SortableItem
              key={index}
              id={`item-${index}`}
              item={item}
              index={index}
              onChange={handleChange}
              onRemove={handleRemove}
              options={options}
              fieldNames={fieldNames}
              disabled={disabled}
              others={others}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button type="dashed" style={{ width: '100%' }} onClick={handleAdd}>
        添加新项
      </Button>
    </div>
  );
};

export class CascadeSelectInnerFieldModel extends AssociationFieldModel {
  declare resource: MultiRecordResource;

  get collectionField(): CollectionField {
    return this.context.collectionField;
  }

  onInit(options) {
    super.onInit(options);
    // 暴露 target collection 给变量选择器
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField?.targetCollection,
    });
  }

  // antd Cascader 对应的事件绑定
  set onPopupScroll(fn) {
    this.setProps({ onPopupScroll: fn });
  }
  set onDropdownVisibleChange(fn) {
    this.setProps({ onDropdownVisibleChange: fn });
  }
  set onSearch(fn) {
    this.setProps({ onSearch: fn });
  }
  set onLoadData(fn) {
    this.setProps({ loadData: fn });
  }

  setDataSource(dataSource) {
    this.setProps({ options: dataSource });
  }
  getDataSource() {
    return this.props.options;
  }

  getFilterValue() {
    const fieldNames = this.props.fieldNames || { label: 'label', value: 'value' };
    return Array.isArray(this.props.value)
      ? this.props.value.map((item) => item[fieldNames.value])
      : this.props.value?.[fieldNames.value];
  }

  //   render() {
  //     return (
  //       <Cascader
  //         disabled={this.props.disabled}
  //         changeOnSelect
  //         options={this.props.options}
  //         onDropdownVisibleChange={this.props.onDropdownVisibleChange}
  //         fieldNames={this.props.fieldNames}
  //         onChange={(value)=>{
  //             console.log(value)
  //         }}
  //         value={this.props.value}
  //       />
  //     );
  //   }
}

// 对一
export class CascadeSelectFieldModel extends CascadeSelectInnerFieldModel {
  render() {
    const initOptions = buildTree(transformNestedData(this.props.value));
    return (
      <Cascader
        disabled={this.props.disabled}
        changeOnSelect
        options={this.props.options || initOptions}
        onDropdownVisibleChange={this.props.onDropdownVisibleChange}
        fieldNames={this.props.fieldNames}
        showSearch={true}
        onSearch={(value) => console.log(value)}
        onChange={(value, item) => {
          const val = last(item);
          this.props.onChange(val);
        }}
        defaultValue={transformNestedData(this.props.value).map((v) => {
          return v[this.collectionField.collection.filterTargetKey];
        })}
      />
    );
  }
}

// 对多
export class CascadeSelectListFieldModel extends CascadeSelectInnerFieldModel {
  render() {
    return (
      <DynamicCascadeList
        disabled={this.props.disabled}
        options={this.props.options}
        onDropdownVisibleChange={this.props.onDropdownVisibleChange}
        fieldNames={this.props.fieldNames}
        showSearch={true}
        onSearch={(value) => console.log(value)}
        onChange={(value) => {
          this.props.onChange(value);
        }}
        value={this.props.value}
      />
    );
  }
}

// 基础分页控制
const paginationState = {
  page: 1,
  pageSize: 40,
  loading: false,
  hasMore: true,
};

/** --------------------------- 事件绑定 --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'eventSettings',
  sort: 900,
  steps: {
    bindEvent: {
      handler(ctx) {
        const labelFieldName = ctx.model.props.fieldNames.label;

        // 打开下拉加载根节点
        ctx.model.onDropdownVisibleChange = (open) => {
          if (open) {
            ctx.model.dispatchEvent('dropdownOpen', {
              apiClient: ctx.app.apiClient,
              form: ctx.model.context.form,
            });
          } else {
            ctx.model.resource.removeFilterGroup(labelFieldName);
            paginationState.page = 1;
          }
        };

        // 滚动分页加载
        ctx.model.onPopupScroll = (e) => {
          ctx.model.dispatchEvent('popupScroll', {
            event: e,
            apiClient: ctx.app.apiClient,
          });
        };

        // 搜索
        ctx.model.onSearch = (searchText) => {
          ctx.model.dispatchEvent('search', {
            searchText,
            apiClient: ctx.app.apiClient,
          });
        };

        // 懒加载（点击展开节点）
        ctx.model.onLoadData = async (selectedOptions) => {
          const targetOption = selectedOptions[selectedOptions.length - 1];
          ctx.model.dispatchEvent('loadChildren', {
            targetOption,
            apiClient: ctx.app.apiClient,
          });
        };
      },
    },
  },
});

/** --------------------------- 下拉展开加载根节点 --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'dropdownOpenSettings',
  on: 'dropdownOpen',
  steps: {
    loadData: {
      async handler(ctx) {
        const resource = ctx.model.resource;
        const options = ctx.model.getDataSource();
        resource.setPage(1);
        resource.setRequestParameters({ tree: true });
        await ctx.model.applyFlow('selectSettings');
        await resource.refresh();

        const data = resource.getData().map((item) => ({
          ...item,
          isLeaf: !item.children?.length,
          children: item.children,
        }));
        ctx.model.setDataSource(data);
        paginationState.hasMore = data.length >= paginationState.pageSize;
        paginationState.page = 2;
      },
    },
  },
});

/** --------------------------- 滚动分页加载 --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'popupScrollSettings',
  on: 'popupScroll',
  steps: {
    loadData: {
      async handler(ctx) {
        const event = ctx.inputArgs?.event;
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        if (scrollTop + clientHeight < scrollHeight - 20) return;
        if (paginationState.loading || !paginationState.hasMore) return;

        paginationState.loading = true;
        try {
          const resource = ctx.model.resource;
          resource.setPage(paginationState.page);
          await resource.refresh();
          const data = resource.getData().map((item) => ({
            label: item[ctx.model.props.fieldNames.label],
            value: item[ctx.model.props.fieldNames.value],
            isLeaf: item.hasChildren === false,
          }));

          const current = ctx.model.getDataSource() || [];
          ctx.model.setDataSource([...current, ...data]);
          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
          } else {
            paginationState.page++;
          }
        } finally {
          paginationState.loading = false;
        }
      },
    },
  },
});

/** --------------------------- 子节点懒加载逻辑 --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'loadChildrenSettings',
  on: 'loadChildren',
  steps: {
    loadChildren: {
      async handler(ctx) {
        const { targetOption } = ctx.inputArgs;
        const resource = ctx.model.resource;
        const labelFieldName = ctx.model.props.fieldNames.label;
        const valueFieldName = ctx.model.props.fieldNames.value;

        targetOption.loading = true;

        // 根据父节点 value 添加过滤条件
        resource.setPage(1);
        resource.addFilterGroup(valueFieldName, {
          [`parent_id.$eq`]: targetOption.value,
        });

        await resource.refresh();
        const data = resource.getData().map((item) => ({
          label: item[labelFieldName],
          value: item[valueFieldName],
          isLeaf: item.hasChildren === false,
        }));

        // 挂载子节点
        targetOption.loading = false;
        targetOption.children = data;

        // 更新全局 options 引用以触发渲染
        ctx.model.setDataSource([...ctx.model.getDataSource()]);
      },
    },
  },
});

/** --------------------------- 搜索 --------------------------- */
async function originalHandler(ctx) {
  try {
    const resource = ctx.model.resource;
    const labelFieldName = ctx.model.props.fieldNames.label;
    const targetCollection = ctx.model.collectionField.targetCollection;
    const targetLabelField = targetCollection.getField(labelFieldName);
    const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
      targetLabelField.options.interface,
    );
    const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';
    const searchText = ctx.inputArgs.searchText?.trim();
    const key = `${labelFieldName}.${operator}`;

    if (searchText === '') {
      resource.removeFilterGroup(labelFieldName);
    } else {
      resource.setPage(1);
      resource.addFilterGroup(labelFieldName, { [key]: searchText });
    }

    await resource.refresh();
    const data = resource.getData().map((item) => ({
      label: item[labelFieldName],
      value: item[ctx.model.props.fieldNames.value],
      isLeaf: item.hasChildren === false,
    }));

    ctx.model.setDataSource(data);
    paginationState.hasMore = data.length >= paginationState.pageSize;
    paginationState.page = 2;
  } catch (error) {
    console.error('CascadeSelectField search error:', error);
    ctx.model.setDataSource([]);
  }
}

const debouncedHandler = debounce(originalHandler, 500);

CascadeSelectInnerFieldModel.registerFlow({
  key: 'searchSettings',
  on: 'search',
  steps: {
    searchData: {
      handler: debouncedHandler,
    },
  },
});

/** --------------------------- 初始化 Resource --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'recordSelectSettings',
  sort: 200,
  steps: {
    init: {
      handler(ctx) {
        const resource = ctx.createResource(MultiRecordResource);
        const collectionField = ctx.model.context.collectionField;
        const { target, dataSourceKey } = collectionField;
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(target);
        resource.setPageSize(paginationState.pageSize);
        ctx.model.resource = resource;
      },
    },
  },
});

/** --------------------------- 可视化配置 --------------------------- */
CascadeSelectInnerFieldModel.registerFlow({
  key: 'selectSettings',
  title: escapeT('Cascade select settings'),
  sort: 800,
  steps: {
    fieldNames: { use: 'titleField' },
    dataScope: { use: 'dataScope' },
    sortingRule: { use: 'sortingRule' },
    allowMultiple: {
      title: escapeT('Allow multiple'),
      uiSchema(ctx) {
        if (ctx.collectionField && ['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.collectionField.type)) {
          return {
            allowMultiple: {
              'x-component': 'Switch',
              type: 'boolean',
              'x-decorator': 'FormItem',
            },
          };
        }
        return null;
      },
      defaultParams(ctx) {
        return {
          allowMultiple:
            ctx.collectionField &&
            ['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.model.context.collectionField.type),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          allowMultiple: params?.allowMultiple,
        });
      },
    },
  },
});

CascadeSelectFieldModel.define({
  label: escapeT('Cascade select'),
});

CascadeSelectListFieldModel.define({
  label: escapeT('Cascade select'),
});

EditableItemModel.bindModelToInterface('CascadeSelectFieldModel', ['m2o', 'o2o', 'oho', 'obo'], {
  when: (ctx, field) => field.targetCollection.template === 'tree',
});

EditableItemModel.bindModelToInterface('CascadeSelectListFieldModel', ['m2m', 'o2m', 'mbm'], {
  when: (ctx, field) => field.targetCollection.template === 'tree',
});
