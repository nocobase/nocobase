/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, App, Breadcrumb, Button, Dropdown, Result, Spin, Switch, Tag, Tooltip } from 'antd';
import { DownOutlined, EllipsisOutlined, RightOutlined } from '@ant-design/icons';
import { NoticeType } from 'antd/es/message/interface';
import { useField, useForm } from '@formily/react';
import {
  ActionContextProvider,
  ResourceActionProvider,
  SchemaComponent,
  cx,
  useActionContext,
  useApp,
  useCancelAction,
  useDocumentTitle,
  useNavigateNoUpdate,
  useResourceActionContext,
  useResourceContext,
  useCompile,
  css,
} from '@nocobase/client';
import { dayjs } from '@nocobase/utils/client';

import { CanvasContent } from './CanvasContent';
import { ExecutionStatusColumn } from './components/ExecutionStatus';
import { ExecutionLink } from './ExecutionLink';
import { CurrentWorkflowContext, FlowContext, useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import { executionSchema } from './schemas/executions';
import useStyles from './style';
import { linkNodes, getWorkflowDetailPath } from './utils';
import { Fieldset } from './components/Fieldset';
import { useRefreshActionProps } from './hooks/useRefreshActionProps';
import { useTrigger } from './triggers';
import { ExecutionStatusOptions, ExecutionStatusOptionsMap } from './constants';
import { HideVariableContext } from './variable';
import { useWorkflowAnyExecuted, useWorkflowExecuted } from './hooks';
import { AddNodeContextProvider } from './AddNodeContext';
import { RemoveNodeContextProvider } from './RemoveNodeContext';

function ExecutionResourceProvider({ request, filter = {}, ...others }) {
  const { workflow } = useFlowContext();
  const props = {
    ...others,
    request: {
      ...request,
      params: {
        ...request?.params,
        filter: {
          ...request?.params?.filter,
          key: workflow.key,
        },
      },
    },
  };

  return <ResourceActionProvider {...props} />;
}

function ExecutedStatusMessage({ data, option }) {
  const compile = useCompile();
  const statusText = compile(option.label);
  return (
    <Trans ns={NAMESPACE} values={{ statusText }}>
      {'Workflow executed, the result status is '}
      <Tag color={option.color}>{'{{statusText}}'}</Tag>
      <Link to={`/admin/workflow/executions/${data.id}`}>View the execution</Link>
    </Trans>
  );
}

function getExecutedStatusMessage({ id, status }) {
  const option = ExecutionStatusOptionsMap[status];
  if (!option) {
    return null;
  }
  return {
    type: 'info' as NoticeType,
    content: <ExecutedStatusMessage data={{ id }} option={option} />,
  };
}

function useExecuteConfirmAction() {
  const { workflow } = useFlowContext();
  const form = useForm();
  const { resource } = useResourceContext();
  const ctx = useActionContext();
  const navigate = useNavigateNoUpdate();
  const { message: messageApi } = App.useApp();
  const executed = useWorkflowExecuted();
  return {
    async run() {
      const { autoRevision, ...values } = form.values;
      // Not executed, could choose to create new version (by default)
      // Executed, stay in current version, and refresh
      await form.submit();
      const {
        data: { data },
      } = await resource.execute({
        filterByTk: workflow.id,
        values,
        ...(!executed && autoRevision ? { autoRevision: 1 } : {}),
      });
      form.reset();
      ctx.setFormValueChanged(false);
      ctx.setVisible(false);
      messageApi?.open(getExecutedStatusMessage(data.execution));
      if (data.newVersionId) {
        navigate(`/admin/workflow/workflows/${data.newVersionId}`);
      }
    },
  };
}

function ActionDisabledProvider({ children }) {
  const field = useField<any>();
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  const valid = trigger.validate(workflow.config);
  let message = '';
  switch (true) {
    case !valid:
      message = lang('The trigger is not configured correctly, please check the trigger configuration.');
      break;
    case !trigger.triggerFieldset:
      message = lang('This type of trigger has not been supported to be executed manually.');
      break;
    default:
      break;
  }
  field.setPattern(message ? 'disabled' : 'editable');
  return message ? <Tooltip title={message}>{children}</Tooltip> : children;
}

function ExecuteActionButton() {
  const { workflow } = useFlowContext();
  const executed = useWorkflowExecuted();
  const trigger = useTrigger();

  return (
    <CurrentWorkflowContext.Provider value={workflow}>
      <HideVariableContext.Provider value={true}>
        <SchemaComponent
          components={{
            Alert,
            Fieldset,
            ActionDisabledProvider,
            ...trigger.components,
          }}
          scope={{
            useCancelAction,
            useExecuteConfirmAction,
            ...trigger.scope,
          }}
          schema={{
            name: `trigger-modal-${workflow.type}-${workflow.id}`,
            type: 'void',
            'x-decorator': 'ActionDisabledProvider',
            'x-component': 'Action',
            'x-component-props': {
              openSize: 'small',
            },
            title: `{{t('Execute manually', { ns: "${NAMESPACE}" })}}`,
            properties: {
              drawer: {
                type: 'void',
                'x-decorator': 'FormV2',
                'x-component': 'Action.Modal',
                title: `{{t('Execute manually', { ns: "${NAMESPACE}" })}}`,
                properties: {
                  ...(Object.keys(trigger.triggerFieldset ?? {}).length
                    ? {
                        alert: {
                          type: 'void',
                          'x-component': 'Alert',
                          'x-component-props': {
                            message: `{{t('Trigger variables need to be filled for executing.', { ns: "${NAMESPACE}" })}}`,
                            className: css`
                              margin-bottom: 1em;
                            `,
                          },
                        },
                      }
                    : {
                        description: {
                          type: 'void',
                          'x-component': 'p',
                          'x-content': `{{t('This will perform all the actions configured in the workflow. Are you sure you want to continue?', { ns: "${NAMESPACE}" })}}`,
                        },
                      }),
                  fieldset: {
                    type: 'void',
                    'x-decorator': 'FormItem',
                    'x-component': 'Fieldset',
                    title: `{{t('Trigger variables', { ns: "${NAMESPACE}" })}}`,
                    properties: trigger.triggerFieldset,
                  },
                  ...(executed
                    ? {}
                    : {
                        autoRevision: {
                          type: 'boolean',
                          'x-decorator': 'FormItem',
                          'x-component': 'Checkbox',
                          'x-content': `{{t('Automatically create a new version after execution', { ns: "${NAMESPACE}" })}}`,
                          default: true,
                        },
                      }),
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Modal.Footer',
                    properties: {
                      cancel: {
                        type: 'void',
                        title: `{{t('Cancel')}}`,
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{useCancelAction}}',
                        },
                      },
                      submit: {
                        type: 'void',
                        title: `{{t('Confirm')}}`,
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: '{{useExecuteConfirmAction}}',
                        },
                      },
                    },
                  },
                },
              },
            },
          }}
        />
      </HideVariableContext.Provider>
    </CurrentWorkflowContext.Provider>
  );
}

