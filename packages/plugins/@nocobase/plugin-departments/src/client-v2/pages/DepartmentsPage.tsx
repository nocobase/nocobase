/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { CollectionFilter, DrawerFormLayout, type CompiledFilter } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Table,
  Tree,
  TreeSelect,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import React, { useCallback, useMemo, useState } from 'react';

import {
  createDepartment,
  destroyDepartment,
  type DepartmentFormValues,
  type DepartmentResource,
  updateDepartment,
} from '../api';
import { useT } from '../locale';
import type { DepartmentPrimaryKey, DepartmentRecord, RoleRecord, UserRecord } from '../../shared/department';
import { getDepartmentTitle } from '../../shared/department';

const FORM_DRAWER_WIDTH = '50%';
const TABLE_DRAWER_WIDTH = '70%';
const DEPARTMENT_PICKER_DRAWER_WIDTH = '40%';

type MembersFilter = CompiledFilter;

interface ApiResource {
  list(params?: Record<string, unknown>): Promise<unknown>;
  get(params?: Record<string, unknown>): Promise<unknown>;
  create(params: Record<string, unknown>): Promise<unknown>;
  update(params: Record<string, unknown>): Promise<unknown>;
  destroy(params: Record<string, unknown>): Promise<unknown>;
  add(params: Record<string, unknown>): Promise<unknown>;
  remove(params: Record<string, unknown>): Promise<unknown>;
  aggregateSearch(params: Record<string, unknown>): Promise<unknown>;
  listExcludeDept(params: Record<string, unknown>): Promise<unknown>;
  setOwner(params: Record<string, unknown>): Promise<unknown>;
  removeOwner(params: Record<string, unknown>): Promise<unknown>;
}

interface ApiResourceFactory {
  resource(name: string, resourceOf?: DepartmentPrimaryKey): unknown;
}

function getResource(api: ApiResourceFactory, name: string, resourceOf?: DepartmentPrimaryKey): ApiResource {
  return api.resource(name, resourceOf) as ApiResource;
}

function getDepartmentResource(api: ApiResourceFactory): DepartmentResource {
  return api.resource('departments') as DepartmentResource;
}

function getResponseData(response: unknown): unknown {
  return (response as { data?: unknown })?.data;
}

function extractList<T>(response: unknown): T[] {
  const data = getResponseData(response);
  const list = (data as { data?: unknown; rows?: unknown })?.data ?? (data as { rows?: unknown })?.rows ?? data;
  return Array.isArray(list) ? (list as T[]) : [];
}

function extractMeta(response: unknown): Record<string, unknown> {
  const data = getResponseData(response);
  const meta = (data as { meta?: unknown })?.meta;
  return meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {};
}

function userLabel(user: Pick<UserRecord, 'nickname' | 'username' | 'email'>) {
  return user.nickname || user.username || user.email || '';
}

