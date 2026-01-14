/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { App, Tabs } from 'antd';
import { NavBar, Toast } from 'antd-mobile';
import React, { useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { css, SchemaInitializerItemType, useApp, useToken } from '@nocobase/client';

import { lang } from './locale';
import {
  TasksCountsContext,
  TasksCountsProvider,
  TaskPageContent,
  useAvailableTaskTypeItems,
  useTaskTypeItems,
} from './WorkflowTasks';

// 内联 MobileRouteItem 类型定义
type MobileRouteItem = {
  type: string;
  title: string;
  icon: string;
  schemaUid: string;
  options: any;
};

const TASK_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const tasksSchemaInitializerItem: SchemaInitializerItemType = {
  name: 'workflow-tasks-center',
  type: 'item',
  useComponentProps() {
    const app = useApp();
    const useMobileRoutes = app.scopes?.useMobileRoutes;
    const { resource, refresh } = useMobileRoutes();
    const items = useTaskTypeItems();
    return items.length
      ? {
          isItem: true,
          title: lang('Workflow tasks'),
          badge: 10,
          async onClick() {
            const res = await resource.list();
            if (Array.isArray(res?.data?.data)) {
              const findIndex = res?.data?.data.findIndex((route) => route?.options?.url === `/page/workflow-tasks`);
              if (findIndex > -1) {
                Toast.show({
                  icon: 'fail',
                  content: lang('The workflow tasks page has already been created.'),
                });
                return;
              }
            }
            await resource.create({
              values: {
                type: 'page',
                title: lang('Workflow tasks'),
                icon: 'CheckCircleOutlined',
                schemaUid: 'workflow-tasks',
                options: {
                  url: `/page/workflow-tasks`,
                  schema: {
                    'x-decorator': 'TasksCountsProvider',
                    'x-component': 'MobileTabBarWorkflowTasksItem',
                  },
                },
              } as MobileRouteItem,
            });
            refresh();
          },
        }
      : null;
  },
};

export const MobileTabBarWorkflowTasksItem = observer(
  (props: any) => {
    const app = useApp();
    const MobileTabBarItem = app.getComponent('MobileTabBarItem') as any;
    const { message } = App.useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const items = useAvailableTaskTypeItems();
    const onClick = useCallback(() => {
      if (items.length) {
        navigate(`/page/workflow-tasks/${items[0].key}/${TASK_STATUS.PENDING}`);
      } else {
        message.error(lang('No workflow tasks available. Please contact the administrator.'));
      }
    }, [items, message, navigate]);
    const { total } = useContext(TasksCountsContext);

    const selected = props.url && location.pathname.startsWith(props.url);

    return (
      <MobileTabBarItem
        {...{
          ...props,
          onClick,
          badge: total > 0 ? total : undefined,
          selected,
        }}
      />
    );
  },
  {
    displayName: 'MobileTabBarWorkflowTasksItem',
  },
);

function WorkflowTasksMobileTabs() {
  const { token } = useToken();
  const items = useAvailableTaskTypeItems();
  return (
    <Tabs
      className={css({
        padding: `0 ${token.paddingPageHorizontal}px`,
        '.adm-tabs-header': {
          borderBottomWidth: 0,
        },
        '.adm-tabs-tab': {
          height: 49,
          padding: '10px 0 10px',
        },
        '> .ant-tabs-nav': {
          marginBottom: 0,
          '&::before': {
            borderBottom: 'none',
          },
        },

        '.ant-tabs-tab+.ant-tabs-tab': {
          marginLeft: '2em',
        },
      })}
      items={items}
    />
  );
}

export function WorkflowTasksMobile() {
  const app = useApp();
  const MobilePageProvider = app.getComponent('MobilePageProvider') as any;
  const MobilePageHeader = app.getComponent('MobilePageHeader') as any;
  const MobilePageContentContainer = app.getComponent('MobilePageContentContainer') as any;
  const navigate = useNavigate();

  return (
    <MobilePageProvider>
      <MobilePageHeader>
        <NavBar className="nb-workflow-tasks-back-action" onBack={() => navigate(-1)}>
          {lang('Workflow tasks')}
        </NavBar>
        <TasksCountsProvider>
          <WorkflowTasksMobileTabs />
        </TasksCountsProvider>
      </MobilePageHeader>
      <MobilePageContentContainer
        className={css`
          padding: 0 !important;
          > div {
            height: 100%;
            overflow: hidden;

            > .ant-formily-layout {
              height: 100%;
              overflow: hidden;

              > div {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
              }
            }
          }

          .ant-nb-list {
            .itemCss:not(:last-child) {
              padding-bottom: 0;
              margin-bottom: 0.5em;
            }
            .itemCss:not(:first-child) {
              padding-top: 0;
              margin-top: 0.5em;
            }
          }
        `}
      >
        <TaskPageContent />
      </MobilePageContentContainer>
    </MobilePageProvider>
  );
}
