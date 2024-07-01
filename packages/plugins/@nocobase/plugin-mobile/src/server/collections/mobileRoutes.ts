/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  "key": "mobileRoutes",
  "name": "mobileRoutes",
  "title": "mobileRoutes",
  "inherit": false,
  "hidden": false,
  "description": null,
  "fields": [
    {
      "key": "zl1wao0hdd5",
      "name": "parentId",
      "type": "bigInt",
      "interface": "integer",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "isForeignKey": true,
      "uiSchema": {
        "type": "number",
        "title": "{{t(\"Parent ID\")}}",
        "x-component": "InputNumber",
        "x-read-pretty": true
      }
    },
    {
      "key": "ldcl6u6ulqx",
      "name": "parent",
      "type": "belongsTo",
      "interface": "m2o",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "foreignKey": "parentId",
      "treeParent": true,
      "onDelete": "CASCADE",
      "uiSchema": {
        "title": "{{t(\"Parent\")}}",
        "x-component": "AssociationField",
        "x-component-props": {
          "multiple": false,
          "fieldNames": {
            "label": "id",
            "value": "id"
          }
        }
      },
      "target": "mobileRoutes",
      "targetKey": "id"
    },
    {
      "key": "4ty6d0c1fa5",
      "name": "children",
      "type": "hasMany",
      "interface": "o2m",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "foreignKey": "parentId",
      "treeChildren": true,
      "onDelete": "CASCADE",
      "uiSchema": {
        "title": "{{t(\"Children\")}}",
        "x-component": "AssociationField",
        "x-component-props": {
          "multiple": true,
          "fieldNames": {
            "label": "id",
            "value": "id"
          }
        }
      },
      "target": "mobileRoutes",
      "targetKey": "id",
      "sourceKey": "id"
    },
    {
      "key": "ldbpm4xqm17",
      "name": "id",
      "type": "bigInt",
      "interface": "integer",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "autoIncrement": true,
      "primaryKey": true,
      "allowNull": false,
      "uiSchema": {
        "type": "number",
        "title": "{{t(\"ID\")}}",
        "x-component": "InputNumber",
        "x-read-pretty": true
      }
    },
    {
      "key": "z4yqdpc5p7r",
      "name": "createdAt",
      "type": "date",
      "interface": "createdAt",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "field": "createdAt",
      "uiSchema": {
        "type": "datetime",
        "title": "{{t(\"Created at\")}}",
        "x-component": "DatePicker",
        "x-component-props": {},
        "x-read-pretty": true
      }
    },
    {
      "key": "o9d4pquz0hv",
      "name": "createdBy",
      "type": "belongsTo",
      "interface": "createdBy",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "target": "users",
      "foreignKey": "createdById",
      "uiSchema": {
        "type": "object",
        "title": "{{t(\"Created by\")}}",
        "x-component": "AssociationField",
        "x-component-props": {
          "fieldNames": {
            "value": "id",
            "label": "nickname"
          }
        },
        "x-read-pretty": true
      },
      "targetKey": "id"
    },
    {
      "key": "6ak0czllpm3",
      "name": "updatedAt",
      "type": "date",
      "interface": "updatedAt",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "field": "updatedAt",
      "uiSchema": {
        "type": "string",
        "title": "{{t(\"Last updated at\")}}",
        "x-component": "DatePicker",
        "x-component-props": {},
        "x-read-pretty": true
      }
    },
    {
      "key": "ivmllnkgfbf",
      "name": "updatedBy",
      "type": "belongsTo",
      "interface": "updatedBy",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "target": "users",
      "foreignKey": "updatedById",
      "uiSchema": {
        "type": "object",
        "title": "{{t(\"Last updated by\")}}",
        "x-component": "AssociationField",
        "x-component-props": {
          "fieldNames": {
            "value": "id",
            "label": "nickname"
          }
        },
        "x-read-pretty": true
      },
      "targetKey": "id"
    },
    {
      "key": "0nvp30wglyv",
      "name": "url",
      "type": "string",
      "interface": "input",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "uiSchema": {
        "type": "string",
        "x-component": "Input",
        "title": "url"
      }
    },
    {
      "key": "gjfpzxpp6n4",
      "name": "options",
      "type": "json",
      "interface": "json",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "defaultValue": null,
      "uiSchema": {
        "type": "object",
        "x-component": "Input.JSON",
        "x-component-props": {
          "autoSize": {
            "minRows": 5
          }
        },
        "default": null,
        "title": "options"
      }
    },
    {
      "key": "bwnegw1biq6",
      "name": "sort",
      "type": "sort",
      "interface": "sort",
      "description": null,
      "collectionName": "mobileRoutes",
      "parentKey": null,
      "reverseKey": null,
      "uiSchema": {
        "type": "number",
        "x-component": "InputNumber",
        "x-component-props": {
          "stringMode": true,
          "step": "1"
        },
        "x-validator": "integer",
        "title": "sort"
      }
    }
  ],
  "category": [],
  "logging": true,
  "autoGenId": true,
  "createdAt": true,
  "createdBy": true,
  "updatedAt": true,
  "updatedBy": true,
  "template": "tree",
  "view": false,
  "tree": "adjacencyList",
  "schema": "public",
  "filterTargetKey": "id"
});
