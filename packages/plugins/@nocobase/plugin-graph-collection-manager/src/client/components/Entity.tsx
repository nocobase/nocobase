import { DeleteOutlined, DownOutlined, EditOutlined, UpOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import {
  CollectionCategroriesContext,
  CollectionProvider_deprecated,
  SchemaComponent,
  SchemaComponentProvider,
  Select,
  StablePopover,
  useCollectionManager_deprecated,
  useCompile,
  useCurrentAppInfo,
  useRecord,
} from '@nocobase/client';
import { Badge, Tag } from 'antd';
import lodash from 'lodash';
import React, { useContext, useRef, useState } from 'react';
import {
  useAsyncDataSource,
  useCancelAction,
  useDestroyActionAndRefreshCM,
  useDestroyFieldActionAndRefreshCM,
  useUpdateCollectionActionAndRefreshCM,
  useValuesFromRecord,
} from '../action-hooks';
import useStyles from '../style';
import { getPopupContainer, useGCMTranslation, collection } from '../utils';
import { AddFieldAction } from './AddFieldAction';
import { CollectionNodeProvder } from './CollectionNodeProvder';
import { ConnectAssociationAction } from './ConnectAssociationAction';
import { ConnectChildAction } from './ConnectChildAction';
import { ConnectParentAction } from './ConnectParentAction';
import { DeleteCollectionAction } from './DeleteCollectionAction';
import { EditCollectionAction } from './EditCollectionAction';
import { EditFieldAction } from './EditFieldAction';
import { FieldSummary } from './FieldSummary';
import { OverrideFieldAction } from './OverrideFieldAction';
import { ViewFieldAction } from './ViewFieldAction';

const OperationButton: any = React.memo((props: any) => {
  const { property, loadCollections, collectionData, setTargetNode, node, handelOpenPorts, title, name, targetGraph } =
    props;
  const isInheritField = !(property.collectionName !== name);
  const options = useContext(SchemaOptionsContext);
  const isAssociationField = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(property.type);
  const isShowAssocition =
    isAssociationField &&
    !(property.through ? targetGraph.hasCell(property.through) : targetGraph.hasCell(property.target));
  const {
    data: { database },
  } = useCurrentAppInfo();
  const useNewId = (prefix) => {
    return `${prefix || ''}${uid()}`;
  };
  // 获取当前字段列表
  const useCurrentFields = () => {
    const record = useRecord();
    const { getCollectionFields } = useCollectionManager_deprecated();
    const fields = getCollectionFields(record.collectionName || record.name) as any[];
    return fields;
  };
  return (
    <div className="field-operator">
      <SchemaComponentProvider
        components={{
          Select: (props) => <Select popupMatchSelectWidth={false} {...props} getPopupContainer={getPopupContainer} />,
          FieldSummary,
          AddFieldAction,
          OverrideFieldAction,
          ViewFieldAction,
          EditFieldAction,
          ConnectAssociationAction,
          ...options.components,
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
          isShowAssocition,
          ...options.scope,
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
                    database,
                  },
                },
                update: {
                  type: 'void',
                  'x-action': 'update',
                  'x-component': 'EditFieldAction',
                  'x-visible': '{{isInheritField}}',
                  'x-component-props': {
                    item: {
                      ...property,
                      title,
                    },
                    parentItem: collectionData.current,
                  },
                },
                delete: {
                  type: 'void',
                  'x-action': 'destroy',
                  'x-component': 'Action.Link',
                  'x-visible': '{{isInheritField}}',
                  'x-component-props': {
                    component: DeleteOutlined,
                    icon: 'DeleteOutlined',
                    className: 'btn-del',
                    confirm: {
                      getContainer: getPopupContainer,
                      title: "{{t('Delete record')}}",
                      content: "{{t('Are you sure you want to delete it?')}}",
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
                      targetCollection: name,
                    },
                    parentItem: collectionData.current,
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
                    },
                    parentItem: collectionData.current,
                  },
                },
                connectAssociation: {
                  type: 'void',
                  'x-action': 'view',
                  'x-visible': '{{isShowAssocition}}',
                  'x-component': 'ConnectAssociationAction',
                  'x-component-props': {
                    item: {
                      ...property,
                      title,
                      __parent: collectionData.current,
                    },
                    targetGraph,
                  },
                },
              },
            }}
          />
        </CollectionNodeProvder>
      </SchemaComponentProvider>
    </div>
  );
});
OperationButton.displayName = 'OperationButton';
const PopoverContent = React.forwardRef((props: any, ref) => {
  const { property, node, ...other } = props;
  const {
    store: {
      data: { title, name, sourcePort, associated, targetPort },
    },
  } = node;
  const compile = useCompile();
  const { styles } = useStyles();
  const { getInterface } = useCollectionManager_deprecated();
  const [isHovered, setIsHovered] = useState(false);
  const CollectionConten = React.useCallback((data) => {
    const { type, name, primaryKey, allowNull, autoIncrement } = data;
    return (
      <div className={styles.collectionPopoverClass}>
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
  }, []);
  const operatioBtnProps = {
    title,
    name,
    node,
    ...other,
  };
  const typeColor = (v) => {
    if (v.isForeignKey || v.primaryKey || v.interface === 'id') {
      return 'red';
    } else if (['obo', 'oho', 'o2o', 'o2m', 'm2o', 'm2m', 'linkTo'].includes(v.interface)) {
      return 'orange';
    }
  };
  return (
    <div>
      <div
        className="body-item"
        key={property.id}
        id={property.id}
        style={{
          background:
            targetPort || sourcePort === property.id || associated?.includes(property.name) ? '#e6f7ff' : null,
        }}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <StablePopover
          content={CollectionConten(property)}
          getPopupContainer={getPopupContainer}
          mouseLeaveDelay={0}
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
          <div className="name">
            <Badge color={typeColor(property)} />
            {compile(property.uiSchema?.title)}
          </div>
        </StablePopover>
        <div className={`type  field_type`}>{compile(getInterface(property.interface)?.title)}</div>
        {isHovered && <OperationButton property={property} {...operatioBtnProps} />}
      </div>
    </div>
  );
});
PopoverContent.displayName = 'PopoverContent';

const PortsCom = React.memo<any>(({ targetGraph, collectionData, setTargetNode, node, loadCollections }) => {
  const {
    store: {
      data: { item, ports, data },
    },
  } = node;
  const [collapse, setCollapse] = useState(false);
  const { t } = useGCMTranslation();
  const portsData = lodash.groupBy(ports.items, (v) => {
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
  const popoverProps = {
    collectionData,
    setTargetNode,
    loadCollections,
    handelOpenPorts,
    node,
    targetGraph,
  };
  return (
    <div className="body">
      {portsData['initPorts']?.map((property) => {
        return property.uiSchema && <PopoverContent {...popoverProps} property={property} key={property.id} />;
      })}
      <div className="morePorts">
        {isCollapse &&
          portsData['morePorts']?.map((property) => {
            return property.uiSchema && <PopoverContent {...popoverProps} property={property} key={property.id} />;
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

const Entity: React.FC<{
  node?: Node | any;
  setTargetNode: Function | any;
  targetGraph: any;
}> = (props) => {
  const { styles } = useStyles();
  const options = useContext(SchemaOptionsContext);
  const { node, setTargetNode, targetGraph } = props;
  const {
    store: {
      data: { title, name, item, attrs, select, actived },
    },
    id,
  } = node;
  const {
    data: { database },
  } = useCurrentAppInfo();
  const collectionData = useRef();
  const categoryData = useContext(CollectionCategroriesContext);
  collectionData.current = { ...item, title, inherits: item.inherits && new Proxy(item.inherits, {}) };
  const { category = [] } = item;
  const compile = useCompile();
  const loadCollections = async (field: any) => {
    return targetGraph.collections?.map((collection: any) => ({
      label: compile(collection.title),
      value: collection.name,
    }));
  };
  const loadCategories = async () => {
    return categoryData?.data.map((item: any) => ({
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
      className={styles.entityContainer}
      style={{ boxShadow: attrs?.boxShadow, border: select ? '2px dashed #f5a20a' : 0 }}
    >
      {category?.map((v, index) => {
        return (
          <Badge.Ribbon
            key={index}
            color={v.color}
            style={{ width: '103%', height: '3px', marginTop: index * 5 - 8, borderRadius: 0 }}
            placement="start"
          />
        );
      })}
      <div
        className={styles.headClass}
        style={{ background: attrs?.hightLight ? '#1890ff' : null, paddingTop: category.length * 3 }}
      >
        <span className={styles.tableNameClass}>{compile(title)}</span>

        <div className={styles.tableBtnClass}>
          <SchemaComponentProvider>
            <CollectionNodeProvder setTargetNode={setTargetNode} node={node}>
              <CollectionProvider_deprecated collection={collection}>
                <SchemaComponent
                  scope={{
                    useUpdateCollectionActionAndRefreshCM,
                    useCancelAction,
                    loadCollections,
                    loadCategories,
                    useAsyncDataSource,
                    enableInherits: database?.dialect === 'postgres',
                    actived: actived === true,
                  }}
                  components={{
                    EditOutlined,
                    EditCollectionAction,
                    DeleteCollectionAction,
                    ConnectChildAction,
                    ConnectParentAction,
                    ...options.components,
                  }}
                  schema={{
                    type: 'object',
                    name: node.id,
                    properties: {
                      connectParent: {
                        type: 'void',
                        'x-visible': '{{actived}}',
                        'x-component': 'ConnectParentAction',
                        'x-component-props': {
                          item: collectionData.current,
                          targetGraph,
                        },
                      },
                      connectChild: {
                        type: 'void',
                        'x-component': 'ConnectChildAction',
                        'x-component-props': {
                          item: collectionData.current,
                          targetGraph,
                        },
                        'x-visible': '{{actived}}',
                      },
                      update: {
                        type: 'void',
                        title: '{{ t("Edit") }}',
                        'x-component': 'EditCollectionAction',
                        'x-component-props': {
                          type: 'primary',
                          item: collectionData.current,
                          className: 'btn-edit-in-head',
                        },
                      },
                      delete: {
                        type: 'void',
                        'x-action': 'destroy',
                        'x-component': 'DeleteCollectionAction',
                        'x-component-props': {
                          className: 'btn-del',
                          getContainer: getPopupContainer,
                          item: collectionData.current,
                          useAction: () => {
                            return useDestroyActionAndRefreshCM({ name, id });
                          },
                        },
                      },
                    },
                  }}
                />
              </CollectionProvider_deprecated>
            </CollectionNodeProvder>
          </SchemaComponentProvider>
        </div>
      </div>
      <PortsCom {...portsProps} />
    </div>
  );
};

export default Entity;
