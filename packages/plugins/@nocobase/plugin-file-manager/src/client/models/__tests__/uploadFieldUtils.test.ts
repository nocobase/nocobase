/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeUploadFieldFileList, shouldShowUploadActionSlot } from '../uploadFieldUtils';

describe('shouldShowUploadActionSlot', () => {
  it('单值字段已有文件时应隐藏追加入口', () => {
    expect(shouldShowUploadActionSlot(false, 1)).toBe(false);
  });

  it('单值字段无文件时应显示追加入口', () => {
    expect(shouldShowUploadActionSlot(false, 0)).toBe(true);
  });

  it('多值字段已有文件时仍应显示追加入口', () => {
    expect(shouldShowUploadActionSlot(true, 1)).toBe(true);
  });
});

describe('normalizeUploadFieldFileList', () => {
  it('外部值回灌时应复用上一轮 uid，避免同一张图片重挂载', () => {
    const previousFileList = [
      {
        uid: 'rc-upload-1',
        filename: 'cover.png',
        response: {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      },
    ];

    const nextFileList = normalizeUploadFieldFileList(
      [
        {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      ],
      previousFileList,
    );

    expect(nextFileList[0].uid).toBe('rc-upload-1');
  });

  it('缺少上一轮列表时应基于记录标识生成稳定 uid', () => {
    const firstFileList = normalizeUploadFieldFileList([
      {
        id: 2,
        url: '/files/avatar.png',
        filename: 'avatar.png',
      },
    ]);
    const secondFileList = normalizeUploadFieldFileList([
      {
        id: 2,
        url: '/files/avatar.png',
        filename: 'avatar.png',
      },
    ]);

    expect(firstFileList[0].uid).toBe('id:2');
    expect(secondFileList[0].uid).toBe('id:2');
  });
});
