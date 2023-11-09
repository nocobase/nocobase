import { useAPIClient, useCompile, Checkbox } from '@nocobase/client';
import { Button, Card, message, Modal, Table, Upload, Tabs, Alert, Divider, Space } from 'antd';
import { FormItem } from '@formily/antd-v5';
import React, { useEffect, useMemo, useState } from 'react';
import type { UploadProps, TabsProps } from 'antd';
import { saveAs } from 'file-saver';
import { InboxOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useDuplicatorTranslation, generateNTemplate } from './locale';

const { Dragger } = Upload;
const options = [
  { label: generateNTemplate('System metadata'), value: 'meta', disabled: true },
  { label: generateNTemplate('System config'), value: 'config' },
  { label: generateNTemplate('Business data'), value: 'business' },
];
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
  console.log(dataSource);
  const columns = [
    {
      title: t('Collection'),
      dataIndex: 'collection',
      key: 'collection',
      render: (_, data) => {
        return (
          <div>
            {compile(data.title)}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{data.name}</div>
          </div>
        );
      },
    },
    {
      title: t('Origin'),
      dataIndex: 'plugin',
      key: 'origin',
      width: '50%',
      render: (_, data) => {
        const { origin } = data;
        return (
          <div>
            {origin.title}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{origin.name}</div>
          </div>
        );
      },
    },
  ];
  const items: TabsProps['items'] = [
    {
      key: 'meta',
      label: t('System metadata'),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={'占位，系统元数据说明'} />
          <Table bordered size={'small'} dataSource={dataSource?.meta} columns={columns} />
        </>
      ),
    },
    dataSource?.config && {
      key: 'config',
      label: t('System config'),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={'占位，系统配置数据说明'} />
          <Table bordered size={'small'} dataSource={dataSource?.config} columns={columns} />
        </>
      ),
    },
    dataSource?.business && {
      key: 'bussiness',
      label: t('Business data'),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={'占位，系统业务数据说明'} />
          <Table bordered size={'small'} dataSource={dataSource?.business} columns={columns} />
        </>
      ),
    },
  ];

  return (
    <>
      <a onClick={showModal}>{t('Learn more')}</a>
      <Modal
        title={t('Backup instructions')}
        width={800}
        open={isModalOpen}
        footer={null}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Tabs defaultActiveKey="meta" items={items} />
      </Modal>
    </>
  );
};

const Restore: React.FC<any> = ({ ButtonComponent = Button, title, upload = false, fileData }) => {
  const { t } = useDuplicatorTranslation();
  const [dataTypes, setDataTypes] = useState<any[]>(['meta']);
  const compile = useCompile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<any>(null);
  const apiClient = useAPIClient();
  const resource = useMemo(() => {
    return apiClient.resource('backupFiles');
  }, [apiClient]);

  const showModal = async () => {
    if (!upload) {
      const { data } = await resource.get({ filterByTk: fileData.name });
      setRestoreData(data?.data?.meta);
    }
    setIsModalOpen(true);
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
        {upload && !restoreData && <RestoreUpload setRestoreData={setRestoreData} />}
        {(!upload || restoreData) && [
          <strong style={{ fontWeight: 600, display: 'block', margin: '16px 0 8px' }} key="info">
            {t('Select the data to be backed up')} (
            <LearnMore collectionsData={restoreData?.dumpableCollectionsGroupByDataTypes} />
            ):
          </strong>,
          <div style={{ lineHeight: 2, marginBottom: 8 }} key="dataType">
            <FormItem>
              <Checkbox.Group
                options={compile(
                  options.filter((v) => {
                    return restoreData?.dataTypes?.includes?.(v.value);
                  }),
                )}
                style={{ flexDirection: 'column' }}
                defaultValue={dataTypes}
                onChange={(checkValue) => setDataTypes(checkValue)}
              />
            </FormItem>
          </div>,
        ]}
      </Modal>
    </>
  );
};

const NewBackup: React.FC<any> = ({ ButtonComponent = Button, refresh }) => {
  const { t } = useDuplicatorTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const compile = useCompile();
  const [dataTypes, setBackupData] = useState<any[]>(['meta']);
  const apiClient = useAPIClient();

  const showModal = () => {
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
    setTimeout(() => {
      refresh();
    }, 1000);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <ButtonComponent icon={<PlusOutlined />} type="primary" onClick={showModal}>
        {t('New backup')}
      </ButtonComponent>
      <Modal title="New backup" width={800} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <strong style={{ fontWeight: 600, display: 'block', margin: '16px 0 8px' }}>
          {t('Select the data to be backed up')} (
          <LearnMore isBackup={true} />
          ):
        </strong>
        <div style={{ lineHeight: 2, marginBottom: 8 }}>
          <Checkbox.Group
            options={compile(options)}
            style={{ flexDirection: 'column' }}
            onChange={(checkValue) => setBackupData(checkValue)}
            defaultValue={dataTypes}
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
    const data = await apiClient.request({
      url: 'backupFiles:download',
      method: 'get',
      params: {
        filterByTk: fileData.name,
      },
      responseType: 'blob',
    });
    const blob = new Blob([data.data]);
    saveAs(blob, fileData.name);
  };
  const handleRefresh = async () => {
    await queryFieldList();
  };
  const handleDestory = async (fileData) => {
    await resource.destroy({ filterByTk: fileData.name });
    await queryFieldList();
    message.success(t('Operation succeeded'));
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
          tableLayout="fixed"
          dataSource={dataSource}
          loading={loading}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
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
                    {name}({t('Backing up...')})
                  </div>
                ) : (
                  <div>{name}</div>
                ),
            },
            {
              title: 'File size',
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
              title: 'Created at',
              dataIndex: 'createdAt',
              onCell: (data) => {
                return data.inProgress
                  ? {
                      colSpan: 0,
                    }
                  : {};
              },
            },
            {
              title: 'Actions',
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
                  <a onClick={() => handleDownload(record)}>{t('Download')}</a>
                  <a onClick={() => handleDestory(record)}>{t('Delete')}</a>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
