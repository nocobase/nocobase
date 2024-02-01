import { Alert, Col, Modal, Row, Space, Spin, Table, Tabs, TabsProps, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../api-client';
import { PluginDocument } from './PluginDocument';
import { useStyles } from './style';
import { IPluginData } from './types';

dayjs.extend(relativeTime);

type Author =
  | string
  | {
      name: string;
      email?: string;
      url?: string;
    };

interface PackageJSON {
  name: string;
  version: string;
  description?: string;
  repository?: string | { type: string; url: string };
  homepage?: string;
  license?: string;
  author?: Author;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
}

interface DepCompatible {
  name: string;
  result: boolean;
  versionRange: string;
  packageVersion: string;
}

interface IPluginDetailData {
  packageJson: PackageJSON;
  depsCompatible: DepCompatible[] | false;
  lastUpdated: string;
}

interface IPluginDetail {
  plugin: IPluginData;
  onCancel: () => void;
}

export const PluginDetail: FC<IPluginDetail> = ({ plugin, onCancel }) => {
  const { t } = useTranslation();
  const dependenciesCompatibleTableColumns = useMemo(
    () => [
      {
        title: t('Name'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('Version range'),
        dataIndex: 'versionRange',
        key: 'versionRange',
      },
      {
        title: t("Plugin's version"),
        dataIndex: 'packageVersion',
        key: 'packageVersion',
      },
      {
        title: t('Result'),
        dataIndex: 'result',
        key: 'result',
        render: (result: boolean) => <Tag color={result ? 'success' : 'error'}>{result ? 'Yes' : 'No'}</Tag>,
      },
    ],
    [t],
  );
  const { data, loading } = useRequest<{ data: IPluginDetailData }>(
    {
      url: `pm:get`,
      params: {
        filterByTk: plugin.name,
      },
    },
    {
      refreshDeps: [plugin.name],
      ready: !!plugin.name,
    },
  );

  const repository = useMemo(() => {
    if (!data?.data?.packageJson?.repository) return null;
    const repository = data?.data?.packageJson.repository;
    const url = typeof repository === 'string' ? repository : repository.url;
    return url.replace(/\.git$/, '').replace(/^git\+/, '');
  }, [data]);

  const author = useMemo(() => {
    const author = data?.data?.packageJson.author;
    if (!author) return null;
    if (typeof author === 'string') return author;
    return author.name;
  }, [data]);

  const { styles, theme } = useStyles();

  const tabItems: TabsProps['items'] = [
    {
      key: 'readme',
      label: t('Readme'),
      children: (
        <Row gutter={20}>
          {plugin.name && (
            <Col span={12}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('Name')}</Typography.Text>
                <Typography.Text strong>{plugin.name}</Typography.Text>
              </div>
            </Col>
          )}
          {plugin.displayName && (
            <Col span={12}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('DisplayName')}</Typography.Text>
                <Typography.Text strong>{plugin.displayName}</Typography.Text>
              </div>
            </Col>
          )}
          <Col span={24}>
            <div className={styles.PluginDetailBaseInfo}>
              <Typography.Text type="secondary">{t('PackageName')}</Typography.Text>
              <Typography.Text strong>{plugin.packageName}</Typography.Text>
            </div>
          </Col>
          {repository && (
            <Col span={24}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('Repository')}</Typography.Text>
                <Typography.Text strong>{repository}</Typography.Text>
              </div>
            </Col>
          )}
          {data?.data?.packageJson.homepage && (
            <Col span={24}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('Homepage')}</Typography.Text>
                <a href={data?.data?.packageJson.homepage} target="_blank" rel="noreferrer">
                  {data?.data?.packageJson.homepage}
                </a>
              </div>
            </Col>
          )}
          {plugin.description && (
            <Col span={24}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('Description')}</Typography.Text>
                <Typography.Text strong>{plugin.description}</Typography.Text>
              </div>
            </Col>
          )}
          {data?.data?.packageJson.license && (
            <Col span={12}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('License')}</Typography.Text>
                <Typography.Text strong>{data?.data?.packageJson.license}</Typography.Text>
              </div>
            </Col>
          )}
          {author && (
            <Col span={12}>
              <div className={styles.PluginDetailBaseInfo}>
                <Typography.Text type="secondary">{t('Author')}</Typography.Text>
                <Typography.Text strong>{author}</Typography.Text>
              </div>
            </Col>
          )}
          <Col span={12}>
            <div className={styles.PluginDetailBaseInfo}>
              <Typography.Text type="secondary">{t('Last updated')}</Typography.Text>
              <Typography.Text strong>{dayjs(data?.data?.lastUpdated).fromNow()}</Typography.Text>
            </div>
          </Col>
          <Col span={12}>
            <div className={styles.PluginDetailBaseInfo}>
              <Typography.Text type="secondary">{t('Version')}</Typography.Text>
              <Typography.Text strong>{plugin?.version}</Typography.Text>
            </div>
          </Col>
        </Row>
      ),
    },
    {
      key: 'dependencies',
      label: t('Dependencies compatibility check'),
      children: (
        <>
          {data?.data?.depsCompatible === false ? (
            <Typography.Text type="danger">
              {t('`dist/externalVersion.js` not found or failed to `require`. Please rebuild this plugin.')}
            </Typography.Text>
          ) : (
            <>
              {!data?.data?.['isCompatible'] && (
                <Alert
                  showIcon
                  type={'error'}
                  message={t(
                    'Plugin dependencies check failed, you should change the dependent version to meet the version requirements.',
                  )}
                />
              )}
              <Table
                style={{ marginTop: theme.margin }}
                rowKey={'name'}
                pagination={false}
                columns={dependenciesCompatibleTableColumns}
                dataSource={data?.data?.depsCompatible}
              />
            </>
          )}
        </>
      ),
    },
    {
      key: 'changelog',
      label: t('Changelog'),
      children: plugin?.changelogUrl ? <PluginDocument url={plugin?.changelogUrl} /> : t('No CHANGELOG.md file'),
    },
  ];

  return (
    <Modal open={!!plugin} footer={false} destroyOnClose width={600} onCancel={onCancel}>
      {loading ? (
        <Spin />
      ) : (
        plugin && (
          <>
            <Typography.Title level={3}>{plugin.packageName}</Typography.Title>
            <Space split={<span>&nbsp;•&nbsp;</span>}>
              <span>{plugin.version}</span>
              <span>
                {t('Last updated')} {dayjs(data?.data?.lastUpdated).fromNow()}
              </span>
            </Space>
            <Tabs
              style={{ minHeight: '50vh' }}
              items={tabItems}
              defaultActiveKey={!plugin.isCompatible ? 'dependencies' : undefined}
            ></Tabs>
          </>
        )
      )}
    </Modal>
  );
};
