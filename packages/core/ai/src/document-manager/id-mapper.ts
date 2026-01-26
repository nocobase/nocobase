/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class IdMapper {
  private nextId = 1;
  private ext2num = new Map<string, number>();
  private num2ext = new Map<number, string>();

  toNumeric(id: string | number): number {
    if (typeof id === 'number') {
      return id;
    }

    let num = this.ext2num.get(id);
    if (!num) {
      num = this.nextId++;
      this.ext2num.set(id, num);
      this.num2ext.set(num, id);
    }
    return num;
  }

  getNumeric(id: string | number): number | undefined {
    if (typeof id === 'number') {
      return id;
    }

    return this.ext2num.get(id);
  }

  toExternal(id: number): string | number {
    return this.num2ext.get(id) ?? id;
  }

  remove(id: string | number) {
    if (typeof id === 'number') {
      const ext = this.num2ext.get(id);
      if (ext) {
        this.num2ext.delete(id);
        this.ext2num.delete(ext);
      }
    } else {
      const num = this.ext2num.get(id);
      if (num) {
        this.ext2num.delete(id);
        this.num2ext.delete(num);
      }
    }
  }
}
