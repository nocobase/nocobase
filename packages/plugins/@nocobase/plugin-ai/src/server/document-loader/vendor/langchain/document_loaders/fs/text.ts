/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Document } from '@langchain/core/documents';
import { getEnv } from '@langchain/core/utils/env';
import { BaseDocumentLoader } from '@langchain/core/document_loaders/base';

export class TextLoader extends BaseDocumentLoader {
  private filePathOrBlob: any;

  constructor(filePathOrBlob) {
    super();
    this.filePathOrBlob = filePathOrBlob;
  }

  async parse(raw) {
    return [raw];
  }

  async load() {
    let text;
    let metadata;

    if (typeof this.filePathOrBlob === 'string') {
      const { readFile } = await TextLoader.imports();
      text = await readFile(this.filePathOrBlob, 'utf8');
      metadata = { source: this.filePathOrBlob };
    } else {
      text = await this.filePathOrBlob.text();
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }

    const parsed = await this.parse(text);
    parsed.forEach((pageContent, i) => {
      if (typeof pageContent !== 'string') {
        throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`);
      }
    });

    return parsed.map(
      (pageContent, i) =>
        new Document({
          pageContent,
          metadata:
            parsed.length === 1
              ? metadata
              : {
                  ...metadata,
                  line: i + 1,
                },
        }),
    );
  }

  static async imports() {
    try {
      const { readFile } = await import('node:fs/promises');
      return { readFile };
    } catch (e) {
      console.error(e);
      throw new Error(
        `Failed to load fs/promises. TextLoader available only on environment 'node'. It appears you are running environment '${getEnv()}'. See https://<link to docs> for alternatives.`,
      );
    }
  }
}
