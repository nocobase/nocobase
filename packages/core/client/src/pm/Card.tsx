import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import {
  Avatar,
  Card,
  Modal,
  Popconfirm,
  Spin,
  Switch,
  Tabs,
  TabsProps,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import cls from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { IPluginData } from '.';
import { useAPIClient, useRequest } from '../api-client';
import { useParseMarkdown } from '../schema-component/antd/markdown/util';

interface PluginDocumentProps {
  path: string;
  name: string;
}

interface ICommonCard {
  onClick: () => void;
  name: string;
  description: string;
  title: string;
  displayName: string;
  actions?: JSX.Element[];
}

interface IPluginDetail {
  plugin: any;
  onCancel: () => void;
  items: TabsProps['items'];
}

/**
 * get color by string
 * TODO: real avatar
 * @param str
 */
const stringToColor = function (str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const PluginDocument: React.FC<PluginDocumentProps> = (props) => {
  const [docLang, setDocLang] = useState('');
  const { name, path } = props;
  const { data, loading, error } = useRequest(
    {
      url: '/plugins:getTabInfo',
      params: {
        filterByTk: name,
        path: path,
        locale: docLang,
      },
    },
    {
      refreshDeps: [name, path, docLang],
    },
  );
  const { html, loading: parseLoading } = useParseMarkdown(data?.data?.content);

  const htmlWithOutRelativeDirect = useMemo(() => {
    if (html) {
      const pattern = /<a\s+href="\..*?\/([^/]+)"/g;
      return html.replace(pattern, (match, $1) => match + `onclick="return false;"`); // prevent the default event of <a/>
    }
  }, [html]);

  const handleSwitchDocLang = useCallback((e: MouseEvent) => {
    const lang = (e.target as HTMLDivElement).innerHTML;
    if (lang.trim() === '中文') {
      setDocLang('zh-CN');
    } else if (lang.trim() === 'English') {
      setDocLang('en-US');
    }
  }, []);

  useEffect(() => {
    const md = document.getElementById('pm-md-preview');
    md.addEventListener('click', handleSwitchDocLang);
    return () => {
      removeEventListener('click', handleSwitchDocLang);
    };
  }, [handleSwitchDocLang]);

  return (
    <div
      className={css`
        background: #ffffff;
        padding: var(--nb-spacing); // if the antd can upgrade to v5.0, theme token will be better
        height: 60vh;
        overflow-y: auto;
      `}
      id="pm-md-preview"
    >
      {loading || parseLoading ? (
        <Spin />
      ) : (
        <div className="nb-markdown" dangerouslySetInnerHTML={{ __html: error ? '' : htmlWithOutRelativeDirect }}></div>
      )}
    </div>
  );
};

function PluginDetail(props: IPluginDetail) {
  const { plugin, onCancel, items } = props;
  return (
    <Modal
      footer={false}
      className={css`
        .ant-modal-header {
          background: #f0f2f5;
          padding-bottom: 8px;
        }

        .ant-modal-body {
          padding-top: 0;
        }

        .ant-modal-content {
          background: #f0f2f5;
          .plugin-desc {
            padding-bottom: 8px;
          }
        }
      `}
      width="70%"
      title={
        <Typography.Title level={2} style={{ margin: 0 }}>
          {plugin?.displayName || plugin?.name}
          <Tag
            className={css`
              vertical-align: middle;
              margin-top: -3px;
              margin-left: 8px;
            `}
          >
            v{plugin?.version}
          </Tag>
        </Typography.Title>
      }
      open={!!plugin}
      onCancel={onCancel}
      destroyOnClose
    >
      {plugin?.description && <div className={'plugin-desc'}>{plugin?.description}</div>}
      <Tabs items={items} />
    </Modal>
  );
}

function CommonCard(props: ICommonCard) {
  const { onClick, name, displayName, actions, description, title } = props;
  return (
    <Card
      bordered={false}
      style={{ width: 'calc(20% - 24px)', marginRight: 24, marginBottom: 24, transition: 'all 0.35s ease-in-out' }}
      onClick={onClick}
      className={cls(css`
        &:hover {
          border: 1px solid var(--antd-wave-shadow-color);
          cursor: pointer;
        }

        border: 1px solid transparent;
      `)}
      actions={actions}
      // actions={[<a>Settings</a>, <a>Remove</a>, <Switch size={'small'} defaultChecked={true}></Switch>]}
    >
      <Card.Meta
        className={css`
          .ant-card-meta-avatar {
            margin-top: 8px;

            .ant-avatar {
              border-radius: 2px;
            }
          }
        `}
        avatar={<Avatar style={{ background: `${stringToColor(name)}` }}>{name?.[0]}</Avatar>}
        description={
          <Tooltip title={description} placement="bottom">
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {description || '-'}
            </div>
          </Tooltip>
        }
        title={
          <span>
            {displayName || name}
            <span
              className={css`
                display: block;
                color: rgba(0, 0, 0, 0.45);
                font-weight: normal;
                font-size: 13px;
                // margin-left: 8px;
              `}
            >
              {title}
            </span>
          </span>
        }
      />
    </Card>
  );
}

export const PluginCard = (props: { data: IPluginData }) => {
  const navigate = useNavigate();
  const { data } = props;
  const api = useAPIClient();
  const { t } = useTranslation();
  const { enabled, name, displayName, id, description, version } = data;
  const [plugin, setPlugin] = useState<any>(null);
  const { data: tabsData, run } = useRequest(
    {
      url: '/plugins:getTabs',
    },
    {
      manual: true,
    },
  );
  const items = useMemo<TabsProps['items']>(() => {
    return tabsData?.data?.tabs.map((item) => {
      return {
        label: item.title,
        key: item.path,
        children: React.createElement(PluginDocument, {
          name: tabsData?.data.filterByTk,
          path: item.path,
        }),
      };
    });
  }, [tabsData?.data]);

  const actions = useMemo(
    () =>
      [
        enabled ? (
          <SettingOutlined
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/settings/${name}`);
            }}
          />
        ) : null,
        <Popconfirm
          key={id}
          title={t('Are you sure to delete this plugin?')}
          onConfirm={async (e) => {
            e.stopPropagation();
            await api.request({
              url: `pm:remove/${name}`,
            });
            message.success(t('插件删除成功'));
            window.location.reload();
          }}
          onCancel={(e) => e.stopPropagation()}
          okText={t('Yes')}
          cancelText={t('No')}
        >
          <DeleteOutlined onClick={(e) => e.stopPropagation()} />
        </Popconfirm>,
        <Switch
          key={id}
          size={'small'}
          onChange={async (checked, e) => {
            e.stopPropagation();
            Modal.warn({
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
            // message.success(checked ? t('插件激活成功') : t('插件禁用成功'));
          }}
          defaultChecked={enabled}
        ></Switch>,
      ].filter(Boolean),
    [api, enabled, navigate, id, name, t],
  );
  return (
    <>
      <PluginDetail plugin={plugin} onCancel={() => setPlugin(null)} items={items} />
      <CommonCard
        onClick={() => {
          setPlugin(data);
          run({
            params: {
              filterByTk: name,
            },
          });
        }}
        name={name}
        description={description}
        title={version}
        actions={actions}
        displayName={displayName}
      />
    </>
  );
};

export const BuiltInPluginCard = (props: { data: IPluginData }) => {
  const {
    data: { description, name, version, displayName },
    data,
  } = props;
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<any>(null);
  const { data: tabsData, run } = useRequest(
    {
      url: '/plugins:getTabs',
    },
    {
      manual: true,
    },
  );
  const items = useMemo(() => {
    return tabsData?.data?.tabs.map((item) => {
      return {
        label: item.title,
        key: item.path,
        children: React.createElement(PluginDocument, {
          name: tabsData?.data.filterByTk,
          path: item.path,
        }),
      };
    });
  }, [tabsData?.data]);

  return (
    <>
      <PluginDetail plugin={plugin} onCancel={() => setPlugin(null)} items={items} />
      <CommonCard
        onClick={() => {
          setPlugin(data);
          run({
            params: {
              filterByTk: name,
            },
          });
        }}
        name={name}
        displayName={displayName}
        description={description}
        title={version}
        actions={[
          <div key="placeholder-comp"></div>,
          <SettingOutlined
            key="settings"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/settings/${name}`);
            }}
          />,
        ]}
      />
    </>
  );
};
function useCallabck(arg0: () => void, arg1: undefined[]) {
  throw new Error('Function not implemented.');
}
