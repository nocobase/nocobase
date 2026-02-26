import { Form, FormProps } from '@formily/antd-v5';
import { withDynamicSchemaProps, FormV2 } from '@nocobase/client';
import React, { FC, useEffect } from 'react';
import { useStepsFormContext } from './context';
import useHeight from './hooks/useHeight';

export interface FormV3Props extends FormProps {
  uid: string;
  children?: React.ReactNode;
}

export const StepForm: FC<FormV3Props> = withDynamicSchemaProps(
  (props) => {
    // const { uid } = props;
    const ctx = useStepsFormContext();
    const height = useHeight();
    // useEffect(() => {
    //   ctx.registerFormInstance({
    //     uid,
    //     form: ctx.form,
    //   });
    //   return () => {
    //   };
    // }, [uid, ctx.form]);
    return <FormV2 {...props} height={height} form={ctx.form} />;
  },
  { displayName: 'FormV3' },
);
