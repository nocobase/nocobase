import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import {
  App,
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { IPluginData } from '.';
import { useAPIClient, useRequest } from '../api-client';
import { useGlobalTheme } from '../global-theme';
import { useStyles as useMarkdownStyles } from '../schema-component/antd/markdown/style';
import { useParseMarkdown } from '../schema-component/antd/markdown/util';
import { useStyles } from './style';

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
  const { styles } = useStyles();
  const { isDarkTheme } = useGlobalTheme();
  const { componentCls, hashId } = useMarkdownStyles({ isDarkTheme });
  const [docLang, setDocLang] = useState('');
  const { name, path } = props;
  const { data, loading, error } = useRequest<{
    data: {
      content: string;
    };
  }>(
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
    <div className={styles.PluginDocument} id="pm-md-preview">
      {loading || parseLoading ? (
        <Spin />
      ) : (
        <div
          className={`${componentCls} ${hashId} nb-markdown nb-markdown-default nb-markdown-table`}
          dangerouslySetInnerHTML={{ __html: error ? '' : htmlWithOutRelativeDirect }}
        ></div>
      )}
    </div>
  );
};

function PluginDetail(props: IPluginDetail) {
  const { plugin, onCancel, items } = props;
  const { styles } = useStyles();

  return (
    <Modal
      footer={false}
      className={styles.PluginDetail}
      width="70%"
      title={
        <Typography.Title level={2} style={{ margin: 0 }}>
          {plugin?.displayName || plugin?.name}
          <Tag className={'version-tag'}>v{plugin?.version}</Tag>
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
  const { styles } = useStyles();

  return (
    <Card
      bordered={false}
      className={styles.CommonCard}
      onClick={onClick}
      hoverable
      // className={cls(css`
      //   &:hover {
      //     border: 1px solid var(--antd-wave-shadow-color);
      //     cursor: pointer;
      //   }

      //   border: 1px solid transparent;
      // `)}
      actions={actions}
      // actions={[<a>Settings</a>, <a>Remove</a>, <Switch size={'small'} defaultChecked={true}></Switch>]}
    >
      <Card.Meta
        className={styles.avatar}
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
            <span className={styles.version}>{title}</span>
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
  const { modal } = App.useApp();
  const { data: tabsData, run } = useRequest<any>(
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
            // window.location.reload();
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
            await api.request({
              url: `pm:${checked ? 'enable' : 'disable'}/${name}`,
            });
          }}
          checked={enabled}
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
  const { data: tabsData, run } = useRequest<{
    data: {
      tabs: {
        title: string;
        path: string;
      }[];
      filterByTk: string;
    };
  }>(
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
