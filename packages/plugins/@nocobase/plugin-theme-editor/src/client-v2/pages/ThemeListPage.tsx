/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EditOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import { compatOldTheme, defaultTheme, useGlobalTheme } from '@nocobase/client-v2';
import { EMBED_REPLACING_DATA_KEY, GLOBAL_EMBED_CONTAINER_ID, useFlowContext } from '@nocobase/flow-engine';
import { error } from '@nocobase/utils/client';
import { useRequest } from 'ahooks';
import { App, Button, Card, ConfigProvider, Dropdown, Space, Spin, Switch, Tag, theme as antdTheme } from 'antd';
import React, { useCallback, useMemo, useEffect } from 'react';
import { Primary } from '../antd-token-previewer';
import ThemeEditorPanel from '../components/ThemeEditorPanel';
import { useT } from '../locale';
import type { ThemeConfig, ThemeItem } from '../types';
import {
  getCurrentUserThemeId,
  getDefaultThemeItem,
  getEffectiveCurrentThemeId,
  isDefaultThemeEffective,
  listThemeItems,
  THEME_RUNTIME_REFRESH_EVENT,
  updateUserTheme,
} from '../utils/themeApi';

enum HandleTypes {
  delete = 'delete',
  optional = 'optional',
}

interface ThemeCardProps {
  item: ThemeItem;
  currentThemeId?: number | null;
  defaultThemeId?: number;
  isUsingDefaultTheme?: boolean;
  onChange?: (params: { type: HandleTypes; item: ThemeItem }) => void;
  openEditor: (options: OpenThemeEditorOptions) => void;
}

interface OpenThemeEditorOptions {
  editingTheme: ThemeItem | null;
  initialTheme: ThemeConfig;
  settingTheme: ThemeConfig;
}

const Overview = ({ theme }: { theme: ThemeConfig }) => {
  const { token } = antdTheme.useToken();

  return (
    <ConfigProvider theme={{ ...theme, inherit: false }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          width: '100%',
          height: 129,
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden',
        }}
      >
        <Space
          style={{
            transform: 'scale(0.7) translate(0, 0)',
            transformOrigin: '0 0',
          }}
          size={0}
          align="start"
        >
          <Primary />
        </Space>
      </div>
    </ConfigProvider>
  );
};

const useOpenThemeEditor = (refresh?: () => void) => {
  const ctx = useFlowContext();
  const t = useT();

  return useCallback(
    (options: OpenThemeEditorOptions) => {
      const target = document.querySelector<HTMLDivElement>(`#${GLOBAL_EMBED_CONTAINER_ID}`);
      if (!target) {
        return;
      }

      ctx.viewer.embed({
        type: 'embed',
        target,
        title: t('Theme editor'),
        styles: {
          body: {
            padding: 0,
            overflow: 'hidden',
          },
        },
        onOpen() {
          target.style.width = '33.3%';
          target.style.maxWidth = '800px';
          target.style.minWidth = '0px';
        },
        onClose() {
          if (target.dataset[EMBED_REPLACING_DATA_KEY] !== '1') {
            target.style.width = 'auto';
            target.style.maxWidth = 'none';
            target.style.minWidth = 'auto';
          }
        },
        content: (view) => <ThemeEditorPanel view={view} refresh={refresh} {...options} />,
      });
    },
    [ctx.viewer, refresh, t],
  );
};

