/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input, theme } from 'antd';
import _ from 'lodash';
import React, { FC, useContext } from 'react';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import { Cascader, Select, Space } from 'antd';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';

// TODO: 需要重构，使用新的方式获取组件实例
const AppContext = React.createContext(null);

const findOperator = (obj) => {
  let current = obj;

  while (current && typeof current === 'object') {
    const keys = Object.keys(current);

    // 如果没有属性或者有多个属性，停止遍历
    if (keys.length !== 1) {
      break;
    }

    const key = keys[0];

    // 如果遇到以 $ 开头的属性，停止遍历
    if (key.startsWith('$')) {
      return key;
    }

    // 移动到下一层
    current = current[key];
  }
};

const findFieldValue = (obj) => {
  let current = obj;

  while (current && typeof current === 'object') {
    const keys = Object.keys(current);

    // 如果没有属性或者有多个属性，停止遍历
    if (keys.length !== 1) {
      break;
    }

    const key = keys[0];

    // 如果遇到以 $ 开头的属性，停止遍历
    if (key.startsWith('$')) {
      return current[key];
    }

    // 移动到下一层
    current = current[key];
  }
};

function extractPath(obj) {
  const path = [];
  let current = obj;

  while (current && typeof current === 'object') {
    const keys = Object.keys(current);

    // 如果没有属性或者有多个属性，停止遍历
    if (keys.length !== 1) {
      break;
    }

    const key = keys[0];

    // 如果遇到以 $ 开头的属性，停止遍历
    if (key.startsWith('$')) {
      break;
    }

    // 将当前属性添加到路径中
    path.push(key);

    // 移动到下一层
    current = current[key];
  }

  return path;
}

function findFieldInOptions(options, fieldNames) {
  return fieldNames.reduce((currentOptions, fieldName, index) => {
    if (!currentOptions) return null;

    const foundField = currentOptions.find((field) => field.name === fieldName);

    // 如果是最后一层，返回找到的字段；否则返回其 children 供下一次迭代
    return index === fieldNames.length - 1 ? foundField : foundField?.children;
  }, options);
}

const field2option = (field, depth, nonfilterable, dataSourceManager) => {
  if (nonfilterable.length && depth === 1 && nonfilterable.includes(field.name)) {
    return;
  }
  if (!field.interface) {
    return;
  }
  if (field.filterable === false) {
    return;
  }
  const fieldInterface = dataSourceManager?.collectionFieldInterfaceManager.getFieldInterface(field.interface);
  if (!fieldInterface?.filterable) {
    return;
  }
  const { nested, children, operators } = fieldInterface.filterable;
  const option = {
    name: field.name,
    type: field.type,
    target: field.target,
    title: field?.uiSchema?.title || field.name,
    schema: field?.uiSchema,
    operators:
      operators?.filter?.((operator) => {
        return !operator?.visible || operator.visible(field);
      }) || [],
  };
  if (field.target && depth > 2) {
    return;
  }
  if (depth > 2) {
    return option;
  }
  if (children?.length) {
    option['children'] = children;
  }
  if (nested) {
    const targetFields = dataSourceManager
      .getDataSource(field.dataSourceKey)
      .collectionManager.getCollectionFields(field.target);
    const options = getOptions(targetFields, depth + 1, nonfilterable, dataSourceManager).filter(Boolean);
    option['children'] = option['children'] || [];
    option['children'].push(...options);
  }
  return option;
};

const getOptions = (fields, depth, nonfilterable, dataSourceManager) => {
  const options = [];
  fields.forEach((field) => {
    const option = field2option(field, depth, nonfilterable, dataSourceManager);
    if (option) {
      options.push(option);
    }
  });
  return options;
};

const FieldComponent: FC<{ component: string; value: any; onChange: any; [key: string]: any }> = (props) => {
  const { component, ...others } = props;

  const app = useContext(AppContext);
  const Component = app.getComponent(component);

  if (!Component) {
    return <Input {...others} />;
  }

  return <Component {...others} />;
};

