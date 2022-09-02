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

    let group1, group2, group3, group4, group5, group6, group7, group8, group9, group10;

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
                status: 1,
                parent: group1,
            },
        });
        group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                status: 1,
                parent: group1,
            },
        });
        group4 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group4',
                status: 1,
                parent: group2,
            },
        });
        group5 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group5',
                status: 1,
                parent: group2,
            },
        });
        group6 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group6',
                status: 1,
                parent: group3,
            },
        });
        group7 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group7',
                status: 1,
                parent: group3,
            },
        });
        group8 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group8',
                status: 1,
                parent: group4,
            },
        });
        group9 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group9',
                status: 1,
                parent: group4,
            },
        });
        group10 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group10',
                status: 1,
                parent: group4,
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
        let response = await adminAgent.resource('userGroups').getSubGroupTree(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    // /userGroups:getParentGroup
    it('send fake id,should get nothing!', async () => {

        const requestdata = { filter: { gid: group1.gid + 'abc' } };//fake gid!
        let response = await adminAgent.resource('userGroups').getSubGroupTree(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    //test the usergroups parent.
    it('should get all the group1s sub tree', async () => {

        const requestdata = { filter: { gid: group1.gid } };
        let response = await adminAgent.resource('userGroups').getSubGroupTree(requestdata);

        const data = response.body.data;
        const code = response.body.data.code;
        const root = data.subGroupTree;

        expect(response.statusCode).toEqual(201);
        expect(root.subGroups.length).toBe(2);
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });

    //test the usergroups parent.
    it('should get all the group1s sub tree in array', async () => {

        const requestdata = { filter: { gid: group1.gid }, noTree: true };
        let response = await adminAgent.resource('userGroups').getSubGroupTree(requestdata);

        const data = response.body.data;
        const code = response.body.data.code;
        const root = data.subGroupTree;

        expect(response.statusCode).toEqual(201);
        expect(root.length).toBe(10);
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });

});
