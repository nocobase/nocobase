import { render, screen, fireEvent, act } from '@testing-library/react';
import { FormItem, Input } from '@formily/antd';
import { ISchema, observer, useForm } from '@formily/react';
import { Form, SchemaComponent, SchemaComponentProvider, useActionContext, ActionContext } from '@nocobase/client';
import { Action } from '../Action';
import React, { useState } from 'react';
import { ActionLink } from '../Action.Link';
import { exp } from 'mathjs';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    action1: {
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
      },
      type: 'void',
      title: 'Open',
      properties: {
        drawer1: {
          'x-component': 'Action.Drawer',
          type: 'void',
          title: 'Drawer Title',
          properties: {
            hello1: {
              'x-content': 'Hello',
              title: 'T1',
            },
            footer1: {
              'x-component': 'Action.Drawer.Footer',
              type: 'void',
              properties: {
                close1: {
                  title: 'Close',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCloseAction }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const ComponentA = observer(() => {
  return (
    <SchemaComponentProvider scope={{ useCloseAction }} components={{ Form, Action, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
});

const ComponentB = observer(() => {
  return (
    <SchemaComponentProvider scope={{ useCloseAction }} components={{ Form, Action, Input, FormItem }}>
      <SchemaComponent
        schema={{
          type: 'object',
          properties: {
            action1: {
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                size: 'large',
              },
              type: 'void',
              title: 'action',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
});

const ComponentC = observer(() => {
  return (
    <SchemaComponentProvider scope={{ useCloseAction }} components={{ Form, ActionLink, Input, FormItem }}>
      <SchemaComponent
        schema={{
          type: 'object',
          properties: {
            action1: {
              'x-component': 'ActionLink',
              'x-component-props': {
                type: 'primary',
                size: 'large',
              },
              type: 'void',
              title: 'link',
            },
          },
        }}
      />
    </SchemaComponentProvider>
  );
});

const setup = () => {
  const returnVal = {};

  const UseComponentTest = () => {
    const [visible, setVisible] = useState(false);

    Object.assign(returnVal, {
      visible,
      setVisible,
    });

    return (
      <SchemaComponentProvider components={{ Form, Action, Input, FormItem }}>
        <ActionContext.Provider value={{ visible, setVisible }}>
          <a onClick={() => setVisible(true)}>Open</a>
          <SchemaComponent scope={{ useCloseAction }} schema={schema} />
        </ActionContext.Provider>
      </SchemaComponentProvider>
    );
  };

  render(<UseComponentTest />);

  return returnVal;
};

describe('action snapshots', () => {
  it('action ', () => {
    const { container } = render(<ComponentA />);
    expect(container).toMatchSnapshot();
  });
  it('action display by props ', () => {
    const wrapper = render(<ComponentB />);
    const element = wrapper.getByText('action');
    expect(element).toBeInTheDocument();
    expect(element.parentNode).toHaveClass('ant-btn-primary');
    expect(element.parentNode).toHaveClass('ant-btn-lg');
  });
  it('action display as link ', () => {
    const wrapper = render(<ComponentC />);
    const element = wrapper.getByText('link');
    expect(element).toBeInTheDocument();
    expect(element.tagName).toEqual('A');
    expect(element).toHaveClass('nb-action-link');
  });
  it('action visible ', () => {
    const useComponentData: any = setup();
    const btn = screen.getAllByText('Open');
    fireEvent.click(btn[0]);
    expect(useComponentData.visible).toBe(true);
  });
});
