/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseCheckpointSaver,
  ChannelVersions,
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  CheckpointTuple,
  maxChannelVersion,
  PendingWrite,
  SerializerProtocol,
  TASKS,
  WRITES_IDX_MAP,
} from '@langchain/langgraph-checkpoint';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { FindOptions, Op } from '@nocobase/database';

export class SequelizeCollectionSaver extends BaseCheckpointSaver {
  constructor(
    private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager },
    serde?: SerializerProtocol,
  ) {
    super(serde);
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const { thread_id, checkpoint_ns = '', checkpoint_id } = config.configurable ?? {};

    let findOptions: FindOptions;
    if (checkpoint_id) {
      findOptions = {
        where: {
          threadId: thread_id,
          checkpointNs: checkpoint_ns,
          checkpointId: checkpoint_id,
        },
      };
    } else {
      findOptions = {
        where: {
          threadId: thread_id,
          checkpointNs: checkpoint_ns,
        },
        order: [['checkpointId', 'DESC']],
        limit: 1,
      };
    }

    const checkpointRow = (await this.checkpointsModel.findOne(findOptions))?.toJSON();
    if (!checkpointRow) {
      return undefined;
    }
    const { threadId, checkpointNs, checkpointId, parentCheckpointId } = checkpointRow;

    checkpointRow.channelValues = [];
    for (const [channel, version] of Object.entries(checkpointRow.checkpoint.channel_versions ?? {})) {
      const blob = (
        await this.checkpointBlobsModel.findOne({
          where: {
            threadId,
            checkpointNs,
            channel,
            version: String(version),
          },
        })
      )?.toJSON();
      if (!blob) {
        continue;
      }
      checkpointRow.channelValues.push([
        new TextEncoder().encode(blob.channel),
        new TextEncoder().encode(blob.type),
        blob.blob ? Uint8Array.from(blob.blob) : null,
      ]);
    }

    const checkpointWrites = await this.getCheckpointWrites([threadId], checkpointNs, checkpointId);
    checkpointRow.pendingWrites = checkpointWrites[`${threadId}:${checkpointNs}:${checkpointId}`];

    if (checkpointRow.checkpoint.v < 4 && checkpointRow.parentCheckpointId != null) {
      const sendsResult = await this.getPendingSends([threadId]);
      const pendingSends = sendsResult[`${threadId}:${parentCheckpointId}`];
      if (pendingSends?.length) {
        await this._migratePendingSends(pendingSends, checkpointRow);
      }
    }

    const checkpoint = await this._loadCheckpoint(checkpointRow.checkpoint, checkpointRow.channelValues);

    const finalConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpointId,
      },
    };
    const metadata = await this._loadMetadata(checkpointRow.metadata);
    const parentConfig = parentCheckpointId
      ? {
          configurable: {
            thread_id,
            checkpoint_ns,
            checkpoint_id: parentCheckpointId,
          },
        }
      : undefined;

    const pendingWrites = await this._loadWrites(checkpointRow.pendingWrites);

    return {
      config: finalConfig,
      checkpoint,
      metadata,
      parentConfig,
      pendingWrites,
    };
  }

  async *list(config: RunnableConfig, options?: CheckpointListOptions): AsyncGenerator<CheckpointTuple> {
    const { filter, before, limit } = options ?? {};
    const findOptions = this._searchWhere(config, filter, before);
    findOptions.order = [['checkpointId', 'DESC']];
    if (limit !== undefined) {
      findOptions.limit = Number.parseInt(limit.toString(), 10); // sanitize via parseInt, as limit could be an externally provided value
    }

    const result = (await this.checkpointsModel.findAll(findOptions)).map((x) => x.toJSON());
    const [checkpointWrites, checkpointBlobs] = await Promise.all([
      this.getCheckpointWrites(result.map((x) => x.threadId)),
      this.getCheckpointBlobs(result.map((x) => x.threadId)),
    ]);

    for (const checkpointRow of result) {
      const { threadId, checkpointNs, checkpointId } = checkpointRow;
      checkpointRow.channelValues = Object.entries(checkpointRow.checkpoint.channel_versions ?? {})
        .map(([channel, version]) => checkpointBlobs[`${threadId}:${checkpointNs}:${channel}:${version}`])
        .filter((x) => x?.length)
        .flatMap((x) => [...x]);
      checkpointRow.pendingWrites = checkpointWrites[`${threadId}:${checkpointNs}:${checkpointId}`];
    }
    const toMigrate = result.filter((row) => row.checkpoint.v < 4 && row.parentCheckpointId != null);

    if (toMigrate.length > 0) {
      const sendsResult = await this.getPendingSends(result.map((x) => x.threadId));
      for (const row of toMigrate) {
        const pendingSends = sendsResult[`${row.threadId}:${row.parentCheckpointId}`];
        if (pendingSends?.length) {
          await this._migratePendingSends(pendingSends, row);
        }
      }
    }

    for (const value of result) {
      yield {
        config: {
          configurable: {
            thread_id: value.threadId,
            checkpoint_ns: value.checkpointNs,
            checkpoint_id: value.checkpointId,
          },
        },
        checkpoint: await this._loadCheckpoint(value.checkpoint, value.channelValues),
        metadata: await this._loadMetadata(value.metadata),
        parentConfig: value.parentCheckpointId
          ? {
              configurable: {
                thread_id: value.threadId,
                checkpoint_ns: value.checkpointNs,
                checkpoint_id: value.parentCheckpointId,
              },
            }
          : undefined,
        pendingWrites: await this._loadWrites(value.pendingWrites),
      };
    }
  }

  async _migratePendingSends(
    pendingSends: [Uint8Array, Uint8Array][],
    mutableRow: {
      channelValues: [Uint8Array, Uint8Array, Uint8Array][];
      checkpoint: Omit<Checkpoint, 'pending_sends' | 'channel_values'>;
    },
  ) {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    const row = mutableRow;

    const [enc, blob] = await this.serde.dumpsTyped(
      await Promise.all(pendingSends.map(([enc, blob]) => this.serde.loadsTyped(textDecoder.decode(enc), blob))),
    );

    row.channelValues ??= [];
    row.channelValues.push([textEncoder.encode(TASKS), textEncoder.encode(enc), blob]);

    // add to versions
    row.checkpoint.channel_versions[TASKS] =
      Object.keys(mutableRow.checkpoint.channel_versions).length > 0
        ? maxChannelVersion(...Object.values(mutableRow.checkpoint.channel_versions))
        : this.getNextVersion(undefined);
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<RunnableConfig> {
    if (config.configurable === undefined) {
      throw new Error(`Missing "configurable" field in "config" param`);
    }
    const { thread_id, checkpoint_ns = '', checkpoint_id } = config.configurable;

    const nextConfig = {
      configurable: {
        thread_id,
        checkpoint_ns,
        checkpoint_id: checkpoint.id,
      },
    };
    const serializedCheckpoint = this._dumpCheckpoint(checkpoint);
    const serializedBlobs = await this._dumpBlobs(thread_id, checkpoint_ns, checkpoint.channel_values, newVersions);
    const serializedMetadata = await this._dumpMetadata(metadata);

    return await this.sequelize.transaction(async (transaction) => {
      const checkpointBlobs = await this.checkpointBlobsModel.findAll({
        where: {
          threadId: thread_id,
          checkpointNs: checkpoint_ns,
        },
        attributes: {
          exclude: ['blob'],
        },
        transaction,
      });
      const duplicateBlobsFilter = checkpointBlobs.map(({ channel, version }) => `${channel}:${version}`);

      await this.checkpointBlobsModel.bulkCreate(
        serializedBlobs
          .filter(
            ([_threadId, _checkpointNs, channel, version]) => !duplicateBlobsFilter.includes(`${channel}:${version}`),
          )
          .map(([threadId, checkpointNs, channel, version, type, blob]) => ({
            threadId,
            checkpointNs,
            channel,
            version,
            type,
            blob: blob ? Buffer.from(blob) : null,
          })),
        {
          transaction,
        },
      );

      const checkPointFindOptions: FindOptions = {
        where: { threadId: thread_id, checkpointNs: checkpoint_ns, checkpointId: checkpoint.id },
        transaction,
      };
      const existed = await this.checkpointsModel.count(checkPointFindOptions);
      if (existed === 0) {
        await this.checkpointsModel.create(
          {
            threadId: thread_id,
            checkpointNs: checkpoint_ns,
            checkpointId: checkpoint.id,
            parentCheckpointId: checkpoint_id,
            checkpoint: serializedCheckpoint,
            metadata: serializedMetadata,
          },
          {
            transaction,
          },
        );
      } else {
        await this.checkpointsModel.update(
          {
            checkpoint: serializedCheckpoint,
            metadata: serializedMetadata,
          },
          {
            transaction,
            where: checkPointFindOptions.where,
          },
        );
      }

      return nextConfig;
    });
  }
  async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
    if (!config.configurable?.thread_id) {
      throw new Error('config.configurable.thread_id is required');
    }
    const dumpedWrites = await this._dumpWrites(
      config.configurable?.thread_id,
      config.configurable?.checkpoint_ns,
      config.configurable?.checkpoint_id,
      taskId,
      writes,
    );
    return await this.sequelize.transaction(async (transaction) => {
      const checkpointWrites = await this.checkpointWritesModel.findAll({
        where: {
          threadId: config.configurable?.thread_id,
          checkpointNs: config.configurable?.checkpoint_ns,
          checkpointId: config.configurable?.checkpoint_id,
          taskId,
        },
        attributes: {
          exclude: ['blob'],
        },
        transaction,
      });
      const duplicateWritesFilter = checkpointWrites.map(
        ({ threadId, checkpointNs, checkpointId, taskId, idx }) =>
          `${threadId}:${checkpointNs}:${checkpointId}:${taskId}:${idx}`,
      );
      const dumpedWritesInclude = ([threadId, checkpointNs, checkpointId, taskId, idx]: (typeof dumpedWrites)[0]) =>
        duplicateWritesFilter.includes(`${threadId}:${checkpointNs}:${checkpointId}:${taskId}:${idx}`);
      const dumpedWritesExclude = (item) => !dumpedWritesInclude(item);

      await this.checkpointWritesModel.bulkCreate(
        dumpedWrites
          .filter(dumpedWritesExclude)
          .map(([threadId, checkpointNs, checkpointId, taskId, idx, channel, type, blob]) => ({
            threadId,
            checkpointNs,
            checkpointId,
            taskId,
            idx,
            channel,
            type,
            blob: blob ? Buffer.from(blob) : null,
          })),
        {
          transaction,
        },
      );

      for (const [threadId, checkpointNs, checkpointId, taskId, idx, channel, type, blob] of dumpedWrites.filter(
        dumpedWritesInclude,
      )) {
        await this.checkpointWritesModel.update(
          {
            channel,
            type,
            blob: blob ? Buffer.from(blob) : null,
          },
          {
            where: {
              threadId,
              checkpointNs,
              checkpointId,
              taskId,
              idx,
            },
            transaction,
          },
        );
      }
    });
  }

  deleteThread(threadId: string): Promise<void> {
    return this.sequelize.transaction(async (transaction) => {
      await this.checkpointsModel.destroy({
        where: {
          threadId,
        },
        transaction,
      });
      await this.checkpointBlobsModel.destroy({
        where: {
          threadId,
        },
        transaction,
      });
      await this.checkpointWritesModel.destroy({
        where: {
          threadId,
        },
        transaction,
      });
    });
  }

  protected async _loadCheckpoint(
    checkpoint: Omit<Checkpoint, 'pending_sends' | 'channel_values'>,
    channelValues: [Uint8Array, Uint8Array, Uint8Array][],
  ): Promise<Checkpoint> {
    return {
      ...checkpoint,
      channel_values: await this._loadBlobs(channelValues),
    };
  }

  protected async _loadBlobs(blobValues: [Uint8Array, Uint8Array, Uint8Array][]): Promise<Record<string, unknown>> {
    if (!blobValues || blobValues.length === 0) {
      return {};
    }
    const textDecoder = new TextDecoder();
    const entries = await Promise.all(
      blobValues
        .filter(([, t]) => textDecoder.decode(t) !== 'empty')
        .map(async ([k, t, v]) => [textDecoder.decode(k), await this.serde.loadsTyped(textDecoder.decode(t), v)]),
    );
    return Object.fromEntries(entries);
  }

  protected async _loadMetadata(metadata: Record<string, unknown>) {
    const [type, dumpedValue] = await this.serde.dumpsTyped(metadata);
    return this.serde.loadsTyped(type, dumpedValue);
  }

  protected async _loadWrites(
    writes: [Uint8Array, Uint8Array, Uint8Array, Uint8Array][],
  ): Promise<[string, string, unknown][]> {
    const decoder = new TextDecoder();
    return writes
      ? await Promise.all(
          writes.map(async ([tid, channel, t, v]) => [
            decoder.decode(tid),
            decoder.decode(channel),
            await this.serde.loadsTyped(decoder.decode(t), v),
          ]),
        )
      : [];
  }

  protected async _dumpBlobs(
    threadId: string,
    checkpointNs: string,
    values: Record<string, unknown>,
    versions: ChannelVersions,
  ): Promise<[string, string, string, string, string, Uint8Array | undefined][]> {
    if (Object.keys(versions).length === 0) {
      return [];
    }

    return Promise.all(
      Object.entries(versions).map(async ([k, ver]) => {
        const [type, value] = k in values ? await this.serde.dumpsTyped(values[k]) : ['empty', null];
        return [threadId, checkpointNs, k, ver.toString(), type, value ? new Uint8Array(value) : undefined];
      }),
    );
  }

  protected _dumpCheckpoint(checkpoint: Checkpoint) {
    const serialized: Record<string, unknown> = { ...checkpoint };
    if ('channel_values' in serialized) delete serialized.channel_values;
    return serialized;
  }

  protected async _dumpMetadata(metadata: CheckpointMetadata) {
    const [, serializedMetadata] = await this.serde.dumpsTyped(metadata);
    // We need to remove null characters before writing
    return JSON.parse(new TextDecoder().decode(serializedMetadata).replace(/\0/g, ''));
  }

  protected async _dumpWrites(
    threadId: string,
    checkpointNs: string,
    checkpointId: string,
    taskId: string,
    writes: [string, unknown][],
  ): Promise<[string, string, string, string, number, string, string, Uint8Array][]> {
    return Promise.all(
      writes.map(async ([channel, value], idx) => {
        const [type, serializedValue] = await this.serde.dumpsTyped(value);
        return [
          threadId,
          checkpointNs,
          checkpointId,
          taskId,
          WRITES_IDX_MAP[channel] ?? idx,
          channel,
          type,
          new Uint8Array(serializedValue),
        ];
      }),
    );
  }

  protected _searchWhere(
    config?: RunnableConfig,
    filter?: Record<string, unknown>,
    before?: RunnableConfig,
  ): FindOptions {
    const findOptions: FindOptions = {};

    // construct predicate for config filter
    if (config?.configurable?.thread_id) {
      if (!findOptions.where) {
        findOptions.where = {};
      }
      findOptions.where['threadId'] = config.configurable.thread_id;
    }

    // strict checks for undefined/null because empty strings are falsy
    if (config?.configurable?.checkpoint_ns !== undefined && config?.configurable?.checkpoint_ns !== null) {
      if (!findOptions.where) {
        findOptions.where = {};
      }
      findOptions.where['checkpointNs'] = config.configurable.checkpoint_ns;
    }

    if (config?.configurable?.checkpoint_id) {
      if (!findOptions.where) {
        findOptions.where = {};
      }
      findOptions.where['checkpointId'] = config.configurable.checkpoint_id;
    }

    // construct predicate for metadata filter
    if (filter && Object.keys(filter).length > 0) {
      if (!findOptions.where) {
        findOptions.where = {};
      }
      if (this.sequelize.getDialect() === 'postgres') {
        findOptions.where['metadata'] = {
          [Op.contains]: filter,
        };
      } else {
        // TODO mysql mariadb sqlite mssql oracle`s metadata filter to be add
      }
    }

    // construct predicate for `before`
    if (before?.configurable?.checkpoint_id !== undefined) {
      if (!findOptions.where) {
        findOptions.where = {};
      }
      findOptions.where['checkpointId'] = {
        $lt: before.configurable.checkpoint_id,
      };
    }

    return findOptions;
  }

  private async getCheckpointWrites(
    threadIds: string[],
    checkpointNs?: string,
    checkpointId?: string,
  ): Promise<Record<string, [Uint8Array, Uint8Array, Uint8Array, Uint8Array][]>> {
    if (!threadIds?.length) {
      return {};
    }
    const where = {
      threadId:
        threadIds.length === 1
          ? threadIds[0]
          : {
              [Op.in]: threadIds,
            },
    };
    if (checkpointNs) {
      where['checkpointNs'] = checkpointNs;
    }
    if (checkpointId) {
      where['checkpointId'] = checkpointId;
    }
    const writes = await this.checkpointWritesModel.findAll({
      where,
    });

    const result: Record<
      string,
      {
        taskId: string;
        channel: string;
        type: string;
        blob: Uint8Array;
        idx: number;
      }[]
    > = {};
    for (const write of writes) {
      const key = `${write.threadId}:${write.checkpointNs}:${write.checkpointId}`;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push({
        taskId: write.taskId,
        channel: write.channel,
        type: write.type,
        blob: write.blob ? Uint8Array.from(write.blob) : null,
        idx: write.idx,
      });
    }
    return Object.fromEntries(
      Object.entries(result).map(([key, list]) => [
        key,
        [...list]
          .sort((a, b) => {
            if (a.taskId !== b.taskId) {
              return a.taskId.localeCompare(b.taskId);
            }
            return a.idx - b.idx;
          })
          .map(({ taskId, channel, type, blob }) => [
            new TextEncoder().encode(taskId),
            new TextEncoder().encode(channel),
            new TextEncoder().encode(type),
            blob,
          ]),
      ]),
    );
  }

  private async getPendingSends(threadIds: string[]): Promise<Record<string, [Uint8Array, Uint8Array][]>> {
    if (!threadIds?.length) {
      return {};
    }
    const writes = await this.checkpointWritesModel.findAll({
      where: {
        threadId: {
          [Op.in]: threadIds,
        },
        channel: TASKS,
      },
    });

    const result: Record<
      string,
      {
        taskId: string;
        channel: string;
        type: string;
        blob: Uint8Array;
        idx: number;
      }[]
    > = {};
    for (const write of writes) {
      const key = `${write.threadId}:${write.checkpointId}`;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push({
        taskId: write.taskId,
        channel: write.channel,
        type: write.type,
        blob: write.blob ? Uint8Array.from(write.blob) : null,
        idx: write.idx,
      });
    }
    return Object.fromEntries(
      Object.entries(result).map(([key, list]) => [
        key,
        [...list]
          .sort((a, b) => {
            if (a.taskId !== b.taskId) {
              return a.taskId.localeCompare(b.taskId);
            }
            return a.idx - b.idx;
          })
          .map(({ type, blob }) => [new TextEncoder().encode(type), blob]),
      ]),
    );
  }

  private async getCheckpointBlobs(
    threadIds: string[],
  ): Promise<Record<string, [Uint8Array, Uint8Array, Uint8Array][]>> {
    const blobs = await this.checkpointBlobsModel.findAll({
      where: {
        threadId:
          threadIds.length === 1
            ? threadIds[0]
            : {
                [Op.in]: threadIds,
              },
      },
    });
    const result: Record<
      string,
      {
        taskId: string;
        checkpointNs: string;
        channel: string;
        version: string;
        type: string;
        blob: Uint8Array;
      }[]
    > = {};
    for (const blob of blobs) {
      const key = `${blob.threadId}:${blob.checkpointNs}:${blob.channel}:${blob.version}`;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push({
        taskId: blob.taskId,
        checkpointNs: blob.checkpointNs,
        channel: blob.channel,
        version: blob.version,
        type: blob.type,
        blob: blob.blob ? Uint8Array.from(blob.blob) : null,
      });
    }
    return Object.fromEntries(
      Object.entries(result).map(([key, list]) => [
        key,
        list.map(({ channel, type, blob }) => [
          new TextEncoder().encode(channel),
          new TextEncoder().encode(type),
          blob,
        ]),
      ]),
    );
  }

  private get checkpointsModel() {
    return this.collectionManager.getCollection('lcCheckpoints').model;
  }

  private get checkpointBlobsModel() {
    return this.collectionManager.getCollection('lcCheckpointBlobs').model;
  }

  private get checkpointWritesModel() {
    return this.collectionManager.getCollection('lcCheckpointWrites').model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}
