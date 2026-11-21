// The plugin's public client surface. The default export is the registration factory an application lists in
// its client/plugins.ts.
export { default } from './plugin.js';
export type { UsersClientOptions } from './plugin.js';
export {
  INVITE_ROUTE_ID,
  USERS_ROUTE_ID,
  USER_CREATE_ROUTE_ID,
  USER_EDIT_ROUTE_ID,
} from './routes.js';
export { UsersClient } from './user-client.js';
export type {
  ManagedUser,
  UserRoleScopeOption,
  UserRoleValue,
  UsersOptions,
} from './user-client.js';
export {
  RoleSelection,
  UserForm,
  type UserFormOutletContext,
} from './pages/users/user-form.js';
