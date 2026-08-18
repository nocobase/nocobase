/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readRunJSWorkspaceZip } from '@nocobase/runjs/workspace/server';
import { TextDecoder } from 'util';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateDiagnostic, JsTemplateTreeEntryInput } from '../../shared/types';
import { JsTemplateValidator, hasErrorDiagnostic } from './JsTemplateValidator';

const ZIP_FILE_MODE = '100644';

export async function parseJsTemplateSourceArchive(
  zipBase64: string,
  validator: JsTemplateValidator,
): Promise<JsTemplateTreeEntryInput[]> {
  const limits = validator.getCapabilities().limits;
  let parsedFiles;
  try {
    parsedFiles = await readRunJSWorkspaceZip(zipBase64, {
      limits: {
        maxCompressedBytes: limits.maxZipBytes,
        maxFiles: limits.maxProjectFiles,
        maxFileBytes: limits.maxFileBytes,
        maxTotalBytes: limits.maxProjectBytes,
        maxCompressionRatio: limits.maxZipCompressionRatio,
      },
      pathMode: 'archive',
      stripSingleTopLevelDirectory: true,
      ignoreMetadata: true,
    });
  } catch (error) {
    throw mapRunJSArchiveError(error);
  }

  if (!parsedFiles.length) {
    throwArchiveValidation('zip_empty', 'ZIP archive does not contain source files');
  }

  const files = parsedFiles.map((file) => ({
    path: file.path,
    content: file.content || '',
    size: Buffer.byteLength(file.content || '', 'utf8'),
    language: languageFromPath(file.path),
    mode: ZIP_FILE_MODE,
  }));
  const diagnostics = validator.validateInitialFiles({ files });
  if (hasErrorDiagnostic(diagnostics)) {
    throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template ZIP source is invalid', {
      status: 422,
      details: { diagnostics },
    });
  }
  return files;
}

export function isStrictUtf8Text(content: string): boolean {
  return (
    !content.includes('\0') &&
    new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(content, 'utf8')) === content
  );
}

function mapRunJSArchiveError(error: unknown): JsTemplateError {
  if (!isRunJSArchiveError(error)) {
    return archiveError('zip_invalid', 'Unable to read ZIP archive');
  }
  const message = error.message;
  if (error.code === 'TEXT_ENCODING_INVALID') {
    return archiveError('zip_file_not_utf8', 'ZIP source files must be UTF-8 text', readDetailPath(error.details));
  }
  if (error.code === 'FILE_TOO_LARGE') {
    return archiveError('file_size_limit_exceeded', 'ZIP source file is too large', readDetailPath(error.details));
  }
  if (error.code === 'REPO_LIMIT_EXCEEDED') {
    if (message.includes('compression ratio')) {
      return archiveError('zip_compression_ratio_too_high', 'ZIP compression ratio is too high');
    }
    if (message.includes('more than')) {
      return archiveError('project_file_count_exceeded', 'ZIP archive contains too many source files');
    }
    if (message.startsWith('ZIP size')) {
      return archiveError('zip_too_large', 'ZIP archive exceeds the compressed size limit');
    }
    return archiveError('project_budget_limit_exceeded', 'ZIP source budget is exceeded');
  }
  if (message.includes('symbolic link')) {
    return archiveError('zip_symlink_not_allowed', 'ZIP archive cannot contain symbolic links');
  }
  if (message.includes('Duplicate file path')) {
    return archiveError('zip_duplicate_path', 'ZIP archive contains duplicate source paths', readQuotedPath(message));
  }
  if (message.includes('ZIP is invalid')) {
    return archiveError('zip_invalid', 'Unable to read ZIP archive');
  }
  if (error.code === 'RUNJS_SOURCE_LOCATOR_INVALID') {
    return archiveError('zip_base64_invalid', 'ZIP archive must be valid base64 data');
  }
  return archiveError('zip_path_invalid', 'ZIP archive contains an invalid source path', readDetailPath(error.details));
}

function isRunJSArchiveError(
  error: unknown,
): error is { code: string; message: string; details?: Record<string, unknown> } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string' &&
      'message' in error &&
      typeof error.message === 'string',
  );
}

function archiveError(code: string, message: string, path?: string): JsTemplateError {
  const diagnostic: JsTemplateDiagnostic = {
    code,
    severity: 'error',
    message,
    ...(path ? { path } : {}),
  };
  return new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', message, {
    status: 422,
    details: { diagnostics: [diagnostic] },
  });
}

function throwArchiveValidation(code: string, message: string, path?: string): never {
  throw archiveError(code, message, path);
}

function readDetailPath(details: unknown): string | undefined {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return undefined;
  }
  const path = (details as Record<string, unknown>).path;
  return typeof path === 'string' ? path : undefined;
}

function readQuotedPath(message: string): string | undefined {
  const match = message.match(/"([^"]+)"/u);
  return match?.[1];
}

function languageFromPath(path: string): string {
  const extension = path.slice(path.lastIndexOf('.')).toLowerCase();
  if (extension === '.ts' || extension === '.tsx') {
    return 'typescript';
  }
  if (extension === '.js' || extension === '.jsx') {
    return 'javascript';
  }
  if (extension === '.json') {
    return 'json';
  }
  if (extension === '.md') {
    return 'markdown';
  }
  if (extension === '.html' || extension === '.htm') {
    return 'html';
  }
  if (extension === '.css') {
    return 'css';
  }
  return 'text';
}
