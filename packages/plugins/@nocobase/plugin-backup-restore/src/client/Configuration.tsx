/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InboxOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { FormItem } from '@formily/antd-v5';
import { Checkbox, DatePicker, useAPIClient, useCompile } from '@nocobase/client';
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Upload,
  UploadProps,
  message,
  TableProps,
} from 'antd';
import { saveAs } from 'file-saver';
import React, { useEffect, useMemo, useState } from 'react';
import { useDuplicatorTranslation } from './locale';

const { Dragger } = Upload;

function useUploadProps(props: UploadProps): any {
  const onChange = (param) => {
    props.onChange?.(param);
  };

  const api = useAPIClient();

  return {
    ...props,
    customRequest({ action, data, file, filename, headers, onError, onProgress, onSuccess, withCredentials }) {
      const formData = new FormData();
      if (data) {
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
      }
      formData.append(filename, file);
      // eslint-disable-next-line promise/catch-or-return
      api.axios
        .post(action, formData, {
          withCredentials,
          headers,
          onUploadProgress: ({ total, loaded }) => {
            onProgress({ percent: Math.round((loaded / total) * 100).toFixed(2) }, file);
          },
        })
        .then(({ data }) => {
          onSuccess(data, file);
        })
        .catch(onError)
        .finally(() => {});

      return {
        abort() {
          console.log('upload progress is aborted.');
        },
      };
    },
    onChange,
  };
}

const LearnMore: any = (props: { collectionsData?: any; isBackup?: boolean }) => {
  const { collectionsData } = props;
  const { t } = useDuplicatorTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<any>(collectionsData);
  useEffect(() => {
    setDataSource(collectionsData);
  }, [collectionsData]);
  const apiClient = useAPIClient();
  const compile = useCompile();
  const resource = useMemo(() => {
    return apiClient.resource('backupFiles');
  }, [apiClient]);
  const showModal = async () => {
    if (props.isBackup) {
      const data = await resource.dumpableCollections();
      setDataSource(data?.data);
      setIsModalOpen(true);
    }
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const columns: TableProps['columns'] = [
    {
      title: t('Collection'),
      dataIndex: 'collection',
      key: 'collection',
      render: (_, data) => {
        const title = compile(data.title);
        const name = data.name;
        return name === title ? (
          title
        ) : (
          <div>
            {data.name} <span style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>({compile(data.title)})</span>
          </div>
        );
      },
    },
    {
      title: t('Origin'),
      dataIndex: 'origin',
      key: 'origin',
      width: '50%',
    },
  ];
  const items = Object.keys(dataSource || {}).map((item) => {
    return {
      key: item,
      label: t(`${item}.title`),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={t(`${item}.description`)} />
          <Table
            pagination={{ pageSize: 100 }}
            bordered
            size={'small'}
            dataSource={dataSource[item]}
            columns={columns}
            scroll={{ y: 400 }}
          />
        </>
      ),
    };
  });

  return (
    <>
      <a onClick={showModal}>{t('Learn more')}</a>
      <Modal
        title={t('Backup instructions')}
        width={'80vw'}
        open={isModalOpen}
        footer={null}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Tabs defaultActiveKey="required" items={items} />
      </Modal>
    </>
  );
};

const Restore: React.FC<any> = ({ ButtonComponent = Button, title, upload = false, fileData }) => {
  const { t } = useDuplicatorTranslation();
  const [dataTypes, setDataTypes] = useState<any[]>(['required']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const apiClient = useAPIClient();
  const resource = useMemo(() => {
    return apiClient.resource('backupFiles');
  }, [apiClient]);
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    setDataSource(
      Object.keys(restoreData?.dumpableCollectionsGroupByGroup || []).map((key) => ({
        value: key,
        label: t(`${key}.title`),
        disabled: ['required', 'skipped'].includes(key),
      })),
    );
  }, [restoreData]);

  const showModal = async () => {
    setIsModalOpen(true);
    if (!upload) {
      setLoading(true);
      const { data } = await resource.get({ filterByTk: fileData.name });
      setDataSource(
        Object.keys(data?.data?.meta?.dumpableCollectionsGroupByGroup || []).map((key) => ({
          value: key,
          label: t(`${key}.title`),
          disabled: ['required', 'skipped'].includes(key),
        })),
      );
      setRestoreData(data?.data?.meta);
      setLoading(false);
    }
  };
  const handleOk = () => {
    resource.restore({
      values: {
        dataTypes,
        filterByTk: fileData?.name,
        key: restoreData?.key,
      },
    });
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setRestoreData(null);
    setDataTypes(['required']);
  };
  return (
    <>
      <ButtonComponent onClick={showModal}>{title}</ButtonComponent>
      <Modal
        title={t('Restore')}
        width={800}
        footer={upload && !restoreData ? null : undefined}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Spin spinning={loading}>
          {upload && !restoreData && <RestoreUpload setRestoreData={setRestoreData} />}
          {(!upload || restoreData) && [
            <strong style={{ fontWeight: 600, display: 'block', margin: '16px 0 8px' }} key="info">
              {t('Select the data to be restored')} (
              <LearnMore collectionsData={restoreData?.dumpableCollectionsGroupByGroup} />
              ):
            </strong>,
            <div style={{ lineHeight: 2, marginBottom: 8 }} key="dataType">
              <FormItem>
                <Checkbox.Group
                  options={dataSource}
                  style={{ flexDirection: 'column' }}
                  value={dataTypes}
                  onChange={(checkValue) => setDataTypes(checkValue)}
                />
              </FormItem>
            </div>,
          ]}
        </Spin>
      </Modal>
    </>
  );
};

