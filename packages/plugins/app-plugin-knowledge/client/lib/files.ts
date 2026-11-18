/** A knowledge file as the preview components read it, saved, and whether it can be previewed. */
import type { KnowledgeFileInfo } from '../../shared/knowledge.js';
import type { FileRecord } from '../extensions/file-preview/file-preview.js';
import { resolveFilePreviewKind } from '../extensions/file-preview/lib/file-preview.js';

/** A file as the preview components read it. */
export function recordOf(file: KnowledgeFileInfo, at: string): FileRecord {
  return {
    id: file.id,
    disk: '',
    key: '',
    filename: file.filename,
    ext: file.ext,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: at,
    updatedAt: at,
    contentUrl: file.contentUrl,
  };
}

/** Saves the file under its own name. */
export function downloadFile(file: KnowledgeFileInfo): void {
  const link = document.createElement('a');
  link.href = file.downloadUrl;
  link.download = file.filename;
  link.rel = 'noopener';
  link.click();
}

/** Whether the file can be previewed at all: types shown in the browser, not ones only stored. */
export function canPreview(file: KnowledgeFileInfo): boolean {
  return resolveFilePreviewKind(recordOf(file, '')) !== 'unsupported';
}

/** Whether the file is previewed as Markdown. */
export function isMarkdown(file: KnowledgeFileInfo): boolean {
  return resolveFilePreviewKind(recordOf(file, '')) === 'markdown';
}
