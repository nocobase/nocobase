import { DeleteOutlined, DownOutlined, EditOutlined, UpOutlined } from '@ant-design/icons';
import '@antv/x6-react-shape';
import { css, cx } from '@emotion/css';
import { uid } from '@formily/shared';
import {
  Action,
  Checkbox,
  collection,
  CollectionField,
  CollectionProvider,
  Form,
  FormItem,
  Formula,
  Grid,
  Input,
  InputNumber,
  Radio,
  ResourceActionProvider,
  SchemaComponent,
  SchemaComponentProvider,
  Select,
  useCollectionManager,
  useCompile,
  useCurrentAppInfo,
  useRecord,
  CollectionCategroriesContext,
} from '@nocobase/client';
import { Badge, Dropdown, Popover, Tag } from 'antd';
import { groupBy } from 'lodash';
import React, { useRef, useState, useContext } from 'react';
import {
  useAsyncDataSource,
  useCancelAction,
  useDestroyActionAndRefreshCM,
  useDestroyFieldActionAndRefreshCM,
  useUpdateCollectionActionAndRefreshCM,
  useValuesFromRecord,
} from '../action-hooks';
import { collectiionPopoverClass, entityContainer, headClass, tableBtnClass, tableNameClass } from '../style';
import { useGCMTranslation } from '../utils';
import { AddFieldAction } from './AddFieldAction';
import { CollectionNodeProvder } from './CollectionNodeProvder';
import { EditCollectionAction } from './EditCollectionAction';
import { EditFieldAction } from './EditFieldAction';
import { FieldSummary } from './FieldSummary';
import { OverrideFieldAction } from './OverrideFieldAction';
import { ViewFieldAction } from './ViewFieldAction';

const Entity: React.FC<{
  node?: Node | any;
  setTargetNode: Function | any;
  targetGraph: any;
}> = (props) => {
  const { node, setTargetNode, targetGraph } = props;
  const {
    store: {
      data: { title, name, item, attrs, select },
    },
    id,
  } = node;
  const database = useCurrentAppInfo();
  const collectionData = useRef();
  const categoryData = useContext(CollectionCategroriesContext);
  collectionData.current = { ...item, title, inherits: item.inherits && new Proxy(item.inherits, {}) };
  const { category } = item;
  const compile = useCompile();
  const loadCollections = async (field: any) => {
    return targetGraph.collections?.map((collection: any) => ({
      label: compile(collection.title),
      value: collection.name,
    }));
  };
  const loadCategories = async () => {
    return categoryData.data.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };
  const portsProps = {
    targetGraph,
    collectionData,
    setTargetNode,
    node,
    loadCollections,
  };
  return (
    <div
      className={cx(entityContainer)}
      style={{ boxShadow: attrs?.boxShadow, border: select ? '2px dashed #f5a20a' : 0 }}
    >
      {category.map((v, index) => {
        return (
          <Badge.Ribbon
            color={v.color}
            style={{ width: '103%', height: '3px', marginTop: index * 5 - 8, borderRadius: 0 }}
            placement="start"
          />
        );
      })}
      <div
        className={headClass}
        style={{ background: attrs?.hightLight ? '#1890ff' : null, paddingTop: category.length * 3 }}
      >
        <span className={tableNameClass}>{compile(title)}</span>

        <div className={tableBtnClass}>
          <SchemaComponentProvider>
            <CollectionNodeProvder setTargetNode={setTargetNode} node={node}>
              <CollectionProvider collection={collection}>
                <SchemaComponent
                  scope={{
                    useUpdateCollectionActionAndRefreshCM,
                    useCancelAction,
                    loadCollections,
                    loadCategories,
                    useAsyncDataSource,
                    Action,
                    DeleteOutlined,
                    enableInherits: database?.dialect === 'postgres',
                  }}
                  components={{
                    Action,
                    EditOutlined,
                    FormItem,
                    CollectionField,
                    Input,
                    Form,
                    Select,
                    EditCollectionAction,
                    Checkbox,
                  }}
                  schema={{
                    type: 'object',
                    properties: {
                      update: {
                        type: 'void',
                        title: '{{ t("Edit") }}',
                        'x-component': 'EditCollectionAction',
                        'x-component-props': {
                          type: 'primary',
                          item: collectionData.current,
                        },
                      },
                      delete: {
                        type: 'void',
                        'x-action': 'destroy',
                        'x-component': 'Action',
                        'x-component-props': {
                          component: DeleteOutlined,
                          icon: 'DeleteOutlined',
                          className: css`
                            background-color: rgb(255 236 232);
                            border-color: transparent;
                            color: #e31c1c;
                            height: 20px;
                            padding: 5px;
                            &:hover {
                              background-color: rgb(253 205 197);
                            }
                          `,

                          confirm: {
                            title: "{{t('Delete record')}}",
                            getContainer: () => {
                              return document.getElementById('graph_container');
                            },
                            collectionConten: "{{t('Are you sure you want to delete it?')}}",
                          },
                          useAction: () => useDestroyActionAndRefreshCM({ name, id }),
                        },
                      },
                    },
                  }}
                />
              </CollectionProvider>
            </CollectionNodeProvder>
          </SchemaComponentProvider>
        </div>
      </div>

      <PortsCom {...portsProps} />
    </div>
  );
};

