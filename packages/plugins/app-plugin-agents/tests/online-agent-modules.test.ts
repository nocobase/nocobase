import { describe, expect, it } from 'vitest';
import * as publicSDK from '@nocobase/app-plugin-agents/server/online-agent';
import * as contracts from '../server/online/agent/contracts.js';
import * as types from '../server/online/agent/types.js';
import * as nativeTypes from '../server/online/agent/native/types.js';
import * as persistenceTypes from '../server/online/agent/persistence/types.js';
import * as runnerTypes from '../server/online/agent/runner/types.js';
import { OnlineAgentConfigurator } from '../server/online/agent/configuration.js';
import { OnlineAgentResultError } from '../server/online/agent/errors.js';
import { NativeOnlineAgentBackend } from '../server/online/agent/native/backend.js';
import {
  NativeRealtimeOnlineAgent,
  NativeBackgroundOnlineAgent,
} from '../server/online/agent/native/session.js';
import { RunnerOnlineAgentAdapter } from '../server/online/agent/runner/backend.js';
import { OnlineAgentService } from '../server/online/agent/service.js';
import { OnlineAgentUIStreams } from '../server/online/agent/transport/streams.js';

describe('OnlineAgent module boundaries', () => {
  it.each([
    ['contracts', contracts],
    ['shared types', types],
    ['native types', nativeTypes],
    ['persistence types', persistenceTypes],
    ['runner types', runnerTypes],
  ])('keeps %s free of runtime exports', (_name, module) => {
    expect(Object.keys(module)).toEqual([]);
  });

  it('exports the original implementation constructors through the public entry', () => {
    const implementations = {
      OnlineAgentConfigurator,
      OnlineAgentResultError,
      NativeOnlineAgentBackend,
      NativeRealtimeOnlineAgent,
      NativeBackgroundOnlineAgent,
      RunnerOnlineAgentAdapter,
      OnlineAgentService,
      OnlineAgentUIStreams,
    };
    for (const [name, implementation] of Object.entries(implementations)) {
      expect(publicSDK[name as keyof typeof implementations]).toBe(
        implementation,
      );
    }
  });
});
