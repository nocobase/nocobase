import { ActionContextProvider, SchemaComponent, FormBlockProvider } from '@nocobase/client';
import React, { createContext, useState } from 'react';
import { useT } from '../locale';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createActionSchema } from '../schemas/createActionSchema';
import { createForm } from '@formily/core';
import { uid } from '@nocobase/utils/client';

export const NewTemplateFormContext = createContext(null);

export const AddNewTemplate = () => {
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState(null);
  const t = useT();
  const handleClick = () => {
    setForm(
      createForm({
        initialValues: {
          key: `t_${uid()}`,
          type: 'Desktop',
        },
      }),
    );
    setVisible(true);
  };

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button icon={<PlusOutlined />} type={'primary'} onClick={handleClick}>
        {t('Add new')}
      </Button>
      <NewTemplateFormContext.Provider value={form}>
        <SchemaComponent schema={createActionSchema} />
      </NewTemplateFormContext.Provider>
    </ActionContextProvider>
  );
};
