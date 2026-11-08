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
      title: '添加或完善浏览界面',
      description:
        '提供从连接、数据表到字段的浏览入口，并按需查看实际数据库结构。',
      prompt:
        '请为当前应用添加或完善数据库浏览器界面。先阅读已安装插件的 nocobase-app-plugin-database-explorer Skill，检查现有路由和页面，已有界面时直接复用，不重复创建。将入口放在“系统设置 → 系统”，支持查看连接列表、分页浏览数据表、查看字段定义和解析提示，并按需查看实际数据库中的列、索引和约束。使用 DatabaseExplorerClient，让页面路由与接口使用一致的 DATABASE_EXPLORER_ACCESS 权限。处理加载中、空列表、资源不存在、连接不可用和无权限状态。不添加连接编辑、修改表结构或编辑业务记录的功能，不展示凭据或敏感连接信息，也不擅自给其他用户授权。',
      inspect:
        '检查插件、认证与授权依赖、注册情况及应用已有的浏览器路由。已提供界面时复用并完善。',
      configure:
        '通过应用 API 客户端使用 DatabaseExplorerClient，声明受 DATABASE_EXPLORER_ACCESS 保护的应用路由，并在“系统设置 → 系统”添加入口。',
      complete:
        '提供连接选择、数据表分页和字段详情，按需读取实际数据库结构。补齐加载、空结果、连接不可用和无权限状态，不添加写入操作。',
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
