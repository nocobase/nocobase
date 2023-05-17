import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import { Col, Collapse, Input, Row, Tree } from 'antd';
import cls from 'classnames';
import React, { ChangeEvent, MouseEvent, useMemo, useState } from 'react';
import { SortableItem } from '../../common';
import { useCompile, useDesigner, useProps } from '../../hooks';
import { EllipsisWithTooltip } from '../input';
import { getLabelFormatValue, useLabelUiSchema } from '../record-picker';
import { AssociationFilter } from './AssociationFilter';

const { Panel } = Collapse;

export const AssociationFilterItem = (props) => {
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
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.title || 'label');

  return (
    <SortableItem
      className={cls(
        'nb-block-item',
        props.className,
        css`
          position: relative;
          &:hover {
            > .general-schema-designer {
              display: block;
            }
          }
          &.nb-form-item:hover {
            > .general-schema-designer {
              background: rgba(241, 139, 98, 0.06) !important;
              border: 0 !important;
              top: -5px !important;
              bottom: -5px !important;
              left: -5px !important;
              right: -5px !important;
            }
          }
          > .general-schema-designer {
            position: absolute;
            z-index: 999;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            display: none;
            border: 2px solid rgba(241, 139, 98, 0.3);
            pointer-events: none;
            > .general-schema-designer-icons {
              position: absolute;
              right: 2px;
              top: 2px;
              line-height: 16px;
              pointer-events: all;
              .ant-space-item {
                background-color: #f18b62;
                color: #fff;
                line-height: 16px;
                width: 16px;
                padding-left: 1px;
              }
            }
          }
        `,
      )}
    >
      <Designer />
      <Collapse defaultActiveKey={defaultActiveKeyCollapse} ghost expandIcon={searchVisible ? () => null : undefined}>
        <Panel
          className={css`
            & .ant-collapse-content-box {
              padding: 0 8px !important;
              max-height: 400px;
              overflow: auto;
            }
            & .ant-collapse-header {
              padding: 10px !important;
              background: #fafafa;
            }
          `}
          header={
            <Row
              className={css`
                align-items: center;
                width: 100%;
                min-width: 0;
                height: 22px;
                flex-wrap: nowrap;
                ${searchVisible ? 'border-bottom: 1px solid #dcdcdc;' : ''}
              `}
              gutter={5}
            >
              <Col
                title={compile(title)}
                className={css`
                  flex: 1 1 auto;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                `}
              >
                {searchVisible ? (
                  <Input
                    bordered={false}
                    autoFocus
                    placeholder="Search..."
                    className={css`
                      outline: none;
                      background: #fafafa;
                      width: 100%;
                      border: none;
                      height: 20px;
                      padding: 4px;
                      &::placeholder {
                        color: #dcdcdc;
                      }
                    `}
                    onClick={handleSearchClick}
                    onChange={handleSearchInput}
                  />
                ) : (
                  compile(title)
                )}
              </Col>
              <Col
                className={css`
                  flex: 0 0 auto;
                `}
              >
                {searchVisible ? (
                  <CloseOutlined
                    className={css`
                      color: #aeaeae !important;
                      font-size: 11px;
                    `}
                    onClick={handleSearchToggle}
                  />
                ) : (
                  <SearchOutlined
                    className={css`
                      color: #aeaeae !important;
                    `}
                    onClick={handleSearchToggle}
                  />
                )}
              </Col>
            </Row>
          }
          key={defaultActiveKeyCollapse[0]}
        >
          <Tree
            style={{ padding: '16px 0' }}
            onExpand={onExpand}
            rootClassName={css`
              .ant-tree-node-content-wrapper {
                overflow-x: hidden;
              }
            `}
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
    </SortableItem>
  );
};
