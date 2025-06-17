/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useState, useMemo } from 'react';
import { Button, Table, Checkbox, Input, message, Tooltip } from 'antd';
import { ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useAPIClient } from '@nocobase/client';

const CollectionsTable = observer((tableProps: any) => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { NAMESPACE, t } = tableProps;
  const defaultAddAllCollections =
    tableProps.formValues?.options?.addAllCollections === undefined
      ? true
      : tableProps.formValues?.options?.addAllCollections;
  const [addAllCollections, setaddAllCollections] = useState(defaultAddAllCollections);
  const collections = tableProps.value || [];

  const handleAddAllCollectionsChange = useCallback(
    (checked: boolean) => {
      setaddAllCollections(checked);
      if (tableProps.formSetValues) {
        tableProps.formSetValues('options.addAllCollections', checked);
      }
    },
    [tableProps.formSetValues],
  );

  const handleLoadCollections = useCallback(async () => {
    const { dataSourceKey: key, formValues, onChange, from } = tableProps;
    const options = formValues?.options || {};
    const requiredText = t('is required');
    if (formValues.type !== 'oracle') {
      if (!key) {
        message.error(t('Data source name', { ns: NAMESPACE }) + requiredText);
        return;
      }

      if (!options.host) {
        message.error(t('Host', { ns: NAMESPACE }) + requiredText);
        return;
      }

      if (!options.port) {
        message.error(t('Port', { ns: NAMESPACE }) + requiredText);
        return;
      }

      if (!options.database) {
        message.error(t('Database', { ns: NAMESPACE }) + requiredText);
        return;
      }

      if (!options.username) {
        message.error(t('Username', { ns: NAMESPACE }) + requiredText);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.request({
        url: `dataSources/${key}/collections:all`,
        method: 'get',
        params: {
          isFirst: from === 'create',
          dbOptions: { ...options, type: formValues.type || 'mysql' },
        },
      });
      const { data } = response?.data || [];

      if (onChange) {
        onChange(data);
      }

      if (tableProps.field && tableProps.field.form) {
        tableProps.field.form.setValuesIn('collections', data);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      message.error(t('Failed to load collections', { ns: NAMESPACE }));
    } finally {
      setLoading(false);
    }
  }, [tableProps.dataSourceKey, tableProps.formValues, tableProps.options, tableProps.from, api, t, NAMESPACE]);

  const filteredCollections = useMemo(() => {
    if (!searchText) return collections;
    return collections.filter((item) => item.name?.toLowerCase().includes(searchText.toLowerCase()));
  }, [collections, searchText]);

  const { isAllSelected, isIndeterminate } = useMemo(() => {
    const selectableFiltered = filteredCollections.filter((item) => !item.required);
    const selectedFiltered = filteredCollections.filter((item) => item.selected || item.required).length;
    const allSelected = selectableFiltered.length > 0 && selectedFiltered === filteredCollections.length;
    const indeterminate = selectedFiltered > 0 && selectedFiltered < filteredCollections.length;

    return {
      selectableFilteredCollections: selectableFiltered,
      selectedFilteredCount: selectedFiltered,
      isAllSelected: allSelected,
      isIndeterminate: indeterminate,
    };
  }, [filteredCollections]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const updateCollections = () => {
        const filteredNames = new Set(filteredCollections.filter((item) => !item.required).map((item) => item.name));
        const updatedCollections = collections.map((item) => {
          if (filteredNames.has(item.name)) {
            return { ...item, selected: checked };
          }
          return item;
        });
        tableProps.onChange?.(updatedCollections);
      };

      if (window.requestIdleCallback) {
        window.requestIdleCallback(updateCollections);
      } else {
        setTimeout(updateCollections, 0);
      }
    },
    [collections, filteredCollections, tableProps.onChange],
  );

  const handleSelectChange = useCallback(
    (index: number, checked: boolean) => {
      const targetItem = filteredCollections[index];
      const realIndex = collections.findIndex((item) => item.name === targetItem.name);

      const updatedCollections = [...collections];
      updatedCollections[realIndex] = { ...updatedCollections[realIndex], selected: checked };
      tableProps.onChange?.(updatedCollections);
    },
    [collections, filteredCollections, tableProps.onChange],
  );

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const columns = useMemo(() => {
    const baseColumns: any = [
      {
        title: <div style={{ textAlign: 'center' }}>{t('Display name', { ns: NAMESPACE })}</div>,
        dataIndex: 'name',
        key: 'name',
        align: 'left' as const,
        render: (text: string) => <span style={{ paddingLeft: '40px' }}>{text}</span>,
      },
    ];

    if (!addAllCollections) {
      baseColumns.push({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            {t('Add', { ns: NAMESPACE })}
          </div>
        ),
        dataIndex: 'selected',
        key: 'selected',
        align: 'center' as const,
        width: 150,
        render: (selected: boolean, record: any, index: number) => (
          <Checkbox
            checked={record.required || selected}
            disabled={record.required}
            onChange={(e) => handleSelectChange(index, e.target.checked)}
          />
        ),
      });
    }

    return baseColumns;
  }, [t, isAllSelected, isIndeterminate, handleSelectAll, handleSelectChange, addAllCollections, NAMESPACE]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '8px 0',
        }}
      >
        <div>
          <Checkbox checked={addAllCollections} onChange={(e) => handleAddAllCollectionsChange(e.target.checked)}>
            {t('Add all collections', { ns: NAMESPACE })}
          </Checkbox>
          <Tooltip
            title={t('When there are too many data tables, it may cause system loading lag.', { ns: NAMESPACE })}
            placement="right"
          >
            <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </div>
        <Input.Search
          placeholder={t('Search collection name', { ns: NAMESPACE })}
          allowClear
          style={{ width: 250 }}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
        />
        <Button icon={<ReloadOutlined />} onClick={handleLoadCollections} loading={loading}>
          {t('Load Collections', { ns: NAMESPACE })}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredCollections}
        loading={loading}
        pagination={false}
        scroll={{ x: addAllCollections ? 300 : 550, y: 400 }}
        virtual
        bordered
        rowKey="name"
        size="small"
      />
    </div>
  );
});

