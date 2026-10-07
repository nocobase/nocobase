import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import { RouteDialog } from '../../components/route-dialog.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs.js';
import { UnsavedChangesBoundary } from '../../components/unsaved-changes.js';
import { useUnsavedChangesGuard } from '@nocobase/app-client';
import type { IntakeAiSourceData } from '../../../shared/intake-ai.js';
import { INTAKE_DRAFT_PARAM, IntakePanel } from '../intake/intake-panel.js';
import { INTAKE_JOB_PARAM } from '../intake/use-intake-ai.js';
import { NewIssueFooter, NewIssueForm } from './new-issue-form.js';

const TABS = ['ai', 'manual'] as const;
type NewIssueTab = (typeof TABS)[number];
const TAB_STORAGE_KEY = 'pm:new-issue-tab';

function storedTab(): NewIssueTab | null {
  try {
    const value = window.localStorage.getItem(TAB_STORAGE_KEY);
    return (TABS as readonly string[]).includes(value ?? '')
      ? (value as NewIssueTab)
      : null;
  } catch {
    return null;
  }
}

function storeTab(tab: NewIssueTab): void {
  try {
    window.localStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // Private windows may refuse storage; the tab is then chosen again next time.
  }
}

/**
 * The "New issue" dialog, as route `/issues/new` over the issue list or as `new-issue` under a project page's tab
 * (`/projects/:projectId/<tab>/new-issue`, the project preselected), with two ways to create, as the old NocoProject
 * had them: "AI draft" (`?tab=ai`, the intake: requirements split into a draft of issues created together,
 * `intake-panel.tsx`) and "Manual" (`?tab=manual`, one issue). `?tab=` picks the tab; otherwise `?draft=` (or `?job=`,
 * a request to AI) opens the AI tab on that draft, and else the tab last used, remembered in the browser. Both tabs
 * stay mounted, so switching keeps what either holds. Closing returns to the page underneath with its filters; it
 * cannot close while the issue is being created, and asks before discarding what was typed. Created, an issue opens
 * from the issue list and the dialog closes over a project page; a breakdown's sub-issues return to their issue.
 */
export default function NewIssuePage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Over a project's page the dialog stays there: created, it closes instead of opening the issue.
  const overProject = useParams().projectId !== undefined;
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const unsaved = useUnsavedChangesGuard();
  const asked = params.get('tab');
  const tab: NewIssueTab = (TABS as readonly string[]).includes(asked ?? '')
    ? (asked as NewIssueTab)
    : params.get(INTAKE_DRAFT_PARAM) || params.get(INTAKE_JOB_PARAM)
      ? 'ai'
      : (storedTab() ?? 'ai');
  const [wide, setWide] = useState(Boolean(params.get(INTAKE_DRAFT_PARAM)));
  const onSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  // Back to the list, without this dialog's own parameters.
  const listSearch = (() => {
    const next = new URLSearchParams(location.search);
    next.delete('tab');
    next.delete(INTAKE_DRAFT_PARAM);
    next.delete(INTAKE_JOB_PARAM);
    const search = next.toString();
    return search ? `?${search}` : '';
  })();
  const choose = (value: NewIssueTab) => {
    storeTab(value);
    const next = new URLSearchParams(params);
    next.set('tab', value);
    setParams(next, { replace: true });
  };
  return (
    <RouteDialog
      title={t('newIssue.title')}
      className={
        tab === 'manual'
          ? 'sm:max-w-xl'
          : wide
            ? 'sm:max-w-5xl'
            : 'sm:max-w-2xl'
      }
      closeTo={{ pathname: '..', search: listSearch }}
      beforeClose={() => !submittingRef.current && unsaved.confirmDiscard()}
      footer={
        tab === 'manual' ? <NewIssueFooter submitting={submitting} /> : null
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value: NewIssueTab) => choose(value)}
        className='gap-4'
      >
        <TabsList variant='line' aria-label={t('newIssue.tabsLabel')}>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`newIssue.tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value='manual' keepMounted>
          <UnsavedChangesBoundary guard={unsaved}>
            <NewIssueForm
              onSubmittingChange={onSubmittingChange}
              {...(overProject
                ? {
                    onCreated: () =>
                      void navigate(
                        { pathname: '..', search: listSearch },
                        { replace: true },
                      ),
                  }
                : {})}
            />
          </UnsavedChangesBoundary>
        </TabsContent>
        <TabsContent value='ai' keepMounted>
          <IntakePanel
            onDraftChange={setWide}
            onCreated={(plan) => {
              const issue = (
                plan.source.data as Partial<IntakeAiSourceData> | null
              )?.issue;
              void navigate(
                issue
                  ? `/issues/${encodeURIComponent(issue.identifier)}`
                  : { pathname: '..', search: listSearch },
              );
            }}
          />
        </TabsContent>
      </Tabs>
    </RouteDialog>
  );
}
