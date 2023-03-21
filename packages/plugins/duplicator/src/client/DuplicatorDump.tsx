import type { ColumnsType } from 'antd/es/table/interface';
import { Tag } from 'antd';
import { useAPIClient, useRequest } from '@nocobase/client';
import { saveAs } from 'file-saver';
import React, { useEffect, useMemo } from 'react';
import { DuplicatorSteps } from './DuplicatorSteps';
import { TableTransfer } from './TableTransfer';
import { Category, CollectionData, GroupData, useDumpableCollections } from './hooks/useDumpableCollections';

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

export const DuplicatorDump = () => {
  const api = useAPIClient();
  const data = useDumpableCollections();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [targetKeys, setTargetKeys] = React.useState([]);
  const { requiredGroups = [], optionalGroups = [], userCollections = [] } = data;

  console.log('userCollections', userCollections);

  const steps = useMemo(
    () => [
      {
        title: '选择功能模块',
        buttonText: '下一步',
        showButton: true,
        data: [...requiredGroups, ...optionalGroups],
        leftColumns: columns1,
        rightColumns: columns1,
        showSearch: false,
        targetKeys: [],
      },
      {
        title: '选择自定义数据表',
        buttonText: '确认导出',
        showButton: true,
        data: userCollections,
        leftColumns: columns2,
        rightColumns: columns2,
        showSearch: true,
        targetKeys: [],
        handler: async () => {
          const response = await api.request({
            url: 'duplicator:dump',
            method: 'post',
            responseType: 'blob',
          });
          const match = /filename="(.+)"/.exec(response?.headers?.['content-disposition'] || '');
          const filename = match ? match[1] : 'duplicator.nbdump';
          let blob = new Blob([response.data]);
          saveAs(blob, filename);
        },
      },
      {
        title: '确认导出',
        buttonText: '',
        showButton: false,
      },
    ],
    [data],
  );
  const handleStepsChange = (current) => {
    steps[currentStep].targetKeys = targetKeys;
    setCurrentStep(current);
    setTargetKeys(steps[current].targetKeys);
  };
  const handleTransferChange = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  useEffect(() => {
    if (requiredGroups.length) {
      const keys = requiredGroups.map((group) => group.key);
      setTargetKeys(keys);
      steps[currentStep].targetKeys = keys;
    }
  }, [requiredGroups]);

  return (
    <DuplicatorSteps steps={steps} onChange={handleStepsChange}>
      <TableTransfer<GroupData | CollectionData>
        listStyle={{ minWidth: 0, border: 'none' }}
        scroll={{ x: true }}
        titles={['未选', '已选']}
        dataSource={steps[currentStep].data}
        leftColumns={steps[currentStep].leftColumns}
        rightColumns={steps[currentStep].rightColumns}
        showSearch={steps[currentStep].showSearch}
        targetKeys={targetKeys}
        onChange={handleTransferChange}
      />
    </DuplicatorSteps>
  );
};
