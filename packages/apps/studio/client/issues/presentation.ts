import { createContext } from 'react';
import type { IssueTableProps } from '../components/issue-table.js';
import type { IssuesPage } from './use-issues-page.js';

/** Optional personal-workspace presentation; data, sorting and tree queries remain shared. */
export interface IssuePresentation {
  readonly compact?: boolean;
  readonly selectedId?: string | null;
  readonly onPreview?: (id: string) => void;
  readonly rowAction?: IssueTableProps['rowAction'];
  readonly reportPage?: (
    page: Pick<IssuesPage, 'view' | 'queryIdentity'>,
  ) => void;
}
export const IssuePresentationContext = createContext<IssuePresentation>({});
