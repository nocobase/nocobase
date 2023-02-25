import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import { Col, Collapse, Input, Row, Tree } from 'antd';
import cls from 'classnames';
import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import { useRequest } from '../../../api-client';
import { useBlockRequestContext } from '../../../block-provider';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollectionManager } from '../../../collection-manager';
import { SortableItem } from '../../common';
import { useCompile, useDesigner } from '../../hooks';
import { AssociationFilter } from './AssociationFilter';

const { Panel } = Collapse;

export const AssociationFilterItem = (props) => {
  const collectionField = AssociationFilter.useAssociationField();
  const { getCollection, getCollectionField } = useCollectionManager();

  if (!collectionField) {
    return null;
  }

  const fieldSchema = useFieldSchema();
  const Designer = useDesigner();
  const compile = useCompile();
  const { service, props: blockProps } = useBlockRequestContext();

  const [searchVisible, setSearchVisible] = useState(false);

  const collectionFieldName = collectionField.name;
  const targetCollection = getCollection(collectionField.target);
  const treeTable = targetCollection.tree === 'adjacencyList';

  const valueKey = collectionField?.targetKey || 'id';
  const labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  const targetValueField = getCollectionField(`${targetCollection.name}.${valueKey}`);

  const fieldNames = {
    title: labelKey || valueKey,
    key: valueKey,
  };

  const params = {
    fields: [labelKey, valueKey],
    pageSize: 200,
    page: 1,
    tree: treeTable,
    filter: {
      parentId: null,
    },
  };

  const { data, loading, run } = useRequest(
    {
      resource: collectionField.target,
      action: 'list',
      params,
    },
    {
      refreshDeps: [labelKey, valueKey],
      debounceWait: 300,
    },
  );

  const treeData = data?.data || [];

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    expandAll();
  }, [loading]);

  const expandAll = () => {
    const keys = [];
    const find = (list) => {
      list.forEach((i) => {
        if (i.children?.length) {
          keys.push(i[valueKey]);
          find(i.children);
        }
      });
    };
    find(treeData);
    setExpandedKeys(keys);
  };

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
  };

  const onSelect = (selectedKeysValue: React.Key[]) => {
    setSelectedKeys(selectedKeysValue);

    const filters = service.params?.[1]?.filters || {};

    if (selectedKeysValue.length) {
      filters[`af.${collectionFieldName}`] = {
        [`${collectionFieldName}.${valueKey}.$in`]: selectedKeysValue,
      };
    } else {
      delete filters[`af.${collectionFieldName}`];
    }

    service.run(
      {
        ...service.params?.[0],
        pageSize: 200,
        page: 1,
        filter: mergeFilter([...Object.values(filters), blockProps?.params?.filter]),
      },
      { filters },
    );
  };

  const handleSearchToggle = async (e: MouseEvent) => {
    const filter = params?.[0]?.filter;
    if (searchVisible || filter) {
      await run({
        ...params,
        filter: {
          ...params.filter,
        },
      });
    }
    setSearchVisible(!searchVisible);
    e.stopPropagation();
  };

  const handleSearchClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleSearchInput = async (e: ChangeEvent<any>) => {
    await run({
      ...params,
      filter: {
        ...params.filter,
        [`${labelKey}.${['integer', 'decimal', 'bigInt'].includes(targetValueField.type) ? '$eq' : '$includes'}`]:
          e.target.value,
      },
    });
  };

  const title = fieldSchema.title ?? collectionField.uiSchema?.title;

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
      <Collapse
        defaultActiveKey={[collectionField.uiSchemaUid]}
        ghost
        expandIcon={searchVisible ? () => null : undefined}
      >
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
          key={collectionField.uiSchemaUid}
        >
          <Tree
            style={{ padding: '16px 0' }}
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            key={valueKey}
            treeData={treeData}
            onSelect={onSelect}
            fieldNames={fieldNames}
            titleRender={(node) => compile(node[labelKey])}
            selectedKeys={selectedKeys}
            blockNode
          />
        </Panel>
      </Collapse>
    </SortableItem>
  );
};
