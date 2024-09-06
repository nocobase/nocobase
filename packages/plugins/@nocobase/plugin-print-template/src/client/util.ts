/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function getFilenameFromContentDisposition(headers) {
  const contentDisposition = headers['content-disposition'];
  if (!contentDisposition) {
    return '';
  }

  const match = contentDisposition.match(/filename\*=UTF-8''(.+?)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

// MIME 类型到扩展名的映射
export const mimeTypeToExtensionMap = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  // 添加其他 MIME 类型和扩展名的映射
};

// 根据 MIME 类型获取文件扩展名
export function getFileExtensionFromMimeType(mimeType) {
  return mimeTypeToExtensionMap[mimeType] || '';
}

// 生成基于当前日期和时间的文件名
export function generateDefaultFilename(extension) {
  const now = new Date();
  const formattedDate = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
  return `file_${formattedDate}.${extension}`;
}
