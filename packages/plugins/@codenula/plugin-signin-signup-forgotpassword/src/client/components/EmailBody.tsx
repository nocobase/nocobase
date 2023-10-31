import React, { useEffect, useState } from 'react';
import { bodySchema, emailSchema } from '../schema/mailSchema';
import {
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useRequest,
  SchemaInitializerItemOptions,
  css,
  Variable,
  useCollectionField,
} from '@nocobase/client';
import { ISchema, useForm } from '@formily/react';
import cloneDeep from 'lodash/cloneDeep';
import { useEmailValuesRequest, useUsersRequest } from '../EmailValuesProvider';
import { Form, Input, Button, Dropdown, Space, MenuProps } from 'antd';
import './EmailBody.css';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { RichText } from '@nocobase/client';

const useEmailValues = (options) => {
  const { visible } = useActionContext();
  const result = useEmailValuesRequest();

  return useRequest(() => Promise.resolve(result.data), {
    ...options,
    refreshDeps: [visible],
  });
};
const useUserValue = () => {
  const { visible } = useActionContext();
  const result = useUsersRequest();
};
function RequestBody() {
  const response = useUserValue();

  const scope = [
    { key: 'key', label: 'username', value: 'username' },
    { key: 'key', label: 'email', value: 'email' },
    { key: 'key', label: 'phone', value: 'phone' },
  ];
  return <Variable.RawTextArea scope={scope} />;
}
const EmailBody = (props) => {
  const api = useAPIClient();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = React.useState({ subject: '', body: '' });
  const fetchExistingData = async () => {
    api
      .request({
        url: 'custom-email-body:get?filterByTk=1',
        method: 'post',
      })
      .then((res) => {
        console.log(res.data);
        if (props.page === 'signinEmail') {
          setFormData({
            body: res.data.data.signinEmail,
            subject: res.data.data.signinEmailSubject,
          });
        } else if (props.page === 'signupEmail') {
          setFormData({
            body: res.data.data.signupEmail,
            subject: res.data.data.signupEmailSubject,
          });
        } else if (props.page === 'forgotPasswordEmail') {
          console.log({
            subject: res.data.data.forgotPasswordEmailSubject,
          });
          setFormData({
            body: res.data.data.forgotPasswordEmail,
            subject: res.data.data.forgotPasswordEmailSubject,
          });
        } else {
          setFormData({
            body: res.data.data.confirmForgotPasswordEmail,
            subject: res.data.data.confirmForgotPasswordEmailSubject,
          });
        }
      })
      .catch((err) => console.log(err));
  };
  const fetchUserDataField = async () => {
    api
      .request({
        url: 'users:get?filterByTk=1',
        method: 'post',
      })
      .then((res) => {
        const newObj = Object.fromEntries(
          Object.entries(res.data.data).filter(
            ([key, value]) =>
              key !== 'updatedById' &&
              key !== 'systemSettings' &&
              key !== 'createdById' &&
              key !== 'appLang' &&
              key !== 'resetToken' &&
              key !== 'password',
          ),
        );
        const dbFields = Object.keys(newObj);
        let items = [];
        for (let i = 0; i < dbFields.length; i++) {
          items.push({
            key: i,
            label: dbFields[i],
          });
        }
        setItems([
          ...items,
          {
            key: 999,
            label: 'link',
          },
        ]);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchUserDataField();
    fetchExistingData();
  }, []);

  const handleSubmit = () => {

    
    api
      .request({
        url: 'custom-email-body:update/1',
        method: 'post',
        data: {
          ...(formData.body && { [props.page]: formData.body }),
          ...(formData.subject && { [props.subject]: formData.subject }),
        },
      })
      .then((res) => {
        window.alert('email values set successfully.');
        console.log(res);
      })
      .catch((err) => console.log(err));
  };
  const useSetValue = () => {
    const { setVisible } = useActionContext();
    const form = useForm();

    const api = useAPIClient();

    // const { t } = useTranslation();
    return {
      async run() {
        await form.submit();
        const values = cloneDeep(form.values);

        console.log(values);
        const string = '{{somevalue}}';

        // Replace the double braces with single braces.
        // const replacedString = values.body.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
        // console.log(replacedString);
        // if (!values.body && !values.subject) {
        //   window.alert('Please enter the details in atleast one field');
        // } else {
        //   await api
        //     .request({
        //       url: 'custom-email-body:update/1',
        //       method: 'post',
        //       data: {
        //         ...(values.body && { [props.page]: replacedString }),
        //         ...(values.subject && { [props.subject]: values.subject }),
        //         custom_variables: values.custom_variables,
        //       },
        //     })
        //     .then((res) => {
        //       window.alert('Custom Email set successfully');
        //       console.log(res);
        //     })
        //     .catch((err) => console.log(err));
        // }
      },
    };
  };
  const onClick = (props) => {
    console.log(props.domEvent.target.innerHTML);
    setFormData({ ...formData, body: formData.body + `{${props.domEvent.target.innerHTML}}` });
  };
  // const items: MenuProps['items'] = [
  //   {
  //     key: '1',
  //     label: 'username',
  //   },
  //   {
  //     key: '2',
  //     label: 'email',
  //   },
  // ];
  return (
    <div>
      {/* <SchemaComponent schema={emailSchema} scope={{ useSetValue, useEmailValues }} /> */}
      {/* <SchemaComponent
       components={{ RequestBody }}
        schema={{
          type: 'void',
          properties: {
            [`somevalue`]: {
              type: 'void',
              title: 'data.title',
              'x-component': 'div',
              'x-decorator': 'Form',

              properties: {
                fieldset: {
                  type: 'void',
                  'x-component': 'fieldset',
                  'x-component-props': {
                    className: css`
                      .ant-input,
                      .ant-select,
                      .ant-cascader-picker,
                      .ant-picker,
                      .ant-input-number,
                      .ant-input-affix-wrapper {
                        &.auto-width {
                          width: auto;
                          min-width: 6em;
                        }
                      }
                    `,
                  },
                  properties: bodySchema.fieldset,
                },
                actions: {
                  type: 'void',
                  'x-component': 'Action.Drawer.Footer',
                  properties: {
                    submit: {
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: useSetValue,
                      },
                    },
                  },
                },
              },
            } as ISchema,
          },
        }}
      /> */}
      <Form onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Subject">
          <Input
            name="subject"
            value={formData.subject}
            required={true}
            onChange={(e) => {
              setFormData({ ...formData, subject: e.target.value });
            }}
          />
        </Form.Item>
        {/* <Form.Item label="Body">
          <Input.TextArea
            name="body"
            value={formData.body}
            required={true}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="text-area"
          />

          <Dropdown menu={{ items, onClick }} placement="bottom" className="dropdown-x">
            <Button>X</Button>
          </Dropdown>
        </Form.Item> */}
        <Form.Item label="Body">
          <RichText value={formData.body} onChange={(value) => setFormData({ ...formData, body: value })} />

          <Dropdown menu={{ items, onClick }} placement="bottom" className="dropdown-x">
            <Button>X</Button>
          </Dropdown>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EmailBody;
