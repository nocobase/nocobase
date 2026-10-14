/**
 * The knowledge base's inbox entries (source `knowledge`, sent by `server/knowledge/inbox.ts`):
 *
 * - `knowledge_proposal`: a decision for the space's decider. The detail pane loads the proposal and shows its reason
 *   and diff (two diffs when the document moved on since), and accepts or rejects it through
 *   the knowledge plugin's `/api/knowledge/proposals/:proposalId`, which settles every decider's card;
 * - `knowledge_decided`: the person a proposal was made for hears how it was decided.
 *
 * Every item opens the proposal in its space's knowledge view.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { BookCheckIcon, BookOpenTextIcon, type LucideIcon } from 'lucide-react';

import { useKnowledgeProposal } from '@nocobase/app-plugin-knowledge/client/api';
import {
  isSettled,
  kindOf,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import {
  defineInboxRenderer,
  type InboxCanAct,
} from '@/extensions/nocobase-inbox/registry';
import {
  KnowledgeActions,
  KnowledgeBody,
  type KnowledgeModel as Model,
} from './knowledge-parts.js';
import { field } from './releases.locales.js';

const ICONS: Readonly<Record<string, LucideIcon>> = {
  knowledge_proposal: BookOpenTextIcon,
  knowledge_decided: BookCheckIcon,
};

const typeOf = (entry: InboxEntry) =>
  entry.notice?.type ?? 'knowledge_proposal';

function useModel(entry: InboxEntry): Model {
  return useKnowledgeProposal(
    field(entry, 'proposalId') ?? entry.notice?.decisionKey ?? null,
  );
}

function useCanAct(entry: InboxEntry, model: Model): InboxCanAct {
  const { t } = useTranslation();
  if (
    kindOf(entry) !== 'decision' ||
    isSettled(entry) ||
    typeOf(entry) !== 'knowledge_proposal'
  )
    return { state: 'none' };
  if (model.isPending) return { state: 'loading' };
  if (!model.data || model.data.status !== 'pending') return { state: 'none' };
  return model.data.canDecide
    ? { state: 'yes' }
    : { state: 'no', reason: t('knowledge.proposals.readOnly') };
}

export const knowledgeRenderer = defineInboxRenderer<Model>({
  source: 'knowledge',
  types: ['knowledge_proposal', 'knowledge_decided'],
  icon: (entry) => ICONS[typeOf(entry)] ?? BookOpenTextIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        typeOf(entry) === 'knowledge_decided'
          ? t('knowledge.inbox.decided')
          : where === 'detail'
            ? t('knowledge.inbox.proposalDetail')
            : t('knowledge.inbox.proposal'),
      text: (entry) => {
        const title = field(entry, 'title') ?? '';
        if (typeOf(entry) === 'knowledge_decided') {
          const decision = field(entry, 'decision') ?? 'accepted';
          return {
            title: t('knowledge.inbox.decidedTitle', {
              decider:
                field(entry, 'deciderName') ?? t('knowledge.inbox.someone'),
              outcome: t(`knowledge.proposals.outcomes.${decision}`),
              title,
            }),
            sentence: field(entry, 'comment'),
          };
        }
        const proposer =
          field(entry, 'proposerName') ?? t('knowledge.inbox.someone');
        const kind = field(entry, 'kind');
        return {
          title: t(
            kind === 'create'
              ? 'knowledge.inbox.proposalNewTitle'
              : kind === 'verify'
                ? 'knowledge.inbox.proposalVerifyTitle'
                : 'knowledge.inbox.proposalTitle',
            { proposer, title },
          ),
          sentence: field(entry, 'reason'),
        };
      },
      outcome: (outcome) =>
        t(`knowledge.proposals.outcomes.${outcome}`, { defaultValue: outcome }),
      open: t('knowledge.inbox.open'),
    };
  },
  useModel,
  useCanAct,
  Actions: KnowledgeActions,
  Body: KnowledgeBody,
  context: (entry) => {
    const docId = field(entry, 'docId');
    return docId ? { ids: [docId] } : {};
  },
});
