export const userRoutes = {
  list: "/users",
  create: "/users/create",
  edit: "/users/edit/:id",
  show: "/users/show/:id",
  role: "/users/roles/:roleName",
  nestedEdit: "/users/show/:id/edit",
  nestedRole: "/users/show/:id/roles/:roleName",
} as const;

export const getUserEditPath = (id: string | number) =>
  `/users/edit/${encodeURIComponent(id)}`;

export const getUserShowPath = (id: string | number) =>
  `/users/show/${encodeURIComponent(id)}`;

export const getRolePath = (roleName: string) =>
  `/users/roles/${encodeURIComponent(roleName)}`;

export const getUserRolePath = (id: string | number, roleName: string) =>
  `/users/show/${encodeURIComponent(id)}/roles/${encodeURIComponent(roleName)}`;
