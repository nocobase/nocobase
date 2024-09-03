import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { PoweredBy, RemoteSchemaComponent, useAPIClient, useRequest, useApp, Block } from '@nocobase/client';
import { Breadcrumb, Button, Dropdown, Space, Spin, Switch, Modal, Input, message, QRCode } from 'antd';
import type { QRCodeProps } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { usePublicSubmitActionProps } from '../hooks';

export function AdminPublicFormPage() {
  const api = useAPIClient();
  // console.log('api', api);
  const params = useParams();
  const { error, data, loading } = useRequest<any>({
    url: `publicForms:get/${params.name}`,
  });
  const [formTitle, setFormTitle] = useState('');
  useEffect(() => {
    if (data) {
      setFormTitle(data.data.title);
    }
  }, [data]);

  const [enabled, setEnabled] = useState(false);
  const getEnabled = async () => {
    const {
      data: { data },
    } = await api.request({
      method: 'POST',
      url: `publicForms:getEnabled`,
      data: {
        filterByTk: params.name,
      },
    });
    setEnabled(data.instance.enabled);
  };
  getEnabled();
  const EnabledChange = async (checked) => {
    await api.request({
      method: 'POST',
      url: `publicForms:setEnabled`,
      data: {
        enabled: checked,
        filterByTk: params.name,
      },
    });
    setEnabled(checked);
  };

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const handleOk = async () => {
    if (!newPassword) {
      return message.error('请先输入新密码!');
    }
    const { data } = await api.request({
      method: 'POST',
      url: `publicForms:setPassword`,
      data: {
        password: newPassword,
        filterByTk: params.name,
      },
    });
    if (data) {
      setOpen(false);
      setConfirmLoading(false);
      if (data.data.message === 'success') {
        message.success('修改成功');
      } else {
        message.error('修改失败');
      }
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };
  const setPassword = async () => {
    setOpen(true);
  };
  const [textToCopy, setTextToCopy] = useState('');
  const { hostname, port } = window.location;
  useEffect(() => {
    setTextToCopy(`${hostname}/public-forms/${params.name}`);
    if (port) {
      setTextToCopy(`${hostname}:${port}/public-forms/${params.name}`);
    }
  }, [hostname, port, params.name]);
  const handleCopyText = () => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        message.success('链接已复制到剪贴板');
      })
      .catch((err) => {
        message.error('复制失败');
        console.error('复制失败', err);
      });
  };

  const [renderType, setRenderType] = React.useState<QRCodeProps['type']>('canvas');
  function doDownload(url: string, fileName: string) {
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  const downloadCanvasQRCode = () => {
    const canvas = document.getElementById('myqrcode')?.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      doDownload(url, 'QRCode.png');
    }
  };

  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <div
        style={{
          margin: '-24px',
          padding: '10px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to={`/admin/settings/public-forms`}>公共表单</Link>,
            },
            {
              title: formTitle,
            },
          ]}
        />
        <Space>
          <Link target={'_blank'} to={`/public-forms/${params.name}`}>
            <Button icon={<EyeOutlined />}>打开表单</Button>
          </Link>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'enabled',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ marginRight: '10px' }}>是否启用</span>
                      <Switch value={enabled} onChange={EnabledChange} size={'small'} />
                    </span>
                  ),
                },
                {
                  key: 'password',
                  label: (
                    <span
                      onClick={() => {
                        setPassword();
                      }}
                      style={{ display: 'Block', width: '100%' }}
                    >
                      修改密码
                    </span>
                  ),
                },
                {
                  key: 'divider1',
                  type: 'divider',
                },
                {
                  key: 'copyLink',
                  label: (
                    <span style={{ display: 'Block', width: '100%' }} onClick={handleCopyText}>
                      复制表单链接
                    </span>
                  ),
                },
                {
                  key: 'qrcode',
                  label: (
                    <span style={{ display: 'Block', width: '100%' }} onClick={downloadCanvasQRCode}>
                      下载二维码
                    </span>
                  ),
                },
              ],
            }}
          >
            <Button icon={<SettingOutlined />}>设置</Button>
          </Dropdown>
        </Space>
      </div>
      <div style={{ maxWidth: 800, margin: '100px auto' }}>
        <RemoteSchemaComponent uid={params.name} scope={{ useCreateActionProps: usePublicSubmitActionProps }} />
        {/* <PoweredBy /> */}
      </div>
      <div>
        <Modal title="修改密码" open={open} onOk={handleOk} confirmLoading={confirmLoading} onCancel={handleCancel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '80px' }}>新密码:</div>
            <Input.Password
              placeholder="请输入新密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
              }}
            />
          </div>
        </Modal>
      </div>
      <div id="myqrcode" style={{ position: 'absolute', top: '100%', right: '100%' }}>
        <QRCode type={renderType} value={textToCopy} bgColor="#fff" style={{ marginBottom: 16 }} />
      </div>
    </div>
  );
}
