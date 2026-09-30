# A long form on its own page: `create.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [form](project-form.md), [types](types.md), [copy](copy.md); the route entry below.

Rules: guidelines T3.1 and T3.9, ["Where forms go" in `form.md`](../form.md#where-forms-go), and [section 5 of `child-routes.md`](../child-routes.md#5-covering-child-pages-routechildpage). The frame for a form too long for a dialog: a covering child page of the list, with the buttons below the form. `ProjectForm` stands in for the long form here; group a real one's fields with `FieldSet`. Declare it beside `new` in the projects route's `children`: `{ name: 'project-create', path: 'create', authz: 'skip', componentLoader: () => import('./pages/projects/create.js') }`. The back button above its title returns to the list ([section 7 of `page.md`](../page.md#7-back-button-and-breadcrumbs)); `project-create` joins the route test's grant list as `null` ([section 12 of `page.md`](../page.md#12-update-the-route-test)).

```tsx
// client/pages/projects/create.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';

import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { ProjectForm } from './project-form.js';
import type { ProjectsOutletContext } from './types.js';

const FORM_ID = 'project-create-form';

/** Route /projects/create: covers the list, which keeps its filters and scroll position underneath. */
export default function CreateProjectPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
        {/* Returns to the list with its search and filters, like Cancel. */}
        <BackButton />
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
                { pathname: `../${project.id}`, search: location.search },
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
                  { pathname: '..', search: location.search },
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
