import { useClientApplication } from '@nocobase/app-client';
import {
  authorizationClientToken,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { DatabaseZapIcon } from 'lucide-react';
import { lazy, Suspense, useState, type ReactElement } from 'react';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { knowledgeIndexingFormsToken } from '../indexing/context.js';
import { Button } from './ui/button.js';

const Dialog = lazy(() =>
  import('./indexing-dialog.js').then((module) => ({
    default: module.KnowledgeIndexingDialog,
  })),
);
export interface KnowledgeIndexingEntryProps {
  readonly className?: string;
}
function AuthorizedEntry({
  className,
}: KnowledgeIndexingEntryProps): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const read = useCan({
    resource: { type: 'settings', id: 'kb.indexing' },
    action: 'read',
  });
  const [open, setOpen] = useState(false);
  if (!read.can) return null;
  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className={className}
        aria-label={t('indexing.title')}
        title={t('indexing.title')}
        onClick={() => setOpen(true)}
      >
        <DatabaseZapIcon />
      </Button>
      {open ? (
        <Suspense fallback={null}>
          <Dialog open onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
/** This is global administration, never a space's manage action or a space-specific configuration. */
export function KnowledgeIndexingEntry(
  props: KnowledgeIndexingEntryProps,
): ReactElement | null {
  const app = useClientApplication();
  return app.container.has(authorizationClientToken) &&
    app.container.has(knowledgeIndexingFormsToken) ? (
    <AuthorizedEntry {...props} />
  ) : null;
}
