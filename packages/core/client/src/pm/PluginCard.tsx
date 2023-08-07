import { DeleteOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import { App, Badge, Button, Card, Col, Popconfirm, Row, Space, Switch, Typography, message } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';

import type { IPluginData } from './types';
import { useAPIClient } from '../api-client';
import { useStyles } from './style';
import { PluginDetail } from './PluginDetail';

interface IPluginBaseInfo extends IPluginData {
  onClick: () => void;
}

function PluginBaseInfo(props: IPluginBaseInfo) {
  const { onClick, name, displayName, builtIn, enabled } = props;
  const { styles, theme } = useStyles();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const api = useAPIClient();
  const { modal } = App.useApp();
  return (
    <Badge.Ribbon
      placement="end"
      style={{ display: props.isOfficial ? undefined : 'none' }}
      text={t('Official plugin')}
    >
      <Card
        bordered={false}
        style={{ width: 380 }}
        headStyle={{ border: 'none' }}
        hoverable
        actions={[
          <div key="setting" className={classnames({ [styles.cardActionDisabled]: !enabled })}>
            <SettingOutlined
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/settings/${name}`);
              }}
            />
          </div>,
          <Popconfirm
            key={'delete'}
            disabled={builtIn}
            title={t('Are you sure to delete this plugin?')}
            onConfirm={async (e) => {
              e.stopPropagation();
              await api.request({
                url: `pm:remove/${name}`,
              });
              message.success(t('The deletion was successful.'));
              window.location.reload();
            }}
            onCancel={(e) => e.stopPropagation()}
            okText={t('Yes')}
            cancelText={t('No')}
          >
            <div className={classnames({ [styles.cardActionDisabled]: builtIn })}>
              <DeleteOutlined />
            </div>
          </Popconfirm>,
          <Switch
            key={'enable'}
            size={'small'}
            disabled={builtIn}
            onChange={async (checked, e) => {
              e.stopPropagation();
              modal.warning({
                title: checked ? t('Plugin starting') : t('Plugin stopping'),
                content: t('The application is reloading, please do not close the page.'),
                okButtonProps: {
                  style: {
                    display: 'none',
                  },
                },
              });
              await api.request({
                url: `pm:${checked ? 'enable' : 'disable'}/${name}`,
              });
              window.location.reload();
            }}
            defaultChecked={enabled}
          ></Switch>,
        ]}
      >
        <Row justify="space-between">
          <Col span={16} onClick={onClick}>
            <Card.Meta
              // avatar={<Avatar style={{ background: `${stringToColor(name)}` }}>{name?.[0]}</Avatar>}
              description={
                <Space direction="vertical">
                  <Typography.Title level={4}>{displayName || name}</Typography.Title>
                  <Typography.Text type="secondary">
                    {t('Version')}: {props.version}
                  </Typography.Text>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ height: theme.fontSize * theme.lineHeight * 3, marginBottom: 0 }}
                    ellipsis={{ rows: 3 }}
                  >
                    {props.description}
                  </Typography.Paragraph>
                </Space>
              }
            />
          </Col>
          <Col span={8}>
            <Space
              direction="vertical"
              align="end"
              style={{ display: 'flex', marginTop: theme.fontSizeHeading4 * theme.lineHeightHeading4 }}
            >
              {props.newVersion && (
                <Button icon={<SyncOutlined style={{ color: 'red', fontWeight: 'bold' }} />} ghost type="primary">
                  {t('Upgrade plugin')}
                </Button>
              )}
              {props.type === 'upload' && (
                <Button ghost type="primary">
                  {t('Upload new version')}
                </Button>
              )}
              {props.isCompatible === false && (
                <Button style={{ padding: 0 }} type="link">
                  <Typography.Text type="danger">{t('Dependencies check failed')}</Typography.Text>
                </Button>
              )}
              <Button onClick={onClick} style={{ padding: 0 }} type="link">
                {t('More details')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </Badge.Ribbon>
  );
}

export const PluginCard = (props: { data: IPluginData }) => {
  const { data } = props;
  const [plugin, setPlugin] = useState<IPluginData>(undefined);

  return (
    <>
      <PluginDetail plugin={plugin} onCancel={() => setPlugin(undefined)} />
      <PluginBaseInfo
        onClick={() => {
          setPlugin(data);
        }}
        {...data}
      />
    </>
  );
};
