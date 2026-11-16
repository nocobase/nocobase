# Create dialog: `new.tsx`

Part of the [projects worked example](../example.md). **Depends on**: [form](project-form.md), [types](types.md); the `new` route under the list ([routes](../example.md#routes)).

Rules: [`overlay.md`](../overlay.md), ["Inside a RouteDialog" in `form.md`](../form.md#inside-a-routedialog), guidelines T3.1 (forms open in a `RouteDialog`), T3.4–T3.5 (buttons, submitting) and T3.9 (unsaved input).

```tsx
// client/pages/projects/new.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';

import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

import { ProjectForm } from './project-form.js';

const FORM_ID = 'project-new-form';

export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  // The state disables the buttons; the ref is what beforeClose reads, before the state has rendered.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const onSubmittingChange = (value: boolean) => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('projects.create.title')}
      className='sm:max-w-lg'
      // No closing while the request runs (T3.5); unsaved input is the FeedbackForm's job (T3.9).
      beforeClose={() => !submittingRef.current}
      footer={<Footer submitting={submitting} />}
    >
      <Body onSubmittingChange={onSubmittingChange} />
    </RouteDialog>
  );
}

// useRouteOverlay() works only inside the RouteDialog, so the body and the footer are components of their own.
function Body({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  // The form announced the new project, so the list behind updates by itself; only close.
  return (
    <ProjectForm
      formId={FORM_ID}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => void close()}
    />
  );
}

function Footer({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        variant='outline'
        disabled={submitting}
        onClick={() => void close()}
      >
        {t('projects.actions.cancel')}
      </Button>
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {t(submitting ? 'projects.actions.saving' : 'projects.actions.create')}
      </Button>
    </>
  );
}
```

- **Form in `children`, buttons in `footer`**: the submit button sits outside the `<form>` and names it with `form={FORM_ID}`; Enter in a field still submits. Cancel comes first, the submit button names the action ("Create").
- **Success**: the form already showed the toast and announced the change; the dialog only closes, and focus returns to the "New project" button. A long form scrolls inside the dialog, which also fits a phone.
