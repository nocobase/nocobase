import { z } from 'zod';

export const KNOWLEDGE_CHAT_SOURCE = 'examples-knowledge';
export const KNOWLEDGE_CHAT_SCOPE = 'examples-knowledge';
export const knowledgeChatVariables = z.object({
  knowledgeRetrieval: z.enum(['on-demand', 'always']),
});
export type KnowledgeRetrievalPolicy = z.infer<
  typeof knowledgeChatVariables
>['knowledgeRetrieval'];
