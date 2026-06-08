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
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { CollectionFilter, DrawerFormLayout, Table, type CompiledFilter } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  type SelectProps,
  Space,
  Tag,
  Tree,
  TreeSelect,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createDepartment,
  destroyDepartment,
  type DepartmentFormValues,
  type DepartmentResource,
  updateDepartment,
} from '../api';
import { useT } from '../locale';
import type { DepartmentPrimaryKey, DepartmentRecord, RoleRecord, UserRecord } from '../shared/department';
import { buildDepartmentTree, getDepartmentTitle } from '../shared/department';

const FORM_DRAWER_WIDTH = '50%';
const TABLE_DRAWER_WIDTH = '50%';
const DEPARTMENT_PICKER_DRAWER_WIDTH = '50%';
const DEPARTMENT_TREE_PANEL_WIDTH = 280;
const MEMBER_TABLE_PAGE_SIZE = 20;
const ADD_MEMBERS_TABLE_PAGE_SIZE = 20;
const SEARCH_RESULT_LIMIT = 10;
const DEPARTMENTS_PAGE_HEIGHT = 'calc(100vh - 160px)';
const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { paddingInline: 0, height: 'auto' };

type MembersFilter = CompiledFilter;
type SearchResultType = 'user' | 'department';

interface SearchResults {
  users: UserRecord[];
  departments: DepartmentRecord[];
  moreUsers: boolean;
  moreDepartments: boolean;
}

interface AggregateSearchParams {
  keyword: string;
  type?: SearchResultType;
  last?: DepartmentPrimaryKey;
}

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

