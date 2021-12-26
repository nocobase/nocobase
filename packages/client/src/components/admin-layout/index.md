---
group:
  title: Route Components
  path: /route-components
---

# AdminLayout

结构

- Layout
- Layout.Header
  - SiteTitle
  - Menu（SchemaComponent）
  - PluginActionBar
    - Designable.Action（引用）
    - CollectionManager.Action（引用）
    - ACL.Action（引用）
    - SystemSettings.Action（引用）
  - CurrentUser.Dropdown（引用）
- Layout.Sider
  - SideMenu（随 Menu 联动的）
- Layout.Content
  - PageTitle
  - SchemaComponent
