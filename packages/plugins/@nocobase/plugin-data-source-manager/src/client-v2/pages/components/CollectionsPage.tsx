/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DeleteOutlined,
  DownOutlined,
  FilterOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Badge, Button, Card, Dropdown, Form, Input, Modal, Select, Space, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../locale';
import { compileLegacyTemplate } from '../../utils/compileLegacyTemplate';
import FieldsPage from './FieldsPage';

interface CollectionsPageProps {
  dataSourceKey: string;
  title?: React.ReactNode;
}

type CollectionCategoryRecord = {
  id: number | string;
  name?: React.ReactNode;
  color?: string;
  sort?: number;
};

type CollectionTemplateName = 'general' | 'calendar' | 'tree' | 'file' | 'sql' | 'view' | 'expression';

type CollectionFormValues = {
  title: string;
  name: string;
  template: CollectionTemplateName;
  category?: Array<number | string>;
  description?: string;
};

const colorOptions = ['default', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'];
const colorLabels: Record<string, string> = {
  default: 'Default',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  cyan: 'Cyan',
  blue: 'Blue',
  purple: 'Purple',
};
const collectionTemplateOptions: Array<{ value: CollectionTemplateName; label: string }> = [
  { value: 'general', label: 'General collection' },
  { value: 'calendar', label: 'Calendar collection' },
  { value: 'tree', label: 'Tree collection' },
  { value: 'file', label: 'File collection' },
  { value: 'sql', label: 'SQL collection' },
  { value: 'view', label: 'Connect to database view' },
  { value: 'expression', label: 'Expression collection' },
];

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};

  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function normalizeArrayResponse(response: any) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
}

function getCollectionTemplateLabel(t: (key: string) => string, value?: string) {
  const template = value || 'general';

  if (template === 'general') {
    return t('General collection');
  }

  return template;
}

function renderCategoryTags(value: CollectionCategoryRecord[] | undefined, t: (key: string) => string) {
  if (!Array.isArray(value) || !value.length) {
    return '-';
  }

  return (
    <Space size={[4, 4]} wrap>
      {value.map((item) => (
        <Tag key={item.id} color={item.color === 'default' ? undefined : item.color}>
          {compileLegacyTemplate(item.name || item.id, t)}
        </Tag>
      ))}
    </Space>
  );
}

