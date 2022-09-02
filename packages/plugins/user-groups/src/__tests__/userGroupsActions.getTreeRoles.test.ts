import Database, { BelongsToManyRepository } from '@nocobase/database';


import { mockServer, MockServer } from '@nocobase/test';

import { Plugin } from '@nocobase/server';
import PluginUsers from '@nocobase/plugin-users';
import PluginAcl from '@nocobase/plugin-acl';
import { default as UserGroupsPlugin } from '..';

import supertest from 'supertest';

describe('test the usergroups actions.', () => {

    let app: MockServer;
    let db: Database;
    let agent;
    let pluginUser;

    let adminAgent;

    let group1,group2,group3,group4;
    let role1,role2,role3,role4,role5,role6;

    beforeEach(async () => {

        app = mockServer({
            registerActions: true,
        });
        await app.cleanDb();

        //插入用户，角色，用户组
        app.plugin(PluginAcl);
        app.plugin(UserGroupsPlugin);
        app.plugin(PluginUsers);

        await app.loadAndInstall();
        db = app.db;

        //登录admin用户
        const userPlugin = app.getPlugin('@nocobase/plugin-users') as PluginUsers;
        adminAgent = await app.agent().auth(userPlugin.jwtService.sign({
            userId: 1,
        }), { type: 'bearer' });

        //产生初始化角色数据
        role1 = await app.db.getRepository('roles').create({
            values: {
                name: 'role1',
                title: 'role1',
            },
        });
        role2 = await app.db.getRepository('roles').create({
            values: {
                name: 'role2',
                title: 'role2',
            },
        });
        role3 = await app.db.getRepository('roles').create({
            values: {
                name: 'role3',
                title: 'role3',
            },
        });
        role4 = await app.db.getRepository('roles').create({
            values: {
                name: 'role4',
                title: 'role4',
            },
        });
        role5 = await app.db.getRepository('roles').create({
            values: {
                name: 'role5',
                title: 'role5',
            },
        });
        role6 = await app.db.getRepository('roles').create({
            values: {
                name: 'role6',
                title: 'role6',
            },
        });

        //产生初始化测用户组试数据
        group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
                roles:[role1],
            },
        });
        group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                parent:group1,
                status: 1,
                roles:[role2],
            },
        });
        group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                parent:group2,
                status: 1,
                // roles:[role3,role4],
            },
        });

        group4 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group4',
                parent:group3,
                status: 1,
                // roles:[role5,role6],
            },
        });

        agent = supertest.agent(app.callback());

    });

    afterEach(async () => {
        // await db.close();
        await app.destroy();
    });

    it('send null id,should get nothing!', async () => {

        const requestdata = { filter: { gid: '' } };
        let response = await adminAgent.resource('userGroups').getTreeRoles(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    // /userGroups:getParentGroup
    it('send fake id,should get nothing!', async () => {

        const requestdata = { filter: { gid: group1.gid + 'abc' } };//fake gid!

        let response = await adminAgent.resource('userGroups').getTreeRoles(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    //test the usergroups parent.
    it('group4 should get roles in group1,group2 :role1 role2', async () => {

        const requestdata = { filter: { gid: group4.gid } };
        let response = await adminAgent.resource('userGroups').getTreeRoles(requestdata);

        const data = response.body.data;
        const code = response.body.data.code;

        expect(response.statusCode).toEqual(201);
        expect(data.treeRoles.length).toBe(2);
        expect(data.treeRoles[0].name).toEqual('role2');
        expect(data.treeRoles[1].name).toEqual('role1');
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });


});
