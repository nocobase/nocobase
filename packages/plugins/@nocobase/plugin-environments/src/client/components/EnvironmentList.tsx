/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MoreOutlined } from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { Dropdown, Menu, Tag } from 'antd';
import React from 'react';

function EditEnvironment({ environmentKey }) {
  return <span>Edit</span>;
}

function DeleteEnvironment({ environmentKey }) {
  return <span>Delete</span>;
}

export function EnvironmentList({ items, onDelete, onSelect, activeKey }) {
  const api = useAPIClient();
  return (
    <Menu
      mode="inline"
      defaultSelectedKeys={[activeKey]}
      style={{ paddingRight: 24 }}
      onSelect={onSelect}
      items={items.map((item) => {
        return {
          key: item.name,
          label: item.name,
          itemIcon: (
            <>
              {item.default && (
                <Tag bordered={false} color="green">
                  Default
                </Tag>
              )}
              <Dropdown
                menu={{
                  async onClick(info) {
                    console.log(info.key);
                    if (info.key === 'edit') {
                      //
                    } else if (info.key === 'delete') {
                      await api.request({
                        url: 'environments:destroy',
                        params: {
                          filterByTk: item.name,
                        },
                      });
                      onDelete(item);
                    }
                  },
                  items: [
                    {
                      key: 'edit',
                      label: 'Edit',
                    },
                    {
                      key: 'delete',
                      label: 'Delete',
                    },
                  ],
                }}
              >
                <MoreOutlined />
              </Dropdown>
            </>
          ),
        };
      })}
    />
  );
}
