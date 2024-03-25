import { DownOutlined, EllipsisOutlined, RightOutlined } from '@ant-design/icons';
import {
  ActionContextProvider,
  ResourceActionProvider,
  SchemaComponent,
  cx,
  useApp,
  useDocumentTitle,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { str2moment } from '@nocobase/utils/client';
import { App, Breadcrumb, Button, Dropdown, Result, Spin, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { CanvasContent } from './CanvasContent';
import { ExecutionLink } from './ExecutionLink';
import { FlowContext, useFlowContext } from './FlowContext';
import { lang } from './locale';
import { executionSchema } from './schemas/executions';
import useStyles from './style';
import { linkNodes, getWorkflowDetailPath } from './utils';
import { ExecutionStatusColumn } from './components/ExecutionStatus';

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

export function WorkflowCanvas() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const app = useApp();
  const { data, refresh, loading } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { setTitle } = useDocumentTitle();
  const [visible, setVisible] = useState(false);
  const { styles } = useStyles();
  const { modal } = App.useApp();

  useEffect(() => {
    const { title } = data?.data ?? {};
    setTitle?.(`${lang('Workflow')}${title ? `: ${title}` : ''}`);
  }, [data?.data]);

  if (!data?.data) {
    if (loading) {
      return <Spin />;
    }
    return <Result status="404" title="Not found" />;
  }

  const { nodes = [], revisions = [], ...workflow } = data?.data ?? {};
  linkNodes(nodes);

  const entry = nodes.find((item) => !item.upstream);

  function onSwitchVersion({ key }) {
    if (key != workflow.id) {
      navigate(getWorkflowDetailPath(key));
    }
  }

  async function onToggle(value) {
    await resource.update({
      filterByTk: workflow.id,
      values: {
        enabled: value,
      },
    });
    refresh();
  }

  async function onRevision() {
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
  }

  async function onDelete() {
    const content = workflow.current
      ? lang('Delete a main version will cause all other revisions to be deleted too.')
      : '';
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
  }

  async function onMenuCommand({ key }) {
    switch (key) {
      case 'history':
        setVisible(true);
        return;
      case 'revision':
        return onRevision();
      case 'delete':
        return onDelete();
      default:
        break;
    }
  }

  const revisionable =
    workflow.executed &&
    !revisions.find((item) => !item.executed && new Date(item.createdAt) > new Date(workflow.createdAt));

  return (
    <FlowContext.Provider
      value={{
        workflow,
        nodes,
        refresh,
      }}
    >
      <div className="workflow-toolbar">
        <header>
          <Breadcrumb
            items={[
              { title: <Link to={app.pluginSettingsManager.getRoutePath('workflow')}>{lang('Workflow')}</Link> },
              { title: <strong>{workflow.title}</strong> },
            ]}
          />
        </header>
        <aside>
          <div className="workflow-versions">
            <Dropdown
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
                      executed: item.executed,
                      unexecuted: !item.executed,
                      enabled: item.enabled,
                    }),
                    label: (
                      <>
                        <strong>{`#${item.id}`}</strong>
                        <time>{str2moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</time>
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
          </div>
          <Switch
            checked={workflow.enabled}
            onChange={onToggle}
            checkedChildren={lang('On')}
            unCheckedChildren={lang('Off')}
          />
          <Dropdown
            menu={{
              items: [
                {
                  role: 'button',
                  'aria-label': 'history',
                  key: 'history',
                  label: lang('Execution history'),
                  disabled: !workflow.allExecuted,
                },
                {
                  role: 'button',
                  'aria-label': 'revision',
                  key: 'revision',
                  label: lang('Copy to new version'),
                  disabled: !revisionable,
                },
                { role: 'button', 'aria-label': 'delete', key: 'delete', label: t('Delete') },
              ] as any[],
              onClick: onMenuCommand,
            }}
          >
            <Button aria-label="more" type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
          <ActionContextProvider value={{ visible, setVisible }}>
            <SchemaComponent
              schema={executionSchema}
              components={{
                ExecutionResourceProvider,
                ExecutionLink,
                ExecutionStatusColumn,
              }}
            />
          </ActionContextProvider>
        </aside>
      </div>
      <CanvasContent entry={entry} />
    </FlowContext.Provider>
  );
}
