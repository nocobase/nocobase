import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';

export const TryModalSchema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      // 'x-decorator-props': {
      //   useValues: '{{ useSmtpRequestValues }}',
      // },
      'x-component': 'div',
      type: 'void',
      title: 'Smtp Request',
      properties: {
        from: {
          type: 'email',
          title: 'From',
          'x-decorator': 'FormItem',
          'x-component': 'Input',

          required: true,
        },
        to: {
          type: 'email',
          title: 'To',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        subject: {
          type: 'string',
          title: 'Subject',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        body: {
          type: 'string',
          title: 'Body',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          required: true,
        },
        apikey: {
          type: 'string',
          title: 'API key',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        uploadFile: {
          type: 'string',
          title:"Attachment",
          'x-decorator': 'FormItem',
          'x-component': 'Upload.Attachment',
          required: false,
          'x-component-props': {
            action: 'attachments:create',
            multiple: true,
            maxCount: 1,
            height: '150px',
            tipContent: `{{t('Drag and drop the file here or click to upload, file size should not exceed 30M')}}`,
            // beforeUpload: (file: RcFile) => {
            //   const compressedFileRegex = /\.(zip|rar|tar|gz|bz2|tgz)$/;
            //   const isCompressedFile = compressedFileRegex.test(file.name);
            //   if (!isCompressedFile) {
            //     message.error('File only support zip, rar, tar, gz, bz2!');
            //   }

            //   const fileSizeLimit = file.size / 1024 / 1024 < 30;
            //   if (!fileSizeLimit) {
            //     message.error('File must smaller than 30MB!');
            //   }
            //   return false;
            //   return isCompressedFile && fileSizeLimit;
            // },
          },
        },

        // attachments: {
        //   type: 'void',
        //   title: 'Attachment',

        //   'x-component': 'UploadFile',

        // },
        footer1: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
          },
          properties: {
            send: {
              title: '{{t("Send")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useTryNow }}',
              },
            },

            // cancel: {
            //   title: 'Cancel',
            //   'x-component': 'Action',
            //   'x-component-props': {
            //     useAction: '{{ useCloseAction }}',
            //   },
            // },
          },
        },
      },
    },
  },
};
