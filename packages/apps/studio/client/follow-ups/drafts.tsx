/** Lightweight upload hosts preserve the original upload lifecycle without mounting hidden issues. */
import {
  useAttachmentUploads,
  type AttachmentUploads,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  useEffect,
  memo,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type ReactElement,
} from 'react';

import type { ComposerSession } from '../components/composer-session.js';
import { DraftContext, IssueDrafts } from './draft-state.js';

export function IssueDraftProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [drafts] = useState(() => new IssueDrafts());
  useSyncExternalStore(drafts.subscribe, drafts.snapshot, drafts.snapshot);
  return (
    <DraftContext.Provider value={drafts}>
      {[...drafts.sessions].map(([id, session]) => (
        <UploadHost key={id} session={session} />
      ))}
      {children}
    </DraftContext.Provider>
  );
}

const UploadHost = memo(function UploadHost({
  session,
}: {
  readonly session: ComposerSession;
}): null {
  const uploads = useAttachmentUploads();
  useEffect(() => {
    session.setter<AttachmentUploads | null>('issueUploads', null)(uploads);
  }, [session, uploads]);
  return null;
});
