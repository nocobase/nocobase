/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Col, Collapse, Input, Row, Tree } from 'antd';
import cls from 'classnames';
import React, { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { SortableItem } from '../../common';
import { useCompile, useDesigner, useProps } from '../../hooks';
import { useToken } from '../__builtins__';
import { EllipsisWithTooltip } from '../input';
import { getLabelFormatValue, useLabelUiSchema } from '../record-picker';
import { AssociationFilter } from './AssociationFilter';
import useStyles from './AssociationFilter.Item.style';

const { Panel } = Collapse;

export const AssociationFilterItem = withDynamicSchemaProps(
  (props) => {
    const { wrapSSR, componentCls, hashId } = useStyles();
    const { token } = useToken();
    const collectionField = AssociationFilter.useAssociationField();

    // 把一些可定制的状态通过 hook 提取出去了，为了兼容之前添加的 Table 区块，这里加了个默认值
    const fieldSchema = useFieldSchema();
    const Designer = useDesigner();
    const compile = useCompile();
    const {
      list,
      onSelected,
      // Used when setting default values
      onChange,
      handleSearchInput: _handleSearchInput,
      params,
      run,
      dataScopeFilter,
      valueKey: _valueKey,
      labelKey: _labelKey,
      defaultCollapse,
    } = useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema

    const [searchVisible, setSearchVisible] = useState(false);

    const defaultActiveKeyCollapse = useMemo<string[]>(
      () => (defaultCollapse && collectionField?.name ? [collectionField.name] : []),
      [collectionField?.name, defaultCollapse],
    );
    const valueKey = _valueKey || collectionField?.targetKey || 'id';
    const labelKey = _labelKey || fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

    const fieldNames = {
      title: labelKey || valueKey,
      key: valueKey,
    };

    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>(fieldSchema.default || []);
    const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

    const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.title || 'label');

    useEffect(() => {
      // by default, if the default is not empty, we will auto run the filter one time
      if (fieldSchema.default) {
        setTimeout(() => {
          onSelected(fieldSchema.default);
          setSelectedKeys(fieldSchema.default);
        });
      }
    }, [fieldSchema.default, onSelected]);

    if (!collectionField) {
      return null;
    }

    const onExpand = (expandedKeysValue: React.Key[]) => {
      setExpandedKeys(expandedKeysValue);
      setAutoExpandParent(false);
    };

    const onSelect = (selectedKeysValue: React.Key[]) => {
      setSelectedKeys(selectedKeysValue);
      onSelected(selectedKeysValue);
      onChange?.(selectedKeysValue);
    };

    const handleSearchToggle = (e: MouseEvent) => {
      const filter = params?.[0]?.filter;
      if (searchVisible || filter) {
        run({
          ...params?.[0],
          filter: dataScopeFilter,
        });
      }
      setSearchVisible(!searchVisible);
      e.stopPropagation();
    };

    const handleSearchClick = (e: MouseEvent) => {
      e.stopPropagation();
    };

    const handleSearchInput = (e: ChangeEvent<any>) => {
      _handleSearchInput(e);
    };

    const title = fieldSchema.title ?? collectionField?.uiSchema?.title;

    return wrapSSR(
      <SortableItem className={cls(componentCls, hashId, 'nb-block-item', props.className, 'SortableItem')}>
        <Designer />
        <Collapse defaultActiveKey={defaultActiveKeyCollapse} ghost expandIcon={searchVisible ? () => null : undefined}>
          <Panel
            className="Panel"
            header={
              <Row
                className="headerRow"
                style={{
                  borderBottom: searchVisible ? `1px solid ${token.colorBorder}` : 'none',
                }}
                gutter={5}
              >
                <Col title={compile(title)} className="headerCol">
                  {searchVisible ? (
                    <Input
                      bordered={false}
                      autoFocus
                      placeholder="Search..."
                      className="search"
                      onClick={handleSearchClick}
                      onChange={handleSearchInput}
                    />
                  ) : (
                    compile(title)
                  )}
                </Col>
                <Col
                  style={{
                    flex: '0 0 auto',
                  }}
                >
                  {searchVisible ? (
                    <CloseOutlined className="CloseOutlined" onClick={handleSearchToggle} />
                  ) : (
                    <SearchOutlined className="SearchOutlined" onClick={handleSearchToggle} />
                  )}
                </Col>
              </Row>
            }
            key={defaultActiveKeyCollapse[0]}
          >
            <Tree
              className="Tree"
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              treeData={list}
              onSelect={onSelect}
              fieldNames={fieldNames}
              titleRender={(node) => {
                return (
                  <EllipsisWithTooltip ellipsis>
                    {getLabelFormatValue(labelUiSchema, compile(node[labelKey]))}
                  </EllipsisWithTooltip>
                );
              }}
              selectedKeys={selectedKeys}
              blockNode
            />
          </Panel>
        </Collapse>
      </SortableItem>,
    );
  },
  { displayName: 'AssociationFilterItem' },
);
