# 扩展点索引

## 内核模块

<table>
  <thead>
    <tr>
      <th>扩展点</th>
      <th>相关介绍</th>
      <th>相关 API</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>扩展数据库字段类型</td>
      <td rowspan="3"><a href="/development/guide/collections-fields">数据表与字段</a></td>
      <td><a href="/api/database#registerfieldtypes"><code>db.registerFieldType()</code></a></td>
    </tr>
    <tr>
      <td>扩展已有数据库表的字段</td>
      <td><a href="/api/database#extendcollection"><code>db.extendcollection()</code></a></td>
    </tr>
    <tr>
      <td>扩展查询比较运算符</td>
      <td><a href="/api/database#registeroperators"><code>db.registerOperators()</code></a></td>
    </tr>
    <tr>
      <td>自定义数据仓库操作</td>
      <td></td>
      <td><a href="/api/database#registerrepositories"><code>db.registerRepositories()</code></a></td>
    </tr>
    <tr>
      <td>扩展针对全局资源的操作</td>
      <td rowspan="3"><a href="/development/guide/resources-actions">资源与操作</a></td>
      <td><a href="/api/resourcer#registeractions"><code>resourcer.registerActions()</code></a></td>
    </tr>
    <tr>
      <td>扩展针对全局资源的中间件</td>
      <td><a href="/api/resourcer#use"><code>resourcer.use()</code></a></td>
    </tr>
    <tr>
      <td>自定义资源及操作</td>
      <td><a href="/api/resourcer#define"><code>resourcer.define()</code></a></td>
    </tr>
    <tr>
      <td>自定义路由与页面</td>
      <td><a href="/development/guide/ui-router">界面路由</a></td>
      <td><a href="/api/client/route-switch"><code>RouteSwitch</code></a></td>
    </tr>
    <tr>
      <td>扩展自定义组件</td>
      <td><a href="/development/guide/ui-schema-designer/extending-schema-components">扩展 Schema 组件</a></td>
      <td><a href="/api/client/schema-designer/schema-component"><code>SchemaComponent</code></a>
      </td>
    </tr>
    <tr>
      <td>扩展自定义区块类型</td>
      <td><a href="/development/guide/ui-schema-designer/designable">Schema 设计能力</a></td>
      <td><a href="/api/client/schema-designer/schema-initializer"><code>SchemaInitializer</code></a></td>
    </tr>
    <tr>
      <td>多语言扩展</td>
      <td><a href="/development/guide/i18n">国际化</a></td>
      <td><a href="/api/server/application#i18n"><code>app.i18n</code></a></td>
    </tr>
    <tr>
      <td>扩展子命令</td>
      <td><a href="/development/guide/commands">命令行工具</a></td>
      <td><a href="/api/server/application#cli"><code>app.i18n</code></a></td>
    </tr>
  </tbody>
</table>

## 内置插件

TODO
