export const getConnectionPath = (name: string | number) => `/admin/settings/data-source-manager/${name}`;
export const getConnectionCollectionPath = (name: string | number) =>
  `/admin/settings/data-source-manager/${name}/collections`;
export const getConnectionPermissionPath = (name: string | number) =>
  `/admin/settings/data-source-manager/${name}/permissions`;
