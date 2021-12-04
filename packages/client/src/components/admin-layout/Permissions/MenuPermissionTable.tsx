import React from 'react';
import { observer } from '@formily/react';
import { Table, Checkbox, Spin } from 'antd';
import { useRequest } from 'ahooks';
import { Resource } from '../../../resource';
import { useContext } from 'react';
import { RoleContext } from '.';
import { useState } from 'react';
import { useResourceRequest } from '../../../constate';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const role = useContext(RoleContext);
  const [allUiSchemaKyes, setAllUiSchemaKyes] = useState([]);
  const [uiSchemaKyes, setUiSchemaKeys] = useState([]);
  const { data, loading } = useRequest('ui_schemas:getMenuItems', {
    formatResult: (data) => data?.data,
    onSuccess(data) {
      setAllUiSchemaKyes(getKeys(data));
    },
  });
  console.log('allUiSchemaKyes', allUiSchemaKyes);
  const resource = useResourceRequest({
    associatedName: 'roles',
    associatedIndex: role.name,
    resourceName: 'ui_schemas',
  });
  useRequest(() => resource.list(), {
    formatResult: (data) => data?.data,
    onSuccess(data) {
      setUiSchemaKeys(getKeys(data));
    },
  });
  const resource2 = useResourceRequest({
    resourceName: 'roles',
    resourceIndex: role.name,
  });
  if (loading) {
    return <Spin size={'large'} className={'nb-spin-center'} />;
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
            title: t('Menu item name'),
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
                    if (e.target.checked) {
                      await resource2.save({
                        ui_schemas: allUiSchemaKyes,
                      });
                      setUiSchemaKeys(allUiSchemaKyes);
                    } else {
                      await resource2.save({
                        ui_schemas: [],
                      });
                      setUiSchemaKeys([]);
                    }
                  }}
                />{' '}
                {t('Allow access')}
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
                      resourceIndex: value,
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
