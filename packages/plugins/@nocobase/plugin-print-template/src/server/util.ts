/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import XlsxTemplate from 'xlsx-template';
// 定义原始的映射类型
type MimeTypeToExtensionMap = {
  [key: string]: string;
};
// 反转后的映射类型
type ExtensionToMimeTypeMap = {
  [key: string]: string;
};

export const mimeTypeToExtensionMap: MimeTypeToExtensionMap = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};
// 反转映射的函数
export function reverseMap(map: MimeTypeToExtensionMap): ExtensionToMimeTypeMap {
  const reversedMap: ExtensionToMimeTypeMap = {};
  for (const [key, value] of Object.entries(map)) {
    reversedMap[value] = key;
  }
  return reversedMap;
}
export function getFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : `${raw.toString('hex')}${path.extname(file.originalname)}`);
  });
}

// 从一个绝对路径转换为另一个绝对路径，其中替换其中的模板变量--word类型的

export function wordTemplateReplacement(srcRenderData: object | any, srcPath: string, destPath: string) {
  const content = fs.readFileSync(srcPath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: '${',
      end: '}',
    },
  });
  doc.render(srcRenderData);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  fs.writeFileSync(destPath, buf);
}
export function excelTemplateReplacement(srcRenderData: object | any, srcPath: string, destPath: string) {
  const content = fs.readFileSync(srcPath);
  const template = new XlsxTemplate(content);
  const sheetNumber = 1;
  template.substitute(sheetNumber, srcRenderData);
  fs.writeFileSync(destPath, template.generate({ type: 'nodebuffer' }));
}
export function getDestFilePath(filePath) {
  fs.mkdirSync(filePath, { recursive: true });
  return filePath;
}
