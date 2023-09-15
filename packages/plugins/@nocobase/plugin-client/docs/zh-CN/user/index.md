# 使用手册

### 插件管理器

<strong>灵活可插拔</strong>：插件管理器以简单、直观，轻量级的使用体验来扩展 NocoBase 的功能。轻松扩展和定制应用功能，包括安装、升级、和卸载插件，以满足特定需求。

![](static/Ncbsb506joJwaCxHewhcJmlwnps.png)

<strong>日趋完善的插件体系</strong>：目前 NocoBase 内置 20+ 个插件，未来的插件市场将成为一个重要的亮点。这意味着用户将能够从更多的第三方开发者和供应商获取插件，以满足更广泛的需求，从而使 Nocobase 成为一个更具生态系统和扩展性的应用开发平台。未来插件市场将为用户提供更多创新的工具和功能，敬请期待。

![](static/SA6vbTwQmoiaCrxyzXzc1PRgnce.png)

#### 插件的添加、激活、禁用、删除

### UI 配置

当激活界面配置按钮，系统进入 UI 配置状态

![](static/IVEtbe27YofOzMx1e1zcdxl9n7e.png)

#### 菜单

##### 菜单项配置

通过拖拽可调整菜单项的顺序或将目标菜单移动到指定菜单的位置。鼠标移到菜单项，可以触发菜单配置项

![](static/XORWbLeFyoQ95AxHPEtcR8fhntd.png)

- 在前面插入/在后面插入：在目标菜单前/后直接插入菜单

![](static/E8PCbsu1nons07x9HBxckVpWnKf.png)

- 移动到：目标菜单项移动到指定菜单的之前/之后

![](static/TvtWb4FPZo6eGuxE13XcAbYxnXb.png)

##### <strong>添加菜单项</strong>

NocoBase 提供了三种配置菜单的类型，包括菜单组、菜单和链接，以帮助用户定制和管理应用的导航菜单结构

![](static/FTCkb2LG3o7qQhxw815cjGdFnWg.png)

- 菜单组（Menu Group）：菜单组用于将相关联的菜单项组织在一起，以创建更清晰和有序的导航结构，有助于组织大型应用的导航栏或侧边栏。

![](static/JBEFbqqrloaTqPxTX5bcT6xdnRg.png)

- 页面（Page）:页面是一个容器，用户可以创建多个页面，每个页面用于不同的应用部分或功能区域

![](static/UptybtoXQoqYkWxEsoQcnyQOnoC.png)

- 链接（Link）:链接定义了导航菜单中的路由目标，可以指向内部页面、外部网址、特定的功能或其他资源

![](static/E7QfbF2EKoCUAXxm4bRcbqeinsd.png)

#### 页面

##### 页面配置项

- 启用页眉：启用页眉后，页面的顶部将显示标题 ，默认启用
- 是否显示页面标题：是否在页眉中显示页面的标题
- 编辑页面标题：自定义页面的标题
- 启用页面选项卡：控制是否启用多页签。启用多页签后，可以在同一菜单项下配置多个页面标签，方便同时访问多个页面
  标签页（也包括弹窗里的标签页），如下图所示订单管理配置多标签页
  ![](static/NXQlbmiRSou5C4xCVnqcdLBOnOh.gif)

##### 页面布局

多个区块通过拖拽可以调整布局。

![](static/SvXabvGRJoIWxbxo31QcpcScnOX.gif)

#### 区块

#### 区块类型

##### 数据区块

##### 筛选区块(区块联动)

##### 关系区块

关系区块是用于展示和操作关联数据，旨在简化关系数据的管理和提高关系数据可视化。不同类型的关系，可以使用不同的关系区块。

以建立完善的订单管理为例：

