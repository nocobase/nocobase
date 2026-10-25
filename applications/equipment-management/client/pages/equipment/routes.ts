import { defineAppRoutes } from '@nocobase/app-client/plugins';
import {
  Monitor,
  UserRound,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  Library,
  Workflow,
} from 'lucide-react';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
const page = (id: string) => ({
  resource: { type: 'page' as const, id },
  action: 'access',
});
function assetChildren(
  prefix: string,
  path = ':assetId',
): AppClientRouteDefinition[] {
  return [
    {
      name: prefix + 'Asset',
      path,
      componentLoader: () => import('./asset-detail.js'),
      breadcrumb: { title: 'equipment.details' },
      children: [
        {
          name: prefix + 'AssetEdit',
          path: 'edit',
          componentLoader: () => import('./asset-form.js'),
          breadcrumb: { title: 'equipment.edit' },
        },
        {
          name: prefix + 'AssetAction',
          path: 'action/:transition',
          componentLoader: () => import('./asset-action.js'),
          breadcrumb: { title: 'equipment.actions' },
        },
        {
          name: prefix + 'AssetRequest',
          path: 'request',
          componentLoader: () => import('./asset-request.js'),
          breadcrumb: { title: 'equipment.newRequest' },
        },
      ],
    },
  ];
}
export const homeEquipmentChildren = assetChildren('home', 'asset/:assetId');
export const equipmentRoutes = defineAppRoutes([
  {
    name: 'equipment',
    path: '/equipment',
    auth: 'required',
    authz: page('equipment'),
    navigation: { title: 'equipment.equipment', icon: Monitor, order: 10 },
    componentLoader: () => import('./ledger.js'),
    children: [
      {
        name: 'equipmentDirectEdit',
        path: 'edit/:assetId',
        componentLoader: () => import('./asset-form.js'),
        breadcrumb: { title: 'equipment.edit' },
      },
      {
        name: 'equipmentNew',
        path: 'new',
        componentLoader: () => import('./asset-form.js'),
        breadcrumb: { title: 'equipment.create' },
      },
      {
        name: 'equipmentImport',
        path: 'import',
        componentLoader: () => import('./import.js'),
        breadcrumb: { title: 'equipment.import' },
      },
      ...assetChildren('equipment'),
    ],
  },
  {
    name: 'myEquipment',
    path: '/myEquipment',
    auth: 'required',
    authz: page('myEquipment'),
    navigation: { title: 'equipment.myEquipment', icon: UserRound, order: 20 },
    componentLoader: () => import('./mine.js'),
    children: [
      {
        name: 'myEquipmentDirectEdit',
        path: 'edit/:assetId',
        componentLoader: () => import('./asset-form.js'),
        breadcrumb: { title: 'equipment.edit' },
      },
      ...assetChildren('myEquipment', 'asset/:assetId'),
    ],
  },
  {
    name: 'operations',
    path: '/operations',
    auth: 'required',
    authz: page('operations'),
    navigation: {
      title: 'equipment.operations',
      icon: ArrowLeftRight,
      order: 30,
    },
    componentLoader: () => import('./requests-list.js'),
    children: [
      {
        name: 'operationsNew',
        path: 'new',
        componentLoader: () => import('./requests-new.js'),
        breadcrumb: { title: 'equipment.newRequest' },
      },
      {
        name: 'operationsDetail',
        path: ':id',
        componentLoader: () => import('./requests-detail.js'),
        breadcrumb: { title: 'equipment.details' },
        children: [
          {
            name: 'operationsHandle',
            path: 'handle',
            componentLoader: () => import('./requests-handle.js'),
            breadcrumb: { title: 'equipment.confirm' },
          },
          ...assetChildren('operations', 'asset/:assetId'),
        ],
      },
    ],
  },
  {
    name: 'maintenance',
    path: '/maintenance',
    auth: 'required',
    authz: page('maintenance'),
    navigation: { title: 'equipment.maintenance', icon: Wrench, order: 40 },
    componentLoader: () => import('./maintenance-list.js'),
    children: [
      {
        name: 'maintenanceNew',
        path: 'new',
        componentLoader: () => import('./maintenance-new.js'),
        breadcrumb: { title: 'equipment.newMaintenance' },
      },
      {
        name: 'maintenanceDetail',
        path: ':id',
        componentLoader: () => import('./maintenance-detail.js'),
        breadcrumb: { title: 'equipment.details' },
        children: [
          {
            name: 'maintenanceHandle',
            path: 'handle',
            componentLoader: () => import('./maintenance-handle.js'),
            breadcrumb: { title: 'equipment.confirm' },
          },
          ...assetChildren('maintenance', 'asset/:assetId'),
        ],
      },
    ],
  },
  {
    name: 'stocktakes',
    path: '/stocktakes',
    auth: 'required',
    authz: page('stocktakes'),
    navigation: {
      title: 'equipment.stocktakes',
      icon: ClipboardCheck,
      order: 50,
    },
    componentLoader: () => import('./stocktakes-list.js'),
    children: [
      {
        name: 'stocktakesNew',
        path: 'new',
        componentLoader: () => import('./stocktakes-new.js'),
        breadcrumb: { title: 'equipment.newStocktake' },
      },
      {
        name: 'stocktakesDetail',
        path: ':id',
        componentLoader: () => import('./stocktakes-detail.js'),
        breadcrumb: { title: 'equipment.details' },
        children: [
          {
            name: 'stocktakesHandle',
            path: 'handle',
            componentLoader: () => import('./stocktakes-handle.js'),
            breadcrumb: { title: 'equipment.confirm' },
          },
          {
            name: 'stocktakesObserve',
            path: 'observe/:itemId',
            componentLoader: () => import('./stocktakes-observe.js'),
            breadcrumb: { title: 'equipment.observe' },
          },
          ...assetChildren('stocktakes', 'asset/:assetId'),
        ],
      },
    ],
  },
  {
    name: 'referenceData',
    path: '/referenceData',
    auth: 'required',
    authz: page('referenceData'),
    navigation: { title: 'equipment.referenceData', icon: Library, order: 60 },
    componentLoader: () => import('./reference.js'),
    children: [
      {
        name: 'referenceNew',
        path: ':kind/new',
        componentLoader: () => import('./reference-form.js'),
        breadcrumb: { title: 'equipment.createAction' },
      },
      {
        name: 'referenceEdit',
        path: ':kind/:refId',
        componentLoader: () => import('./reference-form.js'),
        breadcrumb: { title: 'equipment.edit' },
      },
    ],
  },
]);

export const equipmentWorkflowRoute: AppClientRouteDefinition = {
  name: 'workflows',
  path: '/workflows',
  auth: 'required',
  authz: {
    resource: { type: 'settings', id: 'equipment.workflows' },
    action: 'read',
  },
  navigation: { title: 'equipment.workflows', icon: Workflow, order: 110 },
  componentLoader: () => import('./workflows.js'),
  children: [
    {
      name: 'workflowDefinitions',
      path: 'definitions',
      componentLoader: () => import('./workflow-definitions.js'),
      children: [
        {
          name: 'workflowDefinitionDetail',
          path: ':workflowId',
          componentLoader: () => import('./workflow-definition-detail.js'),
        },
      ],
    },
    {
      name: 'workflowExecutions',
      path: 'executions',
      componentLoader: () => import('./workflow-executions.js'),
      children: [
        {
          name: 'workflowExecutionDetail',
          path: ':lifecycle/:recordId',
          componentLoader: () => import('./workflow-execution-detail.js'),
        },
      ],
    },
  ],
};