function getCollectionDefaultValues(template: CollectionTemplateName) {
  const values: Record<string, unknown> = {
    template,
    fields: [],
  };

  if (template === 'tree') {
    values.tree = 'adjacencyList';
    values.fields = [
      {
        interface: 'integer',
        name: 'parentId',
        type: 'bigInt',
        isForeignKey: true,
        uiSchema: {
          type: 'number',
          title: '{{t("Parent ID")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        interface: 'm2o',
        type: 'belongsTo',
        name: 'parent',
        foreignKey: 'parentId',
        treeParent: true,
        target: undefined,
        onDelete: 'CASCADE',
        uiSchema: {
          title: '{{t("Parent")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: false,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
        },
      },
      {
        interface: 'o2m',
        type: 'hasMany',
        name: 'children',
        foreignKey: 'parentId',
        treeChildren: true,
        target: undefined,
        onDelete: 'CASCADE',
        uiSchema: {
          title: '{{t("Children")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: true,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
        },
      },
    ];
  }

  if (template === 'calendar') {
    values.createdBy = true;
    values.updatedBy = true;
    values.createdAt = true;
    values.updatedAt = true;
    values.sortable = true;
  }

  if (template === 'file') {
    values.createdBy = true;
    values.updatedBy = true;
  }

  if (template === 'expression') {
    values.createdBy = true;
    values.updatedBy = true;
    values.createdAt = true;
    values.updatedAt = true;
  }

  return values;
}

export default function CollectionsPage(props: CollectionsPageProps) {
  const t = useT();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const [categoryForm] = Form.useForm();
  const [collectionForm] = Form.useForm<CollectionFormValues>();
  const [filterForm] = Form.useForm<{ keyword?: string }>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [activeCategoryKey, setActiveCategoryKey] = useState('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CollectionCategoryRecord>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionSubmitting, setCollectionSubmitting] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Record<string, any>>();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<{ keyword?: string }>({});
  const isMainDataSource = props.dataSourceKey === 'main';
  const categoryRequest = useRequest(
    async () => {
      if (!isMainDataSource) {
        return [] as CollectionCategoryRecord[];
      }
      const response = await ctx.api.request({
        url: 'collectionCategories:list',
        params: {
          paginate: false,
          sort: ['sort'],
        },
      });
      return normalizeArrayResponse(response) as CollectionCategoryRecord[];
    },
    {
      refreshDeps: [isMainDataSource],
    },
  );
  const request = useRequest(
    async () => {
      const filterItems: Array<Record<string, unknown>> = [
        {
          'hidden.$isFalsy': true,
        },
      ];

      if (isMainDataSource && activeCategoryKey !== 'all') {
        filterItems.push({
          'category.id': activeCategoryKey,
        });
      }

      if (filterValues.keyword) {
        filterItems.push({
          $or: [
            {
              title: {
                $includes: filterValues.keyword,
              },
            },
            {
              name: {
                $includes: filterValues.keyword,
              },
            },
          ],
        });
      }

      const filter = filterItems.length > 1 ? { $and: filterItems } : filterItems[0];
      const response = await ctx.api.request({
        url: `dataSources/${props.dataSourceKey}/collections:list`,
        params: {
          page,
          pageSize,
          sort: ['sort'],
          filter,
          appends: ['category'],
        },
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [activeCategoryKey, filterValues.keyword, isMainDataSource, props.dataSourceKey, page, pageSize],
    },
  );
  const categories = useMemo(() => categoryRequest.data || [], [categoryRequest.data]);

  useEffect(() => {
    if (!isMainDataSource) {
      setActiveCategoryKey('all');
      return;
    }

    if (activeCategoryKey !== 'all' && !categories.some((item) => String(item.id) === activeCategoryKey)) {
      setActiveCategoryKey('all');
    }
  }, [activeCategoryKey, categories, isMainDataSource]);

  const openFields = useCallback(
    (collection: Record<string, any>) => {
      ctx.viewer.drawer({
        width: '80%',
        closable: true,
        content: () => <FieldsPage dataSourceKey={props.dataSourceKey} collection={collection} />,
      });
    },
    [ctx.viewer, props.dataSourceKey],
  );

  const handleCategoryChange = useCallback((key: string) => {
    setActiveCategoryKey(key);
    setPage(1);
  }, []);

  const openCategoryModal = useCallback(() => {
    setEditingCategory(undefined);
    categoryForm.setFieldsValue({ color: 'default' });
    setCategoryModalOpen(true);
  }, [categoryForm]);

  const openEditCategoryModal = useCallback(
    (category: CollectionCategoryRecord) => {
      setEditingCategory(category);
      categoryForm.setFieldsValue({
        name: category.name,
        color: category.color || 'default',
      });
      setCategoryModalOpen(true);
    },
    [categoryForm],
  );

  const handleSubmitCategory = useCallback(async () => {
    const values = await categoryForm.validateFields();
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await ctx.api.resource('collectionCategories').update({
          filter: { id: editingCategory.id },
          values,
        });
      } else {
        await ctx.api.resource('collectionCategories').create({
          values,
        });
      }
      setCategoryModalOpen(false);
      setEditingCategory(undefined);
      categoryForm.resetFields();
      categoryRequest.refresh();
      request.refresh();
    } finally {
      setCategorySubmitting(false);
    }
  }, [categoryForm, categoryRequest, ctx.api, editingCategory, request]);

  const handleDeleteCategory = useCallback(
    (category: CollectionCategoryRecord) => {
      modal.confirm({
        title: t('Delete category'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await ctx.api.resource('collectionCategories').destroy({
            filter: { id: category.id },
          });
          if (String(category.id) === activeCategoryKey) {
            setActiveCategoryKey('all');
          }
          categoryRequest.refresh();
          request.refresh();
        },
      });
    },
    [activeCategoryKey, categoryRequest, ctx.api, modal, request, t],
  );

  const openCreateCollectionModal = useCallback(
    (template: CollectionTemplateName) => {
      setEditingCollection(undefined);
      collectionForm.setFieldsValue({
        template,
        name: randomId('t_'),
        category: activeCategoryKey === 'all' ? [] : [activeCategoryKey],
      });
      setCollectionModalOpen(true);
    },
    [activeCategoryKey, collectionForm],
  );

  const openEditCollectionModal = useCallback(
    (record: Record<string, any>) => {
      setEditingCollection(record);
      collectionForm.setFieldsValue({
        title: record.title,
        name: record.name,
        template: record.template || 'general',
        category: Array.isArray(record.category) ? record.category.map((item) => item.id) : [],
        description: record.description,
      });
      setCollectionModalOpen(true);
    },
    [collectionForm],
  );

  const handleSubmitCollection = useCallback(async () => {
    const values = await collectionForm.validateFields();
    setCollectionSubmitting(true);
    try {
      const normalizedValues = {
        ...getCollectionDefaultValues(values.template),
        ...values,
        logging: true,
      };

      if (values.template === 'tree' && Array.isArray(normalizedValues.fields)) {
        normalizedValues.fields = normalizedValues.fields.map((field: Record<string, unknown>) =>
          field.target === undefined ? { ...field, target: values.name } : field,
        );
      }

      if (editingCollection) {
        await ctx.api.resource('collections').update({
          filterByTk: editingCollection.name,
          values: normalizedValues,
        });
      } else {
        await ctx.api.resource('collections').create({
          values: normalizedValues,
        });
      }

      setCollectionModalOpen(false);
      setEditingCollection(undefined);
      collectionForm.resetFields();
      setSelectedRowKeys([]);
      request.refresh();
      ctx.dataSourceManager.getDataSource('main')?.reload();
    } finally {
      setCollectionSubmitting(false);
    }
  }, [collectionForm, ctx.api, ctx.dataSourceManager, editingCollection, request]);

  const handleDeleteCollections = useCallback(
    (filterByTk: React.Key | React.Key[]) => {
      const keys = Array.isArray(filterByTk) ? filterByTk : [filterByTk];
      if (!keys.length) {
        return;
      }
      modal.confirm({
        title: t('Delete collection'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await ctx.api.resource('collections').destroy({
            filterByTk: keys,
          });
          setSelectedRowKeys([]);
          request.refresh();
          ctx.dataSourceManager.getDataSource('main')?.reload();
        },
      });
    },
    [ctx.api, ctx.dataSourceManager, modal, request, t],
  );

  const handleSyncFromDatabase = useCallback(() => {
    modal.confirm({
      title: t('Sync field changes from database'),
      content: t('Field synchronization confirmation prompt'),
      async onOk() {
        await ctx.api.resource('mainDataSource').syncFields();
        request.refresh();
        ctx.dataSourceManager.getDataSource('main')?.reload();
      },
    });
  }, [ctx.api, ctx.dataSourceManager, modal, request, t]);

  const handleSubmitFilter = useCallback(async () => {
    const values = await filterForm.validateFields();
    setFilterValues(values);
    setPage(1);
    setFilterModalOpen(false);
  }, [filterForm]);

  const resetFilter = useCallback(() => {
    filterForm.resetFields();
    setFilterValues({});
    setPage(1);
    setFilterModalOpen(false);
  }, [filterForm]);

  const categoryTabs = useMemo(
    () => [
      {
        key: 'all',
        label: t('All collections'),
        closable: false,
      },
      ...categories.map((item) => ({
        key: String(item.id),
        label: (
          <Space size={6}>
            <Badge color={item.color === 'default' ? undefined : item.color} />
            {compileLegacyTemplate(item.name || item.id, t)}
            <Dropdown
              menu={{
                items: [
                  { key: 'edit', label: t('Edit category') },
                  { key: 'delete', label: t('Delete category') },
                ],
                onClick({ key, domEvent }) {
                  domEvent.stopPropagation();
                  if (key === 'edit') {
                    openEditCategoryModal(item);
                    return;
                  }
                  handleDeleteCategory(item);
                },
              }}
              trigger={['click']}
            >
              <Button
                aria-label={t('Edit category')}
                icon={<MenuOutlined />}
                size="small"
                type="text"
                onClick={(event) => event.stopPropagation()}
              />
            </Dropdown>
          </Space>
        ),
        closable: false,
      })),
    ],
    [categories, handleDeleteCategory, openEditCategoryModal, t],
  );

  const columns = useMemo<ColumnsType<Record<string, any>>>(() => {
    const nextColumns: ColumnsType<Record<string, any>> = [
      {
        title: t('Collection display name'),
        render: (record) => compileLegacyTemplate(record.title || record.name, t),
      },
      { title: t('Collection name'), dataIndex: 'name', ellipsis: true },
      {
        title: t('Collection template'),
        dataIndex: 'template',
        render: (value) => <Tag>{getCollectionTemplateLabel(t, value)}</Tag>,
      },
    ];

    if (isMainDataSource && activeCategoryKey === 'all') {
      nextColumns.push({
        title: t('Collection category'),
        dataIndex: 'category',
        render: (value) => renderCategoryTags(value, t),
      });
    }

    nextColumns.push(
      { title: t('Description'), dataIndex: 'description', ellipsis: true, render: (value) => value || '-' },
      {
        title: t('Actions'),
        width: 140,
        render: (_, record) => (
          <Space>
            <a onClick={() => openFields(record)}>{t('Fields')}</a>
          </Space>
        ),
      },
    );

    return nextColumns;
  }, [activeCategoryKey, isMainDataSource, openFields, t]);

  return (
    <Card title={compileLegacyTemplate(props.title, t)} variant="borderless">
      {isMainDataSource ? (
        <Tabs
          activeKey={activeCategoryKey}
          type="editable-card"
          items={categoryTabs}
          onChange={handleCategoryChange}
          onEdit={(_, action) => {
            if (action === 'add') {
              openCategoryModal();
            }
          }}
        />
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={() => request.refresh()}>
          {t('Refresh')}
        </Button>
      </div>
      <Table<Record<string, any>>
        rowKey="name"
        loading={request.loading}
        dataSource={request.data?.records || []}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total: request.data?.total,
          onChange(nextPage, nextPageSize) {
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
              setPage(1);
              return;
            }
            setPage(nextPage);
          },
        }}
      />
      <Modal
        title={editingCategory ? t('Edit category') : t('Add category')}
        open={categoryModalOpen}
        confirmLoading={categorySubmitting}
        okText={t('Submit')}
        cancelText={t('Cancel')}
        onOk={handleSubmitCategory}
        onCancel={() => {
          setCategoryModalOpen(false);
          setEditingCategory(undefined);
          categoryForm.resetFields();
        }}
      >
        <Form form={categoryForm} layout="vertical" initialValues={{ color: 'default' }}>
          <Form.Item name="name" label={t('Category name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="color" label={t('Color')}>
            <Select
              options={colorOptions.map((color) => ({
                value: color,
                label: <Tag color={color === 'default' ? undefined : color}>{t(colorLabels[color])}</Tag>,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
