import { useRef } from 'react';
import { Form } from '@formily/core';

export function useFormRef() {
  const formInstanceRef = useRef({});

  const getCurrentFormInstance = (uid: string) => {
    const currentForm: Form = formInstanceRef.current[uid];
    return currentForm;
  };

  const registerFormInstance = ({ uid, form }) => {
    formInstanceRef.current[uid] = form;
  };

  return { formInstanceRef, getCurrentFormInstance, registerFormInstance };
}
