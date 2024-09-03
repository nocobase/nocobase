import { ISchema, Plugin } from '@nocobase/client';
import { AdminPublicFormList } from './components/AdminPublicFormList';
import { AdminPublicFormPage } from './components/AdminPublicFormPage';
import { PublicFormPage } from './components/PublicFormPage';
import { formSchemaCallback } from './schemas/formSchemaCallback';

export class PluginPublicFormsClient extends Plugin {
  protected formTypes = new Map();

  registerFormType(type: string, options: { label: string; uiSchema: (options: any) => ISchema }) {
    this.formTypes.set(type, options);
  }

  getFormSchemaByType(type = 'form') {
    if (this.formTypes.get(type)) {
      return this.formTypes.get(type).uiSchema;
    }
    return () => {
      return null;
    };
  }

  getFormTypeOptions() {
    const options = [];
    for (const [value, { label }] of this.formTypes) {
      options.push({ value, label });
    }
    return options;
  }

  async load() {
    this.registerFormType('form', {
      label: 'Form',
      uiSchema: formSchemaCallback,
    });
    this.app.router.add('public-forms', {
      path: '/public-forms/:name',
      Component: PublicFormPage,
    });
    this.app.pluginSettingsManager.add('public-forms', {
      title: '公共表单',
      icon: 'TableOutlined',
      Component: AdminPublicFormList,
    });
    this.app.pluginSettingsManager.add(`public-forms/:name`, {
      title: false,
      pluginKey: 'public-forms',
      isTopLevel: false,
      Component: AdminPublicFormPage,
    });
  }
}

export default PluginPublicFormsClient;
