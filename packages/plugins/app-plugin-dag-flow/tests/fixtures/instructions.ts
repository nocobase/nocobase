import { NODE_RUN_STATUS } from '../../server/engine/constants.js';
import type { JsonObject, WorkflowNodeRun } from '../../server/engine/types.js';
import {
  WorkflowInstruction,
  type WorkflowInstructionClass,
  type WorkflowInstructionResult,
} from '../../server/instructions/base.js';
import type {
  ConfigIssue,
  NodeExpression,
  WorkflowNodeSourceInput,
} from '../../server/instructions/types.js';

export function defineTestInstruction(
  type: string,
  run: (instruction: WorkflowInstruction) => Promise<WorkflowInstructionResult>,
  resume?: (
    instruction: WorkflowInstruction,
  ) => Promise<WorkflowInstructionResult>,
): WorkflowInstructionClass {
  return class FixtureInstruction extends WorkflowInstruction {
    static readonly type: string = type;
    static readonly branches: null = null;
    static create(
      _source: WorkflowNodeSourceInput<JsonObject>,
    ): NodeExpression {
      throw new Error('Test-only instruction');
    }
    static validateConfig(_config: unknown): ConfigIssue[] {
      return [];
    }
    async run(): Promise<WorkflowInstructionResult> {
      return run(this);
    }
    async resume(): Promise<WorkflowInstructionResult> {
      if (!resume)
        throw new Error(`Instruction "${type}" does not implement resume()`);
      return resume(this);
    }
  };
}

export const echoInstruction: WorkflowInstructionClass = defineTestInstruction(
  'echo',
  async (instruction) => ({
    status: NODE_RUN_STATUS.RESOLVED,
    result: instruction.processor.getParsedValue(
      instruction.node.config.value ?? instruction.node.key,
      instruction.node.id,
    ),
  }),
);

export const pendingInstruction: WorkflowInstructionClass =
  defineTestInstruction(
    'pending',
    async () => ({ status: NODE_RUN_STATUS.PENDING }),
    async (instruction) => ({
      status: NODE_RUN_STATUS.RESOLVED,
      result:
        instruction.input && 'status' in instruction.input
          ? instruction.input.result
          : null,
    }),
  );

export const errorResumeInstruction: WorkflowInstructionClass =
  defineTestInstruction(
    'error-resume',
    async () => ({ status: NODE_RUN_STATUS.PENDING }),
    async (instruction) => ({
      status: NODE_RUN_STATUS.ERROR,
      error:
        instruction.input && 'status' in instruction.input
          ? (instruction.input.error ?? 'Resume failed')
          : 'Resume failed',
    }),
  );

export function createCounterInstruction(): WorkflowInstructionClass & {
  readonly calls: () => number;
} {
  let calls = 0;
  const Instruction = defineTestInstruction('counter', async () => {
    calls += 1;
    return { status: NODE_RUN_STATUS.RESOLVED, result: calls };
  });
  Object.defineProperty(Instruction, 'calls', { value: () => calls });
  return Instruction as WorkflowInstructionClass & {
    readonly calls: () => number;
  };
}

export function createSlowInstruction(
  delayMs: number,
): WorkflowInstructionClass {
  return defineTestInstruction('slow', async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { status: NODE_RUN_STATUS.RESOLVED, result: 'slow' };
  });
}

export function createTraceInstruction(
  trace: string[],
): WorkflowInstructionClass {
  return defineTestInstruction('trace', async (instruction) => {
    trace.push(instruction.node.key);
    return { status: NODE_RUN_STATUS.RESOLVED, result: instruction.node.key };
  });
}

export function createFailingInstruction(
  status: number = NODE_RUN_STATUS.FAILED,
): WorkflowInstructionClass {
  return defineTestInstruction('fail', async (instruction) => ({
    status,
    error: `Failed at ${instruction.node.key}`,
  }));
}

export function nodeRunOf(
  nodeRuns: WorkflowNodeRun[],
  nodeKey: string,
): WorkflowNodeRun {
  const nodeRun = nodeRuns.find((candidate) => candidate.nodeKey === nodeKey);
  if (!nodeRun) throw new Error(`No nodeRun for node "${nodeKey}"`);
  return nodeRun;
}
