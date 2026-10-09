# Create dialog: `new.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [form](project-form.md), [types](types.md), [copy](copy.md); its child route in [section 1 of `page.md`](../page.md#1-declare-the-route).

Rules: [section 2 of `overlay.md`](../overlay.md#2-overlays-as-child-routes), and ["Inside a RouteDialog" in `form.md`](../form.md#inside-a-routedialog).

```tsx
// client/pages/projects/new.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

import { ProjectForm } from './project-form.js';
import type { ProjectsOutletContext } from './types.js';

const FORM_ID = 'project-new-form';

export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  // The state disables the buttons; the ref is for beforeClose to read: when close() runs right after a successful save, the new state value has not rendered yet.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  return (
    <RouteDialog
      title={t('projects.create.title')}
      description={t('projects.form.description')}
      className='sm:max-w-lg'
      // No closing while submitting: the × button, Esc, clicking the backdrop and close() all go through beforeClose first (guideline T3.5).
      beforeClose={() => !submittingRef.current}
      footer={<NewProjectFooter submitting={submitting} />}
    >
      <NewProjectBody onSubmittingChange={handleSubmittingChange} />
    </RouteDialog>
  );
}

// useRouteOverlay() can only be called in a component inside RouteDialog, so the form and the footer buttons each get their own wrapper component.
function NewProjectBody({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<ProjectsOutletContext>();
  return (
    <ProjectForm
      formId={FORM_ID}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}

function NewProjectFooter({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={submitting}
        onClick={() => void close()}
      >
        {t('actions.cancel')}
      </Button>
      {/* The button is outside the <form> and linked through the form attribute; while it is disabled, Enter does not submit either. */}
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : t('actions.create')}
      </Button>
    </>
  );
}
```

- **Form in `children`, buttons in `footer`**: the buttons are outside the `<form>`, so give the `<form>` an `id` and write the submit button as `type='submit' form={FORM_ID}`; pressing Enter in the form still submits. Make `FORM_ID` a module constant; it must be unique on the page.
- **Button order**: "Cancel" on the left and the submit button on the right, grouped at the right edge (`footer` has `justify-end` built in); the submit button names the specific action, "Create" (guidelines T3.4 and C3). While submitting, both buttons are disabled and the submit button shows a `Spinner` (guideline T3.5).
- **Success**: `ProjectForm` shows the success message, so the page must not show a toast as well. The page first calls `reload()` to refresh the list behind it, then `close()` (guideline T3.7). After closing, focus returns to the "New project" button.
- The 3-field form narrows the dialog with `className='sm:max-w-lg'`.
