/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { SequelizeCollectionSaver } from '../ai-employees/checkpoints';
import {
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  emptyCheckpoint,
  TASKS,
  uuid6,
} from '@langchain/langgraph-checkpoint';
import { RunnableConfig } from '@langchain/core/runnables';

const checkpoint1: Checkpoint = {
  v: 1,
  id: uuid6(-1),
  ts: '2024-04-19T17:19:07.952Z',
  channel_values: {
    someKey1: 'someValue1',
  },
  channel_versions: {
    someKey1: 1,
    someKey2: 1,
  },
  versions_seen: {
    someKey3: {
      someKey4: 1,
    },
  },
  // @ts-expect-error - older version of checkpoint
  pending_sends: [],
};

const checkpoint2: Checkpoint = {
  v: 1,
  id: uuid6(1),
  ts: '2024-04-20T17:19:07.952Z',
  channel_values: {
    someKey1: 'someValue2',
  },
  channel_versions: {
    someKey1: 1,
    someKey2: 2,
  },
  versions_seen: {
    someKey3: {
      someKey4: 2,
    },
  },
  // @ts-expect-error - older version of checkpoint
  pending_sends: [],
};

describe('SequelizeCollectionSaver test cases', () => {
  let app: MockServer;
  let checkpointSaver: SequelizeCollectionSaver;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'field-sort', 'workflow'],
    });
    // with mysql add ai plugin in createMockServer will occur error with create usersAiEmployees collection at app startup
    await app.pm.enable('ai');
    checkpointSaver = new SequelizeCollectionSaver(() => app.mainDataSource);
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should save and retrieve checkpoints correctly', async () => {
    // get undefined checkpoint
    const undefinedCheckpoint = await checkpointSaver.getTuple({
      configurable: { thread_id: '1' },
    });
    expect(undefinedCheckpoint).toBeUndefined();

    // save first checkpoint
    const runnableConfig = await checkpointSaver.put(
      { configurable: { thread_id: '1' } },
      checkpoint1,
      { source: 'update', step: -1, parents: {} },
      checkpoint1.channel_versions,
    );
    expect(runnableConfig).toEqual({
      configurable: {
        thread_id: '1',
        checkpoint_ns: '',
        checkpoint_id: checkpoint1.id,
      },
    });

    // add some writes
    await checkpointSaver.putWrites(
      {
        configurable: {
          checkpoint_id: checkpoint1.id,
          checkpoint_ns: '',
          thread_id: '1',
        },
      },
      [['bar', 'baz']],
      'foo',
    );

    // get first checkpoint tuple
    const firstCheckpointTuple = await checkpointSaver.getTuple({
      configurable: { thread_id: '1' },
    });
    expect(firstCheckpointTuple?.config).toEqual({
      configurable: {
        thread_id: '1',
        checkpoint_ns: '',
        checkpoint_id: checkpoint1.id,
      },
    });
    expect(firstCheckpointTuple?.checkpoint).toEqual(checkpoint1);
    expect(firstCheckpointTuple?.metadata).toEqual({
      source: 'update',
      step: -1,
      parents: {},
    });
    expect(firstCheckpointTuple?.parentConfig).toBeUndefined();
    expect(firstCheckpointTuple?.pendingWrites).toEqual([['foo', 'bar', 'baz']]);

    // save second checkpoint
    await checkpointSaver.put(
      {
        configurable: {
          thread_id: '1',
          checkpoint_id: '2024-04-18T17:19:07.952Z',
        },
      },
      checkpoint2,
      { source: 'update', step: -1, parents: {} },
      checkpoint2.channel_versions,
    );

    // verify that parentTs is set and retrieved correctly for second checkpoint
    const secondCheckpointTuple = await checkpointSaver.getTuple({
      configurable: { thread_id: '1' },
    });
    expect(secondCheckpointTuple?.metadata).toEqual({
      source: 'update',
      step: -1,
      parents: {},
    });
    expect(secondCheckpointTuple?.parentConfig).toEqual({
      configurable: {
        thread_id: '1',
        checkpoint_ns: '',
        checkpoint_id: '2024-04-18T17:19:07.952Z',
      },
    });

    // list checkpoints
    const checkpointTupleGenerator = checkpointSaver.list({
      configurable: { thread_id: '1' },
    });
    const checkpointTuples: CheckpointTuple[] = [];
    for await (const checkpoint of checkpointTupleGenerator) {
      checkpointTuples.push(checkpoint);
    }
    expect(checkpointTuples.length).toBe(2);
    const checkpointTuple1 = checkpointTuples[0];
    const checkpointTuple2 = checkpointTuples[1];
    expect(checkpointTuple1.checkpoint.ts).toBe('2024-04-20T17:19:07.952Z');
    expect(checkpointTuple2.checkpoint.ts).toBe('2024-04-19T17:19:07.952Z');
  });

  it('should delete thread', async () => {
    const thread1 = { configurable: { thread_id: '1', checkpoint_ns: '' } };
    const thread2 = { configurable: { thread_id: '2', checkpoint_ns: '' } };

    const meta: CheckpointMetadata = {
      source: 'update',
      step: -1,
      parents: {},
    };

    await checkpointSaver.put(thread1, emptyCheckpoint(), meta, {});
    await checkpointSaver.put(thread2, emptyCheckpoint(), meta, {});

    expect(await checkpointSaver.getTuple(thread1)).toBeDefined();

    await checkpointSaver.deleteThread('1');

    expect(await checkpointSaver.getTuple(thread1)).toBeUndefined();
    expect(await checkpointSaver.getTuple(thread2)).toBeDefined();
  });

  it('pending sends migration', async () => {
    let config: RunnableConfig = {
      configurable: { thread_id: 'thread-1', checkpoint_ns: '' },
    };

    const checkpoint0: Checkpoint = {
      v: 1,
      id: uuid6(0),
      ts: '2024-04-19T17:19:07.952Z',
      channel_values: {},
      channel_versions: {},
      versions_seen: {},
    };

    config = await checkpointSaver.put(config, checkpoint0, { source: 'loop', parents: {}, step: 0 }, {});

    await checkpointSaver.putWrites(
      config,
      [
        [TASKS, 'send-1'],
        [TASKS, 'send-2'],
      ],
      'task-1',
    );
    await checkpointSaver.putWrites(config, [[TASKS, 'send-3']], 'task-2');

    // check that fetching checkpount 0 doesn't attach pending sends
    // (they should be attached to the next checkpoint)
    const tuple0 = await checkpointSaver.getTuple(config);
    expect(tuple0?.checkpoint.channel_values).toEqual({});
    expect(tuple0?.checkpoint.channel_versions).toEqual({});

    // create second checkpoint
    const checkpoint1: Checkpoint = {
      v: 1,
      id: uuid6(1),
      ts: '2024-04-20T17:19:07.952Z',
      channel_values: {},
      channel_versions: checkpoint0.channel_versions,
      versions_seen: checkpoint0.versions_seen,
      // @ts-expect-error - older version of checkpoint
      pending_sends: [],
    };

    config = await checkpointSaver.put(config, checkpoint1, { source: 'loop', parents: {}, step: 1 }, {});

    // check that pending sends are attached to checkpoint1
    const checkpoint1Tuple = await checkpointSaver.getTuple(config);
    expect(checkpoint1Tuple?.checkpoint.channel_values).toEqual({
      [TASKS]: ['send-1', 'send-2', 'send-3'],
    });
    expect(checkpoint1Tuple?.checkpoint.channel_versions[TASKS]).toBeDefined();

    // check that the list also applies the migration
    const checkpointTupleGenerator = checkpointSaver.list({
      configurable: { thread_id: 'thread-1' },
    });
    const checkpointTuples: CheckpointTuple[] = [];
    for await (const checkpoint of checkpointTupleGenerator) {
      checkpointTuples.push(checkpoint);
    }
    expect(checkpointTuples.length).toBe(2);
    expect(checkpointTuples[0].checkpoint.channel_values).toEqual({
      [TASKS]: ['send-1', 'send-2', 'send-3'],
    });
    expect(checkpointTuples[0].checkpoint.channel_versions[TASKS]).toBeDefined();
  });
});
