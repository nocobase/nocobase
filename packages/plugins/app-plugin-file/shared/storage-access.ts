/**
 * The grants of the file storage settings page, shared by the server routes and the client route. The page grant opens
 * the page and reads the storage; the settings action runs a check, which writes a temporary file to a disk.
 */
export const FILE_STORAGE_PAGE_ID = 'file-storage';
export const FILE_STORAGE_SETTINGS_ID = 'file-storage';

export const FILE_STORAGE_PAGE: {
  readonly resource: { readonly type: 'page'; readonly id: string };
  readonly action: 'access';
} = Object.freeze({
  resource: Object.freeze({ type: 'page', id: FILE_STORAGE_PAGE_ID } as const),
  action: 'access',
} as const);

export const FILE_STORAGE_CHECK: {
  readonly resource: { readonly type: 'settings'; readonly id: string };
  readonly action: 'check';
} = Object.freeze({
  resource: Object.freeze({
    type: 'settings',
    id: FILE_STORAGE_SETTINGS_ID,
  } as const),
  action: 'check',
} as const);
