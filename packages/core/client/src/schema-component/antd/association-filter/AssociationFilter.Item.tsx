import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Col, Collapse, Input, Row, Tree } from 'antd';
import cls from 'classnames';
import React, { ChangeEvent, MouseEvent, useMemo, useState } from 'react';
import { SortableItem } from '../../common';
import { useCompile, useDesigner, useProps } from '../../hooks';
import { useToken } from '../__builtins__';
import { EllipsisWithTooltip } from '../input';
import { getLabelFormatValue, useLabelUiSchema } from '../record-picker';
import { AssociationFilter } from './AssociationFilter';
import useStyles from './AssociationFilter.Item.style';

const { Panel } = Collapse;

export const AssociationFilterItem = (props) => {
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
    handleSearchInput: _handleSearchInput,
    params,
    run,
    valueKey: _valueKey,
    labelKey: _labelKey,
    defaultCollapse,
  } = useProps(props);

  const [searchVisible, setSearchVisible] = useState(false);

  const defaultActiveKeyCollapse = useMemo<React.Key[]>(
    () => (defaultCollapse && collectionField?.name ? [collectionField.name] : []),
    [],
  );
  const valueKey = _valueKey || collectionField?.targetKey || 'id';
  const labelKey = _labelKey || fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  const fieldNames = {
    title: labelKey || valueKey,
    key: valueKey,
  };

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.title || 'label');

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
  };

  const handleSearchToggle = (e: MouseEvent) => {
    const filter = params?.[0]?.filter;
    if (searchVisible || filter) {
      run({
        ...params?.[0],
        filter: undefined,
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
};
