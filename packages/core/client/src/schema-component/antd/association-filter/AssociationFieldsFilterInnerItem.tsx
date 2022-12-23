import cls from 'classnames';
import React, { MouseEvent, ChangeEvent, useContext, useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Col, Collapse, Input, Row, Tree } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useCollectionField } from '../../../collection-manager';
import { useFieldSchema } from '@formily/react';
import { useResource } from '../../../api-client';
import { useCompile, useDesigner } from '../../hooks';
import { AssociationFieldsFilterInnerItemDesigner } from './AssociationFieldsFilterInnerItem.Designer';
import { SortableItem } from '../../common';
import { SharedFilterContext } from '../../../block-provider/SharedFilterProvider';
import { useBlockRequestContext } from '../../../block-provider';

const { Panel } = Collapse;

export const AssociationFieldsFilterInnerItem = (props) => {
  const collectionField = useCollectionField();
  const fieldSchema = useFieldSchema();
  const Designer = useDesigner();
  const compile = useCompile();
  const { service, props: blockProps } = useBlockRequestContext();
  const [list, setList] = useState([]);
  const { setSharedFilterStore, sharedFilterStore, getFilterParams } = useContext(SharedFilterContext);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const targetCollectionName = fieldSchema['x-component-props'].target;
  const collectionFieldName = collectionField.name;

  const resource = useResource(targetCollectionName);

  const labelKey = fieldSchema['x-designer-props'].fieldNames.label;
  const valueKey = 'id';

  const treeData = list
    .map((i) => ({
      title: compile(i[labelKey]),
      key: i[valueKey],
    }))
    .filter((i) => (typeof i.title === 'string' ? i.title : '-').toLowerCase().includes(searchValue.toLowerCase()));

  useEffect(() => {
    resource.list().then((res) => {
      setList(res.data.data);
    });
  }, []);

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onSelect = (selectedKeysValue: React.Key[]) => {
    setSelectedKeys(selectedKeysValue);

    const orList = treeData
      .filter((item) => selectedKeysValue.includes(item.key))
      .map((item) => ({
        [collectionFieldName]: {
          [valueKey]: {
            $eq: item.key,
          },
        },
      }));

    const newFilter =
      orList.length > 0
        ? {
            $or: orList,
          }
        : {};

    const newAssociationFilterStore = {
      ...sharedFilterStore,
      [collectionFieldName]: newFilter,
    };

    setSharedFilterStore(newAssociationFilterStore);

    const paramFilter = getFilterParams(newAssociationFilterStore);

    service.run({ ...service.params?.[0], page: 1, filter: paramFilter });
  };

  const handleSearchToggle = (e: MouseEvent) => {
    setSearchVisible(!searchVisible);
    if (searchValue) setSearchValue('');
    e.stopPropagation();
  };

  const handleSearchClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleSearchInput = (e: ChangeEvent) => {
    setSearchValue((e.target as HTMLInputElement).value);
  };

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
                height: 22px;
                flex-wrap: nowrap;
                ${searchVisible ? 'border-bottom: 1px solid #dcdcdc;' : ''}
              `}
              gutter={5}
            >
              <Col
                className={css`
                  flex: 1 1 auto;
                `}
              >
                {searchVisible ? (
                  <input
                    autoFocus
                    placeholder="Search..."
                    className={css`
                      outline: none;
                      background: #fafafa;
                      width: 100%;
                      border: none;
                      height: 20px;
                      &::placeholder {
                        color: #dcdcdc;
                      }
                    `}
                    onClick={handleSearchClick}
                    onChange={handleSearchInput}
                  />
                ) : (
                  compile(collectionField.uiSchema.title)
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
            autoExpandParent={autoExpandParent}
            treeData={treeData}
            onSelect={onSelect}
            selectedKeys={selectedKeys}
            blockNode
          />
        </Panel>
      </Collapse>
    </SortableItem>
  );
};

AssociationFieldsFilterInnerItem.Designer = AssociationFieldsFilterInnerItemDesigner;
