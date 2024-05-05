/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Popover, Button, Menu } from 'antd';
import { css } from '@emotion/css';
import { LineHeightOutlined } from '@ant-design/icons';
import { getPopupContainer, useGCMTranslation } from '../utils';
import { DirectionType } from '../GraphDrawPage';

export const DirectionAction = (props) => {
  const { onClick } = props;
  const { t } = useGCMTranslation();
  const menuItems = [
    {
      key: DirectionType.Both,
      label: 'All directions',
    },
    {
      key: DirectionType.Target,
      label: 'Target index',
    },
    {
      key: DirectionType.Source,
      label: 'Source index',
    },
  ];
  const content = (
    <div>
      <Menu
        defaultSelectedKeys={[DirectionType.Target]}
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
              onClick: () => {
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
        <LineHeightOutlined />
      </Button>
    </Popover>
  );
};
