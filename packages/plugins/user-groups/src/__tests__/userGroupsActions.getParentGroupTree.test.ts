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

    let group1;
    let group2;
    let group3;
    let group4;

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

        //产生初始化测试数据
        group1 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group1',
                status: 1,
            },
        });
        group2 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group2',
                parent:group1,
                status: 1,
            },
        });
        group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                parent:group2,
                status: 1,
            },
        });

        group4 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group4',
                parent:group3,
                status: 1,
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
        let response = await adminAgent.resource('userGroups').getParentGroupTree(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    // /userGroups:getParentGroup
    it('send fake id,should get nothing!', async () => {

        const requestdata = { filter: { gid: group1.gid + 'abc' } };//fake gid!

        let response = await adminAgent.resource('userGroups').getParentGroupTree(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    //test the usergroups parent.
    it('group4 should get parent tree:group1 group2 group3 group4', async () => {

        const requestdata = { filter: { gid: group4.gid } };
        let response = await adminAgent.resource('userGroups').getParentGroupTree(requestdata);

        const data = response.body.data;
        const code = response.body.data.code;

        expect(response.statusCode).toEqual(201);
        expect(data.parentGroupTree[0].name).toEqual('group1');
        expect(data.parentGroupTree[1].name).toEqual('group2');
        expect(data.parentGroupTree[2].name).toEqual('group3');
        expect(data.parentGroupTree[3].name).toEqual('group4');
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });


});
