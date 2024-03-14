import { customAlphabet as Alphabet } from 'nanoid';
import React, { useEffect } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useForm } from '@formily/react';
import { Input as AntdInput } from 'antd';
import { ReadPretty } from '../input';
import { useCollectionField } from '../../../data-source/collection-field/CollectionFieldProvider';
import { useTranslation } from 'react-i18next';

export const NanoIDInput = Object.assign(
  connect(
    AntdInput,
    mapProps((props: any, field: any) => {
      const { size, customAlphabet } = useCollectionField() || {};
      const { t } = useTranslation();
      const form = useForm();
      function isValidNanoid(value) {
        if (value?.length !== size) {
          return t('Field value size is') + ` ${size || 21}`;
        }
        for (let i = 0; i < value.length; i++) {
          if (customAlphabet?.indexOf(value[i]) === -1) {
            return t(`Field value do not meet the requirements`);
          }
        }
      }

      useEffect(() => {
        if (!field.initialValue && customAlphabet) {
          field.setInitialValue(Alphabet(customAlphabet, size)());
        }
        form.setFieldState(field.props.name, (state) => {
          state.validator = isValidNanoid;
        });
      }, []);
      return {
        ...props,
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty.Input),
  ),
  {
    ReadPretty: ReadPretty.Input,
  },
);
