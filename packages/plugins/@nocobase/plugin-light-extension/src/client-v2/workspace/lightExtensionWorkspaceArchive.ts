/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

import type { LightExtensionFileEncoding } from '../../shared/types';

export interface LightExtensionWorkspaceArchiveFile {
  path: string;
  content: string;
  encoding?: LightExtensionFileEncoding;
}

export async function createLightExtensionWorkspaceArchive(
  files: readonly LightExtensionWorkspaceArchiveFile[],
): Promise<Blob> {
  const zip = new JSZip();
  [...files]
    .sort((left, right) => left.path.localeCompare(right.path))
    .forEach((file) =>
      zip.file(file.path, file.content, file.encoding === 'base64' ? { base64: true, binary: true } : undefined),
    );

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });
}

export function readLightExtensionWorkspaceArchive(file: Blob, errorMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const separatorIndex = result.indexOf(',');
      if (separatorIndex < 0) {
        reject(new Error(errorMessage));
        return;
      }
      resolve(result.slice(separatorIndex + 1));
    };
    reader.onerror = () => reject(new Error(errorMessage));
    reader.readAsDataURL(file);
  });
}

export function buildLightExtensionWorkspaceArchiveFileName(label: string | undefined): string {
  const baseName = (label || 'light-extension')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${baseName || 'light-extension'}.zip`;
}

export function downloadLightExtensionWorkspaceArchive(blob: Blob, fileName: string): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return false;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
