import { describe, expect, it, vi } from 'vitest';
import {
  logRunExecution,
  projectRunNodeInspector,
} from '../server/engine/inspector.js';
import type { WorkflowLogger } from '../server/engine/inspector.js';
import type { WorkflowNode } from '../server/engine/types.js';
describe('run inspector and safe logs', () => {
  it('summarizes argument keys without values or an entry digest', () => {
    const node = {
      id: 1,
      key: 'run',
      title: 'Run',
      workflowId: 1,
      upstreamKey: null,
      branchKey: null,
      downstreamKey: null,
      type: 'run',
      config: {
        module: './server/run',
        args: { password: 'secret', count: 1 },
      },
      options: {},
    } satisfies WorkflowNode;
    const projection = projectRunNodeInspector(node, 'a'.repeat(64));
    expect(projection).toMatchObject({
      module: './server/run',
      artifactShortId: 'aaaaaaaaaaaa',
      sourceManaged: true,
      argsKeys: ['count', 'password'],
    });
    expect(JSON.stringify(projection)).not.toContain('secret');
    expect(JSON.stringify(projection)).not.toContain('entryDigest');
  });
  it('logs fixed identifiers, Artifact digest, module, timing and status only', () => {
    const info = vi.fn();
    const logger: WorkflowLogger = {
      debug: vi.fn(),
      info,
      warn: vi.fn(),
      error: vi.fn(),
    };
    const fields = {
      workflowId: 1,
      executionId: 2,
      nodeId: 3,
      nodeKey: 'run',
      artifactDigest: 'a',
      module: './run',
      durationMs: 5,
      status: 'success' as const,
    };
    logRunExecution(logger, fields);
    expect(info).toHaveBeenCalledWith('Run node "run" success', fields);
    expect(JSON.stringify(info.mock.calls)).not.toContain('args');
    expect(JSON.stringify(info.mock.calls)).not.toContain('result');
  });
});
