import React, { useEffect, useState } from 'react';
import {
  useAPIClient,
} from '@nocobase/client';
import { Form, Input, Button, Dropdown, Space, MenuProps } from 'antd';
import './EmailBody.css';
import 'react-quill/dist/quill.snow.css';
import { RichTextV2 } from '@nocobase/client';


const EmailBody = (props) => {
  const ref = React.useRef(null);
  const api = useAPIClient();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = React.useState({ subject: '', body: '' });
  const fetchExistingData = async () => {
    
    //values for setting data dynamically
    const bodyProperty = props.page;
    const subjectProperty = props.page + 'Subject';
    api
      .request({
        url: 'custom-email-body:get?filterByTk=1',
        method: 'post',
      })
      .then((res) => {
        //used to enter data in Rich Text component without losing value
        ref.current = res.data.data[subjectProperty];

        setFormData({
          body: res.data.data[bodyProperty],
          subject: res.data.data[subjectProperty],
        });
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
    return () => {
      ref.current = null;
    };
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

  const onClick = (props) => {
    console.log(props.domEvent.target.innerHTML);
    setFormData({ ...formData, body: formData.body + `{${props.domEvent.target.innerHTML}}` });
  };

  console.log(formData);
  const handleRichTextValues = (value) => {
    if (formData.subject) {
      setFormData({ ...formData, body: value });
    } else {
      setFormData({ subject: ref.current, body: value });
    }
  };
  return (
    <div>

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
       
        <Form.Item label="Body">
         
          <RichTextV2/>

        
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
