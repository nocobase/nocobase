# A long form on its own page: `create.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [form](project-form.md), [types](types.md), [copy](copy.md); the route entry below.

Rules: guidelines T3.1 and T3.9, ["Where forms go" in `form.md`](../form.md#where-forms-go), and [section 5 of `child-routes.md`](../child-routes.md#5-covering-child-pages-routechildpage). The frame for a form too long for a dialog: a covering child page of the list, with the buttons below the form. `ProjectForm` stands in for the long form here; group a real one's fields with `FieldSet`. Declare it beside `new` in the projects route's `children`: `{ name: 'project-create', path: 'create', authz: 'skip', breadcrumb: { title: 'projects.create.title' }, componentLoader: () => import('./pages/projects/create.js') }`. The shell shows Projects → Create project and supplies the mobile parent arrow, restoring the list's recorded query ([section 7 of `page.md`](../page.md#7-back-button-and-breadcrumbs)); `project-create` joins the route test's grant list as `null` ([section 12 of `page.md`](../page.md#12-update-the-route-test)).

```tsx
// client/pages/projects/create.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { useResolvedPath, useNavigate, useOutletContext } from 'react-router';

import { useAncestorSearch } from '../../routing/route-context.js';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';

import { ProjectForm } from './project-form.js';
import { PROJECT_LIST_KEYS, type ProjectsOutletContext } from './types.js';

const FORM_ID = 'project-create-form';

/** Route /projects/create: covers the list, which keeps its filters and scroll position underneath. */
export default function CreateProjectPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const owner = useResolvedPath('..').pathname;
  // The list's query, also after a reload of this page: the list links here with its own query.
  const parentSearch = useAncestorSearch(owner, PROJECT_LIST_KEYS);
  // The list stays mounted underneath with its old rows, so it is refreshed through the outlet context (R2, T3.7).
  const { reload } = useOutletContext<ProjectsOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // A page has no beforeClose: while there are unsaved changes, ask before a reload or closing the tab (T3.9).
  // In-app navigation is not guarded; record that under "Guideline trade-offs" in the design.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader
          title={t('projects.create.title')}
          description={t('projects.form.description')}
        />
        {/* A page mainly for a form limits its width (guideline L4). */}
        <div className='flex max-w-2xl flex-col gap-6'>
          <ProjectForm
            formId={FORM_ID}
            onSubmittingChange={setSubmitting}
            onDirtyChange={setDirty}
            onSubmitted={(project) => {
              // ProjectForm has shown the success toast. Refresh the list, then open the new record over it.
              // Replace the history entry, as closing an overlay does, so Back does not reopen an empty form.
              reload();
              void navigate(
                { pathname: `../${project.id}`, search: parentSearch },
                { replace: true },
              );
            }}
          />
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='outline'
              disabled={submitting}
              onClick={() => {
                void navigate(
                  { pathname: owner, search: parentSearch },
                  { replace: true },
                );
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='submit' form={FORM_ID} disabled={submitting}>
              {submitting ? <Spinner data-icon='inline-start' /> : null}
              {submitting ? t('actions.saving') : t('actions.create')}
            </Button>
          </div>
        </div>
      </PageContainer>
    </RouteChildPage>
  );
}
```

## Independent edit pages

This example is an independent covering page: Cancel returns to its list with the recorded list query, and it has no Close action. Create/edit dialogs use the separate [create dialog](create-dialog.md) and [edit dialog](edit-dialog.md) patterns, whose Cancel closes the dialog. For an independent edit page, use the [detail → edit navigation pattern](../navigation.md): declare list → record detail → Edit before loading, keep detail as the edit parent regardless of its internal tabs, and do not add a second page BackButton under the shell.
