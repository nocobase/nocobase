/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CollectionTemplate, ICollectionTemplate, Plugin, getConfigurableProperties } from '@nocobase/client';
import { NAMESPACE } from '../locale';
// import { DatabaseServerSelect, DatabaseServerSelectProvider } from './components/DatabaseServerSelect';
// import { PreviewFields } from './components/PreviewFields';
// import { PreviewTable } from './components/PreviewTable';
// import { RemoteTableSelect } from './components/RemoteTableSelect';
// import { SyncFieldsAction } from './components/SyncFieldsAction';
import { lazy } from '@nocobase/client';
const { DatabaseServerSelect, DatabaseServerSelectProvider } = lazy(
  () => import('./components/DatabaseServerSelect'),
  'DatabaseServerSelect',
  'DatabaseServerSelectProvider',
);
const { PreviewFields } = lazy(() => import('./components/PreviewFields'), 'PreviewFields');
const { PreviewTable } = lazy(() => import('./components/PreviewTable'), 'PreviewTable');
const { RemoteTableSelect } = lazy(() => import('./components/RemoteTableSelect'), 'RemoteTableSelect');
const { SyncFieldsAction } = lazy(() => import('./components/SyncFieldsAction'), 'SyncFieldsAction');

const connectForeignData: ICollectionTemplate = {
  name: 'foreign',
  title: `{{t("Connect to foreign data",{ ns: "${NAMESPACE}" })}}`,
  order: 5,
  color: 'yellow',
  default: {
    fields: [],
    autoGenId: false,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
  },
  divider: false,
  configurableProperties: {
    title: {
      type: 'string',
      title: `{{ t("Collection display name") }}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
      'x-reactions': {
        dependencies: ['databaseView'],
        when: '{{isPG}}',
        fulfill: {
          state: {
            initialValue: '{{$deps[0]&&$deps[0].match(/^([^_]+)_(.*)$/)?.[2]}}',
          },
        },
        otherwise: {
          state: {
            value: null,
          },
        },
      },
    },
    remoteServerName: {
      type: 'string',
      title: `{{ t("Database server",{ ns: "${NAMESPACE}" }) }}`,
      'x-decorator': DatabaseServerSelectProvider,
      'x-component': DatabaseServerSelect,
      'x-disabled': '{{ !createOnly }}',
    },
    remoteTableName: {
      type: 'string',
      'x-component': RemoteTableSelect,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      title: `{{ t("Remote table",{ ns: "${NAMESPACE}" }) }}`,
      'x-reactions': {
        dependencies: ['.remoteServerName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    fields: {
      type: 'array',
      'x-component': PreviewFields,
      'x-visible': '{{ createOnly }}',
      'x-reactions': {
        dependencies: ['.remoteTableName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    preview: {
      type: 'void',
      'x-visible': '{{ createOnly }}',
      'x-component': PreviewTable,
      'x-reactions': {
        dependencies: ['.fields', '.remoteTableName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    ...getConfigurableProperties('category', 'description'),
  },
  configureActions: {
    syncFromRemote: {
      type: 'void',
      'x-component': SyncFieldsAction,
      title: `{{ t("Sync form remote table",{ ns: "${NAMESPACE}" }) }}`,
    },
  },
  availableFieldInterfaces: {
    include: ['obo', 'oho', 'o2m', 'm2o', 'm2m'],
  },
};

class ConnectForeignData extends CollectionTemplate {
  name = 'foreign';
  title = `{{t("Connect to foreign data",{ ns: "${NAMESPACE}" })}}`;
  order = 5;
  color = 'yellow';
  default = {
    fields: [],
    autoGenId: false,
    createdAt: false,
    createdBy: false,
    updatedAt: false,
    updatedBy: false,
  };
  divider = false;
  configurableProperties = {
    title: {
      type: 'string',
      title: `{{ t("Collection display name") }}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
      'x-reactions': {
        dependencies: ['databaseView'],
        when: '{{isPG}}',
        fulfill: {
          state: {
            initialValue: '{{$deps[0]&&$deps[0].match(/^([^_]+)_(.*)$/)?.[2]}}',
          },
        },
        otherwise: {
          state: {
            value: null,
          },
        },
      },
    },
    remoteServerName: {
      type: 'string',
      title: `{{ t("Database server",{ ns: "${NAMESPACE}" }) }}`,
      'x-decorator': DatabaseServerSelectProvider,
      'x-component': DatabaseServerSelect,
      'x-disabled': '{{ !createOnly }}',
    },
    remoteTableName: {
      type: 'string',
      'x-component': RemoteTableSelect,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      title: `{{ t("Remote table",{ ns: "${NAMESPACE}" }) }}`,
      'x-reactions': {
        dependencies: ['.remoteServerName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    fields: {
      type: 'array',
      'x-component': PreviewFields,
      'x-visible': '{{ createOnly }}',
      'x-reactions': {
        dependencies: ['.remoteTableName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    preview: {
      type: 'void',
      'x-visible': '{{ createOnly }}',
      'x-component': PreviewTable,
      'x-reactions': {
        dependencies: ['.fields', '.remoteTableName'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}',
          },
        },
      },
    },
    ...getConfigurableProperties('category', 'description'),
  };
  configureActions = {
    syncFromRemote: {
      type: 'void',
      'x-component': SyncFieldsAction,
      title: `{{ t("Sync form remote table",{ ns: "${NAMESPACE}" }) }}`,
    },
  };
  availableFieldInterfaces = {
    include: ['obo', 'oho', 'o2m', 'm2o', 'm2m'],
  };
}

class PluginCollectionFWDClient extends Plugin {
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([ConnectForeignData]);
  }
}

export default PluginCollectionFWDClient;
