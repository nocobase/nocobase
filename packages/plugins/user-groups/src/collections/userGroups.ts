import { CollectionOptions } from '@nocobase/database';

export default {
    name: 'userGroups',
    title: '{{t("User groups")}}',
    sortable: 'sort',
    autoGenId: false,
    model: 'UserGroupModel',
    filterTargetKey: 'name',
    createdBy: true,
    updatedBy: true,
    logging: true,
    fields: [
        {
            type: 'uid',
            name: 'gid',
            prefix: 'g_',
            primaryKey: true,
            interface: 'input',
            uiSchema: {
                type: 'string',
                title: '{{t("Group UID")}}',
                'x-component': 'Input',
            },
        },
        {
            type: 'string',
            name: 'name',
            interface: 'input',
            uiSchema: { type: 'string', title: '{{t("Group name")}}', 'x-component': 'Input' },
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
                        value: 'gid',
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
                        value: 'gid',
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
            sourceKey: 'gid',
            targetKey: 'id',
            through: 'userGroupsUsers',
            allowNull: true,
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