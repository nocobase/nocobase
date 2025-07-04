/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { Button, Table, Checkbox, Input, message, Tooltip } from 'antd';
import { ReloadOutlined, QuestionCircleOutlined, ClearOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useAPIClient } from '@nocobase/client';

const CollectionsTable = observer((tableProps: any) => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [allCollections, setAllCollections] = useState([]);
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [selectAllForCurrentView, setSelectAllForCurrentView] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const MAX_SELECTION_LIMIT = 100;

  const { NAMESPACE, t } = tableProps;
  const defaultAddAllCollections =
    tableProps.formValues?.options?.addAllCollections === undefined
      ? true
      : tableProps.formValues?.options?.addAllCollections;
  const [addAllCollections, setaddAllCollections] = useState(defaultAddAllCollections);

  const displayCollections = useMemo(() => {
    const baseData = tableProps.value && tableProps.value.length > 0 ? tableProps.value : allCollections;
    let filteredData = baseData;

    if (searchText.trim()) {
      filteredData = filteredData.filter((item: any) => item.name?.toLowerCase().includes(searchText.toLowerCase()));
    }

    return filteredData;
  }, [tableProps.value, allCollections, searchText]);

  const allData = useMemo(() => {
    return tableProps.value && tableProps.value.length > 0 ? tableProps.value : allCollections;
  }, [tableProps.value, allCollections]);

  const enrichedDisplayCollections = useMemo(() => {
    const tablePrefix = tableProps.options?.tablePrefix;

    return displayCollections.map((item) => {
      let shouldBeSelected = false;

      if (item.required) {
        shouldBeSelected = true;
      } else if (selectAllForCurrentView) {
        shouldBeSelected = true;
      } else if (selectedMap.get(item.name)) {
        if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
          shouldBeSelected = true;
        }
      }

      return {
        ...item,
        selected: shouldBeSelected,
      };
    });
  }, [displayCollections, selectedMap, selectAllForCurrentView, tableProps.options?.tablePrefix]);

  const previousTablePrefix = useRef(tableProps.options?.tablePrefix);
  useEffect(() => {
    const currentTablePrefix = tableProps.options?.tablePrefix;

    if (previousTablePrefix.current !== currentTablePrefix && allCollections.length > 0) {
      previousTablePrefix.current = currentTablePrefix;

      const updatedData = allCollections.map((item) => {
        let shouldBeSelected = false;

        if (item.required) {
          shouldBeSelected = true;
        } else if (selectedMap.get(item.name)) {
          if (!currentTablePrefix || !currentTablePrefix.trim() || item.name?.startsWith(currentTablePrefix.trim())) {
            shouldBeSelected = true;
          }
        }

        return {
          ...item,
          selected: shouldBeSelected,
        };
      });

      tableProps.onChange?.(updatedData);
    }
  }, [tableProps.options?.tablePrefix, allCollections.length, selectedMap]);

  useEffect(() => {
    if (allData.length > 0) {
      const newSelectedMap = new Map();
      allData.forEach((item) => {
        if (item.selected) {
          newSelectedMap.set(item.name, true);
        }
      });
      setSelectedMap(newSelectedMap);
      setSelectAllForCurrentView(false);
    }
  }, [allData.length]);

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
      const params: any = {
        isFirst: from === 'create',
        dbOptions: { ...options, type: formValues.type || 'mysql' },
      };

      const response = await api.request({
        url: `dataSources/${key}/collections:all`,
        method: 'get',
        params,
      });
      const { data } = response?.data || {};
      const allCollectionsData = data || [];

      setAllCollections(allCollectionsData);

      const isFirstLoad = selectedMap.size === 0 && tableProps.value && tableProps.value.length > 0;
      let currentSelectedMap = selectedMap;

      if (isFirstLoad) {
        const newSelectedMap = new Map();
        tableProps.value.forEach((item: any) => {
          if (item.selected) {
            newSelectedMap.set(item.name, true);
          }
        });
        setSelectedMap(newSelectedMap);
        currentSelectedMap = newSelectedMap;
      }

      const tablePrefix = options.tablePrefix;
      const updatedData = allCollectionsData.map((item) => {
        let shouldBeSelected = false;

        if (item.required) {
          shouldBeSelected = true;
        } else if (currentSelectedMap.get(item.name)) {
          if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
            shouldBeSelected = true;
          }
        }

        return {
          ...item,
          selected: shouldBeSelected,
        };
      });

      if (onChange) {
        onChange(updatedData);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      message.error(t('Failed to load collections', { ns: NAMESPACE }));
    } finally {
      setLoading(false);
    }
  }, [
    tableProps.dataSourceKey,
    tableProps.formValues,
    tableProps.options,
    tableProps.from,
    tableProps.tablePrefix,
    api,
    t,
    NAMESPACE,
  ]);

  const debouncedSearch = useCallback((keywords: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchText(keywords);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const { isAllSelected, isIndeterminate, selectedCount, isAtLimit } = useMemo(() => {
    const tablePrefix = tableProps.options?.tablePrefix;

    const effectiveSelectedCount = allData.filter((item) => {
      if (item.required) return true;
      if (!selectedMap.get(item.name)) return false;

      if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
        return true;
      }
      return false;
    }).length;

    const atLimit = effectiveSelectedCount >= MAX_SELECTION_LIMIT;

    const selectableCollections = enrichedDisplayCollections.filter((item) => !item.required);
    const visibleSelectedCount = enrichedDisplayCollections.filter((item) => item.selected || item.required).length;
    const allSelected = selectableCollections.length > 0 && visibleSelectedCount === enrichedDisplayCollections.length;
    const indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < enrichedDisplayCollections.length;

    return {
      isAllSelected: allSelected,
      isIndeterminate: indeterminate,
      selectedCount: effectiveSelectedCount,
      isAtLimit: atLimit,
    };
  }, [enrichedDisplayCollections, allData, selectedMap, tableProps.options?.tablePrefix]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const tablePrefix = tableProps.options?.tablePrefix;

      if (checked) {
        const currentEffectiveSelectedCount = allData.filter((item) => {
          if (item.required) return true;
          if (!selectedMap.get(item.name)) return false;
          if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
            return true;
          }
          return false;
        }).length;

        const selectableInCurrentView = displayCollections.filter(
          (item) => !item.required && !selectedMap.get(item.name),
        ).length;

        if (currentEffectiveSelectedCount >= MAX_SELECTION_LIMIT) {
          return;
        }

        const remainingLimit = MAX_SELECTION_LIMIT - currentEffectiveSelectedCount;

        if (selectableInCurrentView > remainingLimit) {
          message.warning(
            t(
              'Maximum selection limit exceeded. To ensure system performance, you can select up to {{limit}} collections.',
              {
                ns: NAMESPACE,
                limit: MAX_SELECTION_LIMIT,
              },
            ),
          );
        }
      }

      setSelectAllForCurrentView(checked);

      const updateCollections = () => {
        const newSelectedMap = new Map(selectedMap);
        let selectedInThisOperation = 0;

        const currentEffectiveSelectedCount = allData.filter((item) => {
          if (item.required) return true;
          if (!selectedMap.get(item.name)) return false;
          if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
            return true;
          }
          return false;
        }).length;

        const remainingLimit = MAX_SELECTION_LIMIT - currentEffectiveSelectedCount;

        displayCollections.forEach((item) => {
          if (!item.required) {
            if (checked) {
              if (selectedInThisOperation < remainingLimit && !selectedMap.get(item.name)) {
                newSelectedMap.set(item.name, true);
                selectedInThisOperation++;
              }
            } else {
              newSelectedMap.delete(item.name);
            }
          }
        });

        setSelectedMap(newSelectedMap);

        const updatedAllData = allData.map((item) => {
          let shouldBeSelected = false;

          if (item.required) {
            shouldBeSelected = true;
          } else if (newSelectedMap.get(item.name)) {
            if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
              shouldBeSelected = true;
            }
          }

          return {
            ...item,
            selected: shouldBeSelected,
          };
        });

        tableProps.onChange?.(updatedAllData);

        setSelectAllForCurrentView(false);
      };

      if (typeof MessageChannel !== 'undefined') {
        const channel = new MessageChannel();
        channel.port2.onmessage = () => updateCollections();
        channel.port1.postMessage(null);
      } else {
        setTimeout(updateCollections, 0);
      }
    },
    [displayCollections, allData, selectedMap, tableProps.onChange, tableProps.options?.tablePrefix, t, NAMESPACE],
  );

  const handleSelectChange = useCallback(
    (index: number, checked: boolean) => {
      const currentItem = enrichedDisplayCollections[index];
      if (!currentItem || currentItem.selected === checked) return;

      if (checked) {
        const tablePrefix = tableProps.options?.tablePrefix;

        const currentEffectiveSelectedCount = allData.filter((item) => {
          if (item.required) return true;
          if (!selectedMap.get(item.name)) return false;
          if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
            return true;
          }
          return false;
        }).length;

        if (currentEffectiveSelectedCount >= MAX_SELECTION_LIMIT) {
          return;
        }

        if (currentEffectiveSelectedCount + 1 === MAX_SELECTION_LIMIT) {
          message.warning(
            t(
              'Maximum selection limit reached. To ensure system performance, you can select up to {{limit}} collections at once.',
              {
                ns: NAMESPACE,
                limit: MAX_SELECTION_LIMIT,
              },
            ),
          );
        }
      }

      const newSelectedMap = new Map(selectedMap);
      if (checked) {
        newSelectedMap.set(currentItem.name, true);
      } else {
        newSelectedMap.delete(currentItem.name);
        setSelectAllForCurrentView(false);
      }

      setSelectedMap(newSelectedMap);

      const updateCollections = () => {
        const tablePrefix = tableProps.options?.tablePrefix;

        const updatedAllData = allData.map((item) => {
          let shouldBeSelected = false;

          if (item.required) {
            shouldBeSelected = true;
          } else if (newSelectedMap.get(item.name)) {
            if (!tablePrefix || !tablePrefix.trim() || item.name?.startsWith(tablePrefix.trim())) {
              shouldBeSelected = true;
            }
          }

          return {
            ...item,
            selected: shouldBeSelected,
          };
        });

        tableProps.onChange?.(updatedAllData);
      };

      setTimeout(updateCollections, 0);
    },
    [
      enrichedDisplayCollections,
      allData,
      selectedMap,
      tableProps.onChange,
      tableProps.options?.tablePrefix,
      t,
      NAMESPACE,
    ],
  );

  const handleSearch = useCallback(
    (value: string) => {
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedMap(new Map());
    setSelectAllForCurrentView(false);

    const updatedAllData = allData.map((item) => ({
      ...item,
      selected: item.required || false,
    }));

    tableProps.onChange?.(updatedAllData);
  }, [allData, tableProps.onChange]);

  const columns = useMemo(() => {
    const CheckboxCell = React.memo(({ selected, required, index, onChange, name, disabled }: any) => (
      <Checkbox
        checked={required || selected}
        disabled={required || disabled}
        onChange={(e) => onChange(index, e.target.checked)}
      />
    ));

    const NameCell = React.memo(({ text }: any) => <span style={{ paddingLeft: '40px' }}>{text}</span>);

    const baseColumns: any = [
      {
        title: <div style={{ textAlign: 'center' }}>{t('Display name', { ns: NAMESPACE })}</div>,
        dataIndex: 'name',
        key: 'name',
        align: 'left' as const,
        width: '50%',
        render: (text: string) => <NameCell text={text} />,
      },
    ];

    if (!addAllCollections) {
      const isNearLimit = selectedCount >= MAX_SELECTION_LIMIT * 0.9;
      const titleStyle = isNearLimit ? { color: '#ff7a00' } : {};

      const currentSelectedCount = allData.filter((item) => selectedMap.get(item.name) || item.required).length;
      const unselectedInCurrentView = enrichedDisplayCollections.filter(
        (item) => !item.selected && !item.required,
      ).length;
      const canSelectAll = currentSelectedCount + unselectedInCurrentView <= MAX_SELECTION_LIMIT;

      baseColumns.push({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              disabled={isAtLimit && !isAllSelected && !canSelectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span style={titleStyle}>
              {t('Add', { ns: NAMESPACE })} ({selectedCount}/{allData.length})
            </span>
            {selectedCount > 0 && (
              <Tooltip title={t('Reset selection', { ns: NAMESPACE })}>
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleReset}
                  style={{
                    padding: '0 4px',
                    height: '16px',
                    minWidth: '16px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                />
              </Tooltip>
            )}
          </div>
        ),
        dataIndex: 'selected',
        key: 'selected',
        align: 'center' as const,
        width: '30%',
        render: (selected: boolean, record: any, index: number) => {
          const shouldDisable = isAtLimit && !selected && !record.required;

          return (
            <CheckboxCell
              selected={selected}
              required={record.required}
              index={index}
              name={record.name}
              disabled={shouldDisable}
              onChange={handleSelectChange}
            />
          );
        },
      });
    }

    return baseColumns;
  }, [
    t,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectChange,
    addAllCollections,
    NAMESPACE,
    selectedCount,
    allData.length,
    isAtLimit,
    selectedMap,
    enrichedDisplayCollections,
    handleReset,
  ]);

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
        </div>
        <Input.Search
          placeholder={t('Search collection name', { ns: NAMESPACE })}
          allowClear
          style={{ width: 250 }}
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
        />
        <Button icon={<ReloadOutlined />} onClick={() => handleLoadCollections()} loading={loading}>
          {t('Load Collections', { ns: NAMESPACE })}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={enrichedDisplayCollections}
        loading={loading}
        pagination={false}
        scroll={{
          x: addAllCollections ? 300 : 550,
          y: 400,
        }}
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
        dependencies: ['..options.tablePrefix'],
        fulfill: {
          run: `
          $self.forceUpdate && $self.forceUpdate();
        `,
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
