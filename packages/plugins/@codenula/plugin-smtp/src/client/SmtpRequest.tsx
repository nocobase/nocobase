/* eslint-disable */

import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Card, message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { useSmtpRequest } from './SmtpRequestProvider';
import { SchemaComponentProvider, i18n, useAPIClient, useRequest } from '@nocobase/client';
import { SchemaComponent, useActionContext } from '@nocobase/client';
import { observable } from '@formily/reactive';
import { Observer } from '@formily/react';
import useTryModal from './hooks/useTryModal';
import { Button, Modal, Upload, UploadProps } from 'antd';
import './styles.css';
import { TryModalSchema } from './Schema/modalSchema';
import { sendEmailRequest } from './utils/sendEmailRequest';

import { UploadOutlined } from '@ant-design/icons';
import Loader from './utils/Loader';
import { checkAPIKey } from './utils/checkAPIKey';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

//useForm fetches the values of form where it is used in schema
const useSend = () => {
  const form = useForm();

  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      console.log(values);
    },
  };
};
const useModalOpen = () => {
  return {
    async run() {
      obs.modalFlag = true;
    },
  };
};

//sending Email after entering necessary email field values
const useTryNow = () => {
  const form = useForm();
  const api = useAPIClient();
  const values = cloneDeep(form.values);
  const params = {
    to: values.to,
    from: values.from,
    subject: values.subject,
    text: values.body,
  };

  //using APIClient
  return {
    async run() {
      let attachments = [];
      await form.submit();
      const values = cloneDeep(form.values);

      //converting image object to blob and then to base64 string
      async function convertImageObjectToBlob(imageObject) {
        const response = await fetch(imageObject.url);
        const blob = await response.blob();

        const reader = new FileReader();

        const promise = new Promise((resolve, reject) => {
          reader.onloadend = () => {
            if (reader.error) {
              reject(reader.error);
            } else {
              resolve(reader.result);
            }
          };
        });

        reader.readAsDataURL(blob);

        // Wait for the promise to resolve before accessing the reader.result property.
        const result = await promise;
        return result;
      }

      //converting each image to base64 string and pushing in a new array
      if (values.uploadFile?.length > 0) {
        for (let i = 0; i < values.uploadFile.length; i++) {
          //values.uploadFile is an array of image objects
          const base64string = await convertImageObjectToBlob(values.uploadFile[i]);
          attachments.push({ path: base64string });
        }
      }

      const params = {
        to: values.to,
        from: values.from,
        subject: values.subject,
        text: values.body,
        attachment: attachments ? attachments : [],
      };
      console.log(params, values);
      obs.loading = true;

      if (values.apikey?.length > 0) {
        sendEmailRequest(params, values.apikey, obs);
        obs.apikey = values.apikey;
        // obs.loading = false;
      } else {
        await api
          .request({
            url: 'email:sendMyEmail',
            method: 'post',
            data: params,
            params: params,
          })
          .then((res) => {
            console.log(res);
            obs.to = values.to;
            obs.from = values.from;
            obs.subject = values.subject;
            obs.text = values.body;
            obs.apikey = values.apikey;
            obs.loading = false;
            window.alert('email sent successfully');
          })
          .catch((err) => {
            console.log(err);
            window.alert('Access denied');
            obs.loading = false;
          });
      }
    },
  };
};

const useSmtpRequestValues = (options) => {
  const { visible } = useActionContext();
  const result = useSmtpRequest();

  return useRequest(() => Promise.resolve(result.data), {
    ...options,
    refreshDeps: [visible],
  });
};

const useSubmit = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { mutate, data } = useSmtpRequest();
  const api = useAPIClient();

  // const { t } = useTranslation();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);

      console.log(values);
      mutate({
        data: {
          ...data?.data,
          ...values,
        },
      });
      await api
        .request({
          url: 'smtpRequest:update/1',
          method: 'post',
          data: values,
        })
        .then((res) => {
          window.alert('Email values set successfully');
          console.log(res);
        })
        .catch((err) => console.log(err));
      obs.host = values.host;
      obs.port = values.port;
      obs.username = values.username ? values.username : '';
      obs.password = values.password ? values.password : '';
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-decorator-props': {
        useValues: '{{ useSmtpRequestValues }}',
      },
      'x-component': 'div',
      type: 'void',
      title: 'Smtp Request',
      properties: {
        host: {
          type: 'string',
          title: 'Host',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        port: {
          type: 'integer',
          title: 'Port',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        username: {
          type: 'string',
          title: 'Username',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        password: {
          type: 'string',
          title: 'Password',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        from: {
          type: 'string',
          title: 'Sender Email',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        // allowed_user: {
        //   type: 'string',
        //   title: 'Allowed user',
        //   'x-decorator': 'FormItem',
        //   'x-component': 'Input.Checkbox',
        // },

        admin: {
          title: 'Admin',
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
          // 'x-content': '{{t("Allow admin")}}'
          // 'x-content': 'Select users',
          // 'x-component-props': {
          //   multiple: true,
          // },

          // enum: [
          //   { label: '{{t("Admin")}}', value: 'admin' },
          //   { label: '{{t("Root")}}', value: 'root' },
          //   { label: '{{t("Members")}}', value: 'member' },
          // ],
        },
        member: {
          title: 'Member',
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
        root: {
          title: 'Root',
          type: 'boolean',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },

        footer1: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
          },
          properties: {
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useSubmit }}',
              },
            },
            // try_now: {
            //   title: '{{t("Try now")}}',
            //   'x-component': 'Action',
            //   'x-component-props': {
            //     type: 'primary',
            //     htmlType: 'button',
            //     useAction: '{{ useModalOpen }}',
            //   },
            // },
          },
        },
      },
    },
  },
};

