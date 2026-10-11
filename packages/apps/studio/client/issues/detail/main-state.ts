/**
 * What the parts of an issue's body share (`issue-main.tsx`): the files uploading now (the add bar's "Attachments", the
 * files section's "Upload" and dropping or pasting on the body all start one), and whether the search for the first
 * dependency is open.
 */
import {
  canEditIssues,
  canUploadAttachments,
  type IssuePageActions,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useState } from 'react';

export interface IssueMainState {
  /** Uploading needs `issues/edit` and the upload grant. */
  readonly canUpload: boolean;
  readonly uploading: readonly string[];
  readonly upload: (files: readonly File[]) => void;
  readonly addingDependency: boolean;
  readonly setAddingDependency: (adding: boolean) => void;
}

export function useIssueMainState(
  pageActions: IssuePageActions,
): IssueMainState {
  const viewer = useViewer();
  const [uploading, setUploading] = useState<readonly string[]>([]);
  const [addingDependency, setAddingDependency] = useState(false);
  return {
    canUpload: canEditIssues(viewer) && canUploadAttachments(viewer),
    uploading,
    upload: (files) => {
      setUploading(files.map((file) => file.name));
      void pageActions.uploadFiles(files).finally(() => setUploading([]));
    },
    addingDependency,
    setAddingDependency,
  };
}