const NewBackup: React.FC<any> = ({ ButtonComponent = Button, refresh }) => {
  const { t } = useDuplicatorTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataTypes, setBackupData] = useState<any[]>(['required']);
  const apiClient = useAPIClient();
  const [dataSource, setDataSource] = useState([]);

  const showModal = async () => {
    const { data } = await apiClient.resource('backupFiles').dumpableCollections();
    setDataSource(
      Object.keys(data || []).map((key) => ({
        value: key,
        label: t(`${key}.title`),
        disabled: ['required', 'skipped'].includes(key),
      })),
    );
    setIsModalOpen(true);
  };

  const handleOk = () => {
    apiClient.request({
      url: 'backupFiles:create',
      method: 'post',
      data: {
        dataTypes,
      },
    });
    setIsModalOpen(false);
    setBackupData(['required']);
    setTimeout(() => {
      refresh();
    }, 500);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setBackupData(['required']);
  };

  return (
    <>
      <ButtonComponent icon={<PlusOutlined />} type="primary" onClick={showModal}>
        {t('New backup')}
      </ButtonComponent>
      <Modal title={t('New backup')} width={800} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <strong style={{ fontWeight: 600, display: 'block', margin: '16px 0 8px' }}>
          {t('Select the data to be backed up')} (
          <LearnMore isBackup={true} />
          ):
        </strong>
        <div style={{ lineHeight: 2, marginBottom: 8 }}>
          <Checkbox.Group
            options={dataSource}
            style={{ flexDirection: 'column' }}
            onChange={(checkValue) => setBackupData(checkValue)}
            value={dataTypes}
          />
        </div>
      </Modal>
    </>
  );
};

const RestoreUpload: React.FC<any> = (props: any) => {
  const { t } = useDuplicatorTranslation();
  const uploadProps: UploadProps = {
    multiple: false,
    action: '/backupFiles:upload',
    onChange(info) {
      if (info.fileList.length > 1) {
        info.fileList.splice(0, info.fileList.length - 1); // 只保留一个文件
      }
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} ` + t('file uploaded successfully'));
        props.setRestoreData({ ...info.file.response?.data?.meta, key: info.file.response?.data.key });
      } else if (status === 'error') {
        message.error(`${info.file.name} ` + t('file upload failed'));
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...useUploadProps(uploadProps)}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text"> {t('Click or drag file to this area to upload')}</p>
    </Dragger>
  );
};

export const BackupAndRestoreList = () => {
  const { t } = useDuplicatorTranslation();
  const apiClient = useAPIClient();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(false);
  const { modal } = App.useApp();
  const resource = useMemo(() => {
    return apiClient.resource('backupFiles');
  }, [apiClient]);

  useEffect(() => {
    queryFieldList();
  }, []);
  const queryFieldList = async () => {
    setLoading(true);
    const { data } = await resource.list();
    setDataSource(data.data);
    setLoading(false);
  };
  const handleDownload = async (fileData) => {
    setDownloadTarget(fileData.name);
    const data = await apiClient.request({
      url: 'backupFiles:download',
      method: 'get',
      params: {
        filterByTk: fileData.name,
      },
      responseType: 'blob',
    });
    setDownloadTarget(false);
    const blob = new Blob([data.data]);
    saveAs(blob, fileData.name);
  };
  const handleRefresh = async () => {
    await queryFieldList();
  };
  const handleDestory = (fileData) => {
    modal.confirm({
      title: t('Delete record', { ns: 'client' }),
      content: t('Are you sure you want to delete it?', { ns: 'client' }),
      onOk: async () => {
        await resource.destroy({ filterByTk: fileData.name });
        await queryFieldList();
        message.success(t('Deleted successfully'));
      },
    });
  };

  return (
    <div>
      <Card bordered={false}>
        <Space style={{ float: 'right', marginBottom: 16 }}>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
            {t('Refresh')}
          </Button>
          <Restore
            upload
            title={
              <>
                <UploadOutlined /> {t('Restore backup from local')}
              </>
            }
          />
          <NewBackup refresh={handleRefresh} />
        </Space>
        <Table
          dataSource={dataSource}
          loading={loading}
          columns={
            [
              {
                title: t('Backup file'),
                dataIndex: 'name',
                width: 400,
                onCell: (data) => {
                  return data.inProgress
                    ? {
                        colSpan: 4,
                      }
                    : {};
                },
                render: (name, data) =>
                  data.inProgress ? (
                    <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                      {name}({t('Backing up')}...)
                    </div>
                  ) : (
                    <div>{name}</div>
                  ),
              },
              {
                title: t('File size'),
                dataIndex: 'fileSize',
                onCell: (data) => {
                  return data.inProgress
                    ? {
                        colSpan: 0,
                      }
                    : {};
                },
              },
              {
                title: t('Created at', { ns: 'client' }),
                dataIndex: 'createdAt',
                onCell: (data) => {
                  return data.inProgress
                    ? {
                        colSpan: 0,
                      }
                    : {};
                },
                render: (value) => {
                  return <DatePicker.ReadPretty value={value} showTime />;
                },
              },
              {
                title: t('Actions', { ns: 'client' }),
                dataIndex: 'actions',
                onCell: (data) => {
                  return data.inProgress
                    ? {
                        colSpan: 0,
                      }
                    : {};
                },
                render: (_, record) => (
                  <Space split={<Divider type="vertical" />}>
                    <Restore ButtonComponent={'a'} title={t('Restore')} fileData={record} />
                    <a type="link" onClick={() => handleDownload(record)}>
                      {t('Download')}
                    </a>
                    <a onClick={() => handleDestory(record)}>{t('Delete')}</a>
                  </Space>
                ),
              },
            ] as TableProps['columns']
          }
        />
      </Card>
    </div>
  );
};