Orders-Products（m2m），Orders-Shipments（o2m），Orders-Customers（m2o），Orders-Invoice(obo），如下图所示

![](static/NOvHbqHh4oV7eoxWG4Tc5E9Qnxb.png)

所有关系区块上的增删改操作会实时同步到关联的关系数据表。如在关系区块上新增数据时，实际上是在关系数据表中创建新的记录，并自动建立相关的关联。同样，删除操作会从关系数据表中删除数据，并取消相关的关联。而修改操作则会更新相应的数据，确保关联数据的一致性。

以下是创建一个 Products 表格区块来管理订单关联的商品信息。

![](static/L5SYbxOstoOAY3xAnYEcT5xmnBe.gif)

##### 其他区块

#### 字段

```
   关系字段组件：不同类型的关系字段对应不同的关系字段组件，可在关系字段的使用说明文档中了解
```

#### 操作

##### 操作的联动规则

- 条件控制操作的禁用状态，如图对于编辑操作：  对应记录中 Estimated Arrival Time 早于当前时间时禁用
  ![](static/RD4xbgi3KojCzNxFtducnPAZntB.gif)
- 条件控制操作是否可见，如图对于 Duplicate 操作：对应记录中 Transport Mode 为 Road Shipping 时 hidden
  ![](static/DHWsbnndgo14EgxCzbrcyfvKnNh.gif)

##### 操作类型

### 管理中心

管理中心为用户提供了一个集中管理和配置系统信息以及与工作相关设置的平台。用户可以根据其特定的业务需求和个人偏好来自定义系统、数据表建模、工作流配置和插件配置

![](static/N1QcbPKo1oM8XWxlxvdcBb2cn6p.png)

#### 角色和权限

用户、角色和权限是关键的身份验证和授权概念，用于确保系统的访问安全性和操作可控性。管理员可以为用户分配不同角色，并为每个角色配置不同的权限，定义用户的操作和数据访问权限。

1. 用户：用户代表系统中的个体实体，每个用户具有唯一的身份标识符（通常是用户名或电子邮件地址）以及相关的身份验证凭据。用户通过登录来访问系统，其角色和权限决定了他们在系统中的活动范围。
2. 角色：角色是一种授权实体，它代表一组具有相似权限和访问控制需求的用户。通过为用户分配角色，可以将用户组织成不同的访问组，并为这些组分配特定的权限。角色的定义通常根据业务角色和功能职责进行建模。
3. 权限：权限是定义用户或角色可以执行的具体操作和访问的资源的规则集。这些规则可以包括数据表级别的权限、字段级别的权限、特定操作的权限，以及与特定插件相关的权限。权限定义了系统中的操作和资源的访问控制策略，确保只有经过授权的用户可以执行特定的操作。

![](static/Vs92bI4jco1Q4KxGq58cpG5onLd.png)

NocoBase 系统初始化了两个角色，分别是 "Admin" 和 "Member"，它们具有不同的默认权限设置。

详情通过 ACL 插件了解 [Plugin-acl](https://nocobase.feishu.cn/wiki/VeBfwMXu8ikI7DkYPAbczPRXnqd)

###### 通用权限

![](static/MpH8b1ckhoxnbExhLnqcLApUn4e.png)

1. Allows to install, activate, disable plugins：该权限控制是否允许用户启用或禁用插件。激活此权限后，用户可以访问插件管理器界面。"admin" 角色默认启用此权限。
2. Allows to configure interface：该权限控制是否允许用户配置界面。激活此权限后，出现 UI 配置按钮。"admin" 角色默认启用此权限。
3. Allows to configure plugins：该权限控制是否允许用户配置插件参数或管理插件后台数据。"admin" 角色默认启用此权限。
4. Allows to clear cache, reboot application：该权限控制的是用户的系统运维权限： Clear cache 和 Restart application。激活后，相关操作按钮将出现在个人中心,默认不启用。
5. Global action permissions：按照操作类型划分，这些权限根据数据范围维度配置：所有数据和自己的数据。前者允许对整个数据表执行操作，而后者限制仅能处理自己相关的数据。
6. Menu permissions：默认新建的菜单允许访问

###### 数据表操作权限

![](static/UN4vbuRalogcR5xyPM1cGCPanqd.png)

![](static/Fmxbb7Gb9oBf26xerKRcgJOlnfg.png)

数据表操作权限进一步细化了全局操作权限，可以针对每个数据表的资源访问进行个别的权限配置。这些权限分为两个方面：

1. Action permission：操作权限包括添加、查看、编辑、删除、导出和导入操作。这些权限根据数据范围的维度进行配置：

   - All records：允许用户对数据表中的所有记录执行操作。
   - Own records：限制用户仅对自己创建的数据记录执行操作。
2. Field permission：字段权限允许对每个字段在不同操作中进行个别的权限配置。例如，某些字段可以配置为只允许查看而不允许编辑。

###### 菜单访问权限

菜单访问权限以菜单为维度控制访问权限

![](static/Vi42boi7foKl9vxMLm5cbvaynee.png)

###### 插件配置权限

插件配置权限用于控制对特定插件参数的配置权限，当插件配置权限勾选后管理中心将出现对应的插件管理界面

![](static/VxKJbKf9coVzaNx9tJ8cAia0nye.png)

###### 总结

NocoBase 提供了一个强大而灵活的权限管理体系，为用户提供了多层次的资源访问和操作控制

1. 细粒度、多维度权限控制：支持对数据表、操作、菜单以及数据范围的权限配置，以满足不同用户角色和业务需求。
2. 全局和局部配置：权限可以在全局（系统范围）和局部（实体级别，如数据表、字段、操作、菜单）进行设置，确保全局需求和实体需求的平衡。
3. 字段级别控制：字段权限允许对每个字段在不同操作中进行精细控制，例如指定哪些字段可以查看、编辑等。
4. 数据隐私和合规性：权限设置可以基于所有数据或个人数据范围，确保数据的隐私和合规性。
5. 插件参数控制：控制用户或角色对插件参数的配置权限

#### 数据表管理

Nocobase 中数据表的概念与关系型数据库的数据表概念相近，但是字段的概念略有不同。这里提供了数据建模能力，并为界面设计提供现成的数据表和字段资源

例如，在一个描述订单的数据表中，每列包含的是订单某个特定属性的信息，如收件地址；而每行则包含了某个特定订单的所有信息，如订单号、顾客姓名、电话、收件地址等。

![](static/BAiibeCrAop2YqxzgabcQSD0nVc.png)

详情通过数据表插件说明文档了解 [Plugin-collection-manager](https://nocobase.feishu.cn/wiki/NrLXwbrPsiFi12kER9XcL6CZn2g)

#### 系统设置

允许用户进一步自定义系统级别的设置，如系统名称、logo 设置和启用语言

![](static/RJUpbuoIFoVVqLxvbx2czDIinEe.png)

#### 工作流

由工作流插件实现，包括工作流定义、任务列表、审批流程等。用户可以在管理中心配置工作流相关任务。

工作流插件详情请查看 [https://github.com/nocobase/nocobase/blob/T-678/packages/plugins/workflow/docs/zh-CN/index.md](https://github.com/nocobase/nocobase/blob/T-678/packages/plugins/workflow/docs/zh-CN/index.md)

#### 插件配置权限

插件配置是指对于扩展的插件进行参数配置或管理插件的后台数据

### 个人中心

个人中心为用户提供了一系列管理和系统维护功能，包括查看系统版本号、查看和编辑个人资料、修改登录密码、以及快捷切换角色。当系统权限开启了允许清除缓存和重启应用时，个人中心还会提供清除缓存和重启应用的按钮，以方便用户进行系统维护操作

![](static/UvjmbAI4JoVYftxiJLmcwO30nuf.png)
