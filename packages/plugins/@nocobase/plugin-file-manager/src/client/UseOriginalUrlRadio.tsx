/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer, useForm } from '@formily/react';
import { PublicAccessCheckbox } from '../client-v2/components/PublicAccessField';
import {
  UseOriginalUrlRadio as UseOriginalUrlRadioView,
  type UseOriginalUrlRadioProps as UseOriginalUrlRadioViewProps,
} from '../client-v2/components/UseOriginalUrlField';
import { useFmTranslation } from './locale';

export type UseOriginalUrlRadioProps = Omit<UseOriginalUrlRadioViewProps, 'publicAccessControl' | 't'>;

export const UseOriginalUrlRadio = observer((props: UseOriginalUrlRadioProps) => {
  const { t } = useFmTranslation();
  const form = useForm();
  const publicAccess = Boolean(form.getValuesIn('options.public'));

  React.useEffect(() => {
    if (props.value) {
      form.setValuesIn('options.public', false);
    }
  }, [form, props.value]);

  return (
    <UseOriginalUrlRadioView
      {...props}
      t={t}
      publicAccessControl={
        <PublicAccessCheckbox
          checked={publicAccess}
          onChange={(checked) => form.setValuesIn('options.public', checked)}
          disabled={props.disabled}
          t={t}
        />
      }
    />
  );
});
