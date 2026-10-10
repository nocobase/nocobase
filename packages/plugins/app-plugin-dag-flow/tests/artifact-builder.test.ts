import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildWorkflowArtifact,
  computeWorkflowArtifactDigest,
} from '../build/artifact-builder.js';

const roots: string[] = [];
afterEach(async () =>
  Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  ),
);
const definition = {
  title: 'x',
  inputSchema: { type: 'object' as const },
  nodes: [],
};
const flatIr = { ...definition, start: null, nodes: [] };

describe('workflow Artifact', () => {
  it('hashes only canonical workflow.json and server/client bytes, independent of host path and mtime', async () => {
    const first = buildWorkflowArtifact({
      key: 'stable',
      flatIr,
    });
    const second = buildWorkflowArtifact({
      key: 'stable',
      flatIr,
    });
    expect(second.digest).toBe(first.digest);
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'artifact-mtime-'));
    roots.push(root);
    const file = path.join(root, 'workflow.json');
    await fs.writeFile(file, first.files.get('workflow.json')!);
    await fs.utimes(file, new Date(0), new Date());
    expect(
      computeWorkflowArtifactDigest([
        { path: 'workflow.json', content: await fs.readFile(file) },
        {
          path: 'package.json',
          content: first.files.get('package.json')!,
        },
      ]),
    ).toBe(first.digest);
  });
  it('changes for Flat IR or any resource bytes and preserves relative paths', () => {
    const base = buildWorkflowArtifact({
      key: 'x',
      flatIr,
    });
    const changedIr = buildWorkflowArtifact({
      key: 'x',
      flatIr: { ...flatIr, title: 'y' },
    });
    const changedServer = buildWorkflowArtifact({
      key: 'x',
      flatIr,
      resourceFiles: new Map([
        ['server/run.js', 'export function run(){ return 1; }'],
      ]),
    });
    expect(changedIr.digest).not.toBe(base.digest);
    expect(changedServer.digest).not.toBe(base.digest);
    expect([...changedServer.files.keys()].sort()).toEqual([
      'package.json',
      'server/run.js',
      'workflow.json',
    ]);
    expect(changedServer.workflow).not.toHaveProperty('server');
  });
  it('preserves effective node result schemas in workflow.json', () => {
    const withResult = {
      ...flatIr,
      start: 'value',
      nodes: [
        {
          key: 'value',
          type: 'run',
          config: {},
          result: { type: 'string' as const },
          upstreamKey: null,
          downstreamKey: null,
          branchKey: null,
        },
      ],
    };
    const built = buildWorkflowArtifact({
      key: 'x',
      flatIr: withResult,
    });
    expect(built.workflow.nodes[0].result).toEqual({ type: 'string' });
    expect(
      JSON.parse(String(built.files.get('workflow.json'))).nodes[0].result,
    ).toEqual({ type: 'string' });
  });
});
