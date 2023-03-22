import type { ColumnsType } from 'antd/es/table/interface';
import { Tag, Result, Modal, Table } from 'antd';
import { useAPIClient } from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { DuplicatorSteps } from './DuplicatorSteps';
import { TableTransfer } from './TableTransfer';
import { Category, CollectionData, GroupData } from './hooks/useDumpableCollections';
import { useCollectionsGraph } from './hooks/useCollectionsGraph';
import { splitDataSource } from './utils/splitDataSource';
import _ from 'lodash';
import { getTargetListByKeys } from './utils/getTargetListByKeys';
import { useTranslation } from 'react-i18next';
import { DraggerUpload } from './DraggerUpload';

const columns1: ColumnsType<GroupData> = [
  {
    dataIndex: 'namespace',
    title: 'Namespace',
    render: (namespace: string) => namespace?.split('.')[0],
  },
  {
    dataIndex: 'function',
    title: 'Function',
  },
  {
    dataIndex: 'collections',
    title: 'Collections',
    render: (collections: CollectionData[]) =>
      collections?.map((collection) => <Tag key={collection.title}>{collection.title}</Tag>),
  },
];
const columns2: ColumnsType<CollectionData> = [
  {
    dataIndex: 'title',
    title: 'Title',
  },
  {
    dataIndex: 'name',
    title: 'Name',
  },
  {
    dataIndex: 'category',
    title: 'Category',
    render: (categories: Category[]) =>
      categories?.map((category) => (
        <Tag key={category.name} color={category.color}>
          {category.name}
        </Tag>
      )),
  },
];