const PortsCom = React.memo<any>(({ targetGraph, collectionData, setTargetNode, node, loadCollections }) => {
  const {
    store: {
      data: { title, name, item, ports, data, sourcePort, associated, targetPort },
    },
  } = node;
  const [collapse, setCollapse] = useState(false);
  const { t } = useGCMTranslation();
  const compile = useCompile();
  const portsData = groupBy(ports.items, (v) => {
    if (
      v.isForeignKey ||
      v.primaryKey ||
      ['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo', 'id'].includes(v.interface)
    ) {
      return 'initPorts';
    } else {
      return 'morePorts';
    }
  });
  const useNewId = (prefix) => {
    return `${prefix || ''}${uid()}`;
  };
  const CollectionConten = (data) => {
    const { type, name, primaryKey, allowNull, autoIncrement } = data;
    return (
      <div className={cx(collectiionPopoverClass)}>
        <div className="field-content">
          <div>
            <span>name</span>: <span className="field-type">{name}</span>
          </div>
          <div>
            <span>type</span>: <span className="field-type">{type}</span>
          </div>
        </div>
        <p>
          {primaryKey && <Tag color="green">PRIMARY</Tag>}
          {allowNull && <Tag color="geekblue">ALLOWNULL</Tag>}
          {autoIncrement && <Tag color="purple">AUTOINCREMENT</Tag>}
        </p>
      </div>
    );
  };
  const typeColor = (v) => {
    if (v.isForeignKey || v.primaryKey || v.interface === 'id') {
      return 'red';
    } else if (['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(v.interface)) {
      return 'orange';
    }
  };
  const OperationButton = ({ property }) => {
    const isInheritField = !(property.collectionName !== name);
    return (
      <div className="field-operator">
        <SchemaComponentProvider
          components={{
            FormItem,
            CollectionField,
            Input,
            Form,
            ResourceActionProvider,
            Select: (props) => (
              <Select
                {...props}
                getPopupContainer={() => {
                  return document.getElementById('graph_container');
                }}
              />
            ),
            Checkbox,
            Radio,
            InputNumber,
            Grid,
            FieldSummary,
            Action,
            EditOutlined,
            DeleteOutlined,
            AddFieldAction,
            OverrideFieldAction,
            ViewFieldAction,
            Dropdown,
            Formula,
          }}
          scope={{
            useAsyncDataSource,
            loadCollections,
            useCancelAction,
            useNewId,
            useCurrentFields,
            useValuesFromRecord,
            useUpdateCollectionActionAndRefreshCM,
            isInheritField,
          }}
        >
          <CollectionNodeProvder
            record={collectionData.current}
            setTargetNode={setTargetNode}
            node={node}
            handelOpenPorts={() => handelOpenPorts(true)}
          >
            <SchemaComponent
              scope={useCancelAction}
              schema={{
                type: 'object',
                properties: {
                  create: {
                    type: 'void',
                    'x-action': 'create',
                    'x-component': 'AddFieldAction',
                    'x-visible': '{{isInheritField}}',
                    'x-component-props': {
                      item: {
                        ...property,
                        title,
                      },
                    },
                  },
                  update: {
                    type: 'void',
                    'x-action': 'update',
                    'x-component': EditFieldAction,
                    'x-visible': '{{isInheritField}}',
                    'x-component-props': {
                      item: {
                        ...property,
                        title,
                        __parent: collectionData.current,
                      },
                    },
                  },
                  delete: {
                    type: 'void',
                    'x-action': 'destroy',
                    'x-component': 'Action',
                    'x-visible': '{{isInheritField}}',
                    'x-component-props': {
                      component: DeleteOutlined,
                      icon: 'DeleteOutlined',
                      className: css`
                        background-color: rgb(255 236 232);
                        border-color: transparent;
                        color: #e31c1c;
                        height: 20px;
                        width: 20px;
                        padding: 5px;
                        &:hover {
                          background-color: rgb(253 205 197);
                        }
                      `,
                      confirm: {
                        title: "{{t('Delete record')}}",
                        getContainer: () => {
                          return document.getElementById('graph_container');
                        },
                        collectionConten: "{{t('Are you sure you want to delete it?')}}",
                      },
                      useAction: () =>
                        useDestroyFieldActionAndRefreshCM({
                          collectionName: property.collectionName,
                          name: property.name,
                        }),
                    },
                  },
                  override: {
                    type: 'void',
                    'x-action': 'create',
                    'x-visible': '{{!isInheritField}}',
                    'x-component': 'OverrideFieldAction',
                    'x-component-props': {
                      icon: 'ReconciliationOutlined',
                      item: {
                        ...property,
                        title,
                        __parent: collectionData.current,
                        targetCollection: name,
                      },
                    },
                  },
                  view: {
                    type: 'void',
                    'x-action': 'view',
                    'x-visible': '{{!isInheritField}}',
                    'x-component': 'ViewFieldAction',
                    'x-component-props': {
                      icon: 'ReconciliationOutlined',
                      item: {
                        ...property,
                        title,
                        __parent: collectionData.current,
                      },
                    },
                  },
                },
              }}
            />
          </CollectionNodeProvder>
        </SchemaComponentProvider>
      </div>
    );
  };
  const { getInterface } = useCollectionManager();
  // 获取当前字段列表
  const useCurrentFields = () => {
    const record = useRecord();
    const { getCollectionFields } = useCollectionManager();
    const fields = getCollectionFields(record.collectionName || record.name) as any[];
    return fields;
  };
  const handelOpenPorts = (isCollapse?) => {
    targetGraph.getCellById(item.name)?.toFront();
    setCollapse(isCollapse);
    const collapseNodes = targetGraph.collapseNodes || [];
    collapseNodes.push({
      [item.name]: isCollapse,
    });
    targetGraph.collapseNodes = collapseNodes;
    targetGraph.getCellById(item.name).setData({ collapse: true });
  };
  const isCollapse = collapse && data?.collapse;
  return (
    <div className="body">
      {portsData['initPorts']?.map((property) => {
        return (
          property.uiSchema && (
            <Popover
              content={CollectionConten(property)}
              getPopupContainer={() => {
                return document.getElementById('graph_container');
              }}
              mouseLeaveDelay={0}
              zIndex={100}
              title={
                <div>
                  {compile(property.uiSchema?.title)}
                  <span style={{ color: '#ffa940', float: 'right' }}>
                    {compile(getInterface(property.interface)?.title)}
                  </span>
                </div>
              }
              key={property.id}
              placement="right"
            >
              <div
                className="body-item"
                key={property.id}
                id={property.id}
                style={{
                  background:
                    targetPort || sourcePort === property.id || associated?.includes(property.name) ? '#e6f7ff' : null,
                }}
              >
                <div className="name">
                  <Badge color={typeColor(property)} />
                  {compile(property.uiSchema?.title)}
                </div>
                <div className={`type  field_type`}>{compile(getInterface(property.interface)?.title)}</div>
                <OperationButton property={property} />
              </div>
            </Popover>
          )
        );
      })}
      <div className="morePorts">
        {isCollapse &&
          portsData['morePorts']?.map((property) => {
            return (
              property.uiSchema && (
                <Popover
                  content={CollectionConten(property)}
                  getPopupContainer={() => {
                    return document.getElementById('graph_container');
                  }}
                  mouseLeaveDelay={0}
                  zIndex={100}
                  title={
                    <div>
                      {compile(property.uiSchema?.title)}
                      <span style={{ color: '#ffa940', float: 'right' }}>
                        {compile(getInterface(property.interface)?.title)}
                      </span>
                    </div>
                  }
                  key={property.id}
                  placement="right"
                >
                  <div
                    className="body-item"
                    key={property.id}
                    id={property.id}
                    style={{
                      background:
                        targetPort || sourcePort === property.id || associated?.includes(property.name)
                          ? '#e6f7ff'
                          : null,
                    }}
                  >
                    <div className="name">
                      <Badge color="green" />
                      {compile(property.uiSchema?.title)}
                    </div>
                    <div className={`type field_type`}>{compile(getInterface(property.interface)?.title)}</div>
                    <OperationButton property={property} />
                  </div>
                </Popover>
              )
            );
          })}
      </div>
      <a
        className={css`
          display: block;
          color: #958f8f;
          padding: 10px 5px;
          &:hover {
            color: rgb(99 90 88);
          }
        `}
        onClick={() => handelOpenPorts(!isCollapse)}
      >
        {isCollapse
          ? [
              <UpOutlined style={{ margin: '0px 8px 0px 5px' }} key="icon" />,
              <span key="associate">{t('Association Fields')}</span>,
            ]
          : [
              <DownOutlined style={{ margin: '0px 8px 0px 5px' }} key="icon" />,
              <span key="all">{t('All Fields')}</span>,
            ]}
      </a>
    </div>
  );
});

export default Entity;
