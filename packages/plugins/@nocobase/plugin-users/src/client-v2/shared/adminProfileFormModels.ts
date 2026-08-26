/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CreateModelOptions } from '@nocobase/flow-engine';

export const ADMIN_PROFILE_CREATE_FORM_MODEL_UID = 'nocobase-admin-profile-create-form-2';
export const ADMIN_PROFILE_EDIT_FORM_MODEL_UID = 'nocobase-admin-profile-edit-form-2';

type FlowModelTree = CreateModelOptions & Record<string, unknown>;

function buildFieldInit(fieldPath: string) {
  return {
    dataSourceKey: 'main',
    collectionName: 'users',
    fieldPath,
  };
}

function buildTextFieldItem(
  fieldPath: string,
  options: { disabled?: boolean; required?: boolean } = {},
): FlowModelTree {
  return {
    use: 'FormItemModel',
    ...(options.disabled ? { props: { disabled: true } } : {}),
    stepParams: {
      fieldSettings: {
        init: buildFieldInit(fieldPath),
      },
      ...(options.required
        ? {
            editItemSettings: {
              required: {
                required: true,
              },
            },
          }
        : {}),
    },
    subModels: {
      field: {
        use: 'InputFieldModel',
      },
    },
  };
}

function buildPasswordFieldItem(): FlowModelTree {
  return {
    use: 'FormItemModel',
    stepParams: {
      fieldSettings: {
        init: buildFieldInit('password'),
      },
      editItemSettings: {
        required: {
          required: true,
        },
        initialValue: {
          defaultValue: 'admin123',
        },
      },
    },
    subModels: {
      field: {
        use: 'UserPasswordFieldModel',
        props: {
          autoComplete: 'new-password',
          checkStrength: false,
          initialValue: 'admin123',
        },
      },
    },
  };
}

function buildRolesFieldItem(): FlowModelTree {
  return {
    use: 'FormItemModel',
    stepParams: {
      fieldSettings: {
        init: buildFieldInit('roles'),
      },
    },
    subModels: {
      field: {
        use: 'UserRolesSelectFieldModel',
        stepParams: {
          selectSettings: {
            dataScope: {
              filter: {
                logic: '$and',
                items: [
                  {
                    path: 'name',
                    operator: '$ne',
                    value: 'root',
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
}

export function buildAdminProfileCreateFormModel(): FlowModelTree {
  return {
    uid: ADMIN_PROFILE_CREATE_FORM_MODEL_UID,
    use: 'UserCreateFormModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      },
    },
    subModels: {
      grid: {
        use: 'FormGridModel',
        subModels: {
          items: [
            buildTextFieldItem('nickname'),
            buildTextFieldItem('username', { required: true }),
            buildTextFieldItem('email'),
            buildTextFieldItem('phone'),
            buildPasswordFieldItem(),
            buildRolesFieldItem(),
          ],
        },
      },
    },
  };
}

export function buildAdminProfileEditFormModel(): FlowModelTree {
  return {
    uid: ADMIN_PROFILE_EDIT_FORM_MODEL_UID,
    use: 'UserEditFormModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
        },
      },
    },
    subModels: {
      grid: {
        use: 'FormGridModel',
        subModels: {
          items: [
            buildTextFieldItem('nickname'),
            buildTextFieldItem('username', { required: true }),
            buildTextFieldItem('email'),
            buildTextFieldItem('phone'),
            buildRolesFieldItem(),
          ],
        },
      },
    },
  };
}
