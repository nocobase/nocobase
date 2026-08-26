/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Select, Space, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { FC, ReactNode } from 'react';
import { observer } from '@nocobase/flow-engine';

const itemKeyMap = new WeakMap<Record<string, any>, string>();
let itemKeyCounter = 0;

const getFilterItemKey = (item: Record<string, any>) => {
  let key = itemKeyMap.get(item);
  if (!key) {
    itemKeyCounter += 1;
    key = `filter-item-${itemKeyCounter}`;
    itemKeyMap.set(item, key);
  }
  return key;
};

/**
 * 筛选项组件的属性接口
 */
interface FilterItemProps {
  value: {
    path: string;
    operator: string;
    value: string;
  };
}

/**
 * FilterGroup 组件的属性接口
 */
interface FilterGroupProps {
  /** 响应式的过滤条件对象 */
  value: Record<string, any>;
  /** 自定义筛选项组件 */
  FilterItem?: React.FC<FilterItemProps>;
  closeIcon?: ReactNode;
  /** 是否显示边框 */
  showBorder?: boolean;
  /** 移除当前组的回调 */
  onRemove?: () => void;
  onChange?: (value: any) => void;
}

/**
 * 筛选条件组组件
 *
 * 支持嵌套的逻辑组合，使用新的数据结构：
 * - logic: '$and' | '$or' 表示逻辑关系
 * - items: 数组，包含条件项或嵌套的筛选组
 *
 * @example
 * ```typescript
 * const filterValue = observable({
 *   logic: '$and',
 *   items: [
 *     {
 *       path: 'name',
 *       operator: 'eq',
 *       value: 'test'
 *     },
 *     {
 *       logic: '$or',
 *       items: [...]
 *     }
 *   ]
 * });
 *
 * <FilterGroup
 *   value={filterValue}
 *   FilterItem={CustomFilterItem}
 * />
 * ```
 */
export const FilterGroup: FC<FilterGroupProps> = observer(
  (props) => {
    const { token } = theme.useToken();
    const {
      value = { logic: '$and', items: [] },
      FilterItem,
      showBorder = false,
      onRemove,
      onChange,
      closeIcon = <CloseCircleOutlined style={{ color: token.colorIcon }} />,
    } = props;
    const { t } = useTranslation();

    // 确保 value 有正确的默认结构
    if (!value.logic) {
      value.logic = '$and';
    }
    if (!Array.isArray(value.items)) {
      value.items = [];
    }

    const { logic, items } = value;

    const style: React.CSSProperties = showBorder
      ? {
          position: 'relative',
          border: `1px dashed ${token.colorBorder}`,
          padding: token.paddingSM,
          marginBottom: token.marginXS,
          borderRadius: token.borderRadius,
        }
      : {
          position: 'relative',
          marginBottom: token.marginXS,
        };

    const handleLogicChange = (newLogic: '$and' | '$or') => {
      value.logic = newLogic;
      onChange?.(value);
    };

    const handleAddCondition = () => {
      items.push({
        path: '',
        operator: '',
        value: '',
      });
      onChange?.(value);
    };

    const handleAddConditionGroup = () => {
      items.push({
        logic: '$and',
        items: [],
      });
      onChange?.(value);
    };

    const handleRemoveItem = (index: number) => {
      items.splice(index, 1);
      onChange?.(value);
    };

    const isConditionItem = (item: any) => {
      return 'path' in item || 'operator' in item || 'value' in item;
    };

    const isGroupItem = (item: any) => {
      return 'logic' in item && 'items' in item;
    };

    return (
      <div style={style}>
        {showBorder && onRemove && (
          <button
            type="button"
            aria-label="icon-close"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              cursor: 'pointer',
              background: 'transparent',
              border: 0,
              padding: 0,
            }}
            onClick={onRemove}
          >
            {closeIcon}
          </button>
        )}

        <div style={{ marginBottom: 8, color: token.colorText }}>
          <span>
            {t('Meet')}{' '}
            <Select
              data-testid="filter-select-all-or-any"
              style={{ width: 'auto' }}
              value={logic}
              onChange={handleLogicChange}
            >
              <Select.Option value="$and">{t('All')}</Select.Option>
              <Select.Option value="$or">{t('Any')}</Select.Option>
            </Select>{' '}
            {t('conditions in the group')}
          </span>
        </div>

        <div>
          {items.map((item, index) => {
            if (isGroupItem(item)) {
              // 嵌套的筛选组
              return (
                <FilterGroup
                  key={getFilterItemKey(item)}
                  value={item}
                  FilterItem={FilterItem}
                  showBorder={true}
                  onRemove={() => handleRemoveItem(index)}
                  onChange={(v) => {
                    items[index] = v;
                    onChange?.(value);
                  }}
                />
              );
            } else if (isConditionItem(item)) {
              // 单个筛选条件
              if (FilterItem) {
                return (
                  <div
                    key={getFilterItemKey(item)}
                    style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-end' }}
                  >
                    <Space style={{ flex: 1, minWidth: 0 }}>
                      <FilterItem value={item} />
                      <button
                        type="button"
                        aria-label="icon-close"
                        style={{
                          marginLeft: 8,
                          marginRight: 8,
                          flex: '0 0 auto',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                        }}
                        onClick={() => handleRemoveItem(index)}
                      >
                        {closeIcon}
                      </button>
                    </Space>
                  </div>
                );
              } else {
                // 如果没有提供 FilterItem，显示简单的文本表示
                return (
                  <div
                    key={getFilterItemKey(item)}
                    style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-end' }}
                  >
                    <Space style={{ flex: 1, minWidth: 0 }}>
                      <span>
                        {item.path} {item.operator} {String(item.value)}
                      </span>
                      <button
                        type="button"
                        aria-label="icon-close"
                        style={{
                          marginLeft: 8,
                          marginRight: 8,
                          flex: '0 0 auto',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                        }}
                        onClick={() => handleRemoveItem(index)}
                      >
                        {closeIcon}
                      </button>
                    </Space>
                  </div>
                );
              }
            } else {
              // 未知类型的项，显示占位符
              return (
                <div key={getFilterItemKey(item)} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-end' }}>
                  <Space style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: token.colorTextTertiary }}>Invalid filter item</span>
                    <button
                      type="button"
                      aria-label="icon-close"
                      style={{
                        marginLeft: 8,
                        marginRight: 8,
                        flex: '0 0 auto',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                      }}
                      onClick={() => handleRemoveItem(index)}
                    >
                      {closeIcon}
                    </button>
                  </Space>
                </div>
              );
            }
          })}
        </div>

        <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
          <Button style={{ padding: 0 }} type="link" size="small" icon={<PlusOutlined />} onClick={handleAddCondition}>
            {t('Add condition')}
          </Button>
          <Button
            style={{ padding: 0 }}
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddConditionGroup}
          >
            {t('Add condition group')}
          </Button>
        </Space>
      </div>
    );
  },
  {
    displayName: 'FilterGroup',
  },
);
