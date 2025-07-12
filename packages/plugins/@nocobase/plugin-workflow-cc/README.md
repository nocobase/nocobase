# @nocobase/plugin-workflow-cc

## 分支

和 nocobase 仓库一样，也分为 main 和 next 两个分支

- main：只处理缺陷修复
- next：新插件、新特性、不兼容性变更等

## 提测

- 提交 PR 之后，会自动生成 PR 测试环境，测试通过后再合并到对应分支

```bash
pr-<number>-<pro-tpl>.test.nocobase.com
``` 
