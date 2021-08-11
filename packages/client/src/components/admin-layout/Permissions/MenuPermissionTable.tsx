import React from 'react';
import { observer } from '@formily/react';
import { Table, Checkbox, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { request } from '../../../schemas';
import { Resource } from '@nocobase/client/src/resource';
import { useContext } from 'react';
import { RoleContext } from '.';
import { useState } from 'react';

const getKeys = (items: any[]) => {
  const keys = [];
  for (const item of items) {
    keys.push(item.key);
    const children = getKeys(item.children || []);
    keys.push(...children);
  }
  return keys;
};

export const MenuPermissionTable = observer((props) => {
  const role = useContext(RoleContext);
  const [allUiSchemaKyes, setAllUiSchemaKyes] = useState([]);
  const [uiSchemaKyes, setUiSchemaKeys] = useState([]);
  const { data, loading } = useRequest(
    () => request('ui_schemas:getMenuItems'),
    {
      formatResult: (data) => data?.data,
      onSuccess(data) {
        setAllUiSchemaKyes(getKeys(data));
      },
    },
  );
  console.log('allUiSchemaKyes', allUiSchemaKyes);
  const resource = Resource.make({
    associatedName: 'roles',
    associatedKey: role.name,
    resourceName: 'ui_schemas',
  });
  useRequest(() => resource.list(), {
    formatResult: (data) => data?.data,
    onSuccess(data) {
      setUiSchemaKeys(getKeys(data));
    },
  });
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <Table
        loading={loading}
        dataSource={data}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
        }}
        columns={[
          {
            title: '菜单名称',
            dataIndex: 'title',
          },
          {
            title: (
              <div>
                <Checkbox
                  checked={
                    allUiSchemaKyes.length > 0 &&
                    allUiSchemaKyes.length === uiSchemaKyes.length
                  }
                  onChange={async (e) => {
                    const resource = Resource.make({
                      resourceName: 'roles',
                      resourceKey: role.name,
                    });
                    if (e.target.checked) {
                      await resource.save({
                        ui_schemas: allUiSchemaKyes,
                      });
                      setUiSchemaKeys(allUiSchemaKyes);
                    } else {
                      await resource.save({
                        ui_schemas: [],
                      });
                      setUiSchemaKeys([]);
                    }
                  }}
                />{' '}
                允许访问
              </div>
            ),
            dataIndex: 'key',
            render: (value) => {
              return (
                <Checkbox
                  checked={uiSchemaKyes.includes(value)}
                  onChange={async (e) => {
                    setUiSchemaKeys((prevUiSchemaKeys) => {
                      if (e.target.checked) {
                        prevUiSchemaKeys.push(value);
                      } else {
                        const index = prevUiSchemaKeys.findIndex(
                          (key) => key === value,
                        );
                        prevUiSchemaKeys.splice(index, 1);
                      }
                      return [...prevUiSchemaKeys];
                    });
                    await resource.toggle({
                      resourceKey: value,
                    });
                  }}
                />
              );
            },
          },
        ]}
      />
    </div>
  );
});
