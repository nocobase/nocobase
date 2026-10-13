/**
 * What an issue's feed (`issue-feed.tsx`) and its composer (`issue-composer.tsx`) share wherever they are placed: the
 * projects plugin's comment actions, the comment being answered and the editor to focus for it, and the mention search
 * (agents and other kinds, and the project's members). Without `issues/comment` nobody may reply or post.
 */
import {
  canComment,
  useIssueCommentActions,
  useKindLabel,
  useMentionSearch,
  type IssueComment,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  pmKeys,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { RichTextHandle } from '@/components/rich-text-editor';

import { useIssueDraft, useDraftField } from '../../follow-ups/draft-state.js';

import { issueMentionCandidates } from '../detail/mention-candidates.js';
import { ConversationContext } from './conversation-state.js';

export function IssueConversation({
  detail,
  detailKey,
  children,
}: {
  readonly detail: IssueDetail;
  readonly detailKey: QueryKey;
  readonly children: ReactNode;
}): ReactElement {
  const api = usePmApi();
  const viewer = useViewer();
  const kindLabel = useKindLabel();
  const actions = useIssueCommentActions(detail.id, detailKey);
  const mentionSearch = useMentionSearch(detail.id);
  const [memberSearchFailed, setMemberSearchFailed] = useState(false);
  const [mentionSearchRevision, setMentionSearchRevision] = useState(0);
  const editorRef = useRef<RichTextHandle>(null);
  const draft = useIssueDraft(detail.id);
  const [replyTo, setReplyTarget] = useDraftField<Pick<IssueComment, 'id' | 'authorName'> | null>(
    draft,
    'replyTo',
    null,
  );
  const setReplyTo = useCallback(
    (comment: Pick<IssueComment, 'id' | 'authorName'> | null): void => {
      // A reply selected while sending must not be silently cleared by the pending submission.
      if (comment && draft?.read('pending', false)) return;
      setReplyTarget(comment);
    },
    [draft, setReplyTarget],
  );
  const [composerOpen, setComposerOpen] = useDraftField(
    draft,
    'composerOpen',
    false,
  );
  const openComposer = useCallback(() => {
    setComposerOpen(true);
    // The editor mounts with the open composer.
    requestAnimationFrame(() => editorRef.current?.focus());
  }, [setComposerOpen]);
  const project = useQuery({
    queryKey: pmKeys.project(detail.projectId ?? ''),
    queryFn: () => {
      if (!detail.projectId) throw new Error('Issue has no project');
      return api.project(detail.projectId);
    },
    enabled: Boolean(detail.projectId),
  });
  const projectData = project.data;
  const refetchProject = project.refetch;
  const searchMentions = useCallback(
    async (query: string) => {
      const candidates = await mentionSearch(query);
      let projectDetail = projectData;
      if (detail.projectId && !projectDetail) {
        projectDetail = (await refetchProject()).data;
      }
      if (detail.projectId && !projectDetail) {
        setMemberSearchFailed(true);
        return candidates
          .filter((candidate) => candidate.kind !== 'user')
          .map((candidate) => ({
            ...candidate,
            kindLabel: kindLabel(candidate.kind),
          }));
      }
      setMemberSearchFailed(false);
      return issueMentionCandidates(
        query,
        candidates,
        projectDetail?.members ?? [],
        kindLabel,
      );
    },
    [detail.projectId, kindLabel, mentionSearch, projectData, refetchProject],
  );
  const retryMembers = useCallback(() => {
    void refetchProject().then((result) => {
      if (result.data) {
        setMemberSearchFailed(false);
        setMentionSearchRevision((revision) => revision + 1);
      }
    });
  }, [refetchProject]);
  const mayComment = canComment(viewer);
  const value = useMemo(
    () => ({
      draft,
      detail,
      detailKey,
      actions,
      mayComment,
      editorRef,
      replyTo,
      setReplyTo,
      searchMentions,
      mentionSearchRevision,
      memberSearchFailed,
      retryingMembers: project.isFetching,
      retryMembers,
      composerOpen,
      setComposerOpen,
      openComposer,
    }),
    [
      draft,
      detail,
      detailKey,
      actions,
      mayComment,
      replyTo,
      setReplyTo,
      setComposerOpen,
      searchMentions,
      mentionSearchRevision,
      memberSearchFailed,
      project.isFetching,
      retryMembers,
      composerOpen,
      openComposer,
    ],
  );
  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}
