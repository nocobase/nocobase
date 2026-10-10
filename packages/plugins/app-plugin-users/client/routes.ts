import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

export const INVITE_ROUTE_ID = '@nocobase/app-plugin-users:invite';

/**
 * The page an invitation email links to. Public (`optional`) because the invitee has no account yet; the token in the
 * path identifies the invitation. New accounts also prove mailbox ownership; existing accounts sign in.
 */
const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'invite',
    path: '/invite/:token',
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/accept-invitation-page.js'),
  },
]);

export default routes;
