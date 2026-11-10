/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Re-export shared utilities from client-v2 so v1 client can use them
export {
  OFFICE_MIME_TYPES,
  OFFICE_EXTS,
  KKFILEVIEW_DEFAULT_EXTENSIONS,
  IMAGE_EXTS,
  getOfficeFileExt,
  resolveFileUrl,
  getOfficePreviewUrl,
  isOfficeFile,
  isImageOrPdf,
  isPrivateNetwork,
  safeBase64Encode,
  getFileNameWithExt,
  encodeUrlForKKFileView,
  getAbsoluteFileUrl,
  isMixedContent,
  getPreviewState,
  shouldPreviewFile,
} from '../client-v2/utils';

export type { OfficePreviewFileObject, OfficePreviewFile, PreviewWarning, PreviewState } from '../client-v2/utils';
