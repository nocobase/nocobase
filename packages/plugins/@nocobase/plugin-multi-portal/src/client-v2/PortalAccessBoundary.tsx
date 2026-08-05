/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useACLContext,
  useApp,
  useCurrentUserContext,
  type Application,
  type CurrentRoleOption,
} from '@nocobase/client-v2';
import { Alert, Button, Card, Result, Select, Space, Spin, Tag, theme, Typography } from 'antd';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from './locale';
import {
  type PortalAccessApiClient,
  type PortalAccessController,
  type PortalAccessDeniedContext,
  type PortalAccessState,
} from './portalAccess';

type RoleSwitcherApiClient = Pick<PortalAccessApiClient, 'auth'> & {
  resource: (name: string) => {
    setDefaultRole: (params: { values: { roleName: string } }) => Promise<unknown>;
  };
};

type PortalAccessRuntimeContextValue = {
  controller: PortalAccessController;
  retry: (portalName: string) => Promise<unknown>;
};

const PortalAccessRuntimeContext = createContext<PortalAccessRuntimeContextValue | null>(null);
const subscribeNoop = () => () => undefined;
const getEmptySnapshot = () => null;

function getRoleOptions(denied: PortalAccessDeniedContext, userRoles: CurrentRoleOption[], t: (key: string) => string) {
  const roles = userRoles.filter((role) => role.name !== '__union__');
  if (denied.allowAnonymous && !roles.some((role) => role.name === 'anonymous')) {
    roles.push({ name: 'anonymous', title: t('Anonymous') });
  }
  if (denied.roleMode === 'allow-use-union') {
    roles.unshift({ name: '__union__', title: t('Full permissions') });
  }
  return roles;
}

function getCurrentRole(
  denied: PortalAccessDeniedContext,
  apiClient: RoleSwitcherApiClient,
  roles: CurrentRoleOption[],
) {
  if (denied.roleMode === 'only-use-union') {
    return '__union__';
  }
  return denied.role || apiClient.auth.role || roles[0]?.name || '';
}

function getRoleLabel(roleName: string, roles: CurrentRoleOption[], t: (key: string) => string) {
  if (roleName === '__union__') {
    return t('Full permissions');
  }
  return roles.find((role) => role.name === roleName)?.title || roleName;
}

type PortalDeniedRoleSwitcherProps = {
  apiClient: RoleSwitcherApiClient;
  denied: PortalAccessDeniedContext;
  reload: () => void;
  t: (key: string) => string;
  userRoles: CurrentRoleOption[];
};

export function PortalDeniedRoleSwitcher(props: PortalDeniedRoleSwitcherProps) {
  const { apiClient, denied, reload, t, userRoles } = props;
  const { token } = theme.useToken();
  const roles = useMemo(() => getRoleOptions(denied, userRoles, t), [denied, t, userRoles]);
  const initialRole = getCurrentRole(denied, apiClient, roles);
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  useEffect(() => {
    setCurrentRole(initialRole);
    setSwitchError('');
  }, [initialRole]);

  const handleRoleChange = useCallback(
    async (roleName: string) => {
      const previousRole = apiClient.auth.role || currentRole;
      setSwitchError('');
      setSwitching(true);
      setCurrentRole(roleName);
      apiClient.auth.setRole(roleName);
      try {
        await apiClient.resource('users').setDefaultRole({ values: { roleName } });
        reload();
      } catch {
        apiClient.auth.setRole(previousRole || null);
        setCurrentRole(previousRole || '');
        setSwitchError(t('Failed to switch role'));
      } finally {
        setSwitching(false);
      }
    },
    [apiClient, currentRole, reload, t],
  );

  const canSwitch = roles.length > 1 && denied.roleMode !== 'only-use-union';
  return (
    <Card
      aria-label={t('Switch role')}
      extra={
        <Space size="small">
          <Typography.Text type="secondary">{t('Current role')}</Typography.Text>
          <Tag style={{ marginInlineEnd: 0 }}>{getRoleLabel(currentRole, roles, t)}</Tag>
        </Space>
      }
      role="region"
      style={{ textAlign: 'start', width: '100%' }}
      styles={{ title: { fontWeight: 'normal' } }}
      title={t('Switch role')}
    >
      <Space direction="vertical" size={token.marginXS} style={{ width: '100%' }}>
        {canSwitch ? (
          <>
            <Typography.Text>{t('Select role')}</Typography.Text>
            <Select
              aria-label={t('Switch role')}
              disabled={switching}
              loading={switching}
              onChange={handleRoleChange}
              options={roles.map((role) => ({ label: role.title || role.name, value: role.name }))}
              value={currentRole}
              style={{ width: '100%' }}
            />
            <Typography.Text type="secondary">
              {t('Portal access will be checked again after switching.')}
            </Typography.Text>
          </>
        ) : null}
        {switchError ? <Alert showIcon type="error" message={switchError} /> : null}
      </Space>
    </Card>
  );
}

export type PortalAccessViewProps = {
  access: PortalAccessState;
  apiClient: RoleSwitcherApiClient;
  reload?: () => void;
  renderAllowed: () => React.ReactNode;
  retry: () => Promise<unknown>;
  t: (key: string) => string;
  userRoles: CurrentRoleOption[];
};