const ThemeCard = (props: ThemeCardProps) => {
  const { item, currentThemeId, defaultThemeId, isUsingDefaultTheme, onChange, openEditor } = props;
  const { theme: currentTheme, getCurrentEditingTheme, getCurrentSettingTheme } = useGlobalTheme();
  const ctx = useFlowContext();
  const { modal, message } = App.useApp();
  const { token } = antdTheme.useToken();
  const t = useT();
  const [loading, setLoading] = React.useState(false);
  const isDefault = item.id === defaultThemeId;

  const handleDelete = useCallback(() => {
    if (isDefault) {
      return;
    }

    modal.confirm({
      title: t('Delete theme'),
      content: t('Deletion is unrecoverable. Confirm deletion?'),
      onOk: async () => {
        await ctx.api.request({
          url: `themeConfig:destroy/${item.id}`,
        });

        if (item.id === getCurrentUserThemeId((ctx as any).user)) {
          await updateUserTheme(ctx.api, null);
          message.success(t('Deleted successfully'));
          window.location.reload();
          return;
        }

        message.success(t('Deleted successfully'));
        onChange?.({ type: HandleTypes.delete, item });
      },
    });
  }, [ctx, isDefault, item, message, modal, onChange, t]);

  const handleSwitchOptional = useCallback(
    async (checked: boolean) => {
      setLoading(true);
      try {
        if (!checked) {
          await ctx.api.request({
            url: `themeConfig:update/${item.id}`,
            method: 'post',
            data: {
              optional: checked,
              default: false,
            },
          });

          if (item.id === getCurrentUserThemeId((ctx as any).user)) {
            await updateUserTheme(ctx.api, null);
            message.success(t('Updated successfully'));
            window.location.reload();
            return;
          }
        } else {
          await ctx.api.request({
            url: `themeConfig:update/${item.id}`,
            method: 'post',
            data: {
              optional: checked,
            },
          });
        }

        message.success(t('Updated successfully'));
        onChange?.({ type: HandleTypes.optional, item });
      } catch (err) {
        error(err);
      } finally {
        setLoading(false);
      }
    },
    [ctx, item, message, onChange, t],
  );

  const handleSwitchDefault = useCallback(
    async (checked: boolean) => {
      setLoading(true);
      try {
        await ctx.api.request({
          url: `themeConfig:update/${item.id}`,
          method: 'post',
          data: checked
            ? {
                optional: true,
                default: true,
              }
            : {
                default: false,
              },
        });
        if (checked && isUsingDefaultTheme) {
          (ctx as any).app?.eventBus?.dispatchEvent(new Event(THEME_RUNTIME_REFRESH_EVENT));
        }
        message.success(t('Updated successfully'));
        onChange?.({ type: HandleTypes.optional, item });
      } catch (err) {
        error(err);
      } finally {
        setLoading(false);
      }
    },
    [ctx, isUsingDefaultTheme, item, message, onChange, t],
  );

  const handleEdit = useCallback(() => {
    openEditor({
      editingTheme: item,
      initialTheme: compatOldTheme(item.config || defaultTheme),
      settingTheme: getCurrentSettingTheme() || currentTheme || defaultTheme,
    });
  }, [currentTheme, getCurrentSettingTheme, item, openEditor]);

  const menu = useMemo(() => {
    return {
      items: [
        {
          key: 'optional',
          label: (
            <Space
              style={{ width: '100%', justifyContent: 'space-between' }}
              align="center"
              size="middle"
              onClick={(event) => event.stopPropagation()}
            >
              <span>{t('User selectable')}</span>
              <Switch
                disabled={isDefault}
                style={{ transform: 'translateY(-2px)' }}
                checked={item.optional}
                size="small"
                loading={loading}
                onChange={handleSwitchOptional}
              />
            </Space>
          ),
        },
        {
          key: 'system',
          label: (
            <Space
              style={{ width: '100%', justifyContent: 'space-between' }}
              align="center"
              size="middle"
              onClick={(event) => event.stopPropagation()}
            >
              <span>{t('Default theme')}</span>
              <Switch
                disabled={isDefault}
                style={{ transform: 'translateY(-2px)' }}
                checked={isDefault}
                size="small"
                loading={loading}
                onChange={handleSwitchDefault}
              />
            </Space>
          ),
        },
      ],
    };
  }, [handleSwitchDefault, handleSwitchOptional, isDefault, item.optional, loading, t]);

  const actions = useMemo(() => {
    return [
      <EditOutlined key="edit" onClick={handleEdit} />,
      <DeleteOutlined
        key="delete"
        style={
          isDefault
            ? {
                color: token.colorTextDisabled,
                cursor: 'not-allowed',
              }
            : null
        }
        onClick={handleDelete}
      />,
      <Dropdown key="ellipsis" menu={menu}>
        <EllipsisOutlined />
      </Dropdown>,
    ];
  }, [handleDelete, handleEdit, isDefault, menu, token.colorTextDisabled]);

  const extra = useMemo(() => {
    if (item.id !== defaultThemeId && !item.optional) {
      return null;
    }

    const text =
      item.id === currentThemeId
        ? t('Current')
        : item.id === defaultThemeId
          ? t('Default')
          : item.optional
            ? t('Optional')
            : t('Non-optional');
    const color =
      item.id === currentThemeId
        ? 'processing'
        : item.id === defaultThemeId
          ? 'default'
          : item.optional
            ? 'success'
            : 'error';

    return (
      <Tag style={{ marginRight: 0 }} color={color}>
        {text}
      </Tag>
    );
  }, [currentThemeId, defaultThemeId, item.id, item.optional, t]);

  const cardStyle = useMemo(() => {
    const baseStyle = { cursor: 'default', width: 240, height: 240, overflow: 'hidden' };
    if (getCurrentEditingTheme()?.id === item.id) {
      return {
        ...baseStyle,
        outline: `1px solid ${(token as any).colorSettings}`,
      };
    }

    return baseStyle;
  }, [getCurrentEditingTheme, item.id, token]);

  return (
    <Card
      hoverable
      extra={extra}
      title={t(item.config?.name || '')}
      size="small"
      style={cardStyle}
      headStyle={{ minHeight: 38 }}
      actions={actions}
    >
      <Overview theme={item.config || defaultTheme} />
    </Card>
  );
};