function WorkflowMenu() {
  const { workflow, revisions } = useFlowContext();
  const [historyVisible, setHistoryVisible] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const app = useApp();
  const { resource } = useResourceContext();
  const { message } = App.useApp();
  const executed = useWorkflowExecuted();
  const allExecuted = useWorkflowAnyExecuted();

  const onRevision = useCallback(async () => {
    const {
      data: { data: revision },
    } = await resource.revision({
      filterByTk: workflow.id,
      filter: {
        key: workflow.key,
      },
    });
    message.success(t('Operation succeeded'));

    navigate(`/admin/workflow/workflows/${revision.id}`);
  }, [resource, workflow.id, workflow.key, message, t, navigate]);

  const onDelete = useCallback(async () => {
    const content = workflow.current
      ? lang(
          'This is a main version, delete it will cause the whole workflow to be deleted (including all other revisions).',
        )
      : lang('Current version will be deleted (without affecting other versions).');
    modal.confirm({
      title: t('Are you sure you want to delete it?'),
      content,
      async onOk() {
        await resource.destroy({
          filterByTk: workflow.id,
        });
        message.success(t('Operation succeeded'));

        navigate(
          workflow.current
            ? app.pluginSettingsManager.getRoutePath('workflow')
            : getWorkflowDetailPath(revisions.find((item) => item.current)?.id),
        );
      },
    });
  }, [workflow, modal, t, resource, message, navigate, app.pluginSettingsManager, revisions]);

  const onMenuCommand = useCallback(
    ({ key }) => {
      switch (key) {
        case 'history':
          setHistoryVisible(true);
          return;
        case 'revision':
          return onRevision();
        case 'delete':
          return onDelete();
        default:
          break;
      }
    },
    [onDelete, onRevision],
  );

  return (
    <>
      <Dropdown
        menu={{
          items: [
            {
              key: 'key',
              label: `Key: ${workflow.key}`,
              disabled: true,
            },
            {
              type: 'divider',
            },
            {
              role: 'button',
              'aria-label': 'history',
              key: 'history',
              label: lang('Execution history'),
              disabled: !allExecuted,
            },
            {
              role: 'button',
              'aria-label': 'revision',
              key: 'revision',
              label: lang('Copy to new version'),
            },
            {
              type: 'divider',
            },
            { role: 'button', 'aria-label': 'delete', danger: true, key: 'delete', label: t('Delete') },
          ] as any[],
          onClick: onMenuCommand,
        }}
      >
        <Button aria-label="more" type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
      <ActionContextProvider value={{ visible: historyVisible, setVisible: setHistoryVisible }}>
        <SchemaComponent
          schema={executionSchema}
          components={{
            ExecutionResourceProvider,
            ExecutionLink,
            ExecutionStatusColumn,
          }}
          scope={{
            useRefreshActionProps,
            ExecutionStatusOptions,
          }}
        />
      </ActionContextProvider>
    </>
  );
}

