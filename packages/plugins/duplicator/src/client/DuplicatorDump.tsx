import type { ColumnsType } from 'antd/es/table/interface';
import { Tag, Result, Modal, Table } from 'antd';
import { useAPIClient } from '@nocobase/client';
import { saveAs } from 'file-saver';
import React, { useEffect, useMemo } from 'react';
import { DuplicatorSteps } from './DuplicatorSteps';
import { TableTransfer } from './TableTransfer';
import { Category, CollectionData, GroupData, useDumpableCollections } from './hooks/useDumpableCollections';
import { useCollectionsGraph } from './hooks/useCollectionsGraph';
import { splitDataSource } from './utils/splitDataSource';
import _ from 'lodash';
import { getTargetListByKeys } from './utils/getTargetListByKeys';
import { useTranslation } from 'react-i18next';
import { useTableHeight } from './hooks/useTableHeight';

const columns1: ColumnsType<GroupData> = [
  {
    dataIndex: 'namespace',
    title: 'Namespace',
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
  const { t } = useTranslation();
  const { data, loading } = useDumpableCollections();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [targetKeys, setTargetKeys] = React.useState([]);
  const [sourceSelectedKeys, setSourceSelectedKeys] = React.useState([]);
  const [targetSelectedKeys, setTargetSelectedKeys] = React.useState([]);
  const { findAddable, findRemovable } = useCollectionsGraph();
  const [buttonLoading, setButtonLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState('');
  const tableHeight = useTableHeight();
  const { requiredGroups = [], optionalGroups = [], userCollections = [] } = data;

  const steps = useMemo(
    () => [
      {
        title: t('Select modules'),
        buttonText: t('Next'),
        showButton: true,
        data: [...requiredGroups, ...optionalGroups],
        leftColumns: columns1,
        rightColumns: columns1,
        showSearch: false,
        targetKeys: [],
        sourceSelectedKeys: [],
        targetSelectedKeys: [],
        handlSelectRow(record: any, selected: boolean, direction: 'left' | 'right') {
          const map = {
            left: {
              setSelectedKeys: () => {
                setSourceSelectedKeys(selected ? [record.key] : []);
                setTargetSelectedKeys((prev) => (prev.length ? [] : prev));
              },
            },
            right: {
              setSelectedKeys: () => {
                setTargetSelectedKeys(selected ? [record.key] : []);
                setSourceSelectedKeys((prev) => (prev.length ? [] : prev));
              },
            },
          };
          map[direction].setSelectedKeys();
        },
        handleDoubleClickRow(record: any, direction: 'left' | 'right') {
          this.handlSelectRow(record, true, direction);
          const map = {
            left: {
              setKeys: () => setTargetKeys((prev) => [record.key, ...prev]),
            },
            right: {
              setKeys: () => setTargetKeys((prev) => prev.filter((key) => key !== record.key)),
            },
          };

          map[direction].setKeys();
        },
      },
      {
        title: t('Select custom collections'),
        buttonText: t('Confirm export'),
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
              .filter((name) => dataMap[direction].data.some((item) => item.name === name)) as CollectionData[];

            if (list.length) {
              Modal.confirm({
                title: t('Confirm to move the following collections?'),
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
              .filter((name) => dataMap[direction].data.some((item) => item.name === name));

            if (list.length) {
              Modal.confirm({
                title: t('Confirm to move the following collections?'),
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
          const groups = getTargetListByKeys(steps[0].data, steps[0].targetKeys).map((item) => item.namespace);
          const collections = getTargetListByKeys(steps[1].data, steps[1].targetKeys).map((item) => item.name);
          setButtonLoading(true);
          const response = await api.request({
            url: 'duplicator:dump',
            method: 'post',
            data: {
              groups,
              collections,
            },
            responseType: 'blob',
          });
          setButtonLoading(false);
          const match = /filename="(.+)"/.exec(response?.headers?.['content-disposition'] || '');
          const filename = match ? match[1] : 'duplicator.nbdump';
          let blob = new Blob([response.data]);
          setFileName(filename);
          saveAs(blob, filename);
        },
      },
      {
        title: t('Export succeeded'),
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
    setSourceSelectedKeys(steps[current].sourceSelectedKeys);
    setTargetSelectedKeys(steps[current].targetSelectedKeys);
  };
  const handleTransferChange = (nextTargetKeys) => {
    steps[currentStep].targetKeys = nextTargetKeys;
    setTargetKeys(nextTargetKeys);
  };
  const handleSelectRow = (record: any, selected: boolean, direction: 'left' | 'right') => {
    steps[currentStep].handlSelectRow(record, selected, direction);
  };
  const handleDoubleClickRow = (record: any, direction: 'left' | 'right') => {
    steps[currentStep].handleDoubleClickRow?.(record, direction);
  };

  useEffect(() => {
    if (requiredGroups.length) {
      const keys = requiredGroups.map((group) => group.key);
      setTargetKeys(keys);
      steps[currentStep].targetKeys = keys;
    }
  }, [requiredGroups]);

  return (
    <DuplicatorSteps loading={buttonLoading} steps={steps} current={currentStep} onChange={handleStepsChange}>
      {currentStep < steps.length - 1 ? (
        <TableTransfer<GroupData | CollectionData>
          noCheckbox
          loading={loading}
          listStyle={{ minWidth: 0, border: 'none' }}
          scroll={{ x: true, y: tableHeight }}
          pagination={false}
          titles={[t('No need to export'), t('Need to export')]}
          dataSource={steps[currentStep].data}
          leftColumns={steps[currentStep].leftColumns}
          rightColumns={steps[currentStep].rightColumns}
          showSearch={steps[currentStep].showSearch}
          targetKeys={targetKeys}
          selectedKeys={[...sourceSelectedKeys, ...targetSelectedKeys]}
          onChange={handleTransferChange}
          onSelectRow={handleSelectRow}
          onDoubleClickRow={handleDoubleClickRow}
        />
      ) : (
        <Result
          status="success"
          title={t('Export succeeded')}
          subTitle={`${t('File name has been exported as: ')}${fileName}`}
        />
      )}
    </DuplicatorSteps>
  );
};
