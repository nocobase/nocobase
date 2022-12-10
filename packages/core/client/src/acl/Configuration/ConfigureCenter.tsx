import { Checkbox, message, Table } from 'antd';
import React, { useState, useContext, createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { uniq } from 'lodash';

const getParentKeys = (tree, func, path = []) => {
  if (!tree) return [];
  for (const data of tree) {
    path.push({ tabKey: data.key });
    if (func(data)) return path;
    if (data.children) {
      const findChildren = getParentKeys(data.children, func, path);
      if (findChildren.length) return findChildren;
    }
    path.pop();
  }
  return [];
};
const getChildrenKeys = (data = [], arr = []) => {
  for (let item of data) {
    arr.push({ tabKey: item.key });
    if (item.children && item.children.length) getChildrenKeys(item.children, arr);
  }
  return arr;
};

const SettingMenuContext = createContext(null);

function useGetContext() {
  const [context, setContext] = useState(null);
  import('../../pm').then(({ SettingsCenterContext }) => {
    setContext(SettingsCenterContext);
  });

  return context;
}

export const SettingCenterProvider = (props) => {
  const context = useGetContext();
  const configureItems = context && useContext(context);

  return <SettingMenuContext.Provider value={configureItems}>{props.children}</SettingMenuContext.Provider>;
};

const formatPluginTabs = (data) => {
  const arr: any[] = Object.entries(data);
  const pluginsTabs = [];
  arr.forEach((v) => {
    const children = Object.entries(v[1].tabs).map((k: any) => {
      return {
        key: k[0],
        title: k[1].title,
      };
    });

    pluginsTabs.push({
      title: v[1].title,
      key: v[0],
      children,
    });
  });
  return pluginsTabs;
};

export const SettingsCenterConfigure = () => {
  const record = useRecord();
  const api = useAPIClient();
  const pluginTags = useContext(SettingMenuContext);
  const items: any[] = (pluginTags && formatPluginTabs(pluginTags)) || [];
  const { t } = useTranslation();
  const compile = useCompile();
  const [keys, setkeys] = useState([]);
  const { loading, refresh, data } = useRequest(
    {
      resource: 'roles.pluginTab',
      resourceOf: record.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      onSuccess(data) {
        console.log(data)
        setkeys(data?.data?.map((schema) => schema['x-key']) || []);
      },
    },
  );
  const blackList = data?.data.map((v) => v.tabKey) || [];
  const resource = api.resource('roles.pluginTab', record.name);

  const handleChange = async (checked, record) => {
    const parentKeys = getParentKeys(items, (data) => data.key === record.key);
    const childrenKeys = getChildrenKeys(record?.children, []);
    if (!checked) {
      const totalKeys = childrenKeys.concat({ tabKey: record.key });
      const newKeys = keys.filter((v) => !totalKeys.includes(v));
      setkeys([...newKeys]);
      await resource.destroy({
        filter: {
          tabKey: {
            $in: totalKeys.map((v) => v.tabKey),
          },
        },
      });
      refresh();
    } else {
      const totalKeys = childrenKeys.concat(parentKeys);
      setkeys((prev) => {
        return uniq([...prev, ...totalKeys]);
      });
      await resource.create({
        values: totalKeys,
      });
      refresh();
    }
    message.success(t('Saved successfully'));
  };

  return (
    items?.length&&<Table
      loading={loading}
      rowKey={'key'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={[
        {
          dataIndex: 'title',
          title: t('Plugin Tab Name'),
          render: (value) => {
            return compile(value);
          },
        },
        {
          dataIndex: 'accessible',
          title: t('Accessible'),
          render: (_, record) => {
            const checked = !blackList?.includes(record.key);
            return <Checkbox checked={checked} onChange={() => handleChange(checked, record)} />;
          },
        },
      ]}
      dataSource={items}
    />
  );
};