export function WorkflowCanvas() {
  const navigate = useNavigate();
  const app = useApp();
  const { data, refresh, loading } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { setTitle } = useDocumentTitle();
  const { styles } = useStyles();
  const [enabled, setEnabled] = useState(data?.data?.enabled ?? false);
  const [switchLoading, setSwitchLoading] = useState(false);

  const { nodes = [], revisions = [], ...workflow } = data?.data ?? {};
  linkNodes(nodes);

  useEffect(() => {
    const { title, enabled } = data?.data ?? {};
    setTitle?.(`${lang('Workflow')}${title ? `: ${title}` : ''}`);
    setEnabled(enabled);
  }, [data?.data, setTitle]);

  const onSwitchVersion = useCallback(
    ({ key }) => {
      if (key != workflow.id) {
        navigate(getWorkflowDetailPath(key));
      }
    },
    [workflow.id, navigate],
  );

  const onToggle = useCallback(
    async (value) => {
      // setEnabled(value);
      setSwitchLoading(true);
      await resource.update({
        filterByTk: workflow.id,
        values: {
          enabled: value,
        },
      });
      setSwitchLoading(false);
      setEnabled(value);
      // setTimeout(() => {
      //   refresh();
      // });
    },
    [resource, workflow.id],
  );

  if (!data?.data) {
    if (loading) {
      return <Spin />;
    }
    return (
      <Result status="404" title="Not found" extra={<Button onClick={() => navigate(-1)}>{lang('Go back')}</Button>} />
    );
  }

  const entry = nodes.find((item) => !item.upstream);

  return (
    <FlowContext.Provider
      value={{
        workflow,
        revisions,
        nodes,
        refresh,
      }}
    >
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb
            items={[
              { title: <Link to={app.pluginSettingsManager.getRoutePath('workflow')}>{lang('Workflow')}</Link> },
              {
                title: (
                  <Tooltip title={`Key: ${workflow.key}`}>
                    <strong>{workflow.title}</strong>
                  </Tooltip>
                ),
              },
            ]}
          />
          {workflow.sync ? (
            <Tag color="orange">{lang('Synchronously')}</Tag>
          ) : (
            <Tag color="cyan">{lang('Asynchronously')}</Tag>
          )}
        </header>
        <aside>
          <ExecuteActionButton />
          <Dropdown
            className="workflow-versions"
            trigger={['click']}
            menu={{
              onClick: onSwitchVersion,
              defaultSelectedKeys: [`${workflow.id}`],
              className: cx(styles.dropdownClass, styles.workflowVersionDropdownClass),
              items: revisions
                .sort((a, b) => b.id - a.id)
                .map((item, index) => ({
                  role: 'button',
                  'aria-label': `version-${index}`,
                  key: `${item.id}`,
                  icon: item.current ? <RightOutlined /> : null,
                  className: cx({
                    executed: item.versionStats.executed > 0,
                    unexecuted: item.versionStats.executed == 0,
                    enabled: item.enabled,
                  }),
                  label: (
                    <>
                      <strong>{`#${item.id}`}</strong>
                      <time>{dayjs(item.createdAt).fromNow()}</time>
                    </>
                  ),
                })),
            }}
          >
            <Button type="text" aria-label="version">
              <label>{lang('Version')}</label>
              <span>{workflow?.id ? `#${workflow.id}` : null}</span>
              <DownOutlined />
            </Button>
          </Dropdown>
          <Switch
            checked={enabled}
            onChange={onToggle}
            checkedChildren={lang('On')}
            unCheckedChildren={lang('Off')}
            loading={switchLoading}
          />
          <WorkflowMenu />
        </aside>
      </div>
      <AddNodeContextProvider>
        <RemoveNodeContextProvider>
          <CanvasContent entry={entry} />
        </RemoveNodeContextProvider>
      </AddNodeContextProvider>
    </FlowContext.Provider>
  );
}