export const CollectionsTableField = (props: { NAMESPACE: string; t: (key: string, options?: any) => string }) => {
  const { NAMESPACE, t } = props;
  const Text = observer((props: any) => {
    return <span>{props.value}</span>;
  });

  const addAllCollectionsSchema = {
    type: 'boolean',
    'x-component': 'Checkbox',
    'x-display': 'hidden',
    default: true,
  };
  const createCollectionsSchema = (from: string, loadCollections: any) => ({
    type: 'array',
    title: `{{t("Collections",{ ns: "${NAMESPACE}" })}}`,
    'x-decorator': 'FormItem',
    'x-component': 'CollectionsTable',
    'x-component-props': {
      from,
      loadCollections,
      formValues: '{{$form.values}}',
      options: '{{$form.values.options}}',
      formSetValues: '{{$form.setValuesIn}}',
    },
    'x-reactions': [
      {
        dependencies: ['..key', '..options', '..addAllCollections'],
        fulfill: {
          schema: {
            'x-component-props.dataSourceKey': '{{$deps[0]}}',
            'x-component-props.options': '{{$deps[1]}}',
            'x-component-props.addAllCollectionsValue': '{{$deps[2]}}',
          },
        },
      },
      {
        dependencies: ['..key'],
        fulfill: {
          run: `
          if ($deps[0] && from === 'edit' && loadCollections) {
            (async () => {
              const {data} = await loadCollections($deps[0]);
              $self.value = data || [];
              $form.setValuesIn('collections', data || []);
            })();
          }
        `,
        },
      },
    ],
  });

  return {
    CollectionsTable: (props: any) => <CollectionsTable {...props} NAMESPACE={NAMESPACE} t={t} />,
    createCollectionsSchema,
    Text,
    addAllCollectionsSchema,
  };
};
