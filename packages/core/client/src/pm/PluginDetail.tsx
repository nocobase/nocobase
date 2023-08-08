import React, { useMemo } from 'react';
import { Alert, Col, Modal, Row, Space, Spin, Table, Tabs, TabsProps, Tag, Typography } from 'antd';
import { FC } from 'react';
import { IPluginData } from './types';
import { useRequest } from '../api-client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useStyles } from './style';
import { PluginDocument } from './PluginDocument';

dayjs.extend(relativeTime);

interface PackageJSON {
  name: string;
  version: string;
  description?: string;
  repository?: string | { type: string; url: string };
  homepage?: string;
  license?: string;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

interface DepCompatible {
  name: string;
  isCompatible: boolean;
  globalVersion: string;
  packageVersion: string;
}

interface IPluginDetailData {
  packageJson: PackageJSON;
  depsCompatible: DepCompatible[];
  lastUpdated: string;
}

interface IPluginDetail {
  plugin: IPluginData;
  onCancel: () => void;
}
const dependenciesCompatibleTableColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Global Version',
    dataIndex: 'globalVersion',
    key: 'globalVersion',
  },
  {
    title: 'Package Version',
    dataIndex: 'packageVersion',
    key: 'packageVersion',
  },
  {
    title: 'Is Compatible',
    dataIndex: 'isCompatible',
    key: 'isCompatible',
    render: (isCompatible: boolean) => (
      <Tag color={isCompatible ? 'success' : 'error'}>{isCompatible ? 'Yes' : 'No'}</Tag>
    ),
  },
];

export const PluginDetail: FC<IPluginDetail> = ({ plugin, onCancel }) => {
  const { data, loading } = useRequest<{ data: IPluginDetailData }>(
    {
      url: `/pm:detail/${plugin.name}`,
    },
    {
      refreshDeps: [plugin.name],
      ready: plugin.name !== null,
    },
  );

  const repository = useMemo(() => {
    if (!data?.data?.packageJson?.repository) return null;
    const repository = data?.data?.packageJson.repository;
    const url = typeof repository === 'string' ? repository : repository.url;
    return url.replace(/\.git$/, '').replace(/^git\+/, '');
  }, [data]);

  const { styles, theme } = useStyles();

  const tabItems: TabsProps['items'] = [
    {
      key: 'readme',
      label: 'Readme',
      children: (
        <Row gutter={20}>
          <Col span={16}>{plugin?.readmeUrl ? <PluginDocument url={plugin?.readmeUrl} /> : 'NO README.md FILE'}</Col>
          <Col span={8}>
            <Space style={{ width: '100%' }} direction="vertical">
              {repository && (
                <div className={styles.PluginDetailBaseInfo}>
                  <Typography.Text type="secondary">Repository</Typography.Text>
                  <Typography.Text strong>{repository}</Typography.Text>
                </div>
              )}
              {data?.data?.packageJson.homepage && (
                <div className={styles.PluginDetailBaseInfo}>
                  <Typography.Text type="secondary">Homepage</Typography.Text>
                  <Typography.Text strong>{data?.data?.packageJson.homepage}</Typography.Text>
                </div>
              )}
              {plugin.description && (
                <div className={styles.PluginDetailBaseInfo}>
                  <Typography.Text type="secondary">Description</Typography.Text>
                  <Typography.Text strong>{plugin.description || 'empty'}</Typography.Text>
                </div>
              )}
              <Row>
                <Col span={12}>
                  <div className={styles.PluginDetailBaseInfo}>
                    <Typography.Text type="secondary">Last Updated</Typography.Text>
                    <Typography.Text strong>{dayjs(data?.data?.lastUpdated).fromNow()}</Typography.Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.PluginDetailBaseInfo}>
                    <Typography.Text type="secondary">License</Typography.Text>
                    <Typography.Text strong>{data?.data?.packageJson.license}</Typography.Text>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <div className={styles.PluginDetailBaseInfo}>
                    <Typography.Text type="secondary">Version</Typography.Text>
                    <Typography.Text strong>{plugin?.version}</Typography.Text>
                  </div>
                </Col>
                <Col span={12}>
                  {plugin?.newVersion && (
                    <div className={styles.PluginDetailBaseInfo}>
                      <Typography.Text type="danger">Latest Version</Typography.Text>
                      <Typography.Text strong>{plugin?.newVersion}</Typography.Text>
                    </div>
                  )}
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
      ),
    },
    {
      key: 'dependencies',
      label: 'Dependencies Compatible',
      children: (
        <>
          <Alert
            message="If plugin package is not compatible. You
                should change the package version to match the global version."
          ></Alert>
          <Table
            style={{ marginTop: theme.margin }}
            rowKey={'name'}
            pagination={false}
            columns={dependenciesCompatibleTableColumns}
            dataSource={data?.data?.depsCompatible}
          />
        </>
      ),
    },
    {
      key: 'changelog',
      label: 'Changelog',
      children: plugin?.changelogUrl ? <PluginDocument url={plugin?.changelogUrl} /> : '暂无更新日志',
    },
  ];

  return (
    <Modal open={!!plugin} footer={false} destroyOnClose width={1200} onCancel={onCancel}>
      {loading ? (
        <Spin />
      ) : (
        plugin && (
          <>
            <Typography.Title level={3}>{plugin.name}</Typography.Title>
            <Space split={<span>&nbsp;•&nbsp;</span>}>
              <span>{plugin.version}</span>
              <span>Last Updated {dayjs(data?.data?.lastUpdated).fromNow()}</span>
            </Space>
            <Tabs items={tabItems} defaultActiveKey={!plugin.isCompatible ? 'dependencies' : undefined}></Tabs>
          </>
        )
      )}
    </Modal>
  );
};
