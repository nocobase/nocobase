import { setup } from '@/components/form.fields';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  createFormActions,
  createAsyncFormActions,
  Submit,
  Reset,
  FormButtonGroup,
  registerFormFields,
  FormValidator,
  setValidationLanguage,
} from '@formily/antd';

setup();
setValidationLanguage('zh-CN');

export { Form } from './Form';
export { DrawerForm } from './DrawerForm';
