import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAPIClient, useCurrentUserContext, useGlobalTheme } from '@nocobase/client';
import { App, Card, ConfigProvider, Space, Switch, message } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { ThemeConfig, ThemeItem } from '../../types';
import { Primary } from '../antd-token-previewer';
import { useUpdateThemeSettings } from '../hooks/useThemeSettings';
import { useThemeEditorContext } from './ThemeEditorProvider';

enum HandleTypes {
  delete = 'delete',
  optional = 'optional',
}

interface Props {
  item: ThemeItem;
  style?: React.CSSProperties;
  onChange?: (params: { type: HandleTypes; item: ThemeItem }) => void;
}

const Overview = ({ theme }: { theme: ThemeConfig }) => {
  return (
    <ConfigProvider theme={{ ...theme, inherit: false }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          width: 240,
          height: 191,
          overflow: 'hidden',
        }}
      >
        <Space style={{ transform: 'scale(0.7) translate(0, 0)', transformOrigin: '0 0' }} size={0} align="start">
          <Primary />
        </Space>
      </div>
    </ConfigProvider>
  );
};

const ThemeCard = (props: Props) => {
  const { theme, setTheme, setCurrentSettingTheme, setCurrentEditingTheme } = useGlobalTheme();
  const { setOpen } = useThemeEditorContext();
  const currentUser = useCurrentUserContext();
  const { item, style = {}, onChange } = props;
  const api = useAPIClient();
  const { updateThemeSettings } = useUpdateThemeSettings();
  const { modal } = App.useApp();

  const handleDelete = useCallback(() => {
    modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确认删除？',
      onOk: async () => {
        await api.request({
          url: `themeConfig:destroy/${item.id}`,
        });

        if (item.id === currentUser?.data?.data?.systemSettings?.theme) {
          updateThemeSettings(null);
        }
        message.success('删除成功');
        onChange?.({ type: HandleTypes.delete, item });
      },
    });
  }, [api, currentUser?.data?.data?.systemSettings?.theme, item, onChange, updateThemeSettings]);
  const handleSwitch = useCallback(
    async (checked: boolean) => {
      await api.request({
        url: `themeConfig:update/${item.id}`,
        method: 'post',
        data: {
          optional: checked,
        },
      });

      message.success('更改成功');
      onChange?.({ type: HandleTypes.optional, item });
    },
    [item],
  );
  const handleEdit = useCallback(() => {
    setCurrentSettingTheme(theme);
    setCurrentEditingTheme(item);
    setTheme(item.config);
    setOpen(true);
  }, [item]);

  const actions = useMemo(() => {
    return item.isBuiltIn
      ? [
          <EditOutlined key="edit" onClick={handleEdit} />,
          <Switch key="switch" checked={item.optional} size={'small'} onChange={handleSwitch} />,
        ]
      : [
          <EditOutlined key="edit" onClick={handleEdit} />,
          <DeleteOutlined key="delete" onClick={handleDelete} />,
          <Switch key="switch" checked={item.optional} size={'small'} onChange={handleSwitch} />,
        ];
  }, [handleDelete, handleSwitch, item.isBuiltIn, item.optional]);

  return (
    <Card
      hoverable
      style={{ width: 240, overflow: 'hidden', ...style }}
      bodyStyle={{ display: 'none' }}
      cover={<Overview theme={item.config} />}
      actions={actions}
    ></Card>
  );
};

ThemeCard.displayName = 'ThemeCard';

export default ThemeCard;
