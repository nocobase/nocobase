/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type CloseGuardContext = {
  inputArgs?: {
    dirty?: {
      hasDirtyForms?: boolean;
      formModelUids?: string[];
    };
    controller?: {
      prevent?: () => void;
    };
  };
  modal: {
    confirm: (options: {
      title: string;
      content: string;
      okText: string;
      cancelText: string;
    }) => boolean | Promise<boolean>;
  };
  t: (value: string) => string;
  exitAll: () => void;
};

export async function confirmUnsavedChangesHandler(ctx: CloseGuardContext) {
  if (!ctx.inputArgs?.dirty?.hasDirtyForms) {
    return;
  }

  const confirmed = await ctx.modal.confirm({
    title: ctx.t('Unsaved changes'),
    content: ctx.t("Are you sure you don't want to save?"),
    okText: ctx.t('Confirm'),
    cancelText: ctx.t('Cancel'),
  });

  if (!confirmed) {
    ctx.inputArgs?.controller?.prevent?.();
    ctx.exitAll();
  }
}
