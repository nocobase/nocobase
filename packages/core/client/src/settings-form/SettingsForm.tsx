import { FormButtonGroup, FormDialog, FormDrawer, FormItem, FormLayout, Reset, Submit } from '@formily/antd';
import { createForm, Field, ObjectField, onFormValuesChange } from '@formily/core';
import {
  FieldContext,
  FormContext,
  observer,
  RecursionField,
  Schema,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
  useForm
} from '@formily/react';
import { Dropdown, Menu, Modal, Select, Switch } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { SchemaComponentOptions, useAttach, useDesignable } from '..';

export interface SettingsFormContextProps {
  field?: Field;
  fieldSchema?: Schema;
  dropdownVisible?: boolean;
  setDropdownVisible?: (v: boolean) => void;
  dn?: any;
}

export const SettingsFormContext = createContext<SettingsFormContextProps>(null);

export const useSettingsFormContext = () => {
  return useContext(SettingsFormContext);
};

export const SettingsForm: any = observer((props: any) => {
  const dn = useDesignable();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const settingsFormSchema = useMemo(() => new Schema(props.schema), []);
  const form = useMemo(
    () =>
      createForm({
        initialValues: fieldSchema.toJSON(),
        effects(form) {
          onFormValuesChange((form) => {
            dn.patch(form.values);
            console.log('form.values', form.values);
          });
        },
      }),
    [],
  );
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <SettingsFormContext.Provider value={{ dn, field, fieldSchema, dropdownVisible, setDropdownVisible }}>
      <SchemaComponentOptions components={{ SettingsForm }}>
        <FieldContext.Provider value={null}>
          <FormContext.Provider value={form}>
            <FieldContext.Provider value={f}>
              <Dropdown
                visible={dropdownVisible}
                onVisibleChange={(visible) => setDropdownVisible(visible)}
                overlayStyle={{ width: 200 }}
                overlay={
                  <Menu>
                    {settingsFormSchema.mapProperties((s, key) => {
                      return <RecursionField name={key} schema={s} />;
                    })}
                  </Menu>
                }
              >
                <a>配置</a>
              </Dropdown>
            </FieldContext.Provider>
          </FormContext.Provider>
        </FieldContext.Provider>
      </SchemaComponentOptions>
    </SettingsFormContext.Provider>
  );
});

SettingsForm.Divider = () => {
  return <Menu.Divider />;
};

SettingsForm.Remove = (props) => {
  const field = useField();
  const { dn, setDropdownVisible } = useSettingsFormContext();
  return (
    <Menu.Item
      onClick={() => {
        setDropdownVisible(false);
        Modal.confirm({
          title: 'Are you sure delete this task?',
          content: 'Some descriptions',
          okText: 'Yes',
          okType: 'danger',
          cancelText: 'No',
          ...props.confirm,
          onOk() {
            dn.remove();
            console.log('OK');
          },
          onCancel() {
            console.log('Cancel');
          },
        });
      }}
    >
      {field.title}
    </Menu.Item>
  );
};

SettingsForm.Switch = observer(() => {
  const field = useField<Field>();
  return (
    <Menu.Item
      onClick={() => {
        field.value = !field.value;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {field.title} <Switch checked={!!field.value} />
      </div>
    </Menu.Item>
  );
});

SettingsForm.Select = observer((props) => {
  const field = useField<Field>();
  const [open, setOpen] = useState(false);
  return (
    <Menu.Item onClick={() => !open && setOpen(true)}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {field.title}
        <Select
          open={open}
          onDropdownVisibleChange={(open) => setOpen(open)}
          onSelect={() => {
            setOpen(false);
          }}
          onChange={(value) => {
            field.value = value;
          }}
          value={field.value}
          options={field.dataSource}
          style={{ width: '60%' }}
          size={'small'}
          bordered={false}
        />
      </div>
    </Menu.Item>
  );
});

SettingsForm.Modal = () => {
  const form = useForm();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const { setDropdownVisible } = useSettingsFormContext();
  return (
    <Menu.Item
      style={{ width: 200 }}
      onClick={async () => {
        setDropdownVisible(false);
        const values = await FormDialog('Title', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components, FormItem }}>
              <FormLayout layout={'vertical'}>
                <RecursionField schema={fieldSchema} onlyRenderProperties />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: fieldSchema.type !== 'void' ? field.value : form.values,
        });
        if (fieldSchema.type !== 'void') {
          form.setValues(
            {
              [fieldSchema.name]: values,
            },
            'deepMerge',
          );
        } else {
          form.setValues(values);
        }
      }}
    >
      {field.title}
    </Menu.Item>
  );
};

SettingsForm.Drawer = () => {
  const form = useForm();
  const field = useField<ObjectField>();
  const fieldSchema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const { setDropdownVisible } = useSettingsFormContext();
  return (
    <Menu.Item
      style={{ width: 200 }}
      onClick={async () => {
        setDropdownVisible(false);
        const values = await FormDrawer('Popup form', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components, FormItem }}>
              <FormLayout layout={'vertical'}>
                <RecursionField schema={fieldSchema} onlyRenderProperties />
                <FormDrawer.Footer>
                  <FormButtonGroup align="right">
                    <Reset>Reset</Reset>
                    <Submit
                      onSubmit={() => {
                        return new Promise((resolve) => {
                          setTimeout(resolve, 1000);
                        });
                      }}
                    >
                      Submit
                    </Submit>
                  </FormButtonGroup>
                </FormDrawer.Footer>
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: fieldSchema.type !== 'void' ? field.value : form.values,
        });
        if (fieldSchema.type !== 'void') {
          form.setValues(
            {
              [fieldSchema.name]: values,
            },
            'deepMerge',
          );
        } else {
          form.setValues(values);
        }
      }}
    >
      {field.title}
    </Menu.Item>
  );
};

SettingsForm.SubMenu = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <Menu.SubMenu title={field.title}>
      {fieldSchema.mapProperties((schema, key) => {
        return <RecursionField name={key} schema={schema} />;
      })}
    </Menu.SubMenu>
  );
};

SettingsForm.ItemGroup = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <Menu.ItemGroup title={field.title}>
      {fieldSchema.mapProperties((schema, key) => {
        return <RecursionField name={key} schema={schema} />;
      })}
    </Menu.ItemGroup>
  );
};
