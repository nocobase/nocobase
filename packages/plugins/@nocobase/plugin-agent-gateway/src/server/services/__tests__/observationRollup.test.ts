/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord, ModelRecord } from '../../actions/utils';
import {
  OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT,
  buildRunObservabilityRollup,
  mergeRunObservabilityRollup,
} from '../observationRollup';

function createRecord(values: JsonRecord) {
  return {
    get(name: string) {
      return values[name];
    },
  } as unknown as ModelRecord;
}

function createCommandEvent(sequence: number, correlationId: string, status: 'started' | 'completed') {
  const completed = status === 'completed';
  return createRecord({
    id: `event-${sequence}`,
    source: 'codex',
    sequence,
    eventType: completed ? 'agent.command.completed' : 'agent.command.started',
    providerEventId: `${status}:${correlationId}`,
    correlationId,
    contentText: completed ? 'Command completed' : 'Command started',
    contentJson: {
      command: `echo ${correlationId}`,
      status: completed ? 'completed' : 'in_progress',
      exitCode: completed ? 0 : null,
    },
    createdAt: new Date(Date.UTC(2026, 6, 11, 0, 0, sequence)).toISOString(),
  });
}

describe('agent gateway observation rollup', () => {
  it('bounds terminal correlation samples while retaining aggregate stats and pending correlations', () => {
    const terminalCallCount = OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT + 20;
    const terminalEvents = Array.from({ length: terminalCallCount }, (_, index) =>
      createCommandEvent(index + 1, `completed-${index}`, 'completed'),
    );
    const pendingCorrelationKey = 'pending-after-compaction';
    const pendingEvent = createCommandEvent(terminalCallCount + 1, pendingCorrelationKey, 'started');
    const now = new Date('2026-07-11T01:00:00.000Z');
    const rollup = buildRunObservabilityRollup(
      createRecord({ status: 'running', resultSummaryJson: null }),
      [...terminalEvents, pendingEvent],
      now,
    );

    expect(rollup.toolStatsJson).toMatchObject({
      total: terminalCallCount + 1,
      succeeded: terminalCallCount,
      running: 1,
    });
    expect(rollup.toolLifecycleJson).toMatchObject({
      terminalStatsJson: {
        total: terminalCallCount,
        succeeded: terminalCallCount,
      },
    });
    expect(rollup.toolLifecycleJson?.calls).toHaveLength(OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT + 1);
    expect(rollup.toolLifecycleJson?.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correlationKey: pendingCorrelationKey,
          status: 'running',
        }),
      ]),
    );
    expect(rollup.toolLifecycleJson?.calls).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correlationKey: 'completed-0',
        }),
      ]),
    );

    const completionEvent = createCommandEvent(terminalCallCount + 2, pendingCorrelationKey, 'completed');
    const merged = mergeRunObservabilityRollup(
      createRecord({
        status: 'running',
        resultSummaryJson: null,
        observabilityRollupJson: rollup,
      }),
      [completionEvent],
      new Date('2026-07-11T02:00:00.000Z'),
    );

    expect(merged?.toolStatsJson).toMatchObject({
      total: terminalCallCount + 1,
      succeeded: terminalCallCount + 1,
      running: 0,
    });
    expect(merged?.toolLifecycleJson).toMatchObject({
      terminalStatsJson: {
        total: terminalCallCount + 1,
        succeeded: terminalCallCount + 1,
      },
    });
    expect(merged?.toolLifecycleJson?.calls).toHaveLength(OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT);
    expect(merged?.toolLifecycleJson?.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          correlationKey: pendingCorrelationKey,
          status: 'succeeded',
        }),
      ]),
    );

    const duplicate = mergeRunObservabilityRollup(
      createRecord({
        status: 'running',
        resultSummaryJson: null,
        observabilityRollupJson: merged,
      }),
      [completionEvent],
      new Date('2026-07-11T03:00:00.000Z'),
    );
    expect(duplicate?.toolStatsJson).toMatchObject({
      total: terminalCallCount + 1,
      succeeded: terminalCallCount + 1,
    });
  });
});
