import { useTranslation } from '@nocobase/i18n/client';
import { Suspense, type ReactElement } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import {
  SettingsDialog,
  SettingsDialogSection,
} from '@/components/settings-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
  ACCOUNT_CATEGORIES,
  ACCOUNT_CATEGORY_GROUPS,
  ACCOUNT_PARAM,
  accountCategory,
  withAccountCategory,
} from './categories.js';

/**
 * The person's own settings, a dialog over whatever page is open (the UI Library's `settings-dialog`): the categories
 * (`categories.ts`) in a grouped sidebar on the left, the open one on the right. It opens from the account menu and
 * from `?account=<id>` on any page, each category a link to its own address; `/account/<id>` leads there
 * (`pages/account/index.tsx`).
 */
export function AccountSettingsDialog(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get(ACCOUNT_PARAM);
  const current = accountCategory(id);
  const to = (category: string | null) => ({
    pathname: location.pathname,
    search: withAccountCategory(location.search, category),
    hash: location.hash,
  });
  const groups = Object.entries(ACCOUNT_CATEGORY_GROUPS).map(
    ([group, label]) => ({
      id: group,
      label: t(label),
      items: ACCOUNT_CATEGORIES.filter(
        (category) => category.group === group,
      ).map((category) => ({
        id: category.id,
        label: t(category.title),
        icon: category.icon,
      })),
    }),
  );
  const Content = current.component;

  return (
    <SettingsDialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) void navigate(to(null), { replace: true });
      }}
      title={t('accountSettings.title')}
      description={t('accountSettings.description')}
      navigationLabel={t('accountSettings.categoriesLabel')}
      groups={groups}
      activeId={current.id}
      renderItem={(item) => <Link to={to(item.id)} replace />}
    >
      <SettingsDialogSection
        key={current.id}
        title={current.heading === false ? undefined : t(current.title)}
        description={current.description ? t(current.description) : undefined}
        data-account-category={current.id}
      >
        <Suspense fallback={<Skeleton className='h-48' />}>
          <Content />
        </Suspense>
      </SettingsDialogSection>
    </SettingsDialog>
  );
}
