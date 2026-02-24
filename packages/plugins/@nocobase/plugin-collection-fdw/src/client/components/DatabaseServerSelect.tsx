/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useState, createContext, useRef, useContext, Dispatch, SetStateAction, useEffect } from 'react';
import { Select, Space, Divider, Menu, Modal, message, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormItem, useAPIClient } from '@nocobase/client';
import { RecursionField, useForm, observer } from '@formily/react';
import { CreateDatabaseServerAction } from './CreateDatabaseServerAction';
import { EditDatabaseServerAction } from './EditDatabaseServerAction';

export const DatabaseServerContext = createContext<{
  options: any[];
  setOptions?: Dispatch<SetStateAction<any>>;
  refresh?: Function;
  initialOptions: any[];
}>({ options: [], initialOptions: [] });

export const ServerContext = createContext<{ item: object }>({ item: {} });
const ServerContextProvider = ({ item, children }) => {
  return <ServerContext.Provider value={{ item }}>{children}</ServerContext.Provider>;
};
export const DatabaseServerSelect = observer(
  (props: any) => {
    const { options, setOptions, initialOptions, refresh } = useContext(DatabaseServerContext);
    const [value, setValue] = useState(null);
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const form = useForm();
    const api = useAPIClient();
    useEffect(() => {
      setValue(props.value);
    }, [props.value]);
    const handleDataServerChange = (item) => {
      setValue(item.name);
      form.setValuesIn('remoteServerName', item.name);
      form.setValuesIn('remoteTableName', null);
      setOpen(false);
    };
    const handleDelete = (data) => {
      Modal.confirm({
        title: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await api.resource('databaseServers').destroy({ filterByTk: data.name });
          message.success(t('Saved successfully'));
          refresh();
        },
      });
    };
    return (
      <Select
        disabled={props.disabled}
        allowClear
        showSearch
        onClear={() => {
          setValue(null);
          form.setValuesIn('remoteServerName', null);
          form.setValuesIn('remoteTableName', null);
          setOpen(false);
        }}
        value={value}
        open={open}
        style={{ width: '100%' }}
        onSearch={(value) => {
          setOptions(() =>
            initialOptions.filter((option) => option.description.toLowerCase().indexOf(value.toLowerCase()) >= 0),
          );
        }}
        onDropdownVisibleChange={(visible) => setOpen(visible)}
        dropdownRender={() => {
          return (
            <div>
              {options.length > 0 ? (
                <Menu>
                  {options?.map((item) => (
                    <Menu.Item
                      key={item.name}
                      onClick={() => handleDataServerChange(item)}
                      style={{ margin: '0px', height: '30px', lineHeight: '30px' }}
                    >
                      {item.description}
                      <Space style={{ float: 'right', display: 'inline-flex', color: '#1677FF' }}>
                        <ServerContextProvider item={item}>
                          <RecursionField
                            name="edit-server"
                            schema={{
                              name: 'edit-server',
                              'x-component': EditDatabaseServerAction,
                              type: 'void',
                              title: '{{ t("Edit database server") }}',
                              'x-component-props': {
                                setOpen,
                              },
                            }}
                          />
                        </ServerContextProvider>
                        <Divider type="vertical" />
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                        >
                          {t('Delete')}
                        </span>
                      </Space>
                    </Menu.Item>
                  ))}
                </Menu>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <RecursionField
                  name="create-server"
                  schema={{
                    name: 'create-server',
                    'x-component': CreateDatabaseServerAction,
                    type: 'void',
                    title: '{{ t("Create database server") }}',
                    'x-component-props': {
                      setOpen,
                      handleDataServerChange,
                    },
                  }}
                />
              </Space>
            </div>
          );
        }}
        fieldNames={{ value: 'name', label: 'description' }}
        options={options}
      />
    );
  },
  { displayName: 'DatabaseServerSelect' },
);

export const DatabaseServerSelectProvider = (props) => {
  const [options, setOptions] = useState([]);
  const api = useAPIClient();
  const initialOptions = useRef();

  const refresh = () => {
    api
      .resource('databaseServers')
      .list()
      .then(({ data }) => {
        initialOptions.current = data?.data;
        setOptions(data?.data);
      });
  };
  useEffect(() => {
    try {
      refresh();
    } catch (error) {
      console.log(error);
    }
  }, []);
  return (
    <DatabaseServerContext.Provider value={{ options, setOptions, refresh, initialOptions: initialOptions.current }}>
      <FormItem>{props.children}</FormItem>
    </DatabaseServerContext.Provider>
  );
};
