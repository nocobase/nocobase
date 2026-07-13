/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createArtifactCollector } from '../observations/artifactCollector';
import { terminalizeRun } from '../observations/completion';
import { createRunProgressReporter } from '../observations/eventPublisher';
import { executeTmuxCommand } from '../tmuxTerminal';
import { controlRequestWhileRunPhase } from './controlRequestLoop';
import { closeTmuxTerminalQuietly, createRunTerminalStream, toTerminalEndReason } from './terminalBackend';

export interface ExecutionServices {
  controlRequests: {
    start: typeof controlRequestWhileRunPhase;
  };
  observations: {
    createProgressReporter: typeof createRunProgressReporter;
    createArtifactCollector: typeof createArtifactCollector;
    complete: typeof terminalizeRun;
  };
  terminal: {
    executeTmux: typeof executeTmuxCommand;
    createStream: typeof createRunTerminalStream;
    close: typeof closeTmuxTerminalQuietly;
    toEndReason: typeof toTerminalEndReason;
  };
}

export interface ExecutionServiceOverrides {
  controlRequests?: Partial<ExecutionServices['controlRequests']>;
  observations?: Partial<ExecutionServices['observations']>;
  terminal?: Partial<ExecutionServices['terminal']>;
}

const DEFAULT_EXECUTION_SERVICES: ExecutionServices = {
  controlRequests: {
    start: controlRequestWhileRunPhase,
  },
  observations: {
    createProgressReporter: createRunProgressReporter,
    createArtifactCollector,
    complete: terminalizeRun,
  },
  terminal: {
    executeTmux: executeTmuxCommand,
    createStream: createRunTerminalStream,
    close: closeTmuxTerminalQuietly,
    toEndReason: toTerminalEndReason,
  },
};

export function resolveExecutionServices(overrides?: ExecutionServiceOverrides): ExecutionServices {
  return {
    controlRequests: {
      ...DEFAULT_EXECUTION_SERVICES.controlRequests,
      ...overrides?.controlRequests,
    },
    observations: {
      ...DEFAULT_EXECUTION_SERVICES.observations,
      ...overrides?.observations,
    },
    terminal: {
      ...DEFAULT_EXECUTION_SERVICES.terminal,
      ...overrides?.terminal,
    },
  };
}