//using observable to update the curl request data on clicking submit
const obs = observable({
  host: '',
  port: '',
  username: '',
  password: '',
  to: '',
  from: '',
  subject: '',
  text: '',
  modalFlag: false,
  base64url: '',
  loading: false,
  apikey: false,
});

const CurlRequest = ({ children }) => {
  const [visible, setVisible] = React.useState(false);
  const initialData = {
    host: '',
    port: 0,
    username: '',
    password: '',
  };

  const [data, setData] = useState(initialData);

  const fetchData = () => {
    fetch('/api/smtpRequest:get/1')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData && typeof responseData.data === 'object') {
          const { host, port, username, password } = responseData.data;
        } else {
          console.error('Invalid JSON data:', responseData);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <Observer>
        {() => {
          const object = {
            to: obs.to ? obs.to : `{receiver@example.com}`,
            from: obs.from ? obs.from : `{sender@example.com}`,
            subject: obs.subject ? obs.subject : `{sample-subject}`,
            text: obs.text ? obs.text : `{sample-body}`,
          };
          const values = JSON.stringify(object).split(',');
          const jsxElements = values.map((value, index) => (
            <div key={value}>
              {value}
              {index != values.length - 1 && ','}
            </div>
          ));
          const host = window.location.host;
          const token = obs.apikey ? obs.apikey : localStorage.getItem('NOCOBASE_TOKEN');
          return (
            <>
              {obs.port && obs.host && (
                <>
                  <h4>
                    curl --location {`http://${host}/api/email:sendMyEmail`} \<br />
                    --header 'Content-Type: application/json' \<br />
                    --header 'Authorization: Bearer {`${token}`}'<br />
                    --data-raw '<br />
                    {jsxElements}'
                  </h4>

                  <div>{children}</div>
                </>
              )}
            </>
          );
        }}
      </Observer>
    </div>
  );
};

const schema2: ISchema = {
  type: 'void',
  name: 'hello',
  'x-component': 'CurlRequest',
  properties: {
    try_now: {
      title: '{{t("Try now")}}',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        htmlType: 'button',
        useAction: '{{ useModalOpen }}',
      },
    },
  },
};
const modalSchema: ISchema = {
  type: 'void',
  name: 'modal',
};
const handleTryNowModal = () => {};
export const UploadFile = () => {
  return <h1>Hello</h1>;
};
export const SmtpRequestPane = ({ modalFlag }) => {
  let flag = false;
  const [isOpen, setIsOpen] = React.useState(false);
  const { openModal, isModalOpen, handleOk, handleCancel } = useTryModal();
  const [dropdownValue, setDropdownValue] = React.useState('');

  useEffect(() => {
    console.log(modalFlag);
  }, [modalFlag]);
  const handleDropdown = (value) => {
    setDropdownValue(value);
  };
  console.log(dropdownValue);
  return (
    <>
      <Card bordered={false}>
        <SchemaComponent
          scope={{
            useSubmit,
            useSmtpRequestValues,
            useCloseAction,
            useModalOpen,
            onChange(value) {
              handleDropdown(value);
            },
          }}
          schema={schema}
        />
      </Card>
      <Card bordered={false} className="curl-request">
        <SchemaComponent scope={{ useModalOpen }} components={{ CurlRequest }} schema={schema2} />
      </Card>
      <div>
        <Observer>
          {() => {
            return (
              <>
                {
                  <Modal
                    title="Try now"
                    open={obs.modalFlag}
                    onOk={() => (obs.modalFlag = false)}
                    onCancel={() => (obs.modalFlag = false)}
                    footer={null}
                  >
                    {/* <TryModal /> */}
                    {/* <UploadFile/> */}
                    {obs.loading ? (
                      <>
                        <div
                          style={{
                            height: '500px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '10px',
                          }}
                        >
                          <Loader />
                        </div>
                      </>
                    ) : (
                      <SchemaComponent
                        scope={{ useSubmit, useSmtpRequestValues, useCloseAction, useSend, useTryNow }}
                        schema={TryModalSchema}
                      />
                    )}
                  </Modal>
                }
              </>
            );
          }}
        </Observer>
      </div>
    </>
  );
};

export default SmtpRequestPane;
