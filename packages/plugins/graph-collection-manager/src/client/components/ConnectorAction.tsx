import React from 'react';
import { ShareAltOutlined } from '@ant-design/icons';
import { Menu, Popover, Button } from 'antd';
import { css } from '@emotion/css';
import { getPopupContainer, useGCMTranslation } from '../utils';
import { ConnectionType } from '../GraphDrawPage';

export const ConnectorAction = (props) => {
  const { onClick } = props;
  const { t } = useGCMTranslation();

  const menuItems = [
    {
      key: ConnectionType.Both,
      label: 'All relationships',
    },
    {
      key: ConnectionType.Entity,
      label: 'Entity relationship only',
    },
    {
      key: ConnectionType.Inherit,
      label: 'Inheritance relationship only',
    },
  ];
  const content = (
    <div>
      <Menu
        defaultSelectedKeys={[ConnectionType.Both]}
        selectable={true}
        className={css`
          .ant-menu-item {
            height: 32px;
            line-height: 32px;
          }
        `}
        style={{ maxHeight: '70vh', overflowY: 'auto', border: 'none' }}
        items={[
          { type: 'divider' },
          ...menuItems.map((v) => {
            return {
              key: v.key,
              label: t(v.label),
              onClick: (e: any) => {
                onClick?.(v.key);
              },
            };
          }),
        ]}
      />
    </div>
  );
  return (
    <Popover
      content={content}
      autoAdjustOverflow
      placement="bottomRight"
      trigger={['click']}
      getPopupContainer={getPopupContainer}
      overlayClassName={css`
        .ant-popover-inner-content {
          padding: 0;
        }
      `}
    >
      <Button>
        <ShareAltOutlined />
      </Button>
    </Popover>
  );
};