function useDrawerTableLayoutStyles() {
  const { token } = theme.useToken();
  const contentClassName = useMemo(
    () => css`
      height: 100%;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `,
    [],
  );
  const toolbarClassName = useMemo(
    () => css`
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${token.marginSM}px;
      flex-wrap: wrap;
      margin-bottom: ${token.marginSM}px;
    `,
    [token.marginSM],
  );
  const tableClassName = useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .ant-table-content,
      .ant-table-body {
        flex: 1;
        min-height: 0;
      }

      .ant-table-thead > tr > th {
        white-space: nowrap;
      }

      .ant-pagination {
        flex: 0 0 auto;
      }
    `,
    [],
  );

  return { contentClassName, tableClassName, toolbarClassName };
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
  if (meta && typeof meta === 'object') {
    return meta as Record<string, unknown>;
  }

  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
}

function userLabel(user: Pick<UserRecord, 'nickname' | 'username' | 'email'>) {
  return user.nickname || user.username || user.email || '';
}

function userDescription(user: Pick<UserRecord, 'username' | 'phone' | 'email'>) {
  return [user.username, user.phone, user.email].filter(Boolean).join(' | ');
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

function AsyncSelect<T>(
  props: {
    mode?: 'multiple';
    request: () => Promise<T[]>;
    mapOptions: (record: T) => { label: React.ReactNode; value: DepartmentPrimaryKey };
  } & Omit<SelectProps, 'loading' | 'mode' | 'options'>,
) {
  const { mode, request: requestFn, mapOptions, ...selectProps } = props;
  const request = useRequest(requestFn);

  return (
    <Select
      {...selectProps}
      allowClear
      mode={mode}
      loading={request.loading}
      options={(request.data || []).map(mapOptions)}
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
            mapOptions={(role) => ({
              label: role.title
                ? t(role.title, { ns: ['@nocobase/plugin-acl', 'acl', 'client'], nsMode: 'fallback' })
                : role.name,
              value: role.name,
            })}
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
  const { contentClassName, tableClassName, toolbarClassName } = useDrawerTableLayoutStyles();
  const usersCollection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('users');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState<CompiledFilter>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ADD_MEMBERS_TABLE_PAGE_SIZE);
  const [submitting, setSubmitting] = useState(false);

  const usersRequest = useRequest(
    async () => {
      const response = await getResource(ctx.api, 'users').listExcludeDept({
        departmentId: props.department.id,
        filter,
        page,
        pageSize,
      });
      return {
        data: extractList<UserRecord>(response),
        meta: extractMeta(response),
      };
    },
    {
      refreshDeps: [filter, page, pageSize, props.department.id],
    },
  );

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

  const usersResponse = usersRequest.data;
  const users = usersResponse?.data || [];
  const userCount = usersResponse?.meta?.count as number | undefined;

  return (
    <DrawerFormLayout
      title={t('Add members')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <div className={contentClassName}>
        <div className={toolbarClassName}>
          <Space wrap>
            <CollectionFilter
              collection={usersCollection}
              t={t}
              onChange={(nextFilter) => {
                setSelectedKeys([]);
                setPage(1);
                setFilter(nextFilter);
              }}
            />
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => usersRequest.refresh()}>
              {t('Refresh')}
            </Button>
          </Space>
        </div>
        <Table<UserRecord>
          rowKey="id"
          showIndex={false}
          loading={usersRequest.loading}
          dataSource={users}
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total: userCount ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          rowSelection={{
            preserveSelectedRowKeys: true,
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
          }}
          scroll={{ x: 'max-content', y: '100%' }}
          className={tableClassName}
        />
      </div>
    </DrawerFormLayout>
  );
}

function DepartmentPickerForm(props: {
  departments: DepartmentRecord[];
  disabledIds: Set<DepartmentPrimaryKey>;
  onSubmitted: (departments: DepartmentRecord[]) => Promise<void> | void;
}) {
  const t = useT();
  const ctx = useFlowContext();
  const { contentClassName, tableClassName, toolbarClassName } = useDrawerTableLayoutStyles();
  const departmentsCollection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('departments');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentRecord[]>([]);
  const [filter, setFilter] = useState<CompiledFilter>();
  const [submitting, setSubmitting] = useState(false);

  const departmentsRequest = useRequest(
    async () => {
      if (!filter) {
        return buildDepartmentTree(props.departments);
      }

      const response = await getResource(ctx.api, 'departments').list({
        appends: ['parent(recursively=true)'],
        filter,
        paginate: false,
        sort: ['sort'],
      });
      return extractList<DepartmentRecord>(response).map((department) => ({
        ...department,
        title: getDepartmentTitle(department),
      }));
    },
    { refreshDeps: [filter, props.departments] },
  );

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
      <div className={contentClassName}>
        <div className={toolbarClassName}>
          <Space wrap>
            <CollectionFilter collection={departmentsCollection} t={t} onChange={setFilter} />
          </Space>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => departmentsRequest.refresh()}>
              {t('Refresh')}
            </Button>
          </Space>
        </div>
        <Table<DepartmentRecord>
          rowKey="id"
          showIndex={false}
          loading={departmentsRequest.loading}
          columns={columns}
          dataSource={departmentsRequest.data || []}
          expandable={filter ? undefined : { defaultExpandAllRows: false }}
          pagination={filter ? false : { pageSize: 10, showSizeChanger: true }}
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
          scroll={{ x: 'max-content', y: '100%' }}
          className={tableClassName}
        />
      </div>
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
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
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
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    departments: [],
    moreUsers: true,
    moreDepartments: true,
  });
  const [memberFilter, setMemberFilter] = useState<MembersFilter>();
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(MEMBER_TABLE_PAGE_SIZE);

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
        page: memberPage,
        pageSize: memberPageSize,
      });
      return {
        data: extractList<UserRecord>(response),
        meta: extractMeta(response),
      };
    },
    {
      refreshDeps: [memberFilter, memberPage, memberPageSize, selectedDepartment?.id, selectedUser?.id],
      onSuccess: () => setSelectedMemberKeys([]),
    },
  );

  useEffect(() => {
    setMemberPage(1);
  }, [memberFilter, selectedDepartment?.id, selectedUser?.id]);

  const searchRequest = useRequest(
    async (params: AggregateSearchParams) => {
      const response = await getResource(ctx.api, 'departments').aggregateSearch({
        values: { ...params, limit: SEARCH_RESULT_LIMIT },
      });
      return (
        (getResponseData(response) as { data?: { users?: UserRecord[]; departments?: DepartmentRecord[] } })?.data || {
          users: [],
          departments: [],
        }
      );
    },
    {
      manual: true,
      onSuccess(data, params) {
        const requestParams = params[0];
        const users = data.users || [];
        const departments = data.departments || [];
        setSearchResults((current) => ({
          users:
            requestParams.type === 'department'
              ? current.users
              : requestParams.last
                ? [...current.users, ...users]
                : users,
          departments:
            requestParams.type === 'user'
              ? current.departments
              : requestParams.last
                ? [...current.departments, ...departments]
                : departments,
          moreUsers:
            !requestParams.type || requestParams.type === 'user'
              ? users.length >= SEARCH_RESULT_LIMIT
              : current.moreUsers,
          moreDepartments:
            !requestParams.type || requestParams.type === 'department'
              ? departments.length >= SEARCH_RESULT_LIMIT
              : current.moreDepartments,
        }));
      },
    },
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
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
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
      { title: t('Nickname'), width: 160, render: (_, record) => userLabel(record) },
      { title: t('Username'), dataIndex: 'username', width: 160 },
      {
        title: t('Departments'),
        width: 260,
        render: (record) => (
          <>
            {(record.departments || []).map((department, index) => (
              <React.Fragment key={department.id}>
                {index > 0 ? ', ' : null}
                <a
                  onClick={() => {
                    setSelectedDepartment(department);
                    setSelectedUser(null);
                  }}
                >
                  {getDepartmentTitle(department)}
                </a>
              </React.Fragment>
            ))}
          </>
        ),
      },
      ...(selectedDepartment
        ? [
            {
              title: t('Owner'),
              align: 'center' as const,
              width: 96,
              render: (record: UserRecord) => {
                const isOwner = record.departments?.some(
                  (department) => department.id === selectedDepartment.id && department.departmentsUsers?.isOwner,
                );
                return isOwner ? (
                  <CheckOutlined aria-label={t('Owner')} style={{ color: '#52c41a' }} />
                ) : (
                  <Checkbox disabled aria-label={t('Owner')} />
                );
              },
            },
          ]
        : []),
      { title: t('Phone'), dataIndex: 'phone', width: 140 },
      { title: t('Email'), dataIndex: 'email', width: 220 },
      {
        title: t('Actions'),
        width: 120,
        render: (record) => (
          <Space>
            <Button
              type="link"
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              onClick={() => openUserDepartmentsForm(record)}
            >
              {t('Configure')}
            </Button>
            {selectedDepartment ? (
              <Button
                type="link"
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                onClick={() => removeMembers([record.id])}
              >
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
      <Flex align="center" justify="space-between" gap={8} style={{ width: '100%', minWidth: 0 }}>
        <Flex align="center" gap={8} style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
          <ApartmentOutlined style={{ flex: '0 0 auto' }} />
          <span title={department.title} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {department.title}
          </span>
        </Flex>
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
            style={{ flex: '0 0 auto' }}
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      </Flex>
    ),
    [deleteDepartment, openDepartmentForm, t],
  );

  const searchItems = useMemo(() => {
    const users = searchResults.users;
    const foundDepartments = searchResults.departments;
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
              children: [
                ...users.map((user) => {
                  const description = userDescription(user);
                  return {
                    key: `user-${user.id}`,
                    label: (
                      <div>
                        <div>{userLabel(user)}</div>
                        {description ? (
                          <div style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>
                            {description}
                          </div>
                        ) : null}
                      </div>
                    ),
                    onClick: () => {
                      setSelectedUser(user);
                      setSelectedDepartment(null);
                      setSearchOpen(false);
                    },
                  };
                }),
                ...(searchResults.moreUsers
                  ? [
                      {
                        key: 'user-load-more',
                        disabled: searchRequest.loading,
                        label: (
                          <Button
                            type="link"
                            size="small"
                            loading={searchRequest.loading}
                            onClick={(event) => {
                              event.stopPropagation();
                              const lastUser = users[users.length - 1];
                              if (lastUser) {
                                searchRequest.run({ keyword: searchKeyword, type: 'user', last: lastUser.id });
                              }
                            }}
                          >
                            {t('Load more')}
                          </Button>
                        ),
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
      ...(foundDepartments.length
        ? [
            {
              key: 'departments',
              type: 'group' as const,
              label: t('Departments'),
              children: [
                ...foundDepartments.map((department) => ({
                  key: `department-${department.id}`,
                  label: getDepartmentTitle(department),
                  onClick: () => {
                    setSelectedDepartment(department);
                    setSelectedUser(null);
                    setSearchOpen(false);
                  },
                })),
                ...(searchResults.moreDepartments
                  ? [
                      {
                        key: 'department-load-more',
                        disabled: searchRequest.loading,
                        label: (
                          <Button
                            type="link"
                            size="small"
                            loading={searchRequest.loading}
                            onClick={(event) => {
                              event.stopPropagation();
                              const lastDepartment = foundDepartments[foundDepartments.length - 1];
                              if (lastDepartment) {
                                searchRequest.run({
                                  keyword: searchKeyword,
                                  type: 'department',
                                  last: lastDepartment.id,
                                });
                              }
                            }}
                          >
                            {t('Load more')}
                          </Button>
                        ),
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ];
  }, [
    searchKeyword,
    searchRequest,
    searchResults.departments,
    searchResults.moreDepartments,
    searchResults.moreUsers,
    searchResults.users,
    t,
    token.colorTextDescription,
    token.fontSizeSM,
  ]);

  const treeNodes = useMemo(
    () => toTreeNodes(departmentTree, renderDepartmentTitle),
    [departmentTree, renderDepartmentTitle],
  );
  const departmentsPageClassName = useMemo(
    () => css`
      height: ${DEPARTMENTS_PAGE_HEIGHT};
      min-height: 0;
      overflow: hidden;
      > .ant-card-body {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    `,
    [],
  );
  const membersTableClassName = useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .ant-table-content {
        flex: 1;
        min-height: 0;
      }
      .ant-table-body {
        flex: 1;
        min-height: 0;
      }
      .ant-table-thead > tr > th {
        white-space: nowrap;
      }
      .ant-pagination {
        flex: 0 0 auto;
      }
    `,
    [],
  );
  const departmentTreeClassName = useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      overflow-y: scroll;
      overflow-x: hidden;
      .ant-tree-treenode {
        width: 100%;
        padding: 2px 0;
      }
      .ant-tree-switcher {
        line-height: 32px;
      }
      .ant-tree-switcher::before {
        height: 32px;
      }
      .ant-tree-node-content-wrapper {
        flex: 1;
        min-width: 0;
        height: 32px;
        line-height: 32px;
        overflow: hidden;
        padding-inline: 8px;
      }
      .ant-tree-title {
        display: block;
      }
      .ant-tree-node-selected {
        background-color: ${token.colorPrimaryBg};
      }
    `,
    [token.colorPrimaryBg],
  );
  const memberResponse = membersRequest.data;
  const members = memberResponse?.data || [];
  const memberCount = memberResponse?.meta?.count as number | undefined;

  return (
    <Card className={departmentsPageClassName}>
      <Flex gap={token.marginLG} align="stretch" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Flex
          vertical
          gap={token.marginSM}
          style={{
            width: DEPARTMENT_TREE_PANEL_WIDTH,
            flex: `0 0 ${DEPARTMENT_TREE_PANEL_WIDTH}px`,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
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
                  setSearchResults({ users: [], departments: [], moreUsers: true, moreDepartments: true });
                }
              }}
              onSearch={(keyword) => {
                if (!keyword) {
                  return;
                }
                setSearchResults({ users: [], departments: [], moreUsers: true, moreDepartments: true });
                setSearchOpen(true);
                searchRequest.run({ keyword });
              }}
            />
          </Dropdown>
          <Button
            block
            icon={<UserOutlined />}
            type="text"
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              background: !selectedDepartment && !selectedUser ? token.colorPrimaryBg : undefined,
            }}
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
          <div className={departmentTreeClassName}>
            {treeNodes.length ? (
              <Tree.DirectoryTree
                blockNode
                showIcon={false}
                expandAction={false}
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
          </div>
        </Flex>
        <Flex
          vertical
          flex={1}
          gap={token.marginSM}
          style={{
            borderInlineStart: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
            paddingInlineStart: token.paddingLG,
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Flex vertical gap={token.marginSM} style={{ flex: '0 0 auto' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {selectedUser ? t('Search results') : t(selectedDepartment?.title || 'All users')}
            </Typography.Title>
            <Flex justify="space-between" align="center" wrap="wrap" gap={token.marginSM}>
              <Space wrap>
                <CollectionFilter
                  collection={usersCollection}
                  t={t}
                  onChange={(filter) => {
                    setMemberPage(1);
                    setMemberFilter(filter);
                  }}
                />
              </Space>
              <Space wrap>
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
          </Flex>
          <Table<UserRecord>
            rowKey="id"
            showIndex={false}
            className={membersTableClassName}
            loading={membersRequest.loading}
            dataSource={members}
            columns={memberColumns}
            scroll={{ x: 'max-content', y: '100%' }}
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
                    current: memberPage,
                    pageSize: memberPageSize,
                    total: memberCount,
                    showTotal: (count) => t('Total {{count}} members', { count }),
                    onChange: (page, pageSize) => {
                      setMemberPage(page);
                      setMemberPageSize(pageSize);
                    },
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
