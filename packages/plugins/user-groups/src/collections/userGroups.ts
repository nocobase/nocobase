import { CollectionOptions } from '@nocobase/database';

export default {
    name: 'userGroups',
    title: '{{t("User groups")}}',
    sortable: 'sort',
    model: 'UserGroupModel',
    filterTargetKey: 'name',
    createdBy: true,
    updatedBy: true,
    logging: true,
    fields: [
        {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            interface: 'id',
            uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
            // const copy = readonly()
        },
        {
            type: 'string',
            name: 'name',
            interface: 'input',
            uiSchema: { type: 'string', title: '{{t("Name")}}', 'x-component': 'Input' },
        },
        {//-1 deleted,0 created,1 enable,2 disable
            type: 'integer',
            name: 'status',
            defaultValue: '1',
        },
        {//self assocations which will get subgroups
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            target: 'userGroups',
            foreignKey: 'pid',
            uiSchema: {
                title: '{{t("Parent group")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                    multiple: false,
                    fieldNames: {
                        label: 'name',
                        value: 'id',
                    },
                },
            },
        },
        {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            target: 'userGroups',
            foreignKey: 'pid',
            uiSchema: {
                title: '{{t("Sub-groups")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                    multiple: true,
                    fieldNames: {
                        label: 'name',
                        value: 'id',
                    },
                },
            },
        },
        {
            interface: 'm2m',
            type: 'belongsToMany',
            name: 'users',
            target: 'users',
            foreignKey: 'groupId',
            otherKey: 'userId',
            sourceKey: 'id',
            targetKey: 'id',
            through: 'userGroupsUsers',
            uiSchema: {
                type: 'array',
                title: '{{t("Users")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                    multiple: true,
                    fieldNames: {
                        label: 'nickname',
                        value: 'id',
                    },
                },
            },
        }
    ],
} as CollectionOptions;