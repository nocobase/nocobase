/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SupportedDocumentExtname } from './types';

export const DOCUMENT_PARSE_META_KEY = 'documentParse';

export const DOCUMENT_PARSER_VERSION = 'v1';

export const PARSED_FILE_MIMETYPE = 'text/plain';

export const SUPPORTED_DOCUMENT_EXTNAMES: SupportedDocumentExtname[] = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.txt',
];
