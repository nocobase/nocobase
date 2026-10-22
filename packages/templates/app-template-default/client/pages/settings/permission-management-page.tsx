import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { useNavigate, useResolvedPath, useLocation } from 'react-router';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';

export function PermissionManagementPage({
  tab,
  actions,
  children,
}: {
  tab: 'roles' | 'default-access';
  actions?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const activeRef = useRef<HTMLButtonElement>(null);
  const focusedRef = useRef(false);
  const current = useResolvedPath('.').pathname;
  const prefix = current.slice(0, current.lastIndexOf('/'));
  const roles = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'read',
  }).can;
  const defaults = useCan({
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: 'read',
  }).can;
  // Route changes remount each existing page; keep keyboard focus on the selected tab.
  useEffect(() => {
    if (
      !focusedRef.current &&
      location.state &&
      typeof location.state === 'object' &&
      Reflect.get(location.state, 'permissionTabNavigation') === true &&
      activeRef.current
    ) {
      const frame = requestAnimationFrame(() => {
        if (activeRef.current) {
          const selected = activeRef.current;
          if (
            !selected
              .closest('[role="tablist"]')
              ?.contains(selected.ownerDocument.activeElement)
          )
            selected.focus();
          focusedRef.current = true;
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [location.state, roles, defaults]);
  return (
    <PageContainer>
      <PageHeader
        title={t('settings.permissionManagement')}
        description={t(
          tab === 'roles'
            ? 'settings.rolesDescription'
            : 'settings.defaultAccess.description',
        )}
        actions={actions}
      />
      <Tabs
        className='gap-6'
        value={tab}
        onValueChange={(value) => {
          if (value === 'roles' || value === 'default-access')
            void navigate(`${prefix}/${value}`, {
              state: { permissionTabNavigation: true },
            });
        }}
      >
        <TabsList
          variant='line'
          aria-label={t('settings.permissionManagement')}
        >
          {roles && (
            <TabsTrigger
              ref={tab === 'roles' ? activeRef : undefined}
              value='roles'
            >
              {t('settings.roles')}
            </TabsTrigger>
          )}
          {defaults && (
            <TabsTrigger
              ref={tab === 'default-access' ? activeRef : undefined}
              value='default-access'
            >
              {t('settings.defaultAccess.title')}
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value={tab} className='space-y-6'>
          {children}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