const FilterItem: FC<{
  options: any[];
  value: any;
  onRemove: () => void;
  onChange?: (value: any) => void;
}> = observer(
  (props) => {
    const fieldNames = extractPath(props.value);

    // 使用提取的函数在树结构中查找字段
    const filed = findFieldInOptions(props.options, fieldNames);

    const operators = filed?.operators || [];
    const operator = findOperator(props.value);
    const operatorOption = operators.find((op) => op.value === operator) || {};
    const fieldValue = findFieldValue(props.value);
    const component = operatorOption?.schema?.['x-component'] || filed?.schema?.['x-component'] || 'Input';
    const componentProps = operatorOption?.schema?.['x-component-props'] || filed?.schema?.['x-component-props'] || {};
    const { t } = useTranslation();

    const onChangeFieldName = (value) => {
      if (!value) {
        return;
      }

      const newFieldPath = value.join('.');

      delete props.value[fieldNames[0]];
      _.set(props.value, newFieldPath, {});

      props.onChange?.(props.value);
    };
    const onChangeFieldValue = (event) => {
      const value = event?.target?.value || event;
      const fieldPath = fieldNames.join('.');
      _.set(props.value, `${fieldPath}.${operator}`, value);

      props.onChange?.(props.value);
    };
    const onClearFieldName = () => {
      delete props.value[fieldNames[0]];

      props.onChange?.(props.value);
    };
    const onChangeOperator = (value) => {
      const fieldPath = fieldNames.join('.');
      const operatorObject = _.get(props.value, fieldPath);
      const prevOperator = Object.keys(operatorObject || {})[0];
      _.set(props.value, `${fieldPath}.${value}`, _.get(props.value, `${fieldPath}.${prevOperator}`));

      if (prevOperator) {
        delete operatorObject[prevOperator];
      }

      props.onChange?.(props.value);
    };

    return (
      <div style={{ marginBottom: 8 }}>
        <Space wrap>
          <Cascader
            // @ts-ignore
            role="button"
            data-testid="select-filter-field"
            className={css`
              width: 160px;
            `}
            popupClassName={css`
              .ant-cascader-menu {
                height: fit-content;
                max-height: 50vh;
              }
            `}
            allowClear
            fieldNames={{
              label: 'title',
              value: 'name',
              children: 'children',
            }}
            value={fieldNames}
            options={props.options}
            onChange={onChangeFieldName}
            placeholder={t('Select field')}
            changeOnSelect={false}
            onClear={onClearFieldName}
          />
          <Select
            // @ts-ignore
            role="button"
            data-testid="select-filter-operator"
            className={css`
              min-width: 110px;
            `}
            popupMatchSelectWidth={false}
            value={operator}
            options={operators}
            onChange={onChangeOperator}
            placeholder={t('Comparision')}
          />
          {!operatorOption.noValue ? (
            <FieldComponent
              component={component}
              value={fieldValue}
              onChange={onChangeFieldValue}
              {...componentProps}
            />
          ) : null}
          <a role="button" aria-label="icon-close">
            <CloseCircleOutlined onClick={props.onRemove} style={{ color: '#bfbfbf' }} />
          </a>
        </Space>
      </div>
    );
  },
  {
    displayName: 'FilterItem',
  },
);

export const FilterGroup: FC<{
  value: any;
  fields: any[];
  ctx: any;
  ignoreFieldsNames?: string[];
  showBorder?: boolean;
  onRemove?: () => void;
  onChange?: (value: any) => void;
}> = observer(
  (props) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const logic = Object.keys(props.value).includes('$or') ? '$or' : '$and';
    const items = props.value[logic] || [];
    const options = getOptions(
      props.fields,
      1,
      props.ignoreFieldsNames,
      props.ctx.globals.app.dataSourceManager,
    ).filter(Boolean);
    const style: React.CSSProperties = props.showBorder
      ? {
          position: 'relative',
          border: `1px dashed ${token.colorBorder}`,
          padding: token.paddingSM,
          marginBottom: token.marginXS,
        }
      : {
          position: 'relative',
          marginBottom: token.marginXS,
        };

    const onChangeLogic = (value) => {
      const prevLogic = Object.keys(props.value)[0];
      props.value[value] = props.value[prevLogic];
      delete props.value[prevLogic];

      props.onChange?.(props.value);
    };

    const onAddCondition = () => {
      const subItems = Object.values(props.value)[0] as any[];
      subItems.push({});

      props.onChange?.(props.value);
    };

    const onAddConditionGroup = () => {
      const subItems = Object.values(props.value)[0] as any[];
      subItems.push({ $and: [{}] });

      props.onChange?.(props.value);
    };

    return (
      <AppContext.Provider value={props.ctx.globals.app}>
        <div style={style}>
          {props.showBorder && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  color: '#bfbfbf',
                }}
                onClick={props.onRemove}
              />
            </a>
          )}
          <div style={{ marginBottom: 8, color: token.colorText }}>
            <Trans>
              {'Meet '}
              <Select
                // @ts-ignore
                role="button"
                data-testid="filter-select-all-or-any"
                style={{ width: 'auto' }}
                value={logic}
                onChange={onChangeLogic}
              >
                <Select.Option value={'$and'}>All</Select.Option>
                <Select.Option value={'$or'}>Any</Select.Option>
              </Select>
              {' conditions in the group'}
            </Trans>
          </div>
          <div>
            {items.map((item, index) =>
              item.$and || item.$or ? (
                <FilterGroup
                  key={index}
                  value={item}
                  showBorder
                  fields={props.fields}
                  ignoreFieldsNames={props.ignoreFieldsNames}
                  ctx={props.ctx}
                  onRemove={() => {
                    items.splice(index, 1);
                  }}
                  onChange={props.onChange}
                />
              ) : (
                <FilterItem
                  key={index}
                  value={item}
                  options={options}
                  onRemove={() => {
                    items.splice(index, 1);
                  }}
                  onChange={props.onChange}
                />
              ),
            )}
          </div>
          <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
            <a onClick={onAddCondition}>{t('Add condition')}</a>
            <a onClick={onAddConditionGroup}>{t('Add condition group')}</a>
          </Space>
        </div>
      </AppContext.Provider>
    );
  },
  {
    displayName: 'FilterGroup',
  },
);
