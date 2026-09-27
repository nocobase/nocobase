/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// `@xhmikosr/decompress` ships no type declarations, so declare the subset of its API that we rely on.
declare module '@xhmikosr/decompress' {
  export interface DecompressFile {
    data: Buffer;
    mode: number;
    mtime: Date;
    path: string;
    type: 'directory' | 'file' | 'link' | 'symlink';
    linkname?: string;
  }

  export interface DecompressOptions {
    /** Filter out files before extracting. */
    filter?: (file: DecompressFile) => boolean;
    /** Map files before extracting. */
    map?: (file: DecompressFile) => DecompressFile;
    /** Archive plugins to use instead of the built-in tar/tar.bz2/tar.gz/zip set. */
    plugins?: unknown[];
    /** Remove leading directory components from extracted paths. */
    strip?: number;
  }

  export function assertSafeEntryPath(entryPath: string, isWindows?: boolean): void;

  function decompress(input: string | Buffer, output?: string, options?: DecompressOptions): Promise<DecompressFile[]>;
  function decompress(input: string | Buffer, options?: DecompressOptions): Promise<DecompressFile[]>;

  export default decompress;
}
