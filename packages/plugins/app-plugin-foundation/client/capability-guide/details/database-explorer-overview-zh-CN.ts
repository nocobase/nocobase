import type enUS from './database-explorer-overview-en-US.js';

const databaseExplorerOverview: typeof enUS = {
  current: {
    title: '数据库浏览器界面',
    description:
      '浏览数据库连接、数据表和字段，按需查看实际数据库中的列、索引和约束。',
    boundary:
      '这里的状态表示应用是否提供了浏览界面，不代表每个数据库连接都可正常访问。',
    database: '配置数据库连接',
  },
  actions: {
    interface: {
      title: '使用内置数据库浏览器',
      description: '从系统设置打开内置页面，可按应用需要调整入口。',
      prompt:
        '检查数据库浏览器插件的注册情况和系统设置入口，使用内置页面浏览连接、数据表、字段与物理结构。调整入口时保留已有的自定义页面和访问权限。',
      inspect: '检查认证、授权、数据库浏览器插件及现有的自定义路由。',
      configure:
        '将插件页面挂到“系统设置 → 系统”。应用已有自定义页面时，可设置 routes: false。',
      complete:
        '验证已获授权的用户可以浏览数据表，未获授权的用户无法打开页面或读取接口。',
    },
    access: {
      title: '调整访问权限',
      description: '确定哪些管理员或维护人员可以查看应用的数据库结构。',
      prompt:
        '请为【已确认的角色或人员】整理数据库浏览器的访问权限配置方案。先阅读插件 Skill 并检查现有权限集和授权。当前插件以 page:database-explorer/access 控制整个浏览器，不支持按连接、表或字段分别设置可见范围。说明该权限可以查看应用的整体数据库结构，与业务记录的访问权限不同。让页面路由和接口使用一致的权限检查，保留已有授权，不默认向所有人开放。先列出目标角色或权限集及拟修改的授权，确认后再执行。如果需要更细的隔离，说明仅在界面隐藏连接或字段不能实现权限隔离。',
      inspect:
        '确认需要开放的角色或人员并检查现有权限集。系统管理员已有 page:*/access，因此默认可以访问。',
      configure:
        '仅为已确认的权限集授予 page:database-explorer/access。应用路由保留 DATABASE_EXPLORER_ACCESS，接口继续执行权限检查。',
      complete:
        '确认导航入口、页面和接口的权限一致。不将前端隐藏连接或字段描述为服务端访问范围控制。',
    },
  },
};

export default databaseExplorerOverview;