function buildMembersFilter(department: DepartmentRecord | null, filter?: MembersFilter) {
  const filters: Record<string, unknown>[] = [];
  if (department) {
    filters.push({ 'departments.id': department.id });
  }

  if (filter) {
    filters.push(filter as Record<string, unknown>);
  }

  if (filters.length === 0) {
    return undefined;
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
}

function buildDepartmentTree(records: DepartmentRecord[]): DepartmentRecord[] {
  const nodes = new Map<DepartmentPrimaryKey, DepartmentRecord>();
  const roots: DepartmentRecord[] = [];

  records.forEach((record) => {
    nodes.set(record.id, { ...record, children: [] });
  });

  nodes.forEach((node) => {
    if (node.parentId != null && nodes.has(node.parentId)) {
      nodes.get(node.parentId)?.children?.push(node);
      return;
    }
    roots.push(node);
  });

  return roots;
}

function toTreeNodes(
  records: DepartmentRecord[],
  renderTitle: (department: DepartmentRecord) => React.ReactNode,
  excludedKeys = new Set<DepartmentPrimaryKey>(),
): DataNode[] {
  return records
    .filter((department) => !excludedKeys.has(department.id))
    .map((department) => ({
      key: department.id,
      value: department.id,
      title: renderTitle(department),
      children: department.children?.length ? toTreeNodes(department.children, renderTitle, excludedKeys) : undefined,
    }));
}

function findDepartment(records: DepartmentRecord[], id?: React.Key): DepartmentRecord | null {
  if (id == null) {
    return null;
  }

  for (const record of records) {
    if (record.id === id) {
      return record;
    }
    const child = findDepartment(record.children || [], id);
    if (child) {
      return child;
    }
  }

  return null;
}

function makeRoleInitialValue(record?: DepartmentRecord) {
  return (record?.roles || []).map((role) => role.name);
}

function makeOwnerInitialValue(record?: DepartmentRecord) {
  return (record?.owners || []).map((owner) => owner.id);
}

function collectDepartmentKeys(record?: DepartmentRecord, keys = new Set<DepartmentPrimaryKey>()) {
  if (!record) {
    return keys;
  }

  keys.add(record.id);
  (record.children || []).forEach((child) => collectDepartmentKeys(child, keys));
  return keys;
}

function AsyncSelect<T>(props: {
  mode?: 'multiple';
  request: () => Promise<T[]>;
  mapOptions: (record: T) => { label: React.ReactNode; value: React.Key };
}) {
  const request = useRequest(props.request);

  return (
    <Select
      allowClear
      mode={props.mode}
      loading={request.loading}
      options={(request.data || []).map(props.mapOptions)}
    />
  );
}

function DepartmentForm(props: {
  mode: 'create' | 'edit';
  record?: DepartmentRecord;
  departments: DepartmentRecord[];
  onSubmitted: () => void;
}) {
  const t = useT();
  const ctx = useFlowContext();
  const [form] = Form.useForm<DepartmentFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => getDepartmentResource(ctx.api), [ctx.api]);
  const departmentTree = useMemo(() => buildDepartmentTree(props.departments), [props.departments]);

  const departmentOptions = useMemo(
    () => toTreeNodes(departmentTree, (department) => department.title || '', collectDepartmentKeys(props.record)),
    [departmentTree, props.record],
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await createDepartment(resource, values);
        props.onSubmitted();
        return;
      }

      if (props.record) {
        await updateDepartment(resource, props.record, values);
        props.onSubmitted();
        return;
      }

      throw new Error('Edit mode requires a department record');
    } finally {
      setSubmitting(false);
    }
  }, [form, props, resource]);

  return (
    <DrawerFormLayout
      title={props.mode === 'create' ? t('New department') : t('Edit department')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form<DepartmentFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          title: props.record?.title,
          parentId: props.record?.parentId ?? null,
          roleNames: makeRoleInitialValue(props.record),
          ownerIds: makeOwnerInitialValue(props.record),
        }}
      >
        <Form.Item name="title" label={t('Department name')} rules={[{ required: true, message: t('Required') }]}>
          <Input />
        </Form.Item>
        <Form.Item name="parentId" label={t('Superior department')}>
          <TreeSelect allowClear treeDefaultExpandAll treeData={departmentOptions} />
        </Form.Item>
        <Form.Item name="roleNames" label={t('Roles')}>
          <AsyncSelect<RoleRecord>
            mode="multiple"
            request={async () => {
              const response = await getResource(ctx.api, 'roles').list({ paginate: false });
              return extractList<RoleRecord>(response);
            }}
            mapOptions={(role) => ({ label: role.title || role.name, value: role.name })}
          />
        </Form.Item>
        {props.mode === 'edit' ? (
          <Form.Item name="ownerIds" label={t('Owners')}>
            <AsyncSelect<UserRecord>
              mode="multiple"
              request={async () => {
                const response = await getResource(ctx.api, `departments/${props.record?.id}/members`).list({
                  disableDefaultAppends: true,
                  paginate: false,
                });
                return extractList<UserRecord>(response);
              }}
              mapOptions={(user) => ({ label: userLabel(user), value: user.id })}
            />
          </Form.Item>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

function AddMembersForm(props: { department: DepartmentRecord; onSubmitted: () => void }) {
  const t = useT();
  const ctx = useFlowContext();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const usersRequest = useRequest(async () => {
    const response = await getResource(ctx.api, 'users').listExcludeDept({
      departmentId: props.department.id,
      pageSize: 50,
    });
    return extractList<UserRecord>(response);
  });

  const handleSubmit = useCallback(async () => {
    if (!selectedKeys.length) {
      return;
    }

    setSubmitting(true);
    try {
      await getResource(ctx.api, 'departments.members', props.department.id).add({
        values: selectedKeys,
      });
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }, [ctx.api, props, selectedKeys]);

  const columns = useMemo<ColumnsType<UserRecord>>(
    () => [
      { title: t('Nickname'), render: (_, record) => userLabel(record) },
      { title: t('Username'), dataIndex: 'username' },
      { title: t('Phone'), dataIndex: 'phone' },
      { title: t('Email'), dataIndex: 'email' },
    ],
    [t],
  );

  return (
    <DrawerFormLayout
      title={t('Add members')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Table<UserRecord>
        rowKey="id"
        loading={usersRequest.loading}
        dataSource={usersRequest.data || []}
        columns={columns}
        pagination={false}
        rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
      />
    </DrawerFormLayout>
  );
}

function DepartmentPickerForm(props: {
  departments: DepartmentRecord[];
  disabledIds: Set<DepartmentPrimaryKey>;
  onSubmitted: (departments: DepartmentRecord[]) => Promise<void> | void;
}) {
  const t = useT();
  const { token } = theme.useToken();
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentRecord[]>([]);
  const [filterInput, setFilterInput] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredDepartments = useMemo(() => {
    const value = filterKeyword.trim().toLowerCase();
    if (!value) {
      return buildDepartmentTree(props.departments);
    }

    return props.departments
      .filter((department) => getDepartmentTitle(department).toLowerCase().includes(value))
      .map((department) => ({
        ...department,
        title: getDepartmentTitle(department),
      }));
  }, [filterKeyword, props.departments]);

  const columns = useMemo<ColumnsType<DepartmentRecord>>(
    () => [
      {
        title: t('Department name'),
        render: (_, record) => getDepartmentTitle(record) || record.title,
      },
    ],
    [t],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await props.onSubmitted(selectedDepartments);
    } finally {
      setSubmitting(false);
    }
  }, [props, selectedDepartments]);

  return (
    <DrawerFormLayout
      title={t('Select Departments')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          value={filterInput}
          placeholder={t('Filter')}
          onChange={(event) => {
            const value = event.target.value;
            setFilterInput(value);
            if (!value) {
              setFilterKeyword('');
            }
          }}
          onSearch={(value) => setFilterKeyword(value.trim())}
        />
        <Table<DepartmentRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredDepartments}
          expandable={filterKeyword ? undefined : { defaultExpandAllRows: false }}
          pagination={filterKeyword ? false : { pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys, records) => {
              setSelectedKeys(keys);
              setSelectedDepartments(records);
            },
            getCheckboxProps: (record) => ({
              disabled: props.disabledIds.has(record.id),
            }),
          }}
          style={{ marginTop: token.marginSM }}
        />
      </Space>
    </DrawerFormLayout>
  );
}

function UserDepartmentsForm(props: { user: UserRecord; departments: DepartmentRecord[]; onSubmitted: () => void }) {
  const t = useT();
  const ctx = useFlowContext();
  const { modal, message } = App.useApp();
  const [mainDepartmentId, setMainDepartmentId] = useState(props.user.mainDepartmentId);

  const userDepartmentsRequest = useRequest(
    async () => {
      const response = await getResource(ctx.api, 'users.departments', props.user.id).list({
        appends: ['parent(recursively=true)'],
        paginate: false,
      });
      return extractList<DepartmentRecord>(response).map((department) => ({
        ...department,
        title: getDepartmentTitle(department),
      }));
    },
    { refreshDeps: [props.user.id] },
  );

  const currentDepartments = useMemo(() => userDepartmentsRequest.data || [], [userDepartmentsRequest.data]);

  const currentDepartmentIds = useMemo(() => {
    return new Set(currentDepartments.map((department) => department.id));
  }, [currentDepartments]);

  const addDepartments = useCallback(
    async (departments: DepartmentRecord[]) => {
      const ids = departments.map((department) => department.id).filter((id) => !currentDepartmentIds.has(id));
      if (!ids.length) {
        return;
      }

      await getResource(ctx.api, 'users.departments', props.user.id).add({ values: ids });
      if (currentDepartments.length === 0) {
        setMainDepartmentId(ids[0]);
      }
      userDepartmentsRequest.refresh();
      props.onSubmitted();
    },
    [ctx.api, currentDepartmentIds, currentDepartments.length, props, userDepartmentsRequest],
  );

  const openDepartmentPicker = useCallback(() => {
    ctx.viewer.drawer({
      closable: true,
      width: DEPARTMENT_PICKER_DRAWER_WIDTH,
      content: () => (
        <DepartmentPickerForm
          departments={props.departments}
          disabledIds={currentDepartmentIds}
          onSubmitted={addDepartments}
        />
      ),
    });
  }, [addDepartments, ctx.viewer, currentDepartmentIds, props.departments]);

  const handleSubmit = useCallback(async () => {
    if (!currentDepartments.length) {
      return;
    }
  }, [currentDepartments.length]);

  const removeDepartment = useCallback(
    (department: DepartmentRecord) => {
      modal.confirm({
        title: t('Remove department'),
        content: t('Are you sure you want to remove it?'),
        async onOk() {
          await getResource(ctx.api, 'users.departments', props.user.id).remove({
            values: [department.id],
          });
          if (mainDepartmentId === department.id) {
            const nextMainDepartment = currentDepartments.find((item) => item.id !== department.id);
            setMainDepartmentId(nextMainDepartment?.id ?? null);
          }
          message.success(t('Deleted successfully'));
          userDepartmentsRequest.refresh();
          props.onSubmitted();
        },
      });
    },
    [ctx.api, currentDepartments, mainDepartmentId, message, modal, props, t, userDepartmentsRequest],
  );

  const setMainDepartment = useCallback(
    async (department: DepartmentRecord) => {
      await getResource(ctx.api, 'users').update({
        filterByTk: props.user.id,
        values: { mainDepartmentId: department.id },
      });
      setMainDepartmentId(department.id);
      message.success(t('Set successfully'));
      props.onSubmitted();
      userDepartmentsRequest.refresh();
    },
    [ctx.api, message, props, t, userDepartmentsRequest],
  );

  return (
    <DrawerFormLayout
      title={t('Departments')}
      onSubmit={handleSubmit}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Space direction="vertical">
        <Space wrap>
          {currentDepartments.map((department) => (
            <Tag key={department.id}>
              <Space>
                <span>{department.title}</span>
                {department.id === mainDepartmentId ? <Tag color="processing">{t('Main')}</Tag> : null}
                <Dropdown
                  menu={{
                    items: [
                      ...(department.id === mainDepartmentId
                        ? []
                        : [{ key: 'setMain', label: t('Set as main department') }]),
                      { key: 'remove', label: t('Remove') },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'setMain') {
                        setMainDepartment(department);
                      } else if (key === 'remove') {
                        removeDepartment(department);
                      }
                    },
                  }}
                >
                  <Button type="text" size="small" title={t('Actions')} icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </Tag>
          ))}
        </Space>
        <Button
          icon={<PlusOutlined />}
          title={t('Add departments')}
          aria-label={t('Add departments')}
          onClick={openDepartmentPicker}
        />
      </Space>
    </DrawerFormLayout>
  );
}

const DepartmentsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { modal, message } = App.useApp();
  const { token } = theme.useToken();
  const usersCollection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('users');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentRecord | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedMemberKeys, setSelectedMemberKeys] = useState<React.Key[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [memberFilter, setMemberFilter] = useState<MembersFilter>();

  const departmentsRequest = useRequest(async () => {
    const response = await getResource(ctx.api, 'departments').list({
      paginate: false,
      sort: ['sort'],
      appends: ['parent(recursively=true)', 'roles', 'owners'],
    });
    return extractList<DepartmentRecord>(response);
  });

  const departments = useMemo(() => departmentsRequest.data || [], [departmentsRequest.data]);
  const departmentTree = useMemo(() => buildDepartmentTree(departments), [departments]);

  const membersRequest = useRequest(
    async () => {
      if (selectedUser) {
        return { data: [selectedUser], meta: {} };
      }

      const response = await getResource(ctx.api, 'users').list({
        appends: ['departments', 'departments.parent(recursively=true)'],
        filter: buildMembersFilter(selectedDepartment, memberFilter),
        pageSize: 20,
      });
      return {
        data: extractList<UserRecord>(response),
        meta: extractMeta(response),
      };
    },
    {
      refreshDeps: [memberFilter, selectedDepartment?.id, selectedUser?.id],
      onSuccess: () => setSelectedMemberKeys([]),
    },
  );

  const searchRequest = useRequest(
    async (keyword: string) => {
      const response = await getResource(ctx.api, 'departments').aggregateSearch({
        values: { keyword, limit: 10 },
      });
      return (
        (getResponseData(response) as { data?: { users?: UserRecord[]; departments?: DepartmentRecord[] } })?.data || {
          users: [],
          departments: [],
        }
      );
    },
    { manual: true },
  );

  const refreshAll = useCallback(() => {
    departmentsRequest.refresh();
    membersRequest.refresh();
  }, [departmentsRequest, membersRequest]);

  const openDepartmentForm = useCallback(
    (mode: 'create' | 'edit', record?: DepartmentRecord) => {
      ctx.viewer.drawer({
        closable: true,
        width: FORM_DRAWER_WIDTH,
        content: () => (
          <DepartmentForm mode={mode} record={record} departments={departments} onSubmitted={() => refreshAll()} />
        ),
      });
    },
    [ctx.viewer, departments, refreshAll],
  );

  const openAddMembersForm = useCallback(() => {
    if (!selectedDepartment) {
      return;
    }

    ctx.viewer.drawer({
      closable: true,
      width: TABLE_DRAWER_WIDTH,
      content: () => <AddMembersForm department={selectedDepartment} onSubmitted={() => membersRequest.refresh()} />,
    });
  }, [ctx.viewer, membersRequest, selectedDepartment]);

  const openUserDepartmentsForm = useCallback(
    (user: UserRecord) => {
      ctx.viewer.drawer({
        closable: true,
        width: FORM_DRAWER_WIDTH,
        content: () => (
          <UserDepartmentsForm user={user} departments={departments} onSubmitted={() => membersRequest.refresh()} />
        ),
      });
    },
    [ctx.viewer, departments, membersRequest],
  );

  const deleteDepartment = useCallback(
    (department: DepartmentRecord) => {
      modal.confirm({
        title: t('Delete department'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await destroyDepartment(getDepartmentResource(ctx.api), department);
          message.success(t('Deleted successfully'));
          setSelectedDepartment((current) => (current?.id === department.id ? null : current));
          refreshAll();
        },
      });
    },
    [ctx.api, message, modal, refreshAll, t],
  );

  const removeMembers = useCallback(
    (keys: React.Key[]) => {
      if (!selectedDepartment || !keys.length) {
        return;
      }

      modal.confirm({
        title: t('Remove members'),
        content: t('Are you sure you want to remove these members?'),
        async onOk() {
          await getResource(ctx.api, 'departments.members', selectedDepartment.id).remove({ values: keys });
          setSelectedMemberKeys([]);
          membersRequest.refresh();
        },
      });
    },
    [ctx.api, membersRequest, modal, selectedDepartment, t],
  );

  const memberColumns = useMemo<ColumnsType<UserRecord>>(
    () => [
      { title: t('Nickname'), render: (_, record) => userLabel(record) },
      { title: t('Username'), dataIndex: 'username' },
      {
        title: t('Departments'),
        render: (record) => (
          <Space wrap>
            {(record.departments || []).map((department) => (
              <a
                key={department.id}
                onClick={() => {
                  setSelectedDepartment(department);
                  setSelectedUser(null);
                }}
              >
                {getDepartmentTitle(department)}
              </a>
            ))}
          </Space>
        ),
      },
      ...(selectedDepartment
        ? [
            {
              title: t('Owner'),
              render: (record: UserRecord) =>
                record.departments?.some(
                  (department) => department.id === selectedDepartment.id && department.departmentsUsers?.isOwner,
                ) ? (
                  <Tag color="processing">{t('Owner')}</Tag>
                ) : null,
            },
          ]
        : []),
      { title: t('Phone'), dataIndex: 'phone' },
      { title: t('Email'), dataIndex: 'email' },
      {
        title: t('Actions'),
        render: (record) => (
          <Space>
            <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openUserDepartmentsForm(record)}>
              {t('Configure')}
            </Button>
            {selectedDepartment ? (
              <Button type="link" size="small" icon={<DeleteOutlined />} onClick={() => removeMembers([record.id])}>
                {t('Remove')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [openUserDepartmentsForm, removeMembers, selectedDepartment, t],
  );

  const renderDepartmentTitle = useCallback(
    (department: DepartmentRecord) => (
      <Flex align="center" justify="space-between">
        <Space>
          <ApartmentOutlined />
          <span>{department.title}</span>
        </Space>
        <Dropdown
          menu={{
            items: [
              { key: 'new-sub', label: t('New sub department'), icon: <PlusOutlined /> },
              { key: 'edit', label: t('Edit department'), icon: <EditOutlined /> },
              { key: 'delete', label: t('Delete department'), icon: <DeleteOutlined /> },
            ],
            onClick: ({ key, domEvent }) => {
              domEvent.stopPropagation();
              if (key === 'new-sub') {
                openDepartmentForm('create', { id: 0, parentId: department.id, parent: department });
              } else if (key === 'edit') {
                openDepartmentForm('edit', department);
              } else if (key === 'delete') {
                deleteDepartment(department);
              }
            },
          }}
        >
          <Button
            type="text"
            size="small"
            title={t('Actions')}
            icon={<MoreOutlined />}
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      </Flex>
    ),
    [deleteDepartment, openDepartmentForm, t],
  );

  const searchItems = useMemo(() => {
    const users = searchRequest.data?.users || [];
    const foundDepartments = searchRequest.data?.departments || [];
    if (!users.length && !foundDepartments.length) {
      return [{ key: 'empty', disabled: true, label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }];
    }

    return [
      ...(users.length
        ? [
            {
              key: 'users',
              type: 'group' as const,
              label: t('Users'),
              children: users.map((user) => ({
                key: `user-${user.id}`,
                label: userLabel(user),
                onClick: () => {
                  setSelectedUser(user);
                  setSelectedDepartment(null);
                  setSearchOpen(false);
                },
              })),
            },
          ]
        : []),
      ...(foundDepartments.length
        ? [
            {
              key: 'departments',
              type: 'group' as const,
              label: t('Departments'),
              children: foundDepartments.map((department) => ({
                key: `department-${department.id}`,
                label: getDepartmentTitle(department),
                onClick: () => {
                  setSelectedDepartment(department);
                  setSelectedUser(null);
                  setSearchOpen(false);
                },
              })),
            },
          ]
        : []),
    ];
  }, [searchRequest.data, t]);

  const treeNodes = useMemo(
    () => toTreeNodes(departmentTree, renderDepartmentTitle),
    [departmentTree, renderDepartmentTitle],
  );
  const memberResponse = membersRequest.data;
  const members = memberResponse?.data || [];
  const memberCount = memberResponse?.meta?.count as number | undefined;

  return (
    <Card>
      <Flex gap={token.marginLG} align="stretch">
        <Flex vertical gap={token.marginSM} style={{ minWidth: token.sizeXXL * 8 }}>
          <Dropdown trigger={['click']} open={searchOpen} onOpenChange={setSearchOpen} menu={{ items: searchItems }}>
            <Input.Search
              allowClear
              value={searchKeyword}
              placeholder={t('Search for departments, users')}
              onChange={(event) => {
                setSearchKeyword(event.target.value);
                if (!event.target.value) {
                  setSelectedUser(null);
                  setSearchOpen(false);
                }
              }}
              onSearch={(keyword) => {
                if (!keyword) {
                  return;
                }
                setSearchOpen(true);
                searchRequest.run(keyword);
              }}
            />
          </Dropdown>
          <Button
            block
            icon={<TeamOutlined />}
            type={!selectedDepartment && !selectedUser ? 'primary' : 'default'}
            onClick={() => {
              setSelectedDepartment(null);
              setSelectedUser(null);
            }}
          >
            {t('All users')}
          </Button>
          <Button block type="dashed" icon={<PlusOutlined />} onClick={() => openDepartmentForm('create')}>
            {t('New department')}
          </Button>
          {treeNodes.length ? (
            <Tree
              blockNode
              treeData={treeNodes}
              selectedKeys={selectedDepartment ? [selectedDepartment.id] : []}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys([...keys])}
              onSelect={(keys) => {
                const department = findDepartment(departmentTree, keys[0]);
                setSelectedDepartment(department);
                setSelectedUser(null);
              }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Flex>
        <Flex
          vertical
          flex={1}
          gap={token.marginSM}
          style={{
            borderInlineStart: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
            paddingInlineStart: token.paddingLG,
            minWidth: 0,
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={token.marginSM}>
            <Typography.Title level={4}>
              {selectedUser ? t('Search results') : t(selectedDepartment?.title || 'All users')}
            </Typography.Title>
            <Space wrap>
              <CollectionFilter
                collection={usersCollection}
                t={t}
                filterableFieldNames={['nickname', 'username', 'email', 'phone']}
                onChange={setMemberFilter}
              />
              <Button icon={<ReloadOutlined />} onClick={() => membersRequest.refresh()}>
                {t('Refresh')}
              </Button>
              {selectedDepartment ? (
                <>
                  <Button
                    icon={<UserDeleteOutlined />}
                    disabled={!selectedMemberKeys.length}
                    onClick={() => removeMembers(selectedMemberKeys)}
                  >
                    {t('Remove')}
                  </Button>
                  <Button type="primary" icon={<UserAddOutlined />} onClick={openAddMembersForm}>
                    {t('Add members')}
                  </Button>
                </>
              ) : null}
            </Space>
          </Flex>
          <Table<UserRecord>
            rowKey="id"
            loading={membersRequest.loading}
            dataSource={members}
            columns={memberColumns}
            rowSelection={
              selectedDepartment
                ? {
                    selectedRowKeys: selectedMemberKeys,
                    onChange: setSelectedMemberKeys,
                  }
                : undefined
            }
            pagination={
              memberCount
                ? {
                    total: memberCount,
                    showTotal: (count) => t('Total {{count}} members', { count }),
                  }
                : false
            }
          />
        </Flex>
      </Flex>
    </Card>
  );
};

export default DepartmentsPage;
