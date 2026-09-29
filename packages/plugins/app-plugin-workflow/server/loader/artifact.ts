import { createHash } from 'node:crypto';

import type { WorkflowFlatIr } from '../../dsl/definition.js';

export interface WorkflowArtifactDefinition extends WorkflowFlatIr {
  readonly formatVersion: 1;
  readonly key: string;
}

export interface WorkflowArtifactDigestFile {
  readonly path: string;
  readonly content: string | Uint8Array;
}

export function computeWorkflowArtifactDigest(
  files: readonly WorkflowArtifactDigestFile[],
): string {
  const hash = createHash('sha256');
  for (const file of [...files].sort(comparePaths)) {
    const normalizedPath = file.path.replaceAll('\\', '/');
    const content = Buffer.from(file.content);
    hash
      .update(normalizedPath)
      .update('\0')
      .update(String(content.byteLength))
      .update('\0')
      .update(content)
      .update('\0');
  }
  return hash.digest('hex');
}

function comparePaths(left: { path: string }, right: { path: string }): number {
  return Buffer.from(left.path).compare(Buffer.from(right.path));
}
