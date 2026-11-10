import { ClientApplicationContext } from '@nocobase/app-client';
import { useContext } from 'react';
import { fileUploadLimitsToken } from './token.js';
import {
  DEFAULT_FILE_UPLOAD_LIMIT,
  type DriveUploadLimit,
} from '../shared/upload-limits.js';

export function useFileUploadLimit(disk?: string): DriveUploadLimit {
  const app = useContext(ClientApplicationContext);
  if (!app?.services.has(fileUploadLimitsToken))
    return DEFAULT_FILE_UPLOAD_LIMIT;
  const limits = app.services.resolve(fileUploadLimitsToken);
  const selected = disk ?? limits.default;
  const limit = Object.hasOwn(limits.disks, selected)
    ? limits.disks[selected]
    : undefined;
  if (!limit) throw new Error(`Drive disk "${selected}" is not configured.`);
  return limit;
}