const AddThemeButton = (props: { openEditor: (options: OpenThemeEditorOptions) => void }) => {
  const { openEditor } = props;
  const { theme, getCurrentSettingTheme } = useGlobalTheme();
  const { token } = antdTheme.useToken();
  const { modal } = App.useApp();
  const t = useT();

  const handleClick = useCallback(() => {
    const modalRef = modal.confirm({
      title: t('Add new theme'),
      closable: true,
      maskClosable: true,
      width: 'fit-content',
      footer: (
        <Space style={{ float: 'right', marginTop: token.margin, justifyContent: 'flex-end' }} wrap>
          <Button
            onClick={() => {
              openEditor({
                editingTheme: null,
                initialTheme: compatOldTheme(theme),
                settingTheme: getCurrentSettingTheme() || theme || defaultTheme,
              });
              modalRef.destroy();
            }}
          >
            {t('Edit based on current theme')}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              openEditor({
                editingTheme: null,
                initialTheme: compatOldTheme(defaultTheme),
                settingTheme: getCurrentSettingTheme() || theme || defaultTheme,
              });
              modalRef.destroy();
            }}
          >
            {t('Create a brand new theme')}
          </Button>
        </Space>
      ),
    });
  }, [getCurrentSettingTheme, modal, openEditor, t, theme, token.margin]);

  return (
    <Button
      type="dashed"
      style={{
        width: 240,
        height: 240,
        borderRadius: token.borderRadiusLG,
        borderColor: (token as any).colorSettings,
        color: (token as any).colorSettings,
      }}
      icon={<PlusOutlined />}
      onClick={handleClick}
    >
      {t('Add new theme')}
    </Button>
  );
};

const ThemeListPage = () => {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = antdTheme.useToken();
  const currentUserThemeId = getCurrentUserThemeId((ctx as any).user);
  const {
    data = [],
    loading,
    error: requestError,
    refresh,
  } = useRequest(() => listThemeItems(ctx.api), {
    refreshDeps: [ctx.api],
  });
  const defaultThemeId = getDefaultThemeItem(data)?.id;
  const currentThemeId = useMemo(
    () => getEffectiveCurrentThemeId(data, currentUserThemeId),
    [currentUserThemeId, data],
  );
  const isUsingDefaultTheme = useMemo(
    () => isDefaultThemeEffective(data, currentUserThemeId),
    [currentUserThemeId, data],
  );
  const openEditor = useOpenThemeEditor(refresh);

  useEffect(() => {
    if (requestError) {
      error(requestError);
    }
  }, [requestError]);

  const handleChange = useCallback(() => {
    refresh();
  }, [refresh]);

  if (loading && !data.length) {
    return <Spin />;
  }

  return (
    <Space size={token.marginLG} wrap>
      {data.map((item) => (
        <ThemeCard
          item={item}
          key={item.id}
          currentThemeId={currentThemeId}
          defaultThemeId={defaultThemeId}
          isUsingDefaultTheme={isUsingDefaultTheme}
          onChange={handleChange}
          openEditor={openEditor}
        />
      ))}
      <AddThemeButton openEditor={openEditor} />
    </Space>
  );
};

ThemeListPage.displayName = 'ThemeListPage';

export default ThemeListPage;