export function PortalAccessView(props: PortalAccessViewProps) {
  const { access, apiClient, reload = () => window.location.reload(), renderAllowed, retry, t, userRoles } = props;
  const { token } = theme.useToken();
  const [retrying, setRetrying] = useState(false);
  const pageStyle = useMemo<React.CSSProperties>(
    () => ({
      alignItems: 'center',
      background: token.colorBgLayout,
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: token.paddingLG,
    }),
    [token.colorBgLayout, token.paddingLG],
  );
  const resultStyle = useMemo<React.CSSProperties>(() => ({ width: '100%' }), []);
  const roleCardStyle = useMemo<React.CSSProperties>(
    () => ({ marginInline: 'auto', maxWidth: token.screenXS, width: '100%' }),
    [token.screenXS],
  );
  const hasMultipleUserRoles = userRoles.filter((role) => role.name !== '__union__').length > 1;

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  }, [retry]);

  if (access.status === 'allowed') {
    return <>{renderAllowed()}</>;
  }

  if (access.status === 'checking') {
    return (
      <div role="status" aria-label={t('Checking Portal access')} style={pageStyle}>
        <Spin size="large" />
      </div>
    );
  }

  if (access.status === 'denied' && access.denied) {
    return (
      <main style={pageStyle}>
        <Result
          style={resultStyle}
          status="403"
          title={t('No access to this Portal')}
          subTitle={t('Please switch to a role that can access this Portal.')}
          extra={
            hasMultipleUserRoles ? (
              <div style={roleCardStyle}>
                <PortalDeniedRoleSwitcher
                  apiClient={apiClient}
                  denied={access.denied}
                  reload={reload}
                  t={t}
                  userRoles={userRoles}
                />
              </div>
            ) : undefined
          }
        />
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Result
        style={resultStyle}
        status="error"
        title={t('Failed to check Portal access')}
        subTitle={t('Unable to verify whether the current role can access this Portal.')}
        extra={
          <Button loading={retrying} onClick={handleRetry} type="primary">
            {t('Retry')}
          </Button>
        }
      />
    </main>
  );
}

type PortalAccessRuntimeProviderProps = React.PropsWithChildren<{
  controller: PortalAccessController;
}>;

export function PortalAccessRuntimeProvider({ children, controller }: PortalAccessRuntimeProviderProps) {
  const app = useApp<Application>();
  const aclContext = useACLContext();
  const aclRefresh = aclContext?.refresh;
  const location = useLocation();
  useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const portal = controller.resolvePortal(location.pathname);
  const role = app.apiClient.auth.role;
  const routeKey = portal?.authCheck === false ? null : portal ? `${portal.portalName}\u0000${role || ''}` : null;
  const previousRouteKeyRef = useRef<string | null>();

  const runCheck = useCallback(() => {
    return aclRefresh?.() || controller.checkAccess();
  }, [aclRefresh, controller]);

  const retry = useCallback(
    (portalName: string) => {
      controller.invalidate(portalName, app.apiClient.auth.role);
      return runCheck();
    },
    [app.apiClient.auth.role, controller, runCheck],
  );

  useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;
    previousRouteKeyRef.current = routeKey;
    if (!portal || portal.authCheck === false || app.router.isSkippedAuthCheckRoute(location.pathname)) {
      return;
    }

    const changedPortal = previousRouteKey !== undefined && previousRouteKey !== routeKey;
    if (changedPortal) {
      controller.invalidate(portal.portalName, role);
    }
    if (!changedPortal && !controller.needsCheck(portal.portalName, role)) {
      return;
    }

    runCheck().catch((error) => {
      console.error('[NocoBase] Failed to refresh Portal access.', error);
    });
  }, [app, controller, location.pathname, portal, role, routeKey, runCheck]);

  const value = useMemo<PortalAccessRuntimeContextValue>(() => ({ controller, retry }), [controller, retry]);
  return <PortalAccessRuntimeContext.Provider value={value}>{children}</PortalAccessRuntimeContext.Provider>;
}

export function getPortalUserRoles(value: unknown, compile: (title?: string) => string): CurrentRoleOption[] {
  if (!value || typeof value !== 'object') {
    return [];
  }
  const roles = (value as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.flatMap((role) => {
    if (!role || typeof role !== 'object' || typeof (role as { name?: unknown }).name !== 'string') {
      return [];
    }
    const name = (role as { name: string }).name;
    const titleValue = (role as { title?: unknown }).title;
    const title = compile(typeof titleValue === 'string' ? titleValue : undefined);
    return [{ name, title: title || name }];
  });
}

export type MultiPortalLayoutAccessBoundaryProps = {
  portalUid: string;
  renderAllowed: () => React.ReactNode;
};

export function MultiPortalLayoutAccessBoundary({ portalUid, renderAllowed }: MultiPortalLayoutAccessBoundaryProps) {
  const runtime = useContext(PortalAccessRuntimeContext);
  const app = useApp<Application>();
  const currentUser = useCurrentUserContext();
  const t = useT();
  useSyncExternalStore(
    runtime?.controller.subscribe || subscribeNoop,
    runtime?.controller.getSnapshot || getEmptySnapshot,
    runtime?.controller.getSnapshot || getEmptySnapshot,
  );
  const portal = runtime?.controller.getPortalByUid(portalUid);

  if (!runtime || !portal || portal.authCheck === false) {
    return <>{renderAllowed()}</>;
  }

  const compile = (title?: string) => (title ? String(app.flowEngine.context.t(title)) : '');
  const user = currentUser?.data?.data;
  const userRoles = getPortalUserRoles(user, compile);
  const access = runtime.controller.getAccessState(portal.portalName, app.apiClient.auth.role);
  const retry = () => runtime.retry(portal.portalName);

  return (
    <PortalAccessView
      access={access}
      apiClient={app.apiClient as unknown as RoleSwitcherApiClient}
      renderAllowed={renderAllowed}
      retry={retry}
      t={(key) => String(t(key))}
      userRoles={userRoles}
    />
  );
}
