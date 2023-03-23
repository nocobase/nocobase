import type { ColumnsType } from 'antd/es/table/interface';
import { Tag, Result, Modal, Table } from 'antd';
import { useAPIClient, useCompile } from '@nocobase/client';
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
import { useTableHeight } from './hooks/useTableHeight';
import { css } from '@emotion/css';
import { usePluginUtils } from './hooks/i18';

const columnClass = css`
  word-break: break-all;
`;

export const DuplicatorRestore = () => {
  const api = useAPIClient();
  const { t } = usePluginUtils();
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
  const tableHeight = useTableHeight();
  const compile = useCompile();
  const { requiredGroups = [], optionalGroups = [], userCollections = [] } = data;
  const {
    auth: { token },
    axios: {
      defaults: { baseURL },
    },
  } = api;

  const columns1: ColumnsType<GroupData> = [
    {
      dataIndex: 'namespace',
      title: t('Namespace'),
      className: columnClass,
    },
    {
      dataIndex: 'collections',
      title: t('Collections'),
      className: columnClass,
      render: (collections: CollectionData[]) =>
        collections?.map((collection) => <Tag key={collection.title}>{compile(collection.title)}</Tag>),
    },
  ];
  const columns2: ColumnsType<CollectionData> = [
    {
      dataIndex: 'title',
      title: t('Title'),
      className: columnClass,
    },
    {
      dataIndex: 'name',
      title: t('Name'),
      className: columnClass,
    },
    {
      dataIndex: 'category',
      title: t('Category'),
      className: columnClass,
      render: (categories: Category[]) =>
        categories?.map((category) => (
          <Tag key={category.name} color={category.color}>
            {category.name}
          </Tag>
        )),
    },
  ];
  const steps = useMemo(
    () => [
      {
        title: t('Upload backup file'),
        buttonText: t('Next'),
        showButton: !!requiredGroups.length,
      },
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
        handleSelectRow(record: any, selected: boolean, direction: 'left' | 'right') {
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
          if (record.disabled) return;

          this.handleSelectRow(record, false, direction);
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
        buttonText: t('Confirm import'),
        showButton: true,
        data: userCollections,
        leftColumns: columns2,
        rightColumns: columns2,
        showSearch: true,
        targetKeys: [],
        sourceSelectedKeys: [],
        targetSelectedKeys: [],
        handleSelectRow(record: any, selected: boolean, direction: 'left' | 'right') {
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
          if (record.disabled) return;

          this.handleSelectRow(record, false, direction);
          const { leftDataSource, rightDataSource } = splitDataSource({
            dataSource: this.data,
            targetKeys: this.targetKeys,
          });
          const dataMap = {
            left: {
              addable: findAddable,
              removable: findRemovable,
              data: leftDataSource,
              setKeys: (list: string[]) =>
                setTargetKeys((prev) => {
                  const result = [...list, ...prev];
                  this.targetKeys = result;
                  return result;
                }),
            },
            right: {
              addable: findRemovable,
              removable: findAddable,
              data: rightDataSource,
              setKeys: (list: string[]) =>
                setTargetKeys((prev) => {
                  const result = prev.filter((key) => !list.includes(key));
                  this.targetKeys = result;
                  return result;
                }),
            },
          };

          const list = dataMap[direction]
            .addable(record.name)
            .filter((name) => dataMap[direction].data.some((item: CollectionData) => item.name === name)) as string[];

          console.log(list);

          if (list.length > 1) {
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
                dataMap[direction].setKeys(list);
              },
            });
          } else {
            dataMap[direction].setKeys(list);
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
        title: t('Import succeeded'),
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
  const handleTransferChange = (nextTargetKeys: string[], direction: string, moveKeys: string[]) => {
    console.log('nextTargetKeys', nextTargetKeys, direction, moveKeys);

    const reverse = {
      left: 'right',
      right: 'left',
    };

    steps[currentStep].handleDoubleClickRow?.({ key: moveKeys[0], name: moveKeys[0] }, reverse[direction]);
  };
  const handleSelectChange = (sourceSelectedKeys = [], targetSelectedKeys = []) => {
    steps[currentStep].sourceSelectedKeys = sourceSelectedKeys;
    steps[currentStep].targetSelectedKeys = targetSelectedKeys;

    setSourceSelectedKeys(sourceSelectedKeys);
    setTargetSelectedKeys(targetSelectedKeys);
  };
  const handleSelectRow = (record: any, selected: boolean, direction: 'left' | 'right') => {
    steps[currentStep].handleSelectRow(record, selected, direction);
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
  const handleDoubleClickRow = (record: any, direction: 'left' | 'right') => {
    steps[currentStep].handleDoubleClickRow?.(record, direction);
  };
  const handleTransferAll = () => {
    const targetKeys = steps[currentStep].data.map((item: any) => (item.disabled ? false : item.key)).filter(Boolean);
    setTargetKeys((prev) => {
      const result = [...targetKeys, ...prev];
      steps[currentStep].targetKeys = result;
      return result;
    });
    setSourceSelectedKeys((prev) => {
      const result = prev.length ? [] : prev;
      steps[currentStep].sourceSelectedKeys = result;
      return result;
    });
    setTargetSelectedKeys((prev) => {
      const result = prev.length ? [] : prev;
      steps[currentStep].targetSelectedKeys = result;
      return result;
    });
  };
  const handleNotTransferAll = () => {
    const targetKeys = (steps[currentStep].data as any)
      .filter((item: any) => item.disabled)
      .map((item: any) => item.key);

    setTargetKeys(targetKeys);
    steps[currentStep].targetKeys = targetKeys;
    setSourceSelectedKeys((prev) => {
      const result = prev.length ? [] : prev;
      steps[currentStep].sourceSelectedKeys = result;
      return result;
    });
    setTargetSelectedKeys((prev) => {
      const result = prev.length ? [] : prev;
      steps[currentStep].targetSelectedKeys = result;
      return result;
    });
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
            noCheckbox
            disabled={buttonLoading}
            listStyle={{ minWidth: 0, border: 'none' }}
            scroll={{ x: true, y: tableHeight }}
            titles={[t('No need to import'), t('Need to import')]}
            dataSource={steps[currentStep].data}
            leftColumns={steps[currentStep].leftColumns}
            rightColumns={steps[currentStep].rightColumns}
            showSearch={steps[currentStep].showSearch}
            targetKeys={targetKeys}
            selectedKeys={[...sourceSelectedKeys, ...targetSelectedKeys]}
            pagination={false}
            onChange={handleTransferChange}
            onSelectChange={handleSelectChange}
            onSelectRow={handleSelectRow}
            onDoubleClickRow={handleDoubleClickRow}
            onTransferAll={handleTransferAll}
            onNotTransferAll={handleNotTransferAll}
          />
        );
      case 2:
        return (
          <TableTransfer<GroupData | CollectionData>
            noCheckbox
            disabled={buttonLoading}
            listStyle={{ minWidth: 0, border: 'none' }}
            scroll={{ x: true, y: tableHeight }}
            titles={[t('No need to import'), t('Need to import')]}
            dataSource={steps[currentStep].data}
            leftColumns={steps[currentStep].leftColumns}
            rightColumns={steps[currentStep].rightColumns}
            showSearch={steps[currentStep].showSearch}
            targetKeys={targetKeys}
            selectedKeys={[...sourceSelectedKeys, ...targetSelectedKeys]}
            pagination={false}
            onChange={handleTransferChange}
            onSelectChange={handleSelectChange}
            onSelectRow={handleSelectRow}
            onDoubleClickRow={handleDoubleClickRow}
            onTransferAll={handleTransferAll}
            onNotTransferAll={handleNotTransferAll}
          />
        );
      case 3:
        return <Result status="success" title={t('Import succeeded')} />;
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
