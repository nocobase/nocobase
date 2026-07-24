/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect } from 'vitest';

import {
  createTypeScriptProjectSession,
  getDefaultTypeScriptProjectSessionDebugStateForTests,
  shutdownDefaultTypeScriptProjectSession,
  type CodeEditorTypeScriptProjectSession,
} from '../../typescriptProject';

export async function withTypeScriptProjectSession<T>(
  run: (session: CodeEditorTypeScriptProjectSession) => Promise<T>,
): Promise<T> {
  const session = createTypeScriptProjectSession();
  try {
    return await run(session);
  } finally {
    session.dispose();
    await session.whenDisposed();
  }
}

export async function shutdownTypeScriptProjectSessionSuite(): Promise<void> {
  await shutdownDefaultTypeScriptProjectSession();
  expect(getDefaultTypeScriptProjectSessionDebugStateForTests()).toEqual(
    expect.objectContaining({ allFileNames: [], disposed: true, rootFileNames: [] }),
  );
}
