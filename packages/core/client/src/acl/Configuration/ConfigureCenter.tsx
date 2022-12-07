import { Checkbox, message, Table } from 'antd';
import React, { useState, useContext, useEffect, createContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { uniq } from 'lodash';

const findKeys = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  const keys = [];
  for (const item of items) {
    keys.push(item.key);
    keys.push(...findKeys(item.children));
  }
  return keys;
};
const getParentKeys = (tree, func, path = []) => {
  if (!tree) return [];
  for (const data of tree) {
    path.push(data.key);
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
    arr.push(item.key);
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
  console.log(items);
  const { t } = useTranslation();
  const compile = useCompile();

  const allUids = findKeys(items);
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
        setkeys(data?.data?.map((schema) => schema['x-key']) || []);
      },
    },
  );
  const blackList = data?.data||[];
  console.log(blackList);
  const resource = api.resource('roles.pluginTab', record.name);
  const allChecked = allUids.length === keys.length;

  const handleChange = async (checked, record) => {
    const parentKeys = getParentKeys(items, (data) => data.key === record.key);
    const childrenKeys = getChildrenKeys(record?.children, []);
    if (!checked) {
      const totalKeys = childrenKeys.concat(record.key);
      const newKeys = keys.filter((v) => !totalKeys.includes(v));
      setkeys([...newKeys]);
      await resource.remove({
        values: totalKeys,
      });
    } else {
      const totalKeys = childrenKeys.concat(parentKeys);
      setkeys((prev) => {
        return uniq([...prev, ...totalKeys]);
      });
      await resource.add({
        values: totalKeys,
      });
    }
    message.success(t('Saved successfully'));
  };

  return (
    <Table
      // loading={loading}
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
          title: (
            <>
              <Checkbox
                checked={allChecked}
                onChange={async (value) => {
                  if (allChecked) {
                    await resource.set({
                      values: [],
                    });
                  } else {
                    await resource.set({
                      values: allUids,
                    });
                  }
                  // refresh();
                  message.success(t('Saved successfully'));
                }}
              />
              {t('Accessible')}
            </>
          ),
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
