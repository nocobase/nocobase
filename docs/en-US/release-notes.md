# Release Notes

## 2022/07/07 ~ v0.7.2-alpha.2

- fix(g2plot): import all plots
- fix: field permissions cannot be saved (#605)
- fix(plugin-workflow): fix revision bug (#603)
- fix(plugin-workflow): fix select value (#600)
- fix(plugin-workflow): fix CollectionFieldSelect component (#598)
- feat(plugin-workflow): add association select in calculation (#584)
- feat: function for chart data request
- fix(cli): remove process.env.NODE_OPTIONS

## 2022/07/05 ~ v0.7.2-alpha.1

### New features

- Fields: Integer field
- Blocks: Display fields of relational collections in blocks
- Plugins: Filter conditions support variables

### Breaking changes

- New version does not create foreign key constraints by default, old version will delete all created foreign key constraints after upgrade
- If you installed NocoBase using yarn create before, you need to yarn create again and then execute `yarn nocobase upgrade --raw`

### Details

- fix: drop all foreign keys (#576)
- fix(plugin-workflow): fix collection trigger config (#575)
- fix: improve filter item styling
- fix(collection-manager): missing collection manager context
- feat: filter with variable (#574)
- feat(cli): check database version before installation (#572)
- fix(client): comment out useless code
- fix(cli): app start before sync and upgrade
- feat(client): integer field
- fix(database): index invalid (#564)
- fix: export association table data (#561)
- fix(client): maximum call stack size exceeded (#554)
- refactor(plugin-workflow): move client files into plugin (#556)
- fix(database): constraints default to false (#550)
- fix(client): cannot read properties of undefined (reading 'split')
- fix(workflow): merge workflow providers
- fix(workflow): load workflow after application initialization
- fix(plugin-workflow): fix select width (#552)
- feat: compatible with old kanban (#553)
- fix(client): consider explicitly re-exporting to resolve the ambiguity
- feat: display association fields (#512)
- Fix(plugin workflow) (#549)
- fix: update mysql port (#548)
- fix: export of relation blocks (#546)
- fix(plugin-workflow): clear options when change collection (#547)
- feat(plugin-workflow): add race mode (#542)
- fix(client): change toArr to _.castArray in select component (#543)

## 2022/06/26 ~ v0.7.1-alpha.7

### New features

- Fields: Formula、Relationships(o2o, o2m, m2o, m2m)
- Blocks: Charts(g2plot)
- Plugins: Audit logs, Export, Workflow(schedule trigger)

### Breaking changes

- The percentage field stores the original value. For example, the old version stored 1% as 1 and the new version stores 1% as 0.01
- Remove sub-table field and replace it with one-to-many relationship
- If the NocoBase application was previously installed using yarn create, you need to yarn create again, and then execute yarn nocobase upgrade

### Details

- fix(cli): upgrade from docker
- chore(create-nocobase-app): fix some bugs (#538)
- feat: relationship fields are loaded on demand
- fix: destroy collection fields (#536)
- feat(plugin-workflow): add delay node type (#532)
- refactor: client application (#533)
- fix: missing transaction (#531)
- fix: add ellipsis property to record picker (#527)
- fix: remove pattern without form item (#528)
- fix(client): update only fields in the form
- fix(client): remove z-index
- fix(plugin-workflow): set current when update (#526)
- fix(client): non-empty judgment
- fix: order nulls last (#519)
- fix(client): close the pop-up after request
- fix: action loading, refresh context, form submit and validate (#523)
- fix: field pattern (#520)
- fix(plugin-workflow): fix searchable select min-width (#524)
- fix: template with fields only (#517)
- fix(plugin-workflow): fix update workflow current property (#521)
- feat: improve chart component
- refactor(plugin-workflow): abstract to classes (#515)
- feat: column sortable and form item pattern (#518)
- feat(client): display option value
- feat(client): hide drawer header
- fix(audit-logs): operator does not exist: character varying = integer
- fix(custom-request): support string/json templates (#514)
- fix(cli): missing await
- feat: add block title (#513)
- fix: remove collections & fields from db (#511)
- fix(cli): upgrade error in node v14
- feat: improve migrations (#510)
- fix(client): improve datepicker component, date with time zone, gmt support
- fix: datepicker with timezone
- fix(client): consolidate usage of date/time as UTC in transfering (#509)
- fix: formula bug
- fix: default exportable fields (#506)
- fix(audit-logs): sort by createdAt
- fix(plugin-export): allow to configure in acl
- fix: sign in/sign up with enter key
- fix(client): percent precision
- feat: association field block (#493)
- feat: plugin export (#479)
- fix: create or delete collection error (#501)
- feat: update collections & fields (#500)
- fix: rollback when field creation fails (#498)
- fix(client): set `dropdownMatchSelectWidth` to false globally (#497)
- fix(client): no-key warning in user menu items (#496)
- Feat(plugin workflow): cron field for schedule trigger configuration (#495)
- feat: audit logs (#494)
- fix(client): language settings
- feat(client): improve locale
- refactor(plugin-workflow): add revision column to execution (#491)
- fix(plugin-multi-app-manager): fix pg cannot create database block tests
- refactor(database): hook proxy (#402) 
- feat: chart blocks (#484) 
- refactor(plugin workflow): support number in repeat config for schedule
- chore(debug): add debug config (#475)
- fix: has one bug 
- feat: relationships (#473) 
- fix(plugin-workflow): fix collection trigger transaction (#474)
- fix(plugin-workflow): temporary solution for collection trigger conditions
- fix: markdown component (#469)
- fix: formula field and percent field (#467) 
- fix(plugin-workflow): fix update workflow action (#464)
- fix(acl): skip when field does not exist
- fix: update formula field and percent field (#461)
- fix(client): export useSignin and useSignup
- fix(ci): node_version = 14
- fix(cli): yarn install --production error
- fix(client): build error
- feat: add formula field type (#457) 
- fix: the details of the associated data in the subtable are not displayed
- fix(plugin-workflow): fix languages (#451) 
- fix: afterSync hook not triggered (#450)

## 2022/06/01 ~ v0.7.0-alpha.83

- fix: default value of time zone
- fix(database): add timezone support
- docs(various): Improve readability (#447) 
- fix(client): datetime with timezone
- feat(plugin-file-manager): record the creator of the attachment
- feat: custom request (#439)
- feat(plugin workflow): schedule trigger (#438) 
- feat(database): db migrator (#432) 
- fix(client): select component cannot be opened in sub-table block (#431)
- fix: error message "error:0308010C:digital envelope routines::unsupported
- docs(github): change to markdown format (#430)
- fix(cli): typo (#429)

### New Features

- Core: db migrator

## 2022/05/26 ~ v0.7.0-alpha.82

- feat(client,sdk): improve api client

### Breaking changes

There are major changes to the `APIClient` API, see details [JavaScript SDK](./development/http-api/javascript-sdk.md)

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
- fix(plugin-workflow): fix duplicated description in fields values (#368)
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
