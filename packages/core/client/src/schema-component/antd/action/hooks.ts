/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema, useForm } from '@formily/react';
import { App } from 'antd';
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDetailBlock } from '../../../block-provider/FormBlockProvider';
import { ActionContext } from './context';

export const useActionContext = () => {
  const ctx = useContext(ActionContext);
  const { t } = useTranslation();
  const { modal } = App.useApp();

  return {
    ...ctx,
    setVisible: useCallback(
      (visible: boolean, confirm = false) => {
        if (!visible) {
          if (confirm && ctx.formValueChanged) {
            modal.confirm({
              title: t('Unsaved changes'),
              content: t("Are you sure you don't want to save?"),
              async onOk() {
                ctx.setFormValueChanged(false);
                ctx.setVisible?.(false);
              },
            });
          } else {
            ctx.setVisible?.(false);
          }
        } else {
          ctx.setVisible?.(visible);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [modal, t, ctx.formValueChanged, ctx.setVisible, ctx.setFormValueChanged],
    ),
  };
};

export const useCloseAction = () => {
  const { setVisible } = useContext(ActionContext);
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

export const useLinkageAction = () => {
  const fieldSchema = useFieldSchema();
  const isRecordAction = useIsDetailBlock();
  const isAction = ['Action.Link', 'Action'].includes(fieldSchema['x-component']);
  return isAction && isRecordAction && fieldSchema['x-action'];
};
