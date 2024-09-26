/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Plugin } from '@nocobase/client';
import { AdminPublicFormList } from './components/AdminPublicFormList';
import { AdminPublicFormPage } from './components/AdminPublicFormPage';
import { PublicFormPage } from './components/PublicFormPage';
import { formSchemaCallback } from './schemas/formSchemaCallback';
import { publicFormBlockSettings } from './settings';
import { NAMESPACE } from './locale';
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
    this.app.schemaSettingsManager.add(publicFormBlockSettings);
    this.registerFormType('form', {
      label: 'Form',
      uiSchema: formSchemaCallback,
    });
    this.app.router.add('public-forms', {
      path: '/public-forms/:name',
      Component: PublicFormPage,
    });
    this.app.pluginSettingsManager.add('public-forms', {
      title: `{{t("Public forms", { ns: "${NAMESPACE}" })}}`,

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
