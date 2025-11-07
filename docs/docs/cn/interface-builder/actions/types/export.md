---
pkg: "@nocobase/plugin-action-export"
---
# 导出#

## 介绍

导出功能允许将筛选后的记录导出为 **Excel** 格式，支持配置导出字段。用户可以根据需求选择需要导出的字段，以便后续的数据分析、处理或存档。该功能提高了数据操作的灵活性，尤其适用于需要将数据转移至其他平台或进行进一步处理的场景。

### 功能亮点：
- **字段选择**：用户可以配置选择导出的字段，确保导出的数据精准、简洁。
- **支持 Excel 格式**：导出的数据将保存为标准的 Excel 文件，方便与其他数据进行整合分析。

通过该功能，用户可以轻松地将工作中的关键数据导出并进行外部使用，提升工作效率。

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)
## 操作配置项

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### 可导出字段

- 第一层级：当前 collection 的所有字段；
- 第二层级：如果是关系字段，需要选关联表的字段；
- 第三层级：只处理三个层级，最后一级关系字段不显示；

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [联动规则](/interface-builder/actions/action-settings/linkage-rule)：动态显示/隐藏按钮；
- [编辑按钮](/interface-builder/actions/action-settings/edit-button)：编辑按钮的标题、类型、图标；
