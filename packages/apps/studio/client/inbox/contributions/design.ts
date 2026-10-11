/**
 * The owner's card of a design proposal (`design_review`, sent by `server/agents/design.ts` through Studio's inbox port
 * as a projects notice about the issue), titled "Design proposal to review": the proposal in
 * full with "Approve for development" and "Send back" (`agents/design/`), decided through
 * `/api/designProposals/:issueId`. The server settles the card when the issue leaves Proposal review.
 */
import { DESIGN_REVIEW_TYPE } from '../../../shared/design.js';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { DesignBody, DesignHere } from './design-parts.js';
import { projectsParts, type ProjectsModel } from './projects.js';

// The decision is in the body, next to the document it is about: none of the approval parts in the header.
const {
  useCanAct: _approval,
  Actions: _approve,
  ...issueParts
} = projectsParts;

/** The card, as the projects plugin's issue cards read, with the proposal as its body. Listed before `projectsRenderer`. */
export const designRenderer = defineInboxRenderer<ProjectsModel>({
  ...issueParts,
  types: [DESIGN_REVIEW_TYPE],
  Body: DesignBody,
  // On the issue page the proposal and its decision are a section of their own (`agents/design/section.tsx`).
  Here: DesignHere,
});
