# Release Notes

## 2022/05/26 ~ v0.7.0-alpha.82

- feat(client,sdk): improve api client

### Breaking Change

There are major changes to the `@nocobase/sdk` API, see details [JavaScript SDK](./development/http-api/javascript-sdk.md)

## 2022/05/25 ~ v0.7.0-alpha.81

- feat: add create-plugin command (#423)
- fix: "typescript": "4.5.5"
- docs: update documentation
- fix(client): filter menu item schema by permissions
- fix(database): cannot read properties of null (reading 'substring')
- fix(client): add description
- fix(client): clone schema before insert
- feat(client): add a description to the junction collection field
- fix(devtools): unexpected token '.'

## 2022/05/24 ~ v0.7.0-alpha.78

- fix(client): add RemoteDocumentTitleProvider
- fix(client): incomplete calendar events
- fix(plugin-users): add translations (#416)

## 2022/05/23 ~ v0.7.0-alpha.59

- feat(docs): add alert message
- fix(create-nocobase-app): storage path error
- fix(client): improve translation
- fix(cli): nocobase test command --db-clean option is invalid
- refactor(plugin-workflow): change column type of executed from boolean to integer (#411)

## 2022/05/22 ~ v0.7.0-alpha.58

- fix: 204 no content response (#378)
- feat: destroy association field after target collection destroy (#376)
- fix(type): use sequelize native Transactionable instead of TransactionAble (#410)
- fix(plugin-workflow): remove previous listeners when collection changed in config (#409)
- fix(plugin-acl): missing pagination parameters (#394)
- feat(client): add custom action (#396)
- refactor(plugin-workflow): multiple instances and event management (fix #384) (#408)
- feat(cli): --db-sync options
- fix(client): pagination dropdown menu is blocked (#398)
- feat: display version number (#386)
- fix: missing isTruly/isFalsy filter operators (#390)
- fix(client): reset page number to first page (#399)

## 2022/05/19 ~ v0.7.0-alpha.57

### New features
- Packaging tool `@nocobase/build`
- CLI `@nocobase/cli`
- devtools  `@nocobase/devtools`
- JavaScript SDK `@nocobase/sdk`
- Documents(v0.7)

### Bug fixes & improvements
- `@nocobase/preset-nocobase`
- create scaffolding `create-nocobase-app`
- Documents theme `dumi-theme-nocobase`

### Breaking changes

📢 Previously created projects need to be recreated.

## 2022/05/14 ~ v0.7.0-alpha.34

- feat: add plugins:getPinned action api
- fix(plugin workflow): cannot get job result properties (#382)
- feat: exist on server start throw error (#374)
- chore: application options (#375)
- fix: not in operator with null value record (#377)

## 2022/05/13 ~ v0.7.0-alpha.33

- fix: link-to field data scope error  (#1337)
- feat(plugin workflow): revisions (#379)
- fix(database): fix option-parser include list index (#371)
- fix(plugin-worklfow): fix duplicated description in fields values (#368)
- fix(database): fix type and transaction in repository (#366)
- fix(plugin workflow): fix transaction of execution (#364)

## 2022/05/05 ~ v0.7.0-alpha.30

- fix(client): upgrade formily packages
- fix(client): setFormValueChanged must be defined

## 2022/05/01 ~ v0.7.0-alpha.27

- fix: use wrapper when greater than one column
- fix: props for CreateFormBlockInitializers
- fix: add schema initializer icon
- fix: plugin workflow (#349)
- fix: db:sync not working (#348)
- fix(plugin-workflow): fix trigger bind logic to avoid duplication (#347)
- fix(plugin workflow) (#346)
- fix: action open mode
- fix: menu url style (#344)
- feat: action loading
- fix: compile the label field
- fix: invalid drag and drop sort

## 2022/04/25 ~ v0.7.0-alpha.16

- fix: cannot find module mkdirp (#330)
- fix(plugin workflow): UX issues (#329)
- fix(plugin-file-manager): test failed
- fix(app-server): dist options

## 2022/04/25 ~ v0.7.0-alpha.0

- Alpha Version

## 2021/10/07 ~ v0.5.0

- The second preview version

## 2021/04/07 ~ v0.4.0

- The first preview version
