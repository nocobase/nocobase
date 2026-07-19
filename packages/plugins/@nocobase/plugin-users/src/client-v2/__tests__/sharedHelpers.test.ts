/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
  ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
  buildAdminProfileCreateFormModel,
  buildAdminProfileEditFormModel,
} from '../shared/adminProfileFormModels';
import { generatePassword } from '../shared/generatePassword';
import { toListPayload } from '../pages/types';

function getItems(model: Record<string, any>) {
  return model.subModels.grid.subModels.items as Record<string, any>[];
}

function getFieldPath(item: Record<string, any>) {
  return item.stepParams.fieldSettings.init.fieldPath;
}

describe('plugin-users client-v2 shared helpers', () => {
  it('builds the default create profile form model', () => {
    const model = buildAdminProfileCreateFormModel();
    const items = getItems(model);

    expect(model).toEqual(
      expect.objectContaining({
        uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
        use: 'UserCreateFormModel',
      }),
    );
    expect(items.map(getFieldPath)).toEqual(['nickname', 'username', 'email', 'phone', 'password', 'roles']);
    expect(items.find((item) => getFieldPath(item) === 'username')?.stepParams.editItemSettings.required).toEqual({
      required: true,
    });
    expect(items.find((item) => getFieldPath(item) === 'password')?.subModels.field).toEqual(
      expect.objectContaining({
        use: 'UserPasswordFieldModel',
        props: expect.objectContaining({
          autoComplete: 'new-password',
          checkStrength: false,
        }),
      }),
    );
    expect(items.find((item) => getFieldPath(item) === 'roles')?.subModels.field).toEqual(
      expect.objectContaining({
        use: 'UserRolesSelectFieldModel',
      }),
    );
  });

  it('builds the default edit profile form model without password field', () => {
    const model = buildAdminProfileEditFormModel();
    const items = getItems(model);

    expect(model).toEqual(
      expect.objectContaining({
        uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
        use: 'UserEditFormModel',
      }),
    );
    expect(model.stepParams.resourceSettings.init.filterByTk).toBe('{{ctx.view.inputArgs.filterByTk}}');
    expect(items.map(getFieldPath)).toEqual(['nickname', 'username', 'email', 'phone', 'roles']);
  });

  it('generates passwords with required character categories', () => {
    const password = generatePassword();

    expect(password).toHaveLength(10);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!#$%^&*\-_+=]/);
  });

  it('normalizes list payloads', () => {
    expect(toListPayload(null)).toEqual({});
    expect(toListPayload({ data: 'invalid', meta: { count: 3 } })).toEqual({
      data: [],
      meta: { count: 3 },
    });
    expect(toListPayload<{ id: number }>({ data: [{ id: 1 }], meta: { total: 1 } })).toEqual({
      data: [{ id: 1 }],
      meta: { total: 1 },
    });
  });
});
