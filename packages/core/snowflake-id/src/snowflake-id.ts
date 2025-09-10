/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class Snowflake {
  private workerId = 0;
  // 2020-11-11 00:00:00 The date of the first commit of NocoBase.
  private epoch = 1605024000;
  private workerIdBits = 5;
  private sequenceBits = 16;
  private maxWorkerId = -1 ^ (-1 << this.workerIdBits); // 31
  private maxSequence = -1 ^ (-1 << this.sequenceBits); // 65535
  private lastTs = -1;
  private sequence = 0;

  constructor(options: { workerId?: number; epoch?: number } = {}) {
    const { workerId = 0, epoch = 1605024000 } = options;

    if (workerId < 0 || workerId > this.maxWorkerId) {
      throw new Error(`workerId must be between 0 and ${this.maxWorkerId}`);
    }
    this.workerId = workerId;

    this.epoch = epoch > 1e12 ? Math.floor(epoch / 1000) : epoch;
  }

  private timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  private tilNextSecond(lastTs: number) {
    let ts = this.timestamp();
    while (ts <= lastTs) {
      ts = this.timestamp();
    }
    return ts;
  }

  generate() {
    let ts = this.timestamp();

    if (this.lastTs === ts) {
      this.sequence = (this.sequence + 1) & this.maxSequence;
      if (this.sequence === 0) {
        ts = this.tilNextSecond(this.lastTs);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTs = ts;

    const id =
      ((ts - this.epoch) << (this.workerIdBits + this.sequenceBits)) |
      (this.workerId << this.sequenceBits) |
      this.sequence;

    return id;
  }

  parse(id: number) {
    const timestamp = (id >> (this.workerIdBits + this.sequenceBits)) + this.epoch;
    const workerId = (id >> this.sequenceBits) & this.maxWorkerId;
    const sequence = id & this.maxSequence;

    return {
      id,
      timestamp,
      workerId,
      sequence,
    };
  }
}
