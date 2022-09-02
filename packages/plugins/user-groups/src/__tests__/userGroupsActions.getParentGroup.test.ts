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
        let response = await adminAgent.resource('userGroups').getParentGroup(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    // /userGroups:getParentGroup
    it('send fake id,should get nothing!', async () => {

        const requestdata = { filter: { gid: group1.gid + 'abc' } };//fake gid!

        let response = await adminAgent.resource('userGroups').getParentGroup(requestdata);

        expect(response.statusCode).toEqual(400);
        expect(response.body.data.error).toBeDefined();

        console.log(response.body.data.msg);

    });

    //test the usergroups parent.
    it('group1 should get usergroups parent:group3', async () => {

        // let response = await app.agent().resource('userGroups').check();
        // // expect(response.body.data.id).toBeUndefined();

        //in this case the data need the values:
        // const requestdata = { values: { gid: group1.gid } };
        // const response = await adminAgent.resource('userGroups').getParentGroup(requestdata);

        // this case the post data do not need the values.
        // const requestdata = { gid: group1.gid };
        // let response = await agent.post('/userGroups:getParentGroup').send(requestdata);

        const requestdata = { filter: { gid: group1.gid } };
        let response = await adminAgent.resource('userGroups').getParentGroup(requestdata);

        const parentid = response.body.data.parentGroup.gid;
        const code = response.body.data.code;

        expect(response.statusCode).toEqual(201);
        expect(parentid).toEqual(group3.gid);
        expect(code).toBe(1);

        console.log(response.body.data.msg);
    });

    //test the usergroups parent.
    it('group3 should get no parent', async () => {

        const requestdata = { filter: { gid: group3.gid } };
        let response = await adminAgent.resource('userGroups').getParentGroup(requestdata);

        const parent = response.body.data.parentGroup;
        const code = response.body.data.code;

        expect(response.statusCode).toEqual(201);
        expect(parent).toBeNull;
        expect(code).toBe(2);

        console.log(response.body.data.msg);

    });


});
