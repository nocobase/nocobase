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
            },
        });
        group3 = await app.db.getRepository('userGroups').create({
            values: {
                name: 'group3',
                status: 1,
                children: [group1, group2],
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
        let response = await adminAgent.resource('userGroups').getSubGroups(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    // /userGroups:getParentGroup
    it('send fake id,should get nothing!', async () => {

        const requestdata = { filter: { gid: group1.gid + 'abc' } };//fake gid!
        let response = await adminAgent.resource('userGroups').getSubGroups(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    //test the usergroups parent.
    it('group3 should get subgroups :group1,group2', async () => {

        const requestdata = { filter: { gid: group3.gid } };
        let response = await adminAgent.resource('userGroups').getSubGroups(requestdata);

        const subGroups = response.body.data.subGroups;
        const code = response.body.data.code;

        const subids = [group1.gid, group2.gid];

        expect(response.statusCode).toEqual(201);
        expect(subGroups.length).toBe(2);
        expect(subids.includes(subGroups[0].gid)).toBe(true);
        expect(subids.includes(subGroups[1].gid)).toBe(true);
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });

    //test the usergroups parent.
    it('group1 should get no subgroups', async () => {

        const requestdata = { filter: { gid: group1.gid } };
        let response = await adminAgent.resource('userGroups').getSubGroups(requestdata);

        const subGroups = response.body.data.subGroups;
        const code = response.body.data.code;

        expect(response.statusCode).toEqual(201);
        expect(subGroups).toBeNull;
        expect(code).toBe(2);

        console.log(response.body.data.msg);

    });


});
