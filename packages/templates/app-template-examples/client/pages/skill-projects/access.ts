import type { AuthorizationCheck } from '@nocobase/app-plugin-authorization/client';

/**
 * The page grant `server/routes/skill-projects.ts` requires on every request, reads and writes alike: this learning
 * dataset has no separate create, update or delete permission, so the one page grant shows all three actions.
 * A feature whose server declares action permissions names one check per action here, matching the server's.
 */
const pageAccess: AuthorizationCheck = {
  resource: { type: 'page', id: 'skill-projects' },
  action: 'access',
};

/** What `useCan` checks before showing Create, Edit and Delete; the server checks every request again. */
export const projectPermissions = {
  create: pageAccess,
  update: pageAccess,
  delete: pageAccess,
} as const;
