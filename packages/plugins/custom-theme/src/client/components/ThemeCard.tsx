import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { Card, ConfigProvider, Modal, Space, Switch, message } from 'antd';
import { Error, Primary, Success, Warning } from 'antd-token-previewer';
import React, { useCallback, useMemo } from 'react';
import { ThemeConfig, ThemeItem } from '../../types';

interface TData {
  data: ThemeItem[];
}

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
          height: 194,
          overflow: 'hidden',
        }}
      >
        <Space style={{ transform: 'scale(0.123)', transformOrigin: '11px 10px' }} size={24} align="start">
          <Space direction="vertical" size={24} style={{ width: 960 }}>
            <Primary />
            <Success />
          </Space>
          <Space direction="vertical" size={24} style={{ width: 960 }}>
            <Error />
            <Warning />
          </Space>
        </Space>
      </div>
    </ConfigProvider>
  );
};

const ThemeCard = (props: Props) => {
  const { item, style = {}, onChange } = props;
  const api = useAPIClient();

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确认删除？',
      onOk: async () => {
        await api.request({
          url: `themeConfig:destroy/${item.id}`,
        });

        message.success('删除成功');
        onChange?.({ type: HandleTypes.delete, item });
      },
    });
  }, [item]);
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

  const actions = useMemo(() => {
    return item.isBuiltIn
      ? [
          <EditOutlined key="edit" />,
          <Switch key="switch" checked={item.optional} size={'small'} onChange={handleSwitch} />,
        ]
      : [
          <EditOutlined key="edit" />,
          item.isBuiltIn ? null : <DeleteOutlined key="delete" onClick={handleDelete} />,
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
