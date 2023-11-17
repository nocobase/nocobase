import { CollectionManagerProvider, registerField, registerTemplate, SchemaComponentOptions } from '@nocobase/client';
import { forEach } from '@nocobase/utils/client';
import React, { FC } from 'react';
import * as hooks from './hooks';
import { UploadActionInitializer } from './initializers';
import { attachment } from './interfaces/attachment';
import * as templates from './templates';

// 注册之后就可以在 Crete collection 按钮中选择创建了
forEach(templates, (template, key: string) => {
  registerTemplate(key, template);
});

registerField(attachment.group, 'attachment', attachment);

export const FileManagerProvider: FC = (props) => {
  return (
    <CollectionManagerProvider interfaces={{ attachment }}>
      <SchemaComponentOptions scope={hooks} components={{ UploadActionInitializer }}>
        {props.children}
      </SchemaComponentOptions>
    </CollectionManagerProvider>
  );
};
