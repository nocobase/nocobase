import { Checkbox, message, Table } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { SettingsCenterContext } from '../../pm';
import { useRecord } from '../../record-provider';
import { useStyles } from '../style';
import { useApp } from '../../application';
import { useCompile } from '../../schema-component';

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
  for (const item of data) {
    arr.push(item.key);
    if (item.children && item.children.length) getChildrenKeys(item.children, arr);
  }
  return arr;
};

const SettingMenuContext = createContext(null);

export const SettingCenterProvider = (props) => {
  const configureItems = useContext(SettingsCenterContext);
  return <SettingMenuContext.Provider value={configureItems}>{props.children}</SettingMenuContext.Provider>;
};

export const SettingsCenterConfigure = () => {
  const app = useApp();
  const { styles } = useStyles();
  const record = useRecord();
  const api = useAPIClient();
  const compile = useCompile();
  const settings = app.settingsCenter.getList(false);
  const allAclSnippets = app.settingsCenter.getAclSnippets();
  const [snippets, setSnippets] = useState<string[]>([]);
  const allChecked = useMemo(
    () => snippets.includes('pm.*') && snippets.every((item) => !item.startsWith('!pm.')),
    [snippets],
  );
  const { t } = useTranslation();
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.snippets',
      resourceOf: record.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      onSuccess(data) {
        setSnippets(data?.data || []);
      },
    },
  );
  const resource = api.resource('roles.snippets', record.name);
  const handleChange = async (checked, record) => {
    const childrenKeys = getChildrenKeys(record?.children, []);
    const totalKeys = childrenKeys.concat(record.key);
    if (!checked) {
      await resource.remove({
        values: totalKeys.map((v) => '!' + v),
      });
      refresh();
    } else {
      await resource.add({
        values: totalKeys.map((v) => '!' + v),
      });
      refresh();
    }
    message.success(t('Saved successfully'));
  };
  return (
    <Table
      className={styles}
      loading={loading}
      rowKey={'key'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={[
        {
          dataIndex: 'title',
          title: t('Plugin name'),
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
                onChange={async () => {
                  const values = allAclSnippets.map((v) => '!' + v);
                  if (!allChecked) {
                    await resource.remove({
                      values,
                    });
                  } else {
                    await resource.add({
                      values,
                    });
                  }
                  refresh();
                  message.success(t('Saved successfully'));
                }}
              />{' '}
              {t('Accessible')}
            </>
          ),
          render: (_, record) => {
            const checked = !snippets.includes('!' + record.key);
            return <Checkbox checked={checked} onChange={() => handleChange(checked, record)} />;
          },
        },
      ]}
      dataSource={settings}
    />
  );
};
