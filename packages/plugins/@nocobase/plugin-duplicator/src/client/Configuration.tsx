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

const LearnMore: React.FC = () => {
  const { t } = useDuplicatorTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState<any>();
  const apiClient = useAPIClient();
  const compile = useCompile();
  const showModal = async () => {
    const data = await apiClient.request({
      url: 'backupFiles:dumpableCollections',
      method: 'get',
    });
    setDataSource(data?.data);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: t('Collection'),
      dataIndex: 'collection',
      key: 'collection',
      render: (collection) => {
        return (
          <div>
            {compile(collection.title)}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{collection.name}</div>
          </div>
        );
      },
    },
    {
      title: t('Origin'),
      dataIndex: 'plugin',
      key: 'plugin',
      width: '50%',
      render: (plugin) => {
        return (
          <div>
            {plugin.title}
            <br />
            <div style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '0.9em' }}>{plugin.name}</div>
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
          <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
        </>
      ),
    },
    {
      key: 'config',
      label: t('System config'),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={'占位，系统配置数据说明'} />
          <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
        </>
      ),
    },
    {
      key: 'bussiness',
      label: t('Business data'),
      children: (
        <>
          <Alert style={{ marginBottom: 16 }} message={'占位，系统业务数据说明'} />
          <Table bordered size={'small'} dataSource={dataSource} columns={columns} />
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
  const [restoreData, setRestoreData] = useState<any>({});
  const apiClient = useAPIClient();
  const resource = useMemo(() => {
    return apiClient.resource('backupFiles');
  }, [apiClient]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    resource.restore({
      values: {
        dataTypes,
        key: restoreData.key,
        // filterByTk: 'string'
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
        footer={upload ? null : undefined}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {upload && <RestoreUpload />}

        {!upload && (
          <strong style={{ fontWeight: 600, display: 'block', margin: '16px 0 8px' }}>
            {t('Select the data to be backed up')} (
            <LearnMore />
            ):
          </strong>
        )}
        {!upload && (
          <div style={{ lineHeight: 2, marginBottom: 8 }}>
            <FormItem>
              <Checkbox.Group
                options={compile(
                  options.filter((v) => {
                    return restoreData.includes?.(v);
                  }),
                )}
                style={{ flexDirection: 'column' }}
                defaultValue={dataTypes}
                onChange={(checkValue) => setDataTypes(checkValue)}
              />
            </FormItem>
          </div>
        )}
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
    refresh?.();
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
          <LearnMore />
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

const RestoreUpload = (props: any) => {
  const [restoreData, setRestoreData] = useState(null);
  const { t } = useDuplicatorTranslation();
  const uploadProps: UploadProps = {
    multiple: false,
    action: '/backupFiles:upload',
    onChange(info) {
      if (info.fileList.length > 1) {
        info.fileList.splice(0, info.fileList.length - 1); // 只保留一个文件
      }
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} ` + t('file uploaded successfully'));
        setRestoreData(info.file.response?.data);
      } else if (status === 'error') {
        message.error(`${info.file.name} ` + t('file upload failed'));
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...uploadProps}>
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
        responseType: 'blob',
      },
    });
    const blob = new Blob([data.data]);
    saveAs(blob, fileData.name);
  };
  const handleRefresh = () => {
    queryFieldList();
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
                  <a>{t('Delete')}</a>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
