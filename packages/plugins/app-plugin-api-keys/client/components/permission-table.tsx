import {
  loadKeyPermissionEditor,
  type KeyPermissionEditorProps,
} from '@nocobase/app-plugin-authorization/client/settings';
import {
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactElement,
} from 'react';

import { Skeleton } from '#components/ui/skeleton';

// The authorization plugin's permission table, loaded when a page shows it.
const Editor: LazyExoticComponent<ComponentType<KeyPermissionEditorProps>> =
  lazy(() =>
    loadKeyPermissionEditor().then((module) => ({
      default: module.KeyPermissionEditor,
    })),
  );

/** The role editor's table, limited to what may be given a key; see `KeyPermissionEditor`. */
export function PermissionTable(props: KeyPermissionEditorProps): ReactElement {
  return (
    <Suspense fallback={<Skeleton className='h-64 w-full' />}>
      <Editor {...props} />
    </Suspense>
  );
}