export const DuplicatorRestore = () => {
  const api = useAPIClient();
  const { t } = useTranslation();
  const [data, setData] = React.useState<{ requiredGroups: any[]; optionalGroups: any[]; userCollections: any[] }>({
    requiredGroups: [],
    optionalGroups: [],
    userCollections: [],
  });
  const [currentStep, setCurrentStep] = React.useState(0);
  const [targetKeys, setTargetKeys] = React.useState([]);
  const [sourceSelectedKeys, setSourceSelectedKeys] = React.useState([]);
  const [targetSelectedKeys, setTargetSelectedKeys] = React.useState([]);
  const { findAddable, findRemovable } = useCollectionsGraph();
  const [buttonLoading, setButtonLoading] = React.useState(false);
  const [restoreKey, setRestoreKey] = React.useState('');
  const { requiredGroups = [], optionalGroups = [], userCollections = [] } = data;
  const {
    auth: { token },
    axios: {
      defaults: { baseURL },
    },
  } = api;

  const steps = useMemo(
    () => [
      {
        title: '上传备份文件',
        buttonText: '下一步',
        showButton: true,
      },
      {
        title: '选择功能模块',
        buttonText: '下一步',
        showButton: true,
        data: [...requiredGroups, ...optionalGroups],
        leftColumns: columns1,
        rightColumns: columns1,
        showSearch: false,
        targetKeys: [],
        sourceSelectedKeys: [],
        targetSelectedKeys: [],
        handlSelectRow(record: any, selected: boolean, direction: 'left' | 'right') {
          console.log(record, selected, direction);
        },
      },
      {
        title: '选择自定义数据表',
        buttonText: '确认导入',
        showButton: true,
        data: userCollections,
        leftColumns: columns2,
        rightColumns: columns2,
        showSearch: true,
        targetKeys: [],
        sourceSelectedKeys: [],
        targetSelectedKeys: [],
        handlSelectRow(record: any, selected: boolean, direction: 'left' | 'right') {
          const { leftDataSource, rightDataSource } = splitDataSource({
            dataSource: this.data,
            targetKeys: this.targetKeys,
          });
          const dataMap = {
            left: {
              addable: findAddable,
              removable: findRemovable,
              data: leftDataSource,
              setSelectedKeys: setSourceSelectedKeys,
            },
            right: {
              addable: findRemovable,
              removable: findAddable,
              data: rightDataSource,
              setSelectedKeys: setTargetSelectedKeys,
            },
          };

          if (selected) {
            const list = dataMap[direction]
              .addable(record.name)
              .filter(
                (name) => record.name !== name && dataMap[direction].data.some((item) => item.name === name),
              ) as CollectionData[];

            if (list.length) {
              Modal.confirm({
                title: '确认添加以下数据表？',
                width: '60%',
                content: (
                  <div>
                    <Table
                      size={'small'}
                      columns={columns2}
                      dataSource={dataMap[direction].data.filter((collection) => list.includes(collection.name))}
                      pagination={false}
                      scroll={{ y: '60vh' }}
                    />
                  </div>
                ),
                onOk() {
                  dataMap[direction].setSelectedKeys((prev) => _.uniq([...prev, ...list]));
                },
                onCancel() {
                  dataMap[direction].setSelectedKeys((prev) => prev.filter((key) => key !== record.key));
                },
              });
            } else {
              dataMap[direction].setSelectedKeys((prev) => _.uniq([...prev, record.key]));
            }
          } else {
            const list = dataMap[direction]
              .removable(record.name)
              .filter((name) => record.name !== name && dataMap[direction].data.some((item) => item.name === name));

            if (list.length) {
              Modal.confirm({
                title: '确认移除以下数据表？',
                width: '60%',
                content: (
                  <div>
                    <Table
                      size={'small'}
                      columns={columns2}
                      dataSource={dataMap[direction].data.filter((collection) => list.includes(collection.name))}
                      pagination={false}
                      scroll={{ y: '60vh' }}
                    />
                  </div>
                ),
                onOk() {
                  dataMap[direction].setSelectedKeys((prev) => prev.filter((key) => !list.includes(key)));
                },
                onCancel() {
                  dataMap[direction].setSelectedKeys((prev) => prev.filter((key) => key !== record.key));
                },
              });
            } else {
              dataMap[direction].setSelectedKeys((prev) => prev.filter((key) => key !== record.key));
            }
          }
        },
        async handler() {
          const groups = getTargetListByKeys(steps[1].data, steps[1].targetKeys).map((item) => item.namespace);
          const collections = getTargetListByKeys(steps[2].data, steps[2].targetKeys).map((item) => item.name);
          setButtonLoading(true);
          await api.request({
            url: 'duplicator:restore',
            method: 'post',
            data: {
              groups,
              collections,
              restoreKey,
            },
          });
          setButtonLoading(false);
        },
      },
      {
        title: '导入成功',
        buttonText: '',
        showButton: false,
      },
    ],
    [data],
  );
  const handleStepsChange = (current) => {
    steps[currentStep].targetKeys = targetKeys;
    steps[currentStep].sourceSelectedKeys = sourceSelectedKeys;
    steps[currentStep].targetSelectedKeys = targetSelectedKeys;

    setCurrentStep(current);
    setTargetKeys(steps[current].targetKeys);
    setSourceSelectedKeys(steps[current].sourceSelectedKeys || []);
    setTargetSelectedKeys(steps[current].targetSelectedKeys || []);
  };
  const handleTransferChange = (nextTargetKeys) => {
    steps[currentStep].targetKeys = nextTargetKeys;
    setTargetKeys(nextTargetKeys);
  };
  const handleSelectChange = (sourceSelectedKeys = [], targetSelectedKeys = []) => {
    steps[currentStep].sourceSelectedKeys = sourceSelectedKeys;
    steps[currentStep].targetSelectedKeys = targetSelectedKeys;

    setSourceSelectedKeys(sourceSelectedKeys);
    setTargetSelectedKeys(targetSelectedKeys);
  };
  const handleSelectRow = (record: any, selected: boolean, direction: 'left' | 'right') => {
    steps[currentStep].handlSelectRow(record, selected, direction);
  };
  const handleUploadChange = ({ file }) => {
    if (file.status !== 'done') return;

    const { requiredGroups, optionalGroups, userCollections } = file.response.data.meta;
    requiredGroups.forEach((item) => {
      item.key = item.namespace;
      item.title = item.namespace;
      item.disabled = true;
    });
    optionalGroups.forEach((item) => {
      item.key = item.namespace;
      item.title = item.namespace;
    });
    userCollections.forEach((item) => {
      item.key = item.name;
    });

    setRestoreKey(file.response.data.key);
    setData({
      requiredGroups,
      optionalGroups,
      userCollections,
    });
    setCurrentStep(currentStep + 1);
  };

  useEffect(() => {
    if (requiredGroups.length) {
      const keys = requiredGroups.map((group) => group.key);
      setTargetKeys(keys);
      steps[currentStep].targetKeys = keys;
    }
  }, [requiredGroups]);

  const getResult = (currentStep: number) => {
    switch (currentStep) {
      case 0: {
        const headers = {
          authorization: `Bearer ${token}`,
        };
        return (
          <DraggerUpload
            name="file"
            action={`${baseURL}duplicator:uploadFile`}
            headers={headers}
            onChange={handleUploadChange}
          />
        );
      }
      case 1:
        return (
          <TableTransfer<GroupData | CollectionData>
            listStyle={{ minWidth: 0, border: 'none' }}
            scroll={{ x: true }}
            titles={['未选', '已选']}
            dataSource={steps[currentStep].data}
            leftColumns={steps[currentStep].leftColumns}
            rightColumns={steps[currentStep].rightColumns}
            showSearch={steps[currentStep].showSearch}
            targetKeys={targetKeys}
            selectedKeys={[...sourceSelectedKeys, ...targetSelectedKeys]}
            onChange={handleTransferChange}
            onSelectChange={handleSelectChange}
            onSelectRow={handleSelectRow}
          />
        );
      case 2:
        return (
          <TableTransfer<GroupData | CollectionData>
            listStyle={{ minWidth: 0, border: 'none' }}
            scroll={{ x: true }}
            titles={['未选择', '已选择']}
            dataSource={steps[currentStep].data}
            leftColumns={steps[currentStep].leftColumns}
            rightColumns={steps[currentStep].rightColumns}
            showSearch={steps[currentStep].showSearch}
            targetKeys={targetKeys}
            selectedKeys={[...sourceSelectedKeys, ...targetSelectedKeys]}
            onChange={handleTransferChange}
            onSelectChange={handleSelectChange}
            onSelectRow={handleSelectRow}
          />
        );
      case 3:
        return <Result status="success" title="导入成功" />;
      default:
        return null;
    }
  };

  return (
    <DuplicatorSteps loading={buttonLoading} steps={steps} current={currentStep} onChange={handleStepsChange}>
      {getResult(currentStep)}
    </DuplicatorSteps>
  );
};
