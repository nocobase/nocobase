# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.8.28](https://github.com/nocobase/nocobase/compare/v1.8.27...v1.8.28) - 2025-10-14

### 🚀 Improvements

- **[client]** In order to get more accurate MIME type of file, use `mime` package to detect MIME type of file in client ([#7551](https://github.com/nocobase/nocobase/pull/7551)) by @mytharcher

- **[Workflow]**
  - Support to limit the maximum number of nodes in a workflow through environment variables ([#7542](https://github.com/nocobase/nocobase/pull/7542)) by @mytharcher

  - Add `keepBranch` option when deleting node ([#7571](https://github.com/nocobase/nocobase/pull/7571)) by @mytharcher

- **[Workflow: Loop node]** Support to limit the maximum number of cycles for loop nodes through environment variables ([#7543](https://github.com/nocobase/nocobase/pull/7543)) by @mytharcher

- **[Workflow: Approval]** Add print button to detail popup in custom approval blocks by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where images did not display correctly when both rotated and scaled during preview ([#7573](https://github.com/nocobase/nocobase/pull/7573)) by @mytharcher

  - Fix the issue where missing dynamic properties in the `AssignedField` component caused file upload errors in "Create record" or "Update record" nodes ([#7556](https://github.com/nocobase/nocobase/pull/7556)) by @mytharcher

- **[Public forms]** Fix the issue where the upload rules for file fields in public forms were incorrect ([#7553](https://github.com/nocobase/nocobase/pull/7553)) by @mytharcher

- **[Calendar]** fix data query issue caused by unique identifier in calendar block ([#7562](https://github.com/nocobase/nocobase/pull/7562)) by @katherinehhh

- **[Auth: LDAP]** Fix LDAP bind failure with non-ASCII (UTF-8) DNs in Active Directory by @2013xile

## [v1.8.27](https://github.com/nocobase/nocobase/compare/v1.8.26...v1.8.27) - 2025-10-02

### 🚀 Improvements

- **[client]** Support to rotate image when previewing ([#7523](https://github.com/nocobase/nocobase/pull/7523)) by @mytharcher

- **[Workflow]** Split the dispatching-related logic into a standalone dispatcher ([#7535](https://github.com/nocobase/nocobase/pull/7535)) by @mytharcher

### 🐛 Bug Fixes

- **[client]** Fix the issue where sidebar submenus cannot highlight correctly ([#7520](https://github.com/nocobase/nocobase/pull/7520)) by @duannyuuu

- **[Workflow: Loop node]** Fixed the issue where the process incorrectly advanced to the next item even when loop node conditions were not satisfied ([#7521](https://github.com/nocobase/nocobase/pull/7521)) by @mytharcher

- **[Workflow]**
  - Fix the issue of duplicated executing due to improper queue handling ([#7533](https://github.com/nocobase/nocobase/pull/7533)) by @mytharcher

  - Fix the issue where the workflow list condition is incorrect when loading associated field context in the bound workflow configuration ([#7516](https://github.com/nocobase/nocobase/pull/7516)) by @mytharcher

  - Fix the issue where scheduled tasks based on date fields do not trigger after start ([#7524](https://github.com/nocobase/nocobase/pull/7524)) by @mytharcher

## [v1.8.26](https://github.com/nocobase/nocobase/compare/v1.8.25...v1.8.26) - 2025-09-20

### 🚀 Improvements

- **[client]** add localization support for tooltip & group item title ([#7485](https://github.com/nocobase/nocobase/pull/7485)) by @katherinehhh

- **[Calendar]** support locale mapping display for calendar headers ([#7508](https://github.com/nocobase/nocobase/pull/7508)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]** Fix the issue where the menu icon configuration popover is being obscured ([#7515](https://github.com/nocobase/nocobase/pull/7515)) by @zhangzhonghe

- **[Notification: In-app message]**
  - Fix the issue of incorrect notification link parsing ([#7509](https://github.com/nocobase/nocobase/pull/7509)) by @mytharcher

  - Fix the issue where recent messages are not displayed when opening the notification popup ([#7514](https://github.com/nocobase/nocobase/pull/7514)) by @mytharcher

- **[Workflow]** Fix the issue where incorrect subscription logic on background task queue in the workflow caused execution message incorrectly handled ([#7507](https://github.com/nocobase/nocobase/pull/7507)) by @mytharcher

- **[Workflow: Approval]**
  - Fix the issue where an error occurred when deleting data from an external data source by @mytharcher

  - Fix the issue where formula fields in the approval form do not update automatically by @mytharcher

## [v1.8.25](https://github.com/nocobase/nocobase/compare/v1.8.24...v1.8.25) - 2025-09-16

### 🚀 Improvements

- **[auth]** Support using `.` in usernames ([#7504](https://github.com/nocobase/nocobase/pull/7504)) by @2013xile

### 🐛 Bug Fixes

- **[client]** Fix the issue where button icon configuration popup is being covered/overlapped ([#7506](https://github.com/nocobase/nocobase/pull/7506)) by @zhangzhonghe

- **[Template print]** support chinaRegions field by @jiannx

## [v1.8.24](https://github.com/nocobase/nocobase/compare/v1.8.23...v1.8.24) - 2025-09-12

### 🎉 New Features

- **[Workflow: Approval]** Support to return to any nodes in approval process by @mytharcher

### 🚀 Improvements

- **[server]** Use standard system logger for message queue ([#7480](https://github.com/nocobase/nocobase/pull/7480)) by @mytharcher

- **[client]** Remove the ellipsis popover from file list ([#7479](https://github.com/nocobase/nocobase/pull/7479)) by @mytharcher

- **[Workflow]** Optimize the workflow preparation process to support using preloaded node data ([#7476](https://github.com/nocobase/nocobase/pull/7476)) by @mytharcher

- **[Theme editor]** Add support for side menu color customization ([#7483](https://github.com/nocobase/nocobase/pull/7483)) by @duannyuuu

- **[Redis queue adapter]** Use standard system logger for Redis message queue adapter by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where Popover component is being overlapped/covered ([#7491](https://github.com/nocobase/nocobase/pull/7491)) by @zhangzhonghe

  - incorrect 'not empty' check for numeric fields in linkage rule ([#7477](https://github.com/nocobase/nocobase/pull/7477)) by @katherinehhh

  - readonly select/multiselect/date/richtext still editable on public form ([#7484](https://github.com/nocobase/nocobase/pull/7484)) by @katherinehhh

- **[Workflow]** Fix a potential error related to workflow log caching ([#7490](https://github.com/nocobase/nocobase/pull/7490)) by @mytharcher

- **[HTTP request encryption]** Fix the issue where request parameters do not support the native URLSearchParams type by @mytharcher

- **[Data source: REST API]** fix rest api URL validation rules by @katherinehhh

- **[Workflow: Approval]** Fix the issue where the status text in the approval completion notification was not translated by @mytharcher

## [v1.8.23](https://github.com/nocobase/nocobase/compare/v1.8.22...v1.8.23) - 2025-09-03

### 🚀 Improvements

- **[database]** Optimized list API count query to reduce resource consumption. ([#7453](https://github.com/nocobase/nocobase/pull/7453)) by @aaaaaajie

- **[Notification: In-app message]** Support configuring the auto-close delay for in-app message notifications ([#7472](https://github.com/nocobase/nocobase/pull/7472)) by @mytharcher

- **[Workflow: notification node]** Support to test the node of notification ([#7470](https://github.com/nocobase/nocobase/pull/7470)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - association field render error when switched to tag component in edit form block ([#7468](https://github.com/nocobase/nocobase/pull/7468)) by @katherinehhh

  - time limit issue when selected date equals minDate ([#7461](https://github.com/nocobase/nocobase/pull/7461)) by @katherinehhh

- **[Mobile]** mobile date field without timezone not showing date time correctly ([#7473](https://github.com/nocobase/nocobase/pull/7473)) by @katherinehhh

- **[Public forms]** public form field default value not applied when using variables ([#7467](https://github.com/nocobase/nocobase/pull/7467)) by @katherinehhh

- **[Action: Import records]** Fix incorrect row number displayed when duplicate data is imported ([#7440](https://github.com/nocobase/nocobase/pull/7440)) by @aaaaaajie

- **[Collection: Tree]** Remove database events related to the collection after deleting a tree collection ([#7459](https://github.com/nocobase/nocobase/pull/7459)) by @2013xile

- **[Workflow: Custom action event]** Fix the issue where custom action events cannot be manually executed immediately after initialization by @mytharcher

- **[Workflow: Subflow]** Fix the issue of subprocesses being resumed and executed multiple times by @mytharcher

- **[Workflow: Approval]** For users who are not the current approver, the corresponding view button in the process flow table will not be displayed by @mytharcher

## [v1.8.22](https://github.com/nocobase/nocobase/compare/v1.8.21...v1.8.22) - 2025-08-27

### 🐛 Bug Fixes

- **[Workflow]** Fix the issue where the detail popup was not displayed due to an incorrect route configuration in the tasks center ([#7452](https://github.com/nocobase/nocobase/pull/7452)) by @mytharcher

## [v1.8.21](https://github.com/nocobase/nocobase/compare/v1.8.20...v1.8.21) - 2025-08-26

### 🐛 Bug Fixes

- **[File manager]** Fix the error when editing the `storage` field in the file collection. ([#7393](https://github.com/nocobase/nocobase/pull/7393)) by @mytharcher

- **[Workflow: Parallel node]** Fix the issue where incorrect status determination in parallel branch nodes under the "Run all branch" mode caused premature completion ([#7445](https://github.com/nocobase/nocobase/pull/7445)) by @mytharcher

- **[Workflow: Approval]** Add the status variable for custom templates in approval completion notifications by @mytharcher

## [v1.8.20](https://github.com/nocobase/nocobase/compare/v1.8.19...v1.8.20) - 2025-08-25

### 🚀 Improvements

- **[Workflow]** Adjust the workflow variable API to support presetting an additional variable list ([#7439](https://github.com/nocobase/nocobase/pull/7439)) by @mytharcher

- **[Workflow: Approval]**
  - Support using approval-related variables in custom notifications by @mytharcher

  - Support updating the approval status after the end node terminates the execution by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix an issue where, in certain scenarios, editing a record in the mobile record picker popup causes an error ([#7444](https://github.com/nocobase/nocobase/pull/7444)) by @zhangzhonghe

  - required validation not working for attachment fields in subtable ([#7431](https://github.com/nocobase/nocobase/pull/7431)) by @katherinehhh

  - Fix the issue where the icon was displayed incorrectly when the URL in the attachment URL field contained query parameters ([#7432](https://github.com/nocobase/nocobase/pull/7432)) by @mytharcher

- **[database]**
  - Fixed a MySQL syntax error that occurred when loading more in-app messages. ([#7438](https://github.com/nocobase/nocobase/pull/7438)) by @aaaaaajie

  - Fixed precision issue for exported Number fields ([#7421](https://github.com/nocobase/nocobase/pull/7421)) by @aaaaaajie

- **[undefined]** Fixed issue with filtering by date field only in MySQL external source ([#7422](https://github.com/nocobase/nocobase/pull/7422)) by @aaaaaajie

- **[Action: Import records]** Fixed an issue where import failed when the table primary key was a single-line text ([#7416](https://github.com/nocobase/nocobase/pull/7416)) by @aaaaaajie

- **[Workflow]**
  - Complete the options for automatically deleting workflow execution status ([#7436](https://github.com/nocobase/nocobase/pull/7436)) by @mytharcher

  - Fix issues related to the mobile menu in the workflow tasks ([#7419](https://github.com/nocobase/nocobase/pull/7419)) by @mytharcher

- **[Action: Import records Pro]** Fixed unexpected update result when using string primary key in xlsx import. by @aaaaaajie

## [v1.8.19](https://github.com/nocobase/nocobase/compare/v1.8.18...v1.8.19) - 2025-08-22

### 🎉 New Features

- **[Workflow: Approval]** Add inline template type for notification configuration by @mytharcher

### 🚀 Improvements

- **[client]** Support displaying icons identified by strings in the Select component when in read-only mode ([#7420](https://github.com/nocobase/nocobase/pull/7420)) by @mytharcher

- **[database]** Optimized ACL Meta query performance ([#7400](https://github.com/nocobase/nocobase/pull/7400)) by @aaaaaajie

- **[Mobile]** Optimize the mobile popup component ([#7414](https://github.com/nocobase/nocobase/pull/7414)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[database]** Fixed issue where Postgres external table reads included views from other schemas ([#7410](https://github.com/nocobase/nocobase/pull/7410)) by @aaaaaajie

- **[Block: template]** Resolved an issue where mail blocks were not visible when placed inside an inherited template block ([#7430](https://github.com/nocobase/nocobase/pull/7430)) by @gchust

- **[Action: Import records Pro]** Disallow assigning relation fields during import duplicate detection. by @aaaaaajie

- **[Workflow: Approval]** Fix the issue where the user list was empty during countersigning by @mytharcher

- **[Migration manager]** Skip the `\restrict` and `\unrestrict` commands generated by the latest pg_dump when creating migration files to resolve restore errors. by @2013xile

## [v1.8.18](https://github.com/nocobase/nocobase/compare/v1.8.17...v1.8.18) - 2025-08-19

### 🚀 Improvements

- **[Workflow]** Updated the node selection menu to display options in a two-column layout for improving information density and allowing users to view more options at once ([#7396](https://github.com/nocobase/nocobase/pull/7396)) by @mytharcher

- **[License settings]** In the license settings, copy the latest Instance ID each time ([#7387](https://github.com/nocobase/nocobase/pull/7387)) by @jiannx

### 🐛 Bug Fixes

- **[client]**
  - treat number 0 as empty during linkage rule empty validation ([#7404](https://github.com/nocobase/nocobase/pull/7404)) by @katherinehhh

  - Fix text of link button breaking line ([#7406](https://github.com/nocobase/nocobase/pull/7406)) by @mytharcher

- **[Mobile]** incorrect display format of date field on mobile ([#7412](https://github.com/nocobase/nocobase/pull/7412)) by @katherinehhh

- **[Office File Previewer]** Fix error thrown when upload file to attachment URL field ([#7405](https://github.com/nocobase/nocobase/pull/7405)) by @mytharcher

- **[Workflow]** Fix error thrown and form data disappeared when edit workflow category ([#7408](https://github.com/nocobase/nocobase/pull/7408)) by @mytharcher

- **[Workflow: mailer node]** Fix the issue where the email node might not resume execution properly ([#7409](https://github.com/nocobase/nocobase/pull/7409)) by @mytharcher

- **[Workflow: Custom action event]** Clear the selected rows after successfully triggering actions on multiple records by @mytharcher

- **[Template print]** Printing of radio-select fields in multiple lines of data by @jiannx

- **[Workflow: Approval]** Fix the issue where loading external data source data in approval records resulted in a 404 error by @mytharcher

## [v1.8.17](https://github.com/nocobase/nocobase/compare/v1.8.16...v1.8.17) - 2025-08-15

### 🎉 New Features

- **[Workflow: Approval]** Support to use consistent task title for all approval nodes in same workflow by @mytharcher

### 🚀 Improvements

- **[Authentication]** Removed the token parameter from the URL after a successful sign-in ([#7386](https://github.com/nocobase/nocobase/pull/7386)) by @2013xile

- **[Template print]** support field m2m array by @jiannx

### 🐛 Bug Fixes

- **[Mobile]** Fix the issue where the form submission data in the mobile approval dialog is incorrect ([#7389](https://github.com/nocobase/nocobase/pull/7389)) by @zhangzhonghe

- **[Workflow]** Fix the translation of the page title in the workflow tasks center ([#7392](https://github.com/nocobase/nocobase/pull/7392)) by @mytharcher

- **[Calendar]** calendar event item tooltip showing [object Object] ([#7372](https://github.com/nocobase/nocobase/pull/7372)) by @katherinehhh

- **[Notification: In-app message]** Fix translations ([#7384](https://github.com/nocobase/nocobase/pull/7384)) by @mytharcher

- **[File manager]** Remove the hint for the file upload size limit ([#7391](https://github.com/nocobase/nocobase/pull/7391)) by @mytharcher

- **[File storage: S3(Pro)]**
  - Deprecate problematic parameter `attachmentField` by @mytharcher

  - Fix the issue where the IAM authentication method could not be used to upload files by @mytharcher

## [v1.8.16](https://github.com/nocobase/nocobase/compare/v1.8.15...v1.8.16) - 2025-08-14

### 🚀 Improvements

- **[Notification: In-app message]** Remove SQL logs output via `console.log` ([#7368](https://github.com/nocobase/nocobase/pull/7368)) by @2013xile

### 🐛 Bug Fixes

- **[server]** Some requests lack `ctx.action`, causing errors in the audit log middleware ([#7369](https://github.com/nocobase/nocobase/pull/7369)) by @2013xile

- **[Collection field: Formula]** Fix the issue where formula input could not pass validation due to variable type ([#7373](https://github.com/nocobase/nocobase/pull/7373)) by @mytharcher

- **[Backup manager]** large file backups could show “successful” before actually finishing by @gchust

## [v1.8.15](https://github.com/nocobase/nocobase/compare/v1.8.14...v1.8.15) - 2025-08-11

### 🚀 Improvements

- **[client]**
  - add "day before yesterday" date variable support ([#7359](https://github.com/nocobase/nocobase/pull/7359)) by @katherinehhh

  - Optimize performance when switching popup tabs ([#7353](https://github.com/nocobase/nocobase/pull/7353)) by @zhangzhonghe

- **[Workflow]**
  - Fix unstable test case ([#7349](https://github.com/nocobase/nocobase/pull/7349)) by @mytharcher

  - Show normal title when disabled ([#7339](https://github.com/nocobase/nocobase/pull/7339)) by @mytharcher

- **[Office File Previewer]** Add support for previewing `.odt` file ([#7347](https://github.com/nocobase/nocobase/pull/7347)) by @mytharcher

- **[Backup manager]** improve performance for mysql database backup operation by @gchust

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where multi-column form layout doesn't convert to single-column layout on mobile devices ([#7355](https://github.com/nocobase/nocobase/pull/7355)) by @zhangzhonghe

  - Fix bulk delete collections error ([#7345](https://github.com/nocobase/nocobase/pull/7345)) by @aaaaaajie

  - Fixed issue where previously saved data scope was not preselected when configuring permissions individually. ([#7288](https://github.com/nocobase/nocobase/pull/7288)) by @aaaaaajie

- **[Workflow]**
  - Refactor the "Add Node" menu and fix the workflow canvas rendering performance issues it caused ([#7363](https://github.com/nocobase/nocobase/pull/7363)) by @mytharcher

  - Fix the issue of incorrect filter conditions when retrieving a single to-do item ([#7366](https://github.com/nocobase/nocobase/pull/7366)) by @mytharcher

  - Fix the issue of keyword matching in the field select ([#7356](https://github.com/nocobase/nocobase/pull/7356)) by @mytharcher

  - Avoid error thrown caused by publishing to event queue when stopping ([#7348](https://github.com/nocobase/nocobase/pull/7348)) by @mytharcher

- **[Notification: In-app message]** Fix the issue where in-site messages were received but not displayed in a popup ([#7364](https://github.com/nocobase/nocobase/pull/7364)) by @mytharcher

- **[Mobile]** Resolved an issue where the date picker on mobile devices displayed incorrectly when date range limits were applied ([#7362](https://github.com/nocobase/nocobase/pull/7362)) by @katherinehhh

- **[File manager]** Add `storageId` field to file collection to support permission configuration ([#7351](https://github.com/nocobase/nocobase/pull/7351)) by @mytharcher

- **[Workflow: Parallel node]** Fix parallel node suspend after resume under MySQL ([#7346](https://github.com/nocobase/nocobase/pull/7346)) by @mytharcher

- **[Workflow: CC]** Fix blocks can not be removed ([#7338](https://github.com/nocobase/nocobase/pull/7338)) by @mytharcher

- **[Office File Previewer]** Support `.docx`, `.xlsx` and `.pptx` file with only URL to be previewed ([#7336](https://github.com/nocobase/nocobase/pull/7336)) by @mytharcher

- **[Data visualization]** date variable issue in default value of date field in chart filter block ([#7291](https://github.com/nocobase/nocobase/pull/7291)) by @katherinehhh

- **[Workflow: Approval]**
  - Fix linkage rules not works in approval original detail block by @mytharcher

  - Fix update associations when submit draft by @mytharcher

## [v1.8.14](https://github.com/nocobase/nocobase/compare/v1.8.13...v1.8.14) - 2025-08-05

### 🐛 Bug Fixes

- **[client]** Fix the issue where variable raw strings are submitted with the form ([#7337](https://github.com/nocobase/nocobase/pull/7337)) by @zhangzhonghe

- **[Workflow: Approval]** Add task title for added and delegated items by @mytharcher

## [v1.8.13](https://github.com/nocobase/nocobase/compare/v1.8.12...v1.8.13) - 2025-08-04

### 🎉 New Features

- **[Auth: SAML 2.0]** Add signature-related configuration options by @2013xile

### 🚀 Improvements

- **[Workflow: JavaScript]** Change cache to app cache to avoid bugs in cluster mode by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix tooltip shows [object Object] on hover in action panel ([#7322](https://github.com/nocobase/nocobase/pull/7322)) by @katherinehhh

  - When using variables to set field default values in filter forms, if the variable value is empty, the input box will display the original variable string ([#7335](https://github.com/nocobase/nocobase/pull/7335)) by @zhangzhonghe

- **[Collection: Tree]** Fix the path synchronization logic of tree collections ([#7330](https://github.com/nocobase/nocobase/pull/7330)) by @ChimingLiu

## [v1.8.12](https://github.com/nocobase/nocobase/compare/v1.8.11...v1.8.12) - 2025-08-01

### 🎉 New Features

- **[client]** Added "Auto focus" option for Input, TextArea, URL, and InputNumber components that automatically focuses the input field during initial page rendering when enabled ([#7320](https://github.com/nocobase/nocobase/pull/7320)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - Fix file preview item on null url ([#7315](https://github.com/nocobase/nocobase/pull/7315)) by @mytharcher

  - Add full URL to local file when previewing ([#7314](https://github.com/nocobase/nocobase/pull/7314)) by @mytharcher

- **[utils]** incorrect timezone handling for parseDate ([#7318](https://github.com/nocobase/nocobase/pull/7318)) by @katherinehhh

- **[undefined]** Add new plugin to preset ([#7319](https://github.com/nocobase/nocobase/pull/7319)) by @mytharcher

- **[File manager]** Fix storage field permission ([#7316](https://github.com/nocobase/nocobase/pull/7316)) by @mytharcher

- **[Workflow]** Fix `undefined` result when processor exit ([#7317](https://github.com/nocobase/nocobase/pull/7317)) by @mytharcher

- **[Workflow: Dynamic calculation node]** Fix legacy API caused error ([#7321](https://github.com/nocobase/nocobase/pull/7321)) by @mytharcher

- **[Workflow: Subflow]** Fix flow suspended by @mytharcher

## [v1.8.11](https://github.com/nocobase/nocobase/compare/v1.8.10...v1.8.11) - 2025-07-30

### 🎉 New Features

- **[Office File Previewer]** Support to preview Office files via Microsoft live preview ([#7300](https://github.com/nocobase/nocobase/pull/7300)) by @mytharcher

### 🚀 Improvements

- **[client]** Do not automatically close menu after selection ([#7252](https://github.com/nocobase/nocobase/pull/7252)) by @kerwin612

- **[Notification: In-app message]** Change in-app message from SSE to WebSocket ([#7302](https://github.com/nocobase/nocobase/pull/7302)) by @mytharcher

- **[Workflow]** Reduce jobs amount to load when preparing execution ([#7284](https://github.com/nocobase/nocobase/pull/7284)) by @mytharcher

- **[Auth: DingTalk]** In the DingTalk client, set the navigation bar title to an empty string instead of displaying “Loading…” by @2013xile

### 🐛 Bug Fixes

- **[client]**
  - Fix issue where tree table cannot be expanded ([#7309](https://github.com/nocobase/nocobase/pull/7309)) by @zhangzhonghe

  - Fix unexpected behavior in table row drag and drop sorting ([#6959](https://github.com/nocobase/nocobase/pull/6959)) by @ChimingLiu

  - Fix infinite loop issue when parsing field default values ([#7301](https://github.com/nocobase/nocobase/pull/7301)) by @zhangzhonghe

  - 修复筛选表单中关系字段配置数据选择器时弹窗内日期字段展示异常的问题 ([#7290](https://github.com/nocobase/nocobase/pull/7290)) by @katherinehhh

- **[Workflow: HTTP request node]** Fix racing condition bug ([#7310](https://github.com/nocobase/nocobase/pull/7310)) by @mytharcher

- **[Workflow]** Fix BigInt ID issue in MySQL when save job ([#7292](https://github.com/nocobase/nocobase/pull/7292)) by @mytharcher

- **[Action: Export records]** Fixed incorrect formatting of nested relational fields when exporting to Excel. ([#7277](https://github.com/nocobase/nocobase/pull/7277)) by @aaaaaajie

- **[Data source: External SQL Server]** Fix inconsistent storage format for MSSQL datetime (without time zone) fields from external data sources by @aaaaaajie

- **[Workflow: Approval]** Fix error thrown from assignee select inside external datasource by @mytharcher

## [v1.8.10](https://github.com/nocobase/nocobase/compare/v1.8.7...v1.8.10) - 2025-07-24

### 🎉 New Features

- **[Auth: SAML 2.0]** Support automatic redirection to the SSO URL when the user is unauthenticated by @2013xile

- **[server]** Support configuring request body size limit via environment variable ([#7273](https://github.com/nocobase/nocobase/pull/7273)) by @aaaaaajie

- **[Workflow: Parallel node]** Add "All settled" mode for parallel node ([#7263](https://github.com/nocobase/nocobase/pull/7263)) by @mytharcher

- **[Redis queue adapter]** Add Redis adapter for event queue by @mytharcher

### 🚀 Improvements

- **[Workflow]** Add json type constant for test variable ([#7274](https://github.com/nocobase/nocobase/pull/7274)) by @mytharcher

- **[AI integration]** Remove `await` for invoking `saveJob` ([#7275](https://github.com/nocobase/nocobase/pull/7275)) by @mytharcher

- **[Workflow: JSON calculation]** Make JSON query node testable by @mytharcher

- **[server]** Make concurrent memory queue available when processing items not full ([#7267](https://github.com/nocobase/nocobase/pull/7267)) by @mytharcher

- **[database]** Automatically activates simple pagination when dataset exceeds a threshold ([#7227](https://github.com/nocobase/nocobase/pull/7227)) by @aaaaaajie

- **[Workflow: Manual node]** storePopupContext supports saving default context ([#7264](https://github.com/nocobase/nocobase/pull/7264)) by @zhangzhonghe

- **[Redis queue adapter]** Make concurrent queue available when processing items not full for Redis adapter by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - fuzzy search not working in select association field when using formula as title field ([#7280](https://github.com/nocobase/nocobase/pull/7280)) by @katherinehhh

  - missing current object variable in sub-table linkage rules ([#7266](https://github.com/nocobase/nocobase/pull/7266)) by @katherinehhh

  - Data selector title field setting is invalid ([#7251](https://github.com/nocobase/nocobase/pull/7251)) by @zhangzhonghe

  - Fix issue where Markdown fields were not rendered correctly in the detail view. ([#7257](https://github.com/nocobase/nocobase/pull/7257)) by @aaaaaajie

  - After field changes, the association fields that depend on this field have not cleared their values ([#7262](https://github.com/nocobase/nocobase/pull/7262)) by @zhangzhonghe

  - display issue when deprecated date variables are used in date fields of historical data ([#7253](https://github.com/nocobase/nocobase/pull/7253)) by @katherinehhh

- **[database]**
  - Resolve auto simple pagination failure caused by table naming convention. ([#7256](https://github.com/nocobase/nocobase/pull/7256)) by @aaaaaajie

  - Fixed failure when exporting large datasets from PostgreSQL ([#7228](https://github.com/nocobase/nocobase/pull/7228)) by @aaaaaajie

  - Fix issue where default primary key sorting causes list loading failure when using MSSQL external data source in table block. ([#7259](https://github.com/nocobase/nocobase/pull/7259)) by @aaaaaajie

- **[auth]** Fix the issue where an empty `secret` in sub-application configuration prevents sign-in ([#7239](https://github.com/nocobase/nocobase/pull/7239)) by @2013xile

- **[Data source manager]** Fixed preserve external datasource attributes in collection configuration ([#7249](https://github.com/nocobase/nocobase/pull/7249)) by @aaaaaajie

- **[Action: Batch edit]** Unable to perform bulk edit and bulk update in data selector ([#7250](https://github.com/nocobase/nocobase/pull/7250)) by @zhangzhonghe

- **[Workflow]** Fix wrong version of dependency ([#7258](https://github.com/nocobase/nocobase/pull/7258)) by @mytharcher

- **[Data source: External Oracle]** Fixed preserve external datasource attributes in collection configuration by @aaaaaajie

- **[Workflow: Approval]** The Link button's URL points to a popup on the current page, but clicking it shows a 404 error by @zhangzhonghe

- **[Email manager]** the messages and labes relationship collection is exceptional under mysql by @jiannx

## [v1.8.7](https://github.com/nocobase/nocobase/compare/v1.8.6...v1.8.7) - 2025-07-17

### 🎉 New Features

- **[Workflow: date calculation node]** Support to test run node by @mytharcher

### 🚀 Improvements

- **[client]** Color Picker: Add four recommended colors ([#7226](https://github.com/nocobase/nocobase/pull/7226)) by @zhangzhonghe

- **[Workflow]** Make comparison compatible for date values ([#7237](https://github.com/nocobase/nocobase/pull/7237)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - style rules not working on table action column ([#7225](https://github.com/nocobase/nocobase/pull/7225)) by @katherinehhh

  - When deleting a menu, the corresponding data in the uiSchemas table is not deleted ([#7232](https://github.com/nocobase/nocobase/pull/7232)) by @zhangzhonghe

  - Avoid non-association fields to be selected in appends ([#7231](https://github.com/nocobase/nocobase/pull/7231)) by @mytharcher

- **[Workflow: Subflow]** Fix error thrown when recall signal arrive but pending execution is not on current instance by @mytharcher

## [v1.8.6](https://github.com/nocobase/nocobase/compare/v1.8.5...v1.8.6) - 2025-07-16

### 🐛 Bug Fixes

- **[client]**
  - Fix error: Can't resolve 'react-device-detect ([#7224](https://github.com/nocobase/nocobase/pull/7224)) by @zhangzhonghe

  - display issue for association fields in linkage rules ([#7220](https://github.com/nocobase/nocobase/pull/7220)) by @katherinehhh

- **[database]** Fixed error when enabling simple pagination for external data source tables ([#7222](https://github.com/nocobase/nocobase/pull/7222)) by @aaaaaajie

- **[Collection field: Sort]** missing sort field selection when duplicating records ([#7116](https://github.com/nocobase/nocobase/pull/7116)) by @katherinehhh

- **[Workflow: Approval]**
  - Add fault tolerance for deleted approval in record list by @mytharcher

  - Fix multiple levels of associations when submit approval by @mytharcher

  - Fix exception when delete record by @mytharcher

## [v1.8.5](https://github.com/nocobase/nocobase/compare/v1.8.4...v1.8.5) - 2025-07-14

### 🚀 Improvements

- **[Collection field: Formula]** Add more calculable interfaces ([#7215](https://github.com/nocobase/nocobase/pull/7215)) by @mytharcher

- **[Workflow]** Use logging instead of throwing error when execution should not run due to status ([#7217](https://github.com/nocobase/nocobase/pull/7217)) by @mytharcher

- **[Workflow: Approval]** Support to delete approval when related data deleted by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - issue where attachment fields could not be selected as variables in linkage rule ([#7213](https://github.com/nocobase/nocobase/pull/7213)) by @zhangzhonghe

  - Fix the issue where dropdown select components are blocked by the keyboard on iOS ([#7149](https://github.com/nocobase/nocobase/pull/7149)) by @zhangzhonghe

  - value assignment fails in edit form when both value and options are set for select field ([#7209](https://github.com/nocobase/nocobase/pull/7209)) by @katherinehhh

  - Filter collapse: Filter is not triggered during page initialization after setting default values for fields ([#7206](https://github.com/nocobase/nocobase/pull/7206)) by @zhangzhonghe

  - error when assigning values in list block using kanban sort field ([#7208](https://github.com/nocobase/nocobase/pull/7208)) by @katherinehhh

  - Browser tab title is not synchronized when switching between submenus ([#7207](https://github.com/nocobase/nocobase/pull/7207)) by @zhangzhonghe

  - Popup action: Page display does not meet expectations after switching tabs ([#7212](https://github.com/nocobase/nocobase/pull/7212)) by @zhangzhonghe

- **[acl]** Fix error when deleting a role under role union mode that includes the root role. ([#7198](https://github.com/nocobase/nocobase/pull/7198)) by @aaaaaajie

- **[Multi-app manager]** Fix auth options in unexpected position ([#7210](https://github.com/nocobase/nocobase/pull/7210)) by @mytharcher

- **[Authentication]** Fix the issue where the login page cannot scroll ([#7159](https://github.com/nocobase/nocobase/pull/7159)) by @zhangzhonghe

- **[Workflow: Approval]** Fix associations when submit approval by @mytharcher

## [v1.8.4](https://github.com/nocobase/nocobase/compare/v1.8.3...v1.8.4) - 2025-07-13

### 🎉 New Features

- **[Multi-app manager]** Support to configure independent auth secret for sub-apps ([#7197](https://github.com/nocobase/nocobase/pull/7197)) by @mytharcher

- **[Workflow: CC]** Add CC node to workflow ([#7201](https://github.com/nocobase/nocobase/pull/7201)) by @mytharcher

### 🚀 Improvements

- **[Notification: In-app message]** Optimize font size for mobile message page ([#7199](https://github.com/nocobase/nocobase/pull/7199)) by @zhangzhonghe

- **[Auth: DingTalk]** Support configuring the callback URL’s protocol and port number by @2013xile

### 🐛 Bug Fixes

- **[Notification: In-app message]** Fix BigInt timestamp in string format causes dayjs issue ([#7196](https://github.com/nocobase/nocobase/pull/7196)) by @mytharcher

- **[Workflow: Approval]**
  - To avoid error when user not exists by @mytharcher

  - Reload association on record by @mytharcher

  - Add `try/catch` in migration when update UI schema by @mytharcher

## [v1.8.3](https://github.com/nocobase/nocobase/compare/v1.8.2...v1.8.3) - 2025-07-11

### 🚀 Improvements

- **[Multi-app manager]** Add database and authorization options for sub-app ([#7184](https://github.com/nocobase/nocobase/pull/7184)) by @mytharcher

### 🐛 Bug Fixes

- **[Action: Custom request]** variable parsing issue in URL during route navigation after custom request success ([#7186](https://github.com/nocobase/nocobase/pull/7186)) by @katherinehhh

## [v1.8.2](https://github.com/nocobase/nocobase/compare/v1.8.1...v1.8.2) - 2025-07-10

### 🎉 New Features

- **[Workflow: Approval]** Add initializer for trigger by @mytharcher

### 🚀 Improvements

- **[Workflow]** Convert operands to string before string comparison in logic calculation ([#7190](https://github.com/nocobase/nocobase/pull/7190)) by @mytharcher

- **[Collection field: Code]** Add indent setting by @mytharcher

### 🐛 Bug Fixes

- **[database]** Fixed an issue where fields of views were not displayed in blocks. ([#7162](https://github.com/nocobase/nocobase/pull/7162)) by @aaaaaajie

- **[Block: Kanban]** fix subtable UI issues in Kanban and add support for Kanban column width setting ([#7189](https://github.com/nocobase/nocobase/pull/7189)) by @katherinehhh

- **[Workflow: Approval]** Fix block and association bugs by @mytharcher

## [v1.8.1](https://github.com/nocobase/nocobase/compare/v1.8.0...v1.8.1) - 2025-07-09

### 🐛 Bug Fixes

- **[client]**
  - The checkbox field display is incorrect in the association field collection within the form ([#7176](https://github.com/nocobase/nocobase/pull/7176)) by @zhangzhonghe

  - Fix the issue where clicking buttons cannot open popups ([#7180](https://github.com/nocobase/nocobase/pull/7180)) by @zhangzhonghe

- **[Workflow: Manual node]** Fix error thrown when use variable ([#7177](https://github.com/nocobase/nocobase/pull/7177)) by @mytharcher

- **[Template print]** add migration script to rootDataType field by @jiannx

- **[Workflow: Approval]** Fix approved branch not run when no assignee by @mytharcher

## [v1.8.0](https://github.com/nocobase/nocobase/compare/v1.7.20...v1.8.0) - 2025-07-07

## New Feature

### Forgot Password – Email Recovery Supported

Users can now recover their passwords via email. Enable this feature in **Settings > Authentication > Forgot Password**, configure an email notification channel, and customize the password reset email (supports variables and HTML format).

![20250707104631_rec_-ihynhs.gif](https://static-docs.nocobase.com/20250707104631_rec_-ihynhs.gif)

Reference: [Forgot Password](https://docs.nocobase.com/handbook/auth/user#forgot-password)

### Custom Aggregation Variables

Supports creating statistical variables such as count, sum, and average. These variables can be used in menu badges, page labels, and other areas to make the interface more intuitive and information-rich.

![20250707110736_rec_-fzpk98.gif](https://static-docs.nocobase.com/20250707110736_rec_-fzpk98.gif)

Reference: [Custom Variables](https://docs.nocobase.com/handbook/custom-variables)

### Email Management

The email management module has been fully upgraded, now supporting email deletion, batch sending, sync interval settings, AI-generated content, and various user experience improvements.

![image-9dyulg.png](https://static-docs.nocobase.com/image-9dyulg.png)

### Data Sources

Supports the SQL Server BIT field in external data sources and enables on-demand loading of data tables from external sources.

![image-rml96b.png](https://static-docs.nocobase.com/image-rml96b.png)

### Text Copy

Supports one-click copying of text field content.

![20250707105447_rec_-m25b6x.gif](https://static-docs.nocobase.com/20250707105447_rec_-m25b6x.gif)


### [Workflow: HTTP Request Node] Support for `multipart/form-data` Type

When configuring an HTTP Request node in a workflow, you can now select the `multipart/form-data` content type. Once enabled, the request body accepts form-data submissions—including `file` fields—to support file uploads and similar scenarios.

![image-gutu74.png](https://static-docs.nocobase.com/image-gutu74.png)

### [Workflow: Approval] Approval Node Results Support Generating Approval Record Variables

Approval node execution results can now be used as variables in subsequent nodes, with automatic recording of status and related data.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

Reference: [Node Results](https://docs.nocobase.com/handbook/workflow-approval/node#node-results)

## Improvements

### Scan-to-Fill Input

The generic text input component now includes an **Enable Scan** option. When enabled, a scan button appears on the right side of the input field, allowing data to be entered via scanning devices. You can also configure whether manual input is allowed.

![image-u7gfro.png](https://static-docs.nocobase.com/image-u7gfro.png)

Reference: [Enable scan](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/enable-scan)

### Localization Support in Markdown Block

Markdown content now supports localization using the `{{t 'xxx'}}` syntax to insert multilingual text.

![20250707132207_rec_-a1fu68.gif](https://static-docs.nocobase.com/20250707132207_rec_-a1fu68.gif)

Reference: [Localization](https://docs.nocobase.com/handbook/ui/blocks/other-blocks/markdown#localization)

### Menu Links Support Opening in New Window

A new **"Open in new window"** option has been added for menu links, allowing you to customize how links are opened.

![image-x0qfsq.png](https://static-docs.nocobase.com/image-x0qfsq.png)

### Calendar Block Supports Setting Week Start Day

You can now customize the calendar view’s week start day, choosing either Sunday or Monday to fit different regional preferences and habits.

![image-uu5ubi.png](https://static-docs.nocobase.com/image-uu5ubi.png)

### Markdown (Vditor) View Mode Supports Image Click-to-Zoom

In view mode, images within Markdown content can be clicked to enlarge, enhancing the reading experience.

![20250707134351_rec_-zd0mvw.gif](https://static-docs.nocobase.com/20250707134351_rec_-zd0mvw.gif)

### Comprehensive Enhancement Of Workflow Module Functionality And Performance

- Support filtering workflows by more fields to improve search efficiency
- Optimize mobile display styles to enhance user experience
- Exclude JSON field loading to significantly improve execution plan list loading performance
- Add a new log API for node test runs
- Adjust the API interface of the `getCollectionFieldOptions` method to enhance flexibility

![image-5b3byb.png](https://static-docs.nocobase.com/image-5b3byb.png)

### Approval Process Functionality Enhancements And Experience Improvements

- Added Configuration Option For Transfer And Add Sign Personnel Selection Lists, Supporting Display Of More Field Information To Assist More Accurate Selection
- Adjusted Time Display In Timeline To Absolute Time To Improve Readability
- Imported Approval-Related Data Tables From Workflow Plugin To Prevent Local Tables From Being Overwritten
- Adjusted Variable API Interface Structure To Enhance Flexibility And Consistency

![20250707141716_rec_-v2nc4q.gif](https://static-docs.nocobase.com/20250707141716_rec_-v2nc4q.gif)

### Support Configuring Database Connection Pool Options Via Environment Variables

Database connection pool parameters can be flexibly set through environment variables to improve deployment flexibility.

![image-tz87as.png](https://static-docs.nocobase.com/image-tz87as.png)

### Comment Block Supports Pagination

Supports paginated loading of comments to enhance loading performance and reading experience in scenarios with large data volumes.

![20250707155143_rec_-ch7qvy.gif](https://static-docs.nocobase.com/20250707155143_rec_-ch7qvy.gif)

### Mobile Experience Improvements

- Notification Popups Adapted To Mobile Styles
- Optimized Mobile Layout Detection Logic To Enhance Responsiveness Accuracy

## [v1.7.20](https://github.com/nocobase/nocobase/compare/v1.7.19...v1.7.20) - 2025-07-07

### 🐛 Bug Fixes

- **[client]**
  - After field changes, data scopes that depend on this field should automatically clear selected values ([#7161](https://github.com/nocobase/nocobase/pull/7161)) by @zhangzhonghe

  - Fix the issue where setting table column width is ineffective ([#7158](https://github.com/nocobase/nocobase/pull/7158)) by @zhangzhonghe

  - Fix the error issue with filter forms in the Duplicate button popup ([#7154](https://github.com/nocobase/nocobase/pull/7154)) by @zhangzhonghe

  - Fixed an error that occurred when saving a one-to-one relationship in a configuration field. ([#7153](https://github.com/nocobase/nocobase/pull/7153)) by @aaaaaajie

- **[undefined]** Fix e2e.yml ([#7160](https://github.com/nocobase/nocobase/pull/7160)) by @mytharcher

- **[File manager]**
  - Fix mimetype detect ([#7164](https://github.com/nocobase/nocobase/pull/7164)) by @mytharcher

  - Fix build error due to ESM package ([#7169](https://github.com/nocobase/nocobase/pull/7169)) by @mytharcher

- **[Public forms]** fix issue where Date Only field failed to select date in public form. ([#7168](https://github.com/nocobase/nocobase/pull/7168)) by @katherinehhh

- **[Workflow]** Fix the issue where multiple left swipes are required to return to the previous page on mobile devices ([#7165](https://github.com/nocobase/nocobase/pull/7165)) by @zhangzhonghe

- **[Data visualization]** Table pagination issue ([#7151](https://github.com/nocobase/nocobase/pull/7151)) by @2013xile

- **[Workflow: Approval]**
  - Fix associations not loaded after withdrawn by @mytharcher

  - Remove transaction of patching schema due to timeout by @mytharcher

  - Fix error thrown when approval deleted by @mytharcher

  - Fix update association when submit by @mytharcher

## [v1.7.19](https://github.com/nocobase/nocobase/compare/v1.7.18...v1.7.19) - 2025-07-03

### 🚀 Improvements

- **[database]** Support to add pool options from env ([#7133](https://github.com/nocobase/nocobase/pull/7133)) by @mytharcher

- **[Workflow]**
  - Improve executions list load performance by excepting JSON field ([#7138](https://github.com/nocobase/nocobase/pull/7138)) by @mytharcher

  - Add log API for node testing ([#7129](https://github.com/nocobase/nocobase/pull/7129)) by @mytharcher

- **[Multi-app manager]** add filter support to multi-app management ([#7124](https://github.com/nocobase/nocobase/pull/7124)) by @katherinehhh

- **[Workflow: Approval]** Change time to absolute in timeline by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Setting field displayName in connected view had no effect ([#7130](https://github.com/nocobase/nocobase/pull/7130)) by @aaaaaajie

  - background color style issue  in subtable on detail block ([#7144](https://github.com/nocobase/nocobase/pull/7144)) by @katherinehhh

  - Workflow manual node UI configuration: linkage rules cannot select Current form variables ([#7125](https://github.com/nocobase/nocobase/pull/7125)) by @zhangzhonghe

  - association field default value overrides existing data in sub-table ([#7120](https://github.com/nocobase/nocobase/pull/7120)) by @katherinehhh

  - markdown did not reflect changes in real-time when referencing $nForm variables ([#7147](https://github.com/nocobase/nocobase/pull/7147)) by @katherinehhh

  - Fault tolerance for settings based on 'x-acl-action' ([#7128](https://github.com/nocobase/nocobase/pull/7128)) by @mytharcher

- **[utils]** filtering issue on DateOnly or Datetime (without time zone) using Exact day variable ([#7113](https://github.com/nocobase/nocobase/pull/7113)) by @katherinehhh

- **[Workflow]** Fix error thrown by cycling import ([#7134](https://github.com/nocobase/nocobase/pull/7134)) by @mytharcher

- **[Password policy]** Support permanently locking user accounts by @2013xile

- **[Workflow: Subflow]** Fix issue in cluster mode by @mytharcher

- **[Workflow: Approval]**
  - Remove non-filterable fields from filter by @mytharcher

  - Add form layout settings by @mytharcher

## [v1.7.18](https://github.com/nocobase/nocobase/compare/v1.7.17...v1.7.18) - 2025-06-26

### 🚀 Improvements

- **[Workflow]** Optimize mobile style ([#7040](https://github.com/nocobase/nocobase/pull/7040)) by @mytharcher

- **[Public forms]** Optimize the performance of date components in public forms ([#7117](https://github.com/nocobase/nocobase/pull/7117)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[Workflow]** Fix params of loading record in tasks ([#7123](https://github.com/nocobase/nocobase/pull/7123)) by @mytharcher

- **[WEB client]** Fix issue where blocks under pages were not displayed after setting role menu permissions ([#7112](https://github.com/nocobase/nocobase/pull/7112)) by @aaaaaajie

- **[Workflow: Approval]**
  - Fix applicant variable name in trigger by @mytharcher

  - Fix mobile styles by @mytharcher

  - Fix error thrown when approval related collection deleted by @mytharcher

## [v1.7.17](https://github.com/nocobase/nocobase/compare/v1.7.16...v1.7.17) - 2025-06-23

### 🐛 Bug Fixes

- **[client]**
  - incorrect range limitation on date fields with time ([#7107](https://github.com/nocobase/nocobase/pull/7107)) by @katherinehhh

  - When URL query parameter variables are empty, the data scope conditions are not removed ([#7104](https://github.com/nocobase/nocobase/pull/7104)) by @zhangzhonghe

- **[Mobile]** Fix mobile popup z-index issue ([#7110](https://github.com/nocobase/nocobase/pull/7110)) by @zhangzhonghe

- **[Calendar]** date field issue in quick create form of calendar block ([#7106](https://github.com/nocobase/nocobase/pull/7106)) by @katherinehhh

## [v1.7.16](https://github.com/nocobase/nocobase/compare/v1.7.15...v1.7.16) - 2025-06-19

### 🐛 Bug Fixes

- **[Workflow]**
  - Fix incorrectly executed checking on big integer number ([#7099](https://github.com/nocobase/nocobase/pull/7099)) by @mytharcher

  - Fix stats cascade deleted by non-current workflow version ([#7103](https://github.com/nocobase/nocobase/pull/7103)) by @mytharcher

- **[Action: Import records]** Resolve login failure issue after batch import of usernames and passwords ([#7076](https://github.com/nocobase/nocobase/pull/7076)) by @aaaaaajie

- **[Workflow: Approval]** Only participants can view (get) detail of approval by @mytharcher

## [v1.7.15](https://github.com/nocobase/nocobase/compare/v1.7.14...v1.7.15) - 2025-06-18

### 🐛 Bug Fixes

- **[client]**
  - Use independent variable scope for each field ([#7012](https://github.com/nocobase/nocobase/pull/7012)) by @mytharcher

  - Assign field values: Unable to clear data for relation fields ([#7086](https://github.com/nocobase/nocobase/pull/7086)) by @zhangzhonghe

  - Table column text alignment function is not working ([#7094](https://github.com/nocobase/nocobase/pull/7094)) by @zhangzhonghe

- **[Workflow]** Fix incorrectly executed checking on big integer number ([#7091](https://github.com/nocobase/nocobase/pull/7091)) by @mytharcher

- **[File manager]** Fix attachments field can not be updated in approval process ([#7093](https://github.com/nocobase/nocobase/pull/7093)) by @mytharcher

- **[Workflow: Approval]** Use comparison instead of implicit logic to avoid type issues by @mytharcher

## [v1.7.14](https://github.com/nocobase/nocobase/compare/v1.7.13...v1.7.14) - 2025-06-17

### 🚀 Improvements

- **[client]** Auto-hide grid card block action bar when empty ([#7069](https://github.com/nocobase/nocobase/pull/7069)) by @zhangzhonghe

- **[Verification]** Remove verifier options from the response of the `verifiers:listByUser` API ([#7090](https://github.com/nocobase/nocobase/pull/7090)) by @2013xile

### 🐛 Bug Fixes

- **[database]** support association updates in updateOrCreate and firstOrCreate ([#7088](https://github.com/nocobase/nocobase/pull/7088)) by @chenos

- **[client]**
  - URL query parameter variables not working in public form field default value ([#7084](https://github.com/nocobase/nocobase/pull/7084)) by @katherinehhh

  - style condition on subtable column fields not applied correctly ([#7083](https://github.com/nocobase/nocobase/pull/7083)) by @katherinehhh

  - Filtering through relationship collection fields in filter forms is invalid ([#7070](https://github.com/nocobase/nocobase/pull/7070)) by @zhangzhonghe

- **[Collection field: Many to many (array)]** Updating a many to many (array) field throws an error when the `updatedBy` field is present ([#7089](https://github.com/nocobase/nocobase/pull/7089)) by @2013xile

- **[Public forms]** Public forms: Fix unauthorized access issue on form submission ([#7085](https://github.com/nocobase/nocobase/pull/7085)) by @zhangzhonghe

## [v1.7.13](https://github.com/nocobase/nocobase/compare/v1.7.12...v1.7.13) - 2025-06-17

### 🚀 Improvements

- **[client]** Logo container width adapts to content type (fixed 168px for images, auto width for text) ([#7075](https://github.com/nocobase/nocobase/pull/7075)) by @Cyx649312038

- **[Workflow: Approval]** Add extra field option for re-assignees list by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - required validation message in subtable persists when switching page ([#7080](https://github.com/nocobase/nocobase/pull/7080)) by @katherinehhh

  - decimal point lost after switching amount component from mask to inputNumer ([#7077](https://github.com/nocobase/nocobase/pull/7077)) by @katherinehhh

  - incorrect Markdown (Vditor) rendering in subtable ([#7074](https://github.com/nocobase/nocobase/pull/7074)) by @katherinehhh

- **[Collection field: Sequence]** Fix string based bigint sequence calculation ([#7079](https://github.com/nocobase/nocobase/pull/7079)) by @mytharcher

- **[Backup manager]** unknow command error when restoring MySQL backups on windows platform by @gchust

## [v1.7.12](https://github.com/nocobase/nocobase/compare/v1.7.11...v1.7.12) - 2025-06-16

### 🚀 Improvements

- **[client]** add "empty" and "not empty" options to checkbox field linkage rules ([#7073](https://github.com/nocobase/nocobase/pull/7073)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]** After creating the reverse relation field, the option "Create reverse relation field in the target data table" in the association field settings was not checked. ([#6914](https://github.com/nocobase/nocobase/pull/6914)) by @aaaaaajie

- **[Data source manager]** Scope changes now take effect immediately for all related roles. ([#7065](https://github.com/nocobase/nocobase/pull/7065)) by @aaaaaajie

- **[Access control]** Fixed an issue where the app blocked entry when no default role existed ([#7059](https://github.com/nocobase/nocobase/pull/7059)) by @aaaaaajie

- **[Workflow: Custom action event]** Fix variable of redirect url not parsed by @mytharcher

## [v1.7.11](https://github.com/nocobase/nocobase/compare/v1.7.10...v1.7.11) - 2025-06-15

### 🎉 New Features

- **[Text copy]** Support one-click copying of text field content ([#6954](https://github.com/nocobase/nocobase/pull/6954)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - association field selector does not clear selected data after submission ([#7067](https://github.com/nocobase/nocobase/pull/7067)) by @katherinehhh

  - Fix upload size hint ([#7057](https://github.com/nocobase/nocobase/pull/7057)) by @mytharcher

- **[server]** Cannot read properties of undefined (reading 'setMaaintainingMessage') ([#7064](https://github.com/nocobase/nocobase/pull/7064)) by @chenos

- **[Workflow: Loop node]** Fix loop branch runs when condition not satisfied ([#7063](https://github.com/nocobase/nocobase/pull/7063)) by @mytharcher

- **[Workflow: Approval]**
  - Fix todo stats not updated when execution canceled by @mytharcher

  - Fix trigger variable when filter by type by @mytharcher

## [v1.7.10](https://github.com/nocobase/nocobase/compare/v1.7.9...v1.7.10) - 2025-06-12

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where linkage rules cause infinite loop ([#7050](https://github.com/nocobase/nocobase/pull/7050)) by @zhangzhonghe

  - Fix: use optional chaining to safely reject requests in APIClient when handler may be undefined ([#7054](https://github.com/nocobase/nocobase/pull/7054)) by @sheldon66

  - auto-closing issue when configuring fields in the secondary popup form ([#7052](https://github.com/nocobase/nocobase/pull/7052)) by @katherinehhh

- **[Data visualization]** incorrect display of between date field in chart filter ([#7051](https://github.com/nocobase/nocobase/pull/7051)) by @katherinehhh

- **[API documentation]** non-NocoBase official plugins fail to display API documentation ([#7045](https://github.com/nocobase/nocobase/pull/7045)) by @chenzhizdt

- **[Action: Import records]** Fixed xlsx import to restrict textarea fields from accepting non-string formatted data ([#7049](https://github.com/nocobase/nocobase/pull/7049)) by @aaaaaajie

## [v1.7.9](https://github.com/nocobase/nocobase/compare/v1.7.8...v1.7.9) - 2025-06-11

### 🐛 Bug Fixes

- **[client]** Fix block error issues ([#7048](https://github.com/nocobase/nocobase/pull/7048)) by @gchust

## [v1.7.8](https://github.com/nocobase/nocobase/compare/v1.7.6...v1.7.8) - 2025-06-10

### 🎉 New Features

- **[Audit logs]** Add the environment variable `AUDIT_LOGGER_TRANSPORT` to control the audit log output method by @2013xile

### 🚀 Improvements

- **[Calendar]** support setting week start day in calendar block ([#7032](https://github.com/nocobase/nocobase/pull/7032)) by @katherinehhh

- **[Collection field: Many to many (array)]** Permission-related errors when displaying many-to-many(many) fields in ​data tables. ([#7028](https://github.com/nocobase/nocobase/pull/7028)) by @aaaaaajie

### 🐛 Bug Fixes

- **[client]**
  - auto-closing issue when configuring fields in the secondary popup form ([#7042](https://github.com/nocobase/nocobase/pull/7042)) by @katherinehhh

  - select field options not working in filter form linkage rules ([#7035](https://github.com/nocobase/nocobase/pull/7035)) by @katherinehhh

  - Filter form validation rules cause the filter button to become ineffective ([#6975](https://github.com/nocobase/nocobase/pull/6975)) by @zhangzhonghe

  - Fix fields not displaying in block templates caused by duplicate API requests ([#6985](https://github.com/nocobase/nocobase/pull/6985)) by @zhangzhonghe

- **[Action: Import records]** Fix child table import failurewhen relational fields are involved ([#7039](https://github.com/nocobase/nocobase/pull/7039)) by @aaaaaajie

- **[Data visualization]** Checkbox group fields in charts should display labels instead of raw values ([#7033](https://github.com/nocobase/nocobase/pull/7033)) by @2013xile

- **[Workflow]** Fix error thrown in manual execute action when trigger not configured correctly ([#7036](https://github.com/nocobase/nocobase/pull/7036)) by @mytharcher

- **[Workflow: Approval]**
  - To avoid undefined field error by @mytharcher

  - Fix API error when refresh detail page by @mytharcher

- **[WeCom]** Add check for callback path in gateway middleware by @2013xile

## [v1.7.6](https://github.com/nocobase/nocobase/compare/v1.7.5...v1.7.6) - 2025-06-09

### 🚀 Improvements

- **[client]** Prohibit moving a group menu into itself ([#7005](https://github.com/nocobase/nocobase/pull/7005)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - Resolved an issue where block failed to read view data from external data sources. ([#7017](https://github.com/nocobase/nocobase/pull/7017)) by @aaaaaajie

  - Fix the filter block parameter error issue ([#6966](https://github.com/nocobase/nocobase/pull/6966)) by @zhangzhonghe

  - Current object variable is invalid in linkage rules ([#7008](https://github.com/nocobase/nocobase/pull/7008)) by @zhangzhonghe

  - Unable to clear the required field indicator of sub-table using linkage rules ([#7022](https://github.com/nocobase/nocobase/pull/7022)) by @zhangzhonghe

- **[undefined]** Remove database dependency for possibleTypes, enforce API-driven configuration by @aaaaaajie

- **[Mobile]** Optimize mobile popup lag issues ([#7029](https://github.com/nocobase/nocobase/pull/7029)) by @zhangzhonghe

- **[Data source manager]** Remove database dependency for possibleTypes, enforce API-driven configuration ([#7019](https://github.com/nocobase/nocobase/pull/7019)) by @aaaaaajie

- **[Action: Import records]** Fixed errors occurring during batch editing when importing XLSX tree table data ([#7013](https://github.com/nocobase/nocobase/pull/7013)) by @aaaaaajie

- **[Workflow]** Fix UI error when workflow not exists ([#7023](https://github.com/nocobase/nocobase/pull/7023)) by @mytharcher

- **[Workflow: JavaScript]** Fix require for relative path by @mytharcher

- **[Workflow: Approval]**
  - Fix error thrown when workflow deleted by @mytharcher

  - Reload file association from snapshot to avoid URL expires by @mytharcher

  - Fix trigger variables by @mytharcher

## [v1.7.5](https://github.com/nocobase/nocobase/compare/v1.7.4...v1.7.5) - 2025-06-07

### 🐛 Bug Fixes

- **[client]** Use independent variable scope for each field ([#7012](https://github.com/nocobase/nocobase/pull/7012)) by @mytharcher

- **[database]** fix: add missing creator and updater fields in import xlsx ([#7011](https://github.com/nocobase/nocobase/pull/7011)) by @aaaaaajie

- **[Workflow]** Fix collection event on create or update mode not triggering when create without changed field ([#7015](https://github.com/nocobase/nocobase/pull/7015)) by @mytharcher

- **[Action: Export records Pro]** Fix the error that occurs when exporting attachments with conditions. by @aaaaaajie

## [v1.7.4](https://github.com/nocobase/nocobase/compare/v1.7.3...v1.7.4) - 2025-06-06

### 🐛 Bug Fixes

- **[client]**
  - Association fields shows sub-table and sub-form on hover in read-pretty mode ([#7002](https://github.com/nocobase/nocobase/pull/7002)) by @zhangzhonghe

  - markdown block linkage rules not working when triggered by popup action ([#7007](https://github.com/nocobase/nocobase/pull/7007)) by @katherinehhh

- **[Localization]** Resolve error caused by empty texts ([#7010](https://github.com/nocobase/nocobase/pull/7010)) by @2013xile

- **[Async task manager]** Fixed multiple execution issue during async import ([#7006](https://github.com/nocobase/nocobase/pull/7006)) by @aaaaaajie

- **[Action: Export records Pro]** Fixed multiple execution issue during async import by @aaaaaajie

- **[Workflow: Approval]** Fix delegated approval can not continue when approved by others by @mytharcher

## [v1.7.3](https://github.com/nocobase/nocobase/compare/v1.7.2...v1.7.3) - 2025-06-06

### 🚀 Improvements

- **[Workflow]** Support to filter more fields of workflow ([#6995](https://github.com/nocobase/nocobase/pull/6995)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - switching page in subtable of detail block within modal triggers unsaved changes warning ([#7004](https://github.com/nocobase/nocobase/pull/7004)) by @katherinehhh

  - missing field title when setting a variable in the assignment component ([#7001](https://github.com/nocobase/nocobase/pull/7001)) by @katherinehhh

  - field style linkage rules not working ([#7003](https://github.com/nocobase/nocobase/pull/7003)) by @katherinehhh

## [v1.7.2](https://github.com/nocobase/nocobase/compare/v1.7.1...v1.7.2) - 2025-06-05

### 🚀 Improvements

- **[Action: Batch edit]** Use `filterByTk` instead of `filter` under selected mode ([#6994](https://github.com/nocobase/nocobase/pull/6994)) by @mytharcher

- **[Action: Import records Pro]** Optimze performance issues when processing large XLSX files (high-row/column datasets), preventing system crashes or freezes. by @aaaaaajie

### 🐛 Bug Fixes

- **[client]**
  - missing field title in assignedField component ([#6987](https://github.com/nocobase/nocobase/pull/6987)) by @katherinehhh

  - The last menu item cannot be selected in the move menu list ([#6997](https://github.com/nocobase/nocobase/pull/6997)) by @zhangzhonghe

- **[Workflow]**
  - Fix filter not updated when switching categories tabs ([#6989](https://github.com/nocobase/nocobase/pull/6989)) by @mytharcher

  - Fix workflow stats not auto created ([#6993](https://github.com/nocobase/nocobase/pull/6993)) by @mytharcher

## [v1.7.1](https://github.com/nocobase/nocobase/compare/v1.7.0...v1.7.1) - 2025-06-04

### 🎉 New Features

- **[Data visualization]** Support multiplication and division in chart transformation configuration ([#6788](https://github.com/nocobase/nocobase/pull/6788)) by @bugstark

### 🚀 Improvements

- **[Public forms]** Support to use url parameter as variable ([#6973](https://github.com/nocobase/nocobase/pull/6973)) by @mytharcher

### 🐛 Bug Fixes

- **[client]** Fix fields not displaying in block templates caused by duplicate API requests ([#6957](https://github.com/nocobase/nocobase/pull/6957)) by @zhangzhonghe

- **[Workflow: Manual node]** Fix initializer throws error when using external datasource ([#6983](https://github.com/nocobase/nocobase/pull/6983)) by @mytharcher

## [v1.7.0](https://github.com/nocobase/nocobase/compare/v1.6.38...v1.7.0) - 2025-06-03

## New Feature

### Role Union

Role Union is a permission management mode. According to system settings, system developers can choose to use `Independent roles`, `Allow roles union`, or `Allow roles union`, to meet different permission requirements.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

Reference: [Role Union](https://docs.nocobase.com/handbook/acl/manual)

### Verification and Two-Factor Authentication (2FA)

The original verification code feature has been upgraded to a comprehensive verification management system, supporting multiple authentication methods (such as TOTP). The system also supports two-factor authentication (2FA), which requires an additional verification step during login, on top of the password, significantly enhancing account security.

![20250603133219_rec_-vg5hh3.gif](https://static-docs.nocobase.com/20250603133219_rec_-vg5hh3.gif)

Reference:

* [Verification](https://docs.nocobase.com/handbook/verification)
* [Two-Factor Authentication](https://docs.nocobase.com/handbook/two-factor-authentication)
* [TOTP Authenticator](https://docs.nocobase.com/handbook/verification-totp-authenticator)

### Template Printing

Template printing now supports dynamic image and barcode rendering.

![](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

Reference: [Template Printing](https://docs-cn.nocobase.com/handbook/action-template-print#%E5%9C%A8-docx-%E6%96%87%E4%BB%B6%E4%B8%AD%E6%8F%92%E5%85%A5%E5%8A%A8%E6%80%81%E5%9B%BE%E7%89%87)

### Multiple Keyword Filter

The multi-keyword filter plugin adds powerful text filtering capabilities to the NocoBase platform, enabling you to filter data using multiple keywords and greatly enhancing the flexibility and efficiency of data queries.

![20250603152726_rec_-ix3j8w.gif](https://static-docs.nocobase.com/20250603152726_rec_-ix3j8w.gif)

Reference: [Multiple keyword filter](https://docs.nocobase.com/handbook/multi-keyword-filter)

### Date Filter Supports Relative Date Range Selection

Supports filtering by custom time offsets (days/weeks/months/quarters/years) and specific dates, enabling more flexible time range queries.

![20250603130948_rec_-plwa6o.gif](https://static-docs.nocobase.com/20250603130948_rec_-plwa6o.gif)

### Left-side Variables

The left-side variables in a condition are used to define the "object being judged" in the linkage rule, i.e., the condition will evaluate this variable’s value to determine whether the linkage behavior should be triggered.

![20250417214217](https://static-docs.nocobase.com/20250417214217.png)

Reference: [Left-side Variables](https://docs.nocobase.com/handbook/ui/linkage-rule#left-side-variables)

### Inherited Template

Inherited templates are ideal when you want blocks to follow a template’s basic updates but also allow specific changes. Blocks inherit the template’s settings and can extend or override them. Settings not changed in the block will update automatically with the template.

![主界面](https://static-docs.nocobase.com/main-screen-block-templates.png)

Reference: [Inherited Template](https://docs.nocobase.com/handbook/block-template#inherited-template)

### Block Linkage Rules

Block linkage rules allow users to dynamically control the visibility of blocks, enabling the management of element display at the block level.

![image-ccerr7.png](https://static-docs.nocobase.com/image-ccerr7.png)

Reference: [Block Linkage Rules](https://docs.nocobase.com/handbook/ui/blocks/block-settings/block-linkage-rule)

### After Successful Submission

After successful submission, supports refreshing data in other blocks and navigating to detail pages with parameters.

![image-v29vlv.png](https://static-docs.nocobase.com/image-v29vlv.png)

Reference: [After Successful Submission](https://docs.nocobase.com/handbook/ui/actions/action-settings/affter-successful)

### Workflow Category Management

![1-62ogb6.png](https://static-docs.nocobase.com/1-62ogb6.png)

### Open Source Plugins For Department And Attachment URL

![image-br8u55.png](https://static-docs.nocobase.com/image-br8u55.png)

## Improvements

### Linkage Rule Property Enhancements

* Selectable fields now support configurable options
* Date fields now support setting a date range

![20250603143237_rec_-k8hene.gif](https://static-docs.nocobase.com/20250603143237_rec_-k8hene.gif)

Reference: [Field Linkage Rules](https://docs.nocobase.com/handbook/ui/blocks/block-settings/field-linkage-rule)

### Import Pro

Import configuration now supports using multiple fields to uniquely identify records, as well as options to either overwrite or ignore blank cells during import.

![20250603153457_rec_-9zfsfx.gif](https://static-docs.nocobase.com/20250603153457_rec_-9zfsfx.gif)

Reference:[Import Pro](https://docs.nocobase.com/handbook/action-import-pro)

### Performance Optimization For Exporting XLSX

* Memory overflow and application freezing when exporting large data tables
* There is a probability of duplicate data in the exported data
* Query optimization for exported data based on indexes, unique constraints, and index strategies
* Add an export concurrent queue and set the concurrency number through environment variables.

![20250505171706](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250505171706.png)

Reference:

* [Concurrent Exports](https://docs.nocobase.com/handbook/action-export-pro#concurrent-exports)
* [About Performance](https://docs.nocobase.com/handbook/action-export-pro#about-performance)

### Performance Optimization For Importing XLSX Files

* Change the original single - row import strategy to batch insertion
* Reconstruct the duplicate identification mechanism. Change from single - row processing to batch processing while keeping the update logic and triggering workflow unchanged

Reference: [About Performance](https://docs.nocobase.com/handbook/action-import-pro#about-performance)

### Workflow Execution Efficiency Improved By 100%

![image-ligrnm.png](https://static-docs.nocobase.com/image-ligrnm.png)

## [v1.6.38](https://github.com/nocobase/nocobase/compare/v1.6.37...v1.6.38) - 2025-06-03

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where blocks created in popups have incorrect collection ([#6961](https://github.com/nocobase/nocobase/pull/6961)) by @zhangzhonghe

  - Fix issue where filter form default values are invalid in sub-pages ([#6960](https://github.com/nocobase/nocobase/pull/6960)) by @zhangzhonghe

  - unable to expand association collection fields from external data sources in role data table scope ([#6958](https://github.com/nocobase/nocobase/pull/6958)) by @katherinehhh

  - Fix the issue where the 'Ellipsis overflow content' option is ineffective for relation fields ([#6967](https://github.com/nocobase/nocobase/pull/6967)) by @zhangzhonghe

  - Fix the issue where single-line text field values are displayed as an array in esay-reading mode ([#6968](https://github.com/nocobase/nocobase/pull/6968)) by @zhangzhonghe

- **[Authentication]** Performance issue caused by expired token cleanup ([#6981](https://github.com/nocobase/nocobase/pull/6981)) by @2013xile

- **[File manager]** Fix Ali-OSS timeout configuration ([#6970](https://github.com/nocobase/nocobase/pull/6970)) by @mytharcher

- **[Workflow: Custom action event]** Fix initializer for workbench missed by @mytharcher

- **[Auth: OIDC]** Sign-in button text not being localized by @2013xile

## [v1.6.37](https://github.com/nocobase/nocobase/compare/v1.6.36...v1.6.37) - 2025-05-30

### 🐛 Bug Fixes

- **[client]**
  - Fix the field order in filter button dropdown list ([#6962](https://github.com/nocobase/nocobase/pull/6962)) by @zhangzhonghe

  - subtable linkage variable fetches association data on clear instead of using form value ([#6963](https://github.com/nocobase/nocobase/pull/6963)) by @katherinehhh

  - association field in subtable triggering request when iteration variable with empty value ([#6969](https://github.com/nocobase/nocobase/pull/6969)) by @katherinehhh

- **[Theme editor]** Hide theme switch option and fix popup style ([#6964](https://github.com/nocobase/nocobase/pull/6964)) by @zhangzhonghe

- **[Workflow: Approval]** Fix error when assignees scope querying with association condition by @mytharcher

## [v1.6.36](https://github.com/nocobase/nocobase/compare/v1.6.35...v1.6.36) - 2025-05-29

### 🚀 Improvements

- **[Auth: OIDC]** Ignore case when matching user by email by @2013xile

## [v1.6.35](https://github.com/nocobase/nocobase/compare/v1.6.34...v1.6.35) - 2025-05-29

### 🎉 New Features

- **[undefined]**
  - Add new "Input Copy Button" plugin for single-line text fields ([#6894](https://github.com/nocobase/nocobase/pull/6894)) by @kerwin612

  - Add new "Input Copy Button" plugin for single-line text fields ([#6894](https://github.com/nocobase/nocobase/pull/6894)) by @kerwin612

  - New support for Gitpod allows you to start the development environment with one click and quickly begin development. ([#6922](https://github.com/nocobase/nocobase/pull/6922)) by @kerwin612

### 🚀 Improvements

- **[client]**
  - Fix issue where hidden form controls captured tab key, significantly improving form operation efficiency ([#6942](https://github.com/nocobase/nocobase/pull/6942)) by @kerwin612

  - support configuring whether menu links open in a new window ([#6918](https://github.com/nocobase/nocobase/pull/6918)) by @katherinehhh

  - validate required fields before showing confirmation dialog ([#6931](https://github.com/nocobase/nocobase/pull/6931)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]**
  - paginate association field dropdown data with page size of 200 ([#6950](https://github.com/nocobase/nocobase/pull/6950)) by @katherinehhh

  - Incorrect highlight position when dragging table rows ([#6952](https://github.com/nocobase/nocobase/pull/6952)) by @chenos

  - Block resize by dragging not working ([#6944](https://github.com/nocobase/nocobase/pull/6944)) by @chenos

  - field assignment component i18n not working ([#6945](https://github.com/nocobase/nocobase/pull/6945)) by @katherinehhh

  - Fix the issue with the copy button in the error pop-up copying out as [object Object]. ([#6908](https://github.com/nocobase/nocobase/pull/6908)) by @kerwin612

- **[Collection field: Markdown(Vditor)]** markdown-vditor field  component width issue after zoom in and out ([#6946](https://github.com/nocobase/nocobase/pull/6946)) by @katherinehhh

- **[Workflow: Approval]** Fix locale by @mytharcher

## [v1.6.34](https://github.com/nocobase/nocobase/compare/v1.6.33...v1.6.34) - 2025-05-27

### 🎉 New Features

- **[Action: Import records Pro]**
  - Support defining unique records by multiple fields when importing settings by @aaaaaajie

  - Supports settings for overwriting blank cells and ignore them when importing settings by @aaaaaajie

### 🚀 Improvements

- **[undefined]** Upgrade Node version to 20 for CI ([#6927](https://github.com/nocobase/nocobase/pull/6927)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - noneOf condition check failed in linkage rules ([#6934](https://github.com/nocobase/nocobase/pull/6934)) by @katherinehhh

  - block height setting not applied in real time ([#6904](https://github.com/nocobase/nocobase/pull/6904)) by @katherinehhh

- **[undefined]** Use Node 20 due to commander package requires ([#6924](https://github.com/nocobase/nocobase/pull/6924)) by @mytharcher

- **[database]** Fixed uuid or nanoid auto-generation not working in many-to-many association ([#6912](https://github.com/nocobase/nocobase/pull/6912)) by @aaaaaajie

- **[Action: Export records]** Fixed an issue where nested relationships failed to export correctly. ([#6917](https://github.com/nocobase/nocobase/pull/6917)) by @aaaaaajie

- **[Data source manager]** Resolve issue with drag-and-drop sorting not working ([#6937](https://github.com/nocobase/nocobase/pull/6937)) by @chenos

- **[API documentation]** Add missing sub-app info to req.headers ([#6933](https://github.com/nocobase/nocobase/pull/6933)) by @chenos

- **[Notification: In-app message]** Resolved an issue where the "mark all as read" action in in-app messages could affect other users' data. ([#6926](https://github.com/nocobase/nocobase/pull/6926)) by @sheldon66

- **[Workflow: Custom action event]** Avoid plugin load order caused error by @mytharcher

- **[File storage: S3(Pro)]**
  - Fix preview url and upload parameter by @mytharcher

  - Fix duplicated upload parameters by @mytharcher

- **[Block: Multi-step form]** Fix types by @mytharcher

- **[Workflow: Approval]**
  - Fix incorrect record id for ViewAction by @mytharcher

  - Fix appends and data calculation before submit approval process by @mytharcher

## [v1.6.33](https://github.com/nocobase/nocobase/compare/v1.6.32...v1.6.33) - 2025-05-23

### 🚀 Improvements

- **[undefined]** Build the full docker image ([#6898](https://github.com/nocobase/nocobase/pull/6898)) by @chenos

- **[client]** Optimize the issue of pages becoming increasingly slow with use ([#6888](https://github.com/nocobase/nocobase/pull/6888)) by @zhangzhonghe

- **[Calendar]** support configurable refresh button in calendar block ([#6920](https://github.com/nocobase/nocobase/pull/6920)) by @katherinehhh

- **[Workflow: Custom action event]** Fix en-US locales based on zh-CN keys by @mytharcher

- **[Workflow: Approval]** Support to do all todos in workflow tasks center by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - rendering error caused by invalid style format when adding association field ([#6903](https://github.com/nocobase/nocobase/pull/6903)) by @katherinehhh

  - incorrect empty value check for toMany association field in linkage rule ([#6905](https://github.com/nocobase/nocobase/pull/6905)) by @katherinehhh

- **[Collection field: Markdown(Vditor)]** markdown (Vditor) field not adapting to theme ([#6919](https://github.com/nocobase/nocobase/pull/6919)) by @katherinehhh

- **[Collection: Tree]** Avoid incorrect updates to similar path prefixes during path updates ([#6913](https://github.com/nocobase/nocobase/pull/6913)) by @2013xile

- **[File manager]**
  - Fix preview match rule ([#6902](https://github.com/nocobase/nocobase/pull/6902)) by @mytharcher

  - Fix client collection injection and upload parameter ([#6909](https://github.com/nocobase/nocobase/pull/6909)) by @mytharcher

  - Fix preview URL on non-image files ([#6889](https://github.com/nocobase/nocobase/pull/6889)) by @mytharcher

- **[Workflow: mailer node]** Handle undefined 'to' field and improve email recipient processing. ([#6915](https://github.com/nocobase/nocobase/pull/6915)) by @sheldon66

- **[Workflow: Custom action event]**
  - Fix button perform incorrectly after a few clicks by @mytharcher

  - Fix error handler can not be matched by class by @mytharcher

- **[Workflow: Approval]** Fix association appends calculation by @mytharcher

## [v1.6.32](https://github.com/nocobase/nocobase/compare/v1.6.31...v1.6.32) - 2025-05-20

### 🐛 Bug Fixes

- **[client]**
  - page not redirected correctly after deleting last item ([#6892](https://github.com/nocobase/nocobase/pull/6892)) by @katherinehhh

  - cascade component in modal not loading association data initially ([#6886](https://github.com/nocobase/nocobase/pull/6886)) by @katherinehhh

## [v1.6.31](https://github.com/nocobase/nocobase/compare/v1.6.30...v1.6.31) - 2025-05-18

### 🚀 Improvements

- **[Workflow]** Add all missed en-US locale keys ([#6885](https://github.com/nocobase/nocobase/pull/6885)) by @mytharcher

### 🐛 Bug Fixes

- **[database]** handle empty string cells during field import to prevent errors ([#6880](https://github.com/nocobase/nocobase/pull/6880)) by @aaaaaajie

- **[client]**
  - association select record table did not filter already associate record ([#6874](https://github.com/nocobase/nocobase/pull/6874)) by @katherinehhh

  - association data not submitted when exposing association fields  in subForm ([#6883](https://github.com/nocobase/nocobase/pull/6883)) by @katherinehhh

  - draggable sort fields not displaying available options correctly ([#6875](https://github.com/nocobase/nocobase/pull/6875)) by @katherinehhh

- **[Workflow]** Fix stack limit works incorrectly for collection event ([#6876](https://github.com/nocobase/nocobase/pull/6876)) by @mytharcher

- **[Block: Action panel]** Read the route basename from the scanner to adapt for the desktop environment. ([#6877](https://github.com/nocobase/nocobase/pull/6877)) by @sheldon66

- **[Workflow: Manual node]** Fix render error when show unprocessed item ([#6879](https://github.com/nocobase/nocobase/pull/6879)) by @mytharcher

- **[Workflow: Approval]** Fix assignees scope of delegate and add to other assignees by @mytharcher

## [v1.6.30](https://github.com/nocobase/nocobase/compare/v1.6.29...v1.6.30) - 2025-05-15

### 🚀 Improvements

- **[client]** add more built-in size settings for read status image ([#6868](https://github.com/nocobase/nocobase/pull/6868)) by @katherinehhh

### 🐛 Bug Fixes

- **[File manager]**
  - Fix types ([#6873](https://github.com/nocobase/nocobase/pull/6873)) by @mytharcher

  - Fix create file record without foreign key permission ([#6863](https://github.com/nocobase/nocobase/pull/6863)) by @mytharcher

- **[Action: Export records]** improve performance when deleting fields in import/export field settings ([#6861](https://github.com/nocobase/nocobase/pull/6861)) by @katherinehhh

- **[Data visualization]** Chart blocks do not display when added to popups triggered from block-level actions ([#6864](https://github.com/nocobase/nocobase/pull/6864)) by @2013xile

- **[Action: Export records Pro]** improve performance when deleting fields in import/export pro field settings by @katherinehhh

- **[File storage: S3(Pro)]** Change to use collection field to locate storage by @mytharcher

- **[Backup manager]** Fix type error in build by @mytharcher

## [v1.6.29](https://github.com/nocobase/nocobase/compare/v1.6.28...v1.6.29) - 2025-05-13

### 🚀 Improvements

- **[Workflow]** Allow to revision more than one draft ([#6851](https://github.com/nocobase/nocobase/pull/6851)) by @mytharcher

### 🐛 Bug Fixes

- **[Action: Export records]** Fixed   exporting empty values in nested associations and attachment url ([#6845](https://github.com/nocobase/nocobase/pull/6845)) by @aaaaaajie

- **[Workflow: Manual node]** Fix stats number count wrong on tasks ([#6783](https://github.com/nocobase/nocobase/pull/6783)) by @mytharcher

- **[Workflow: test kit]** Fix failed test cases due to required preset plugin ([#6839](https://github.com/nocobase/nocobase/pull/6839)) by @mytharcher

- **[Data visualization]** Fix error when filtering nested m2m fields ([#6855](https://github.com/nocobase/nocobase/pull/6855)) by @2013xile

- **[Workflow: Subflow]** Fix undefined trigger caused page crash by @mytharcher

- **[File storage: S3(Pro)]** access url expiration invalid by @jiannx

- **[Workflow: Approval]** Fix stats number count wrong on tasks by @mytharcher

## [v1.6.28](https://github.com/nocobase/nocobase/compare/v1.6.27...v1.6.28) - 2025-05-09

### 🐛 Bug Fixes

- **[database]** Import failed due to text field values. ([#6699](https://github.com/nocobase/nocobase/pull/6699)) by @aaaaaajie

- **[client]** The hidden fields are still displayed ([#6844](https://github.com/nocobase/nocobase/pull/6844)) by @zhangzhonghe

- **[Action: Export records]** Fix the error of exporting long texts. ([#6713](https://github.com/nocobase/nocobase/pull/6713)) by @aaaaaajie

- **[Workflow: Post-action event]** Fix user acted variable not accessible in Hanldebars template ([#6837](https://github.com/nocobase/nocobase/pull/6837)) by @mytharcher

- **[Block: Action panel]** The color of the Action panel is incorrect in dark mode ([#6842](https://github.com/nocobase/nocobase/pull/6842)) by @zhangzhonghe

- **[Action: Export records Pro]** Fix the error of exporting long texts. by @aaaaaajie

## [v1.6.27](https://github.com/nocobase/nocobase/compare/v1.6.26...v1.6.27) - 2025-05-08

### 🐛 Bug Fixes

- **[client]**
  - unable to drag other buttons onto the duplicate button ([#6822](https://github.com/nocobase/nocobase/pull/6822)) by @katherinehhh

  - multiple association field failed to submit when showing fields from association collection ([#6833](https://github.com/nocobase/nocobase/pull/6833)) by @katherinehhh

## [v1.6.26](https://github.com/nocobase/nocobase/compare/v1.6.25...v1.6.26) - 2025-05-07

### 🎉 New Features

- **[Block: iframe]** Iframe block supports configuring the allow attribute ([#6824](https://github.com/nocobase/nocobase/pull/6824)) by @zhangzhonghe

- **[Template print]** Feature: Support `{ label, value }` Select options in template printing. by @sheldon66

### 🐛 Bug Fixes

- **[client]**
  - In nested subpages, the block list is not displayed when hovering the mouse over the "Add block" button ([#6832](https://github.com/nocobase/nocobase/pull/6832)) by @zhangzhonghe

  - When the relation field component of the filter form is changed to a data selector, there is no "Allow multiple selection" configuration item ([#6656](https://github.com/nocobase/nocobase/pull/6656)) by @zhangzhonghe

  - multiple error messages displayed when validation rule is violated in form fields ([#6805](https://github.com/nocobase/nocobase/pull/6805)) by @katherinehhh

  - issue with configuring linkage rules in subform (popup) within subtable ([#6803](https://github.com/nocobase/nocobase/pull/6803)) by @katherinehhh

  - Fix the issue where one-to-many field sub-fields cannot be selected as filtering options in filter forms ([#6809](https://github.com/nocobase/nocobase/pull/6809)) by @zhangzhonghe

  - subtable pagination bar style issue in read-only mode ([#6830](https://github.com/nocobase/nocobase/pull/6830)) by @katherinehhh

  - Table selector in the filter form, abnormal style ([#6827](https://github.com/nocobase/nocobase/pull/6827)) by @zhangzhonghe

- **[database]**
  - Fix belongs-to association not loaded in appends when foreign key is bigInt under MariaDB ([#6823](https://github.com/nocobase/nocobase/pull/6823)) by @mytharcher

  - Fix test cases ([#6811](https://github.com/nocobase/nocobase/pull/6811)) by @mytharcher

- **[Collection field: Attachment(URL)]** attachment (URL) fields should not allow value configuration in linkage rule ([#6831](https://github.com/nocobase/nocobase/pull/6831)) by @katherinehhh

- **[Workflow: Custom action event]** triggered workflow action linkage issue by @katherinehhh

## [v1.6.25](https://github.com/nocobase/nocobase/compare/v1.6.24...v1.6.25) - 2025-04-29

### 🎉 New Features

- **[undefined]** add publish ci for license kit ([#6786](https://github.com/nocobase/nocobase/pull/6786)) by @jiannx

- **[Data visualization: ECharts]** Add "Y-Axis inverse" setting for bar charts by @2013xile

### 🚀 Improvements

- **[utils]** Increase the height of the filter button field list and sort/categorize the fields ([#6779](https://github.com/nocobase/nocobase/pull/6779)) by @zhangzhonghe

- **[client]** optimize subtable add button style and align paginator on the  same row ([#6790](https://github.com/nocobase/nocobase/pull/6790)) by @katherinehhh

- **[File manager]** Add OSS timeout option default to 10min ([#6795](https://github.com/nocobase/nocobase/pull/6795)) by @mytharcher

- **[Password policy]** Change default password expiration to never expire by @2013xile

- **[WeCom]** Prioritize corporate email over personal email when updating the user's email by @2013xile

### 🐛 Bug Fixes

- **[client]**
  - In the collapse block, clicking the clear button in the relationship field search box should not delete the data range ([#6782](https://github.com/nocobase/nocobase/pull/6782)) by @zhangzhonghe

  - association field not submitting data when displaying field from related collection ([#6798](https://github.com/nocobase/nocobase/pull/6798)) by @katherinehhh

  - Prohibit moving menus before or after page tabs ([#6777](https://github.com/nocobase/nocobase/pull/6777)) by @zhangzhonghe

  - Table block displays duplicate data when filtering ([#6792](https://github.com/nocobase/nocobase/pull/6792)) by @zhangzhonghe

  - In the filter form, switching the field operator and then refreshing the page causes an error ([#6781](https://github.com/nocobase/nocobase/pull/6781)) by @zhangzhonghe

- **[database]**
  - Avoid error thrown when data type is not string ([#6797](https://github.com/nocobase/nocobase/pull/6797)) by @mytharcher

  - add  unavailableActions to sql collection and view collection ([#6765](https://github.com/nocobase/nocobase/pull/6765)) by @katherinehhh

- **[create-nocobase-app]** Temporarily fix mariadb issue by downgrading to 2.5.6 ([#6762](https://github.com/nocobase/nocobase/pull/6762)) by @chenos

- **[Authentication]** Disallow changing authenticator name ([#6808](https://github.com/nocobase/nocobase/pull/6808)) by @2013xile

- **[Template print]** Fix: Correct permission validation logic to prevent unauthorized actions. by @sheldon66

- **[File storage: S3(Pro)]** access url expiration invalid by @jiannx

- **[Block: Tree]** After connecting through a foreign key, clicking to trigger filtering results in empty filter conditions by @zhangzhonghe

## [v1.6.24](https://github.com/nocobase/nocobase/compare/v1.6.23...v1.6.24) - 2025-04-24

### 🚀 Improvements

- **[client]** Adjust upload message ([#6757](https://github.com/nocobase/nocobase/pull/6757)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - only export action in view collection is support  when writableView is false ([#6763](https://github.com/nocobase/nocobase/pull/6763)) by @katherinehhh

  - unexpected  association data creation when displaying association field under sub-form/sub-table in create form ([#6727](https://github.com/nocobase/nocobase/pull/6727)) by @katherinehhh

  - Incorrect data retrieved for many-to-many array fields from related tables in forms ([#6744](https://github.com/nocobase/nocobase/pull/6744)) by @2013xile

## [v1.6.23](https://github.com/nocobase/nocobase/compare/v1.6.22...v1.6.23) - 2025-04-23

### 🚀 Improvements

- **[cli]** Optimize internal logic of the `nocobase upgrade` command ([#6754](https://github.com/nocobase/nocobase/pull/6754)) by @chenos

- **[Template print]** Replaced datasource action control with client role-based access control. by @sheldon66

### 🐛 Bug Fixes

- **[cli]** Auto-update package.json on upgrade ([#6747](https://github.com/nocobase/nocobase/pull/6747)) by @chenos

- **[client]**
  - missing filter for already associated data when adding association data ([#6750](https://github.com/nocobase/nocobase/pull/6750)) by @katherinehhh

  - tree table 'Add Child' button linkage rule missing 'current record' ([#6752](https://github.com/nocobase/nocobase/pull/6752)) by @katherinehhh

- **[Action: Import records]** Fix the import and export exceptions that occur when setting field permissions. ([#6677](https://github.com/nocobase/nocobase/pull/6677)) by @aaaaaajie

- **[Block: Gantt]** gantt chart block overlapping months in calendar header for month view ([#6753](https://github.com/nocobase/nocobase/pull/6753)) by @katherinehhh

- **[Action: Export records Pro]**
  - pro export button losing filter parameters after sorting table column by @katherinehhh

  - Fix the import and export exceptions that occur when setting field permissions. by @aaaaaajie

- **[File storage: S3(Pro)]** Fix response data of uploaded file by @mytharcher

- **[Workflow: Approval]** Fix preload association fields for records by @mytharcher

## [v1.6.22](https://github.com/nocobase/nocobase/compare/v1.6.21...v1.6.22) - 2025-04-22

### 🚀 Improvements

- **[create-nocobase-app]** Upgrade dependencies and remove SQLite support ([#6708](https://github.com/nocobase/nocobase/pull/6708)) by @chenos

- **[File manager]** Expose utils API ([#6705](https://github.com/nocobase/nocobase/pull/6705)) by @mytharcher

- **[Workflow]** Add date types to variable types set ([#6717](https://github.com/nocobase/nocobase/pull/6717)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - The problem of mobile top navigation bar icons being difficult to delete ([#6734](https://github.com/nocobase/nocobase/pull/6734)) by @zhangzhonghe

  - After connecting through a foreign key, clicking to trigger filtering results in empty filter conditions ([#6634](https://github.com/nocobase/nocobase/pull/6634)) by @zhangzhonghe

  - picker switching issue in date field of filter button ([#6695](https://github.com/nocobase/nocobase/pull/6695)) by @katherinehhh

  - The issue of the collapse button in the left menu being obscured by the workflow pop-up window ([#6733](https://github.com/nocobase/nocobase/pull/6733)) by @zhangzhonghe

  - missing action option constraints when reopening linkage rules ([#6723](https://github.com/nocobase/nocobase/pull/6723)) by @katherinehhh

  - export button shown without export permission ([#6689](https://github.com/nocobase/nocobase/pull/6689)) by @katherinehhh

  - Required fields hidden by linkage rules should not affect form submission ([#6709](https://github.com/nocobase/nocobase/pull/6709)) by @zhangzhonghe

- **[server]** appVersion incorrectly generated by create-migration ([#6740](https://github.com/nocobase/nocobase/pull/6740)) by @chenos

- **[build]** Fix error thrown in tar command ([#6722](https://github.com/nocobase/nocobase/pull/6722)) by @mytharcher

- **[Workflow]** Fix error thrown when execute schedule event in subflow ([#6721](https://github.com/nocobase/nocobase/pull/6721)) by @mytharcher

- **[Workflow: Custom action event]** Support to execute in multiple records mode by @mytharcher

- **[File storage: S3(Pro)]** Add multer make logic for server-side upload by @mytharcher

## [v1.6.21](https://github.com/nocobase/nocobase/compare/v1.6.20...v1.6.21) - 2025-04-17

### 🚀 Improvements

- **[client]** Add delay API for scenarios which open without delay ([#6681](https://github.com/nocobase/nocobase/pull/6681)) by @mytharcher

- **[create-nocobase-app]** Upgrade some dependencies to latest versions ([#6673](https://github.com/nocobase/nocobase/pull/6673)) by @chenos

### 🐛 Bug Fixes

- **[client]**
  - Fix error thrown when mouse hover on referenced template block in approval node configuration ([#6691](https://github.com/nocobase/nocobase/pull/6691)) by @mytharcher

  - custom association field not displaying field component  settings ([#6692](https://github.com/nocobase/nocobase/pull/6692)) by @katherinehhh

  - Fix locale for upload component ([#6682](https://github.com/nocobase/nocobase/pull/6682)) by @mytharcher

  - lazy load missing ui component will cause render error ([#6683](https://github.com/nocobase/nocobase/pull/6683)) by @gchust

  - Add native Password component to HoC Input ([#6679](https://github.com/nocobase/nocobase/pull/6679)) by @mytharcher

  - inherited fields shown in current collection  field assignment list ([#6666](https://github.com/nocobase/nocobase/pull/6666)) by @katherinehhh

- **[database]** Fixed ci build error ([#6687](https://github.com/nocobase/nocobase/pull/6687)) by @aaaaaajie

- **[build]** build output is incorrect when plugin depends on some AMD libraries ([#6665](https://github.com/nocobase/nocobase/pull/6665)) by @gchust

- **[Action: Import records]** fixed an error importing xlsx time field ([#6672](https://github.com/nocobase/nocobase/pull/6672)) by @aaaaaajie

- **[Workflow: Manual node]** Fix manual task status constant ([#6676](https://github.com/nocobase/nocobase/pull/6676)) by @mytharcher

- **[Block: iframe]** vertical scrollbar appears when iframe block is set to full height ([#6675](https://github.com/nocobase/nocobase/pull/6675)) by @katherinehhh

- **[Workflow: Custom action event]** Fix test cases by @mytharcher

- **[Backup manager]** timeout error occurs when trying to restore an unecrypted backup with a password by @gchust

## [v1.6.20](https://github.com/nocobase/nocobase/compare/v1.6.19...v1.6.20) - 2025-04-14

### 🎉 New Features

- **[Departments]** Make Department, Attachment URL, and Workflow response message plugins free ([#6663](https://github.com/nocobase/nocobase/pull/6663)) by @chenos

### 🐛 Bug Fixes

- **[client]**
  - The filter form should not display the "Unsaved changes" prompt ([#6657](https://github.com/nocobase/nocobase/pull/6657)) by @zhangzhonghe

  - "allow multiple" option not working for relation field ([#6661](https://github.com/nocobase/nocobase/pull/6661)) by @katherinehhh

  - In the filter form, when the filter button is clicked, if there are fields that have not passed validation, the filtering is still triggered ([#6659](https://github.com/nocobase/nocobase/pull/6659)) by @zhangzhonghe

  - Switching to the group menu should not jump to a page that has already been hidden in menu ([#6654](https://github.com/nocobase/nocobase/pull/6654)) by @zhangzhonghe

- **[File storage: S3(Pro)]**
  - Organize language by @jiannx

  - Individual baseurl and public settings, improve S3 pro storage config UX by @jiannx

- **[Migration manager]** the skip auto backup option becomes invalid if environment variable popup appears during migration by @gchust

## [v1.6.19](https://github.com/nocobase/nocobase/compare/v1.6.18...v1.6.19) - 2025-04-14

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue of preview images being obscured ([#6651](https://github.com/nocobase/nocobase/pull/6651)) by @zhangzhonghe

  - In the form block, the default value of the field configuration will first be displayed as the original variable string and then disappear ([#6649](https://github.com/nocobase/nocobase/pull/6649)) by @zhangzhonghe

## [v1.6.18](https://github.com/nocobase/nocobase/compare/v1.6.17...v1.6.18) - 2025-04-11

### 🚀 Improvements

- **[client]**
  - Add default type fallback API for `Variable.Input` ([#6644](https://github.com/nocobase/nocobase/pull/6644)) by @mytharcher

  - Optimize prompts for unconfigured pages ([#6641](https://github.com/nocobase/nocobase/pull/6641)) by @zhangzhonghe

- **[Workflow: Delay node]** Support to use variable for duration ([#6621](https://github.com/nocobase/nocobase/pull/6621)) by @mytharcher

- **[Workflow: Custom action event]** Add refresh settings for trigger workflow button by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - subtable description overlapping with add new button ([#6646](https://github.com/nocobase/nocobase/pull/6646)) by @katherinehhh

  - dashed underline caused by horizontal form layout in modal ([#6639](https://github.com/nocobase/nocobase/pull/6639)) by @katherinehhh

- **[File storage: S3(Pro)]** Fix missing await for next call. by @jiannx

- **[Email manager]** Fix missing await for next call. by @jiannx

## [v1.6.17](https://github.com/nocobase/nocobase/compare/v1.6.16...v1.6.17) - 2025-04-09

### 🚀 Improvements

- **[utils]** Add duration extension for dayjs ([#6630](https://github.com/nocobase/nocobase/pull/6630)) by @mytharcher

- **[client]**
  - Support to search field in Filter component ([#6627](https://github.com/nocobase/nocobase/pull/6627)) by @mytharcher

  - Add `trim` API for `Input` and `Variable.TextArea` ([#6624](https://github.com/nocobase/nocobase/pull/6624)) by @mytharcher

- **[Error handler]** Support custom title in AppError component. ([#6409](https://github.com/nocobase/nocobase/pull/6409)) by @sheldon66

- **[IP restriction]** Update IP restriction message content. by @sheldon66

- **[File storage: S3(Pro)]** Support global variables in storage configuration by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - rule with 'any' condition does not take effect when condition list is empty ([#6628](https://github.com/nocobase/nocobase/pull/6628)) by @katherinehhh

  - data issue with Gantt block in tree collection ([#6617](https://github.com/nocobase/nocobase/pull/6617)) by @katherinehhh

  - The relationship fields in the filter form report an error after the page is refreshed because x-data-source is not carried ([#6619](https://github.com/nocobase/nocobase/pull/6619)) by @zhangzhonghe

  - variable parse failure when URL parameters contain Chinese characters ([#6618](https://github.com/nocobase/nocobase/pull/6618)) by @katherinehhh

- **[Users]** Issue with parsing the user profile form schema ([#6635](https://github.com/nocobase/nocobase/pull/6635)) by @2013xile

- **[Mobile]** single-select field with 'contains' filter on mobile does not support multiple selection ([#6629](https://github.com/nocobase/nocobase/pull/6629)) by @katherinehhh

- **[Action: Export records]** missing filter params when exporting data after changing pagination ([#6633](https://github.com/nocobase/nocobase/pull/6633)) by @katherinehhh

- **[Email manager]** fix email management permission cannot view email list by @jiannx

- **[File storage: S3(Pro)]** Throw error to user when upload logo to S3 Pro storage (set to default) by @mytharcher

- **[Workflow: Approval]** Fix `updatedAt` changed after migration by @mytharcher

- **[Migration manager]** migration log creation time is displayed incorrectly in some environments by @gchust

## [v1.6.16](https://github.com/nocobase/nocobase/compare/v1.6.15...v1.6.16) - 2025-04-03

### 🐛 Bug Fixes

- **[client]**
  - x-disabled property not taking effect on form fields ([#6610](https://github.com/nocobase/nocobase/pull/6610)) by @katherinehhh

  - field label display issue to prevent truncation by colon ([#6599](https://github.com/nocobase/nocobase/pull/6599)) by @katherinehhh

- **[database]** When deleting one-to-many records, both `filter` and `filterByTk` are passed and `filter` includes an association field, the `filterByTk` is ignored ([#6606](https://github.com/nocobase/nocobase/pull/6606)) by @2013xile

## [v1.6.15](https://github.com/nocobase/nocobase/compare/v1.6.14...v1.6.15) - 2025-04-01

### 🚀 Improvements

- **[database]**
  - Add trim option for text field ([#6603](https://github.com/nocobase/nocobase/pull/6603)) by @mytharcher

  - Add trim option for string field ([#6565](https://github.com/nocobase/nocobase/pull/6565)) by @mytharcher

- **[File manager]** Add trim option for text fields of storages collection ([#6604](https://github.com/nocobase/nocobase/pull/6604)) by @mytharcher

- **[Workflow]** Improve code ([#6589](https://github.com/nocobase/nocobase/pull/6589)) by @mytharcher

- **[Workflow: Approval]** Support to use block template for approval process form by @mytharcher

### 🐛 Bug Fixes

- **[database]** Avoid "datetimeNoTz" field changes when value not changed in updating record ([#6588](https://github.com/nocobase/nocobase/pull/6588)) by @mytharcher

- **[client]**
  - association field (select) displaying N/A when exposing related collection fields ([#6582](https://github.com/nocobase/nocobase/pull/6582)) by @katherinehhh

  - Fix `disabled` property not works when `SchemaInitializerItem` has `items` ([#6597](https://github.com/nocobase/nocobase/pull/6597)) by @mytharcher

  - cascade  issue: 'The value of xxx cannot be in array format' when deleting and re-selecting ([#6585](https://github.com/nocobase/nocobase/pull/6585)) by @katherinehhh

- **[Collection field: Many to many (array)]** Issue of filtering by fields in an association collection with a many to many (array) field ([#6596](https://github.com/nocobase/nocobase/pull/6596)) by @2013xile

- **[Public forms]** View permissions include list and get ([#6607](https://github.com/nocobase/nocobase/pull/6607)) by @chenos

- **[Authentication]** token assignment in `AuthProvider` ([#6593](https://github.com/nocobase/nocobase/pull/6593)) by @2013xile

- **[Workflow]** Fix sync option display incorrectly ([#6595](https://github.com/nocobase/nocobase/pull/6595)) by @mytharcher

- **[Block: Map]** map management validation should not pass with space input ([#6575](https://github.com/nocobase/nocobase/pull/6575)) by @katherinehhh

- **[Workflow: Approval]**
  - Fix client variables to use in approval form by @mytharcher

  - Fix branch mode when `endOnReject` configured as `true` by @mytharcher

## [v1.6.14](https://github.com/nocobase/nocobase/compare/v1.6.13...v1.6.14) - 2025-03-29

### 🐛 Bug Fixes

- **[Calendar]** missing data on boundary dates in weekly calendar view ([#6587](https://github.com/nocobase/nocobase/pull/6587)) by @katherinehhh

- **[Auth: OIDC]** Incorrect redirection occurs when the callback path is the string 'null' by @2013xile

- **[Workflow: Approval]** Fix approval node configuration is incorrect after schema changed by @mytharcher

## [v1.6.13](https://github.com/nocobase/nocobase/compare/v1.6.12...v1.6.13) - 2025-03-28

### 🚀 Improvements

- **[Async task manager]** optimize import/export buttons in Pro ([#6531](https://github.com/nocobase/nocobase/pull/6531)) by @chenos

- **[Action: Export records Pro]** optimize import/export buttons in Pro by @katherinehhh

- **[Migration manager]** allow skip automatic backup and restore for migration by @gchust

### 🐛 Bug Fixes

- **[client]** linkage conflict between same-named association fields in different sub-tables within the same form ([#6577](https://github.com/nocobase/nocobase/pull/6577)) by @katherinehhh

- **[Action: Batch edit]** Click the batch edit button, configure the pop-up window, and then open it again, the pop-up window is blank ([#6578](https://github.com/nocobase/nocobase/pull/6578)) by @zhangzhonghe

## [v1.6.12](https://github.com/nocobase/nocobase/compare/v1.6.11...v1.6.12) - 2025-03-27

### 🐛 Bug Fixes

- **[Block: Multi-step form]**
  - the submit button has the same color in its default and highlighted by @jiannx

  - fixed the bug that form reset is invalid when the field is associated with other field by @jiannx

- **[Workflow: Approval]** Fix approval form values to submit by @mytharcher

## [v1.6.11](https://github.com/nocobase/nocobase/compare/v1.6.10...v1.6.11) - 2025-03-27

### 🚀 Improvements

- **[client]**
  - Optimize 502 error message ([#6547](https://github.com/nocobase/nocobase/pull/6547)) by @chenos

  - Only support plain text file to preview ([#6563](https://github.com/nocobase/nocobase/pull/6563)) by @mytharcher

- **[Collection field: Sequence]** support setting sequence as the title field for calendar block ([#6562](https://github.com/nocobase/nocobase/pull/6562)) by @katherinehhh

- **[Workflow: Approval]** Support to skip validator in settings by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - issue with date field display in data scope filtering ([#6564](https://github.com/nocobase/nocobase/pull/6564)) by @katherinehhh

  - The 'Ellipsis overflow content' option requires a page refresh for the toggle state to take effect ([#6520](https://github.com/nocobase/nocobase/pull/6520)) by @zhangzhonghe

  - Unable to open another modal within a modal ([#6535](https://github.com/nocobase/nocobase/pull/6535)) by @zhangzhonghe

- **[API documentation]** API document page cannot scroll ([#6566](https://github.com/nocobase/nocobase/pull/6566)) by @zhangzhonghe

- **[Workflow]** Make sure workflow key is generated before save ([#6567](https://github.com/nocobase/nocobase/pull/6567)) by @mytharcher

- **[Workflow: Post-action event]** Multiple records in bulk action should trigger multiple times ([#6559](https://github.com/nocobase/nocobase/pull/6559)) by @mytharcher

- **[Authentication]** Localization issue for fields of sign up page ([#6556](https://github.com/nocobase/nocobase/pull/6556)) by @2013xile

- **[Public forms]** issue with public form page title displaying 'Loading...' ([#6569](https://github.com/nocobase/nocobase/pull/6569)) by @katherinehhh

## [v1.6.10](https://github.com/nocobase/nocobase/compare/v1.6.9...v1.6.10) - 2025-03-25

### 🐛 Bug Fixes

- **[client]**
  - Unable to use 'Current User' variable when adding a link page ([#6536](https://github.com/nocobase/nocobase/pull/6536)) by @zhangzhonghe

  - field assignment with null value is ineffective ([#6549](https://github.com/nocobase/nocobase/pull/6549)) by @katherinehhh

  - `yarn doc` command error ([#6540](https://github.com/nocobase/nocobase/pull/6540)) by @gchust

  - Remove the 'Allow multiple selection' option from dropdown single-select fields in filter forms ([#6515](https://github.com/nocobase/nocobase/pull/6515)) by @zhangzhonghe

  - Relational field's data range linkage is not effective ([#6530](https://github.com/nocobase/nocobase/pull/6530)) by @zhangzhonghe

- **[Collection: Tree]** Migration issue for plugin-collection-tree ([#6537](https://github.com/nocobase/nocobase/pull/6537)) by @2013xile

- **[Action: Custom request]** Unable to download UTF-8 encoded files ([#6541](https://github.com/nocobase/nocobase/pull/6541)) by @2013xile

## [v1.6.9](https://github.com/nocobase/nocobase/compare/v1.6.8...v1.6.9) - 2025-03-23

### 🐛 Bug Fixes

- **[client]** action button transparency causing setting display issue on hover ([#6529](https://github.com/nocobase/nocobase/pull/6529)) by @katherinehhh

## [v1.6.8](https://github.com/nocobase/nocobase/compare/v1.6.7...v1.6.8) - 2025-03-22

### 🐛 Bug Fixes

- **[server]** The upgrade command may cause workflow errors ([#6524](https://github.com/nocobase/nocobase/pull/6524)) by @gchust

- **[client]** the height of the subtable in the form is set along with the form height ([#6518](https://github.com/nocobase/nocobase/pull/6518)) by @katherinehhh

- **[Authentication]**
  - X-Authenticator missing ([#6526](https://github.com/nocobase/nocobase/pull/6526)) by @chenos

  - Trim authenticator options ([#6527](https://github.com/nocobase/nocobase/pull/6527)) by @2013xile

- **[Block: Map]** map block key management issue causing request failures due to invisible characters ([#6521](https://github.com/nocobase/nocobase/pull/6521)) by @katherinehhh

- **[Backup manager]** Restoration may cause workflow execution errors by @gchust

- **[WeCom]** Resolve environment variables and secrets when retrieving notification configuration. by @2013xile

## [v1.6.7](https://github.com/nocobase/nocobase/compare/v1.6.6...v1.6.7) - 2025-03-20

### 🚀 Improvements

- **[Workflow: mailer node]** Add secure field config description. ([#6510](https://github.com/nocobase/nocobase/pull/6510)) by @sheldon66

- **[Notification: Email]** Add secure field config description. ([#6501](https://github.com/nocobase/nocobase/pull/6501)) by @sheldon66

- **[Calendar]** Calendar plugin with optional settings to enable or disable quick event creation ([#6391](https://github.com/nocobase/nocobase/pull/6391)) by @Cyx649312038

### 🐛 Bug Fixes

- **[client]** time field submission error in Chinese locale (invalid input syntax for type time) ([#6511](https://github.com/nocobase/nocobase/pull/6511)) by @katherinehhh

- **[File manager]** Unable to access files stored in COS ([#6512](https://github.com/nocobase/nocobase/pull/6512)) by @chenos

- **[Block: Map]** secret key fields not triggering validation in map management ([#6509](https://github.com/nocobase/nocobase/pull/6509)) by @katherinehhh

- **[WEB client]** The path in the route management table is different from the actual path ([#6483](https://github.com/nocobase/nocobase/pull/6483)) by @zhangzhonghe

- **[Action: Export records Pro]** Unable to export attachments by @chenos

- **[Workflow: Approval]**
  - Fix null user caused crash by @mytharcher

  - Fix error thrown when add query node result by @mytharcher

## [v1.6.6](https://github.com/nocobase/nocobase/compare/v1.6.5...v1.6.6) - 2025-03-18

### 🎉 New Features

- **[client]** support long text fields as title fields for association field ([#6495](https://github.com/nocobase/nocobase/pull/6495)) by @katherinehhh

- **[Workflow: Aggregate node]** Support to configure precision for aggregation result ([#6491](https://github.com/nocobase/nocobase/pull/6491)) by @mytharcher

### 🚀 Improvements

- **[File storage: S3(Pro)]** Change the text 'Access URL Base' to 'Base URL' by @zhangzhonghe

### 🐛 Bug Fixes

- **[evaluators]** Revert round decimal places to 9 ([#6492](https://github.com/nocobase/nocobase/pull/6492)) by @mytharcher

- **[File manager]** encode url ([#6497](https://github.com/nocobase/nocobase/pull/6497)) by @chenos

- **[Data source: Main]** Unable to create a MySQL view. ([#6477](https://github.com/nocobase/nocobase/pull/6477)) by @aaaaaajie

- **[Workflow]** Fix legacy tasks count after workflow deleted ([#6493](https://github.com/nocobase/nocobase/pull/6493)) by @mytharcher

- **[Embed NocoBase]** Page displays blank by @zhangzhonghe

- **[Backup manager]**
  - Upload files have not been restored when creating sub-app from backup template by @gchust

  - MySQL database restore failure caused by GTID set overlap by @gchust

- **[Workflow: Approval]**
  - Change returned approval as todo by @mytharcher

  - Fix action button missed in process table by @mytharcher

## [v1.6.5](https://github.com/nocobase/nocobase/compare/v1.6.4...v1.6.5) - 2025-03-17

### 🚀 Improvements

- **[File manager]** Simplify file URL generating logic and API ([#6472](https://github.com/nocobase/nocobase/pull/6472)) by @mytharcher

- **[File storage: S3(Pro)]** Change to a simple way to generate file URL by @mytharcher

- **[Backup manager]** Allow restore backup between pre release and release version of the same version by @gchust

### 🐛 Bug Fixes

- **[client]**
  - rich text field not clearing data on submission ([#6486](https://github.com/nocobase/nocobase/pull/6486)) by @katherinehhh

  - The color of the icons in the upper right corner of the page does not change with the theme ([#6482](https://github.com/nocobase/nocobase/pull/6482)) by @zhangzhonghe

  - Clicking the reset button on the filter form cannot clear the filtering conditions of the grid card block ([#6475](https://github.com/nocobase/nocobase/pull/6475)) by @zhangzhonghe

- **[Workflow: Manual node]**
  - Fix migration ([#6484](https://github.com/nocobase/nocobase/pull/6484)) by @mytharcher

  - Change migration name to ensure rerun ([#6487](https://github.com/nocobase/nocobase/pull/6487)) by @mytharcher

  - Fix workflow title field in filter ([#6480](https://github.com/nocobase/nocobase/pull/6480)) by @mytharcher

  - Fix migration error when id column is not exists ([#6470](https://github.com/nocobase/nocobase/pull/6470)) by @chenos

  - Avoid collection synchronized from fields ([#6478](https://github.com/nocobase/nocobase/pull/6478)) by @mytharcher

- **[Workflow: Aggregate node]** Fix round on null result ([#6473](https://github.com/nocobase/nocobase/pull/6473)) by @mytharcher

- **[Workflow]** Don't count tasks when workflow deleted ([#6474](https://github.com/nocobase/nocobase/pull/6474)) by @mytharcher

- **[Backup manager]** Not able to start server when missing default backup settings by @gchust

- **[Workflow: Approval]**
  - Fix file association field error in process form by @mytharcher

  - Fix tasks count based on hooks by @mytharcher

## [v1.6.4](https://github.com/nocobase/nocobase/compare/v1.6.3...v1.6.4) - 2025-03-14

### 🎉 New Features

- **[client]** Cascade Selection Component Add Data Scope Setting ([#6386](https://github.com/nocobase/nocobase/pull/6386)) by @Cyx649312038

### 🚀 Improvements

- **[utils]** Move `md5` to utils ([#6468](https://github.com/nocobase/nocobase/pull/6468)) by @mytharcher

### 🐛 Bug Fixes

- **[client]** In the tree block, when unchecked, the data in the data block is not being cleared ([#6460](https://github.com/nocobase/nocobase/pull/6460)) by @zhangzhonghe

- **[File manager]** Unable to delete files stored in S3. ([#6467](https://github.com/nocobase/nocobase/pull/6467)) by @chenos

- **[Workflow]** Remove bind workflow settings button from data picker ([#6455](https://github.com/nocobase/nocobase/pull/6455)) by @mytharcher

- **[File storage: S3(Pro)]** Resolve issue with inaccessible S3 Pro signed URLs by @chenos

- **[Workflow: Approval]** Avoid page crash when no applicant in approval process table by @mytharcher

## [v1.6.3](https://github.com/nocobase/nocobase/compare/v1.6.2...v1.6.3) - 2025-03-13

### 🎉 New Features

- **[WeCom]** Allows setting a custom tooltip for the sign-in button by @2013xile

### 🐛 Bug Fixes

- **[client]**
  - Fix special character in image URL caused not showing ([#6459](https://github.com/nocobase/nocobase/pull/6459)) by @mytharcher

  - incorrect page number when adding data after subtable page size change ([#6437](https://github.com/nocobase/nocobase/pull/6437)) by @katherinehhh

  - The logo style is inconsistent with the previous one ([#6444](https://github.com/nocobase/nocobase/pull/6444)) by @zhangzhonghe

- **[Workflow: Manual node]** Fix error thrown in migration ([#6445](https://github.com/nocobase/nocobase/pull/6445)) by @mytharcher

- **[Data visualization]** Removed fields appear when adding custom filter fields ([#6450](https://github.com/nocobase/nocobase/pull/6450)) by @2013xile

- **[File manager]** Fix a few issues of file manager ([#6436](https://github.com/nocobase/nocobase/pull/6436)) by @mytharcher

- **[Action: Custom request]** custom request server-side permission validation error ([#6438](https://github.com/nocobase/nocobase/pull/6438)) by @katherinehhh

- **[Data source manager]** switching data source in role management does not load corresponding collections ([#6431](https://github.com/nocobase/nocobase/pull/6431)) by @katherinehhh

- **[Action: Batch edit]** Fix workflow can not be triggered in bulk edit submission ([#6440](https://github.com/nocobase/nocobase/pull/6440)) by @mytharcher

- **[Workflow: Custom action event]** Remove `only` in E2E test case by @mytharcher

- **[Workflow: Approval]**
  - Fix association data not showing in approval form by @mytharcher

  - Fix error thrown when approve on external data source by @mytharcher

## [v1.6.2](https://github.com/nocobase/nocobase/compare/v1.6.1...v1.6.2) - 2025-03-12

### 🐛 Bug Fixes

- **[client]** date field range selection excludes the max date ([#6418](https://github.com/nocobase/nocobase/pull/6418)) by @katherinehhh

- **[Notification: In-app message]** Avoid wrong receivers configuration query all users ([#6424](https://github.com/nocobase/nocobase/pull/6424)) by @sheldon66

- **[Workflow: Manual node]**
  - Fix migration which missed table prefix and schema logic ([#6425](https://github.com/nocobase/nocobase/pull/6425)) by @mytharcher

  - Change version limit of migration to `<1.7.0` ([#6430](https://github.com/nocobase/nocobase/pull/6430)) by @mytharcher

## [v1.6.1](https://github.com/nocobase/nocobase/compare/v1.6.0...v1.6.1) - 2025-03-11

### 🐛 Bug Fixes

- **[client]**
  - When using the '$anyOf' operator, the linkage rule is invalid ([#6415](https://github.com/nocobase/nocobase/pull/6415)) by @zhangzhonghe

  - Data not updating in popup windows opened via Link buttons ([#6411](https://github.com/nocobase/nocobase/pull/6411)) by @zhangzhonghe

  - multi-select field value changes and option loss when deleting subtable records ([#6405](https://github.com/nocobase/nocobase/pull/6405)) by @katherinehhh

- **[Notification: In-app message]** Differentiate the in-app message list background color from the message cards to enhance visual hierarchy and readability. ([#6417](https://github.com/nocobase/nocobase/pull/6417)) by @sheldon66

## [v1.6.0](https://github.com/nocobase/nocobase/compare/v1.5.25...v1.6.0) - 2025-03-11

## New Features

### Cluster Mode

The Enterprise edition supports cluster mode deployment via relevant plugins. When the application runs in cluster mode, it can leverage multiple instances and multi-core processing to improve its performance in handling concurrent access.

![Cluster Mode Screenshot](https://static-docs.nocobase.com/20241231010814.png)

Reference: [Deployment - Cluster Mode](https://docs.nocobase.com/welcome/getting-started/deployment/cluster-mode)

### Password Policy

A password policy is established for all users, including rules for password complexity, validity periods, and login security strategies, along with the management of locked accounts.

![Password Policy Screenshot](https://static-docs.nocobase.com/202412281329313.png)

Reference: [Password Policy](https://docs.nocobase.com/handbook/password-policy)

### Token Policy

The Token Security Policy is a function configuration designed to protect system security and enhance user experience. It includes three main configuration items: "session validity," "token effective period," and "expired token refresh limit."

![Token Policy Screenshot](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

Reference: [Token Policy](https://docs.nocobase.com/handbook/token-policy)

### IP Restriction

NocoBase allows administrators to set up an IP allowlist or blacklist for user access to restrict unauthorized external network connections or block known malicious IP addresses, thereby reducing security risks. It also supports querying access denial logs to identify risky IPs.

![IP Restriction Screenshot](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

Reference: [IP Restriction](https://docs.nocobase.com/handbook/IP-restriction)

### Environment Variables

Centralized configuration and management of environment variables and secrets are provided for sensitive data storage, configuration reuse, environment isolation, and more.

![Environment Variables Screenshot](https://static-docs.nocobase.com/1ee6c3fa09533b19f4d6038f53b06006.png)

Reference: [Environment Variables](https://docs.nocobase.com/handbook/environment-variables)

### Release Management

This feature allows you to migrate application configurations from one environment to another.

![Migration Manager Screenshot](https://static-docs.nocobase.com/20250107105005.png)

Reference: [Release Management](https://docs.nocobase.com/handbook/release-management)

### Route Management

- **Menu Data Separated and Renamed to Routes**: The menu data has been decoupled from the UI Schema and renamed as "routes." It is divided into two tables, desktopRoutes and mobileRoutes, which correspond to desktop and mobile routes respectively.
- **Frontend Menu Optimization with Collapse and Responsive Support**: The frontend menu now supports collapse functionality and responsive design for an improved user experience.

![Route Management Screenshot](https://static-docs.nocobase.com/20250107115449.png)

Reference: [Routes](https://docs.nocobase.com/handbook/routes)

### Roles and Permissions

- Supports configuration of action action permissions.
  ![Roles and Permissions Screenshot 1](https://static-docs.nocobase.com/b0a7905d9fd4beaaf21592b1f56fe752.png)
- Supports configuration of tab permissions.

![Roles and Permissions Screenshot 2](https://static-docs.nocobase.com/4fd3a5144a2301638b9f24b033d33add.png)

### User Management

Supports customization of user profile forms.

![User Management Screenshot](https://static-docs.nocobase.com/171e5a4c61033afb237c9ae1a3d89000.png)

### Workflow

An entry for the workflow to-do center has been added to the global toolbar, providing real-time notifications for manual nodes and pending approval tasks.

![Workflow Screenshot](https://static-docs.nocobase.com/855c58536f9fd29ae353dd19b3aff73f.png)

### Workflow: Custom Action Events

Supports triggering custom action events both globally and in batch actions.

![Custom Action Events Screenshot](https://static-docs.nocobase.com/106ae1296d180718799eb6d7f423805c.png)

### Workflow: Approval

- Supports transferring approval responsibilities and adding extra approvers.
  ![Approval Form Screenshot](https://static-docs.nocobase.com/20241226232013.png)
- Allows approvers to modify the application content when submitting an approval.
  ![Approval Modification Screenshot](https://static-docs.nocobase.com/20241226232124.png)
- Supports configuration of a basic information block within the approval interface.
- Optimizes the style and interaction of initiating approvals and viewing pending tasks, with these improvements also integrated into the global process to-do center.
  ![Approval To-do Center Screenshot](https://static-docs.nocobase.com/20250310161203.png)
- No longer distinguishes the location where the approval is initiated; the approval center block can both initiate and process all approvals.

### Workflow: JSON Variable Mapping Node

A new dedicated node has been added to map JSON data from upstream node results into variables.

![JSON Variable Mapping Node Screenshot](https://static-docs.nocobase.com/20250113173635.png)

Reference: [JSON Variable Mapping](https://docs.nocobase.com/handbook/workflow/nodes/json-variable-mapping)

### Capability Enhancements and Plugin Examples


| Extension                         | Plugin Example                                                  |
| --------------------------------- | --------------------------------------------------------------- |
| Data Source Custom Preset Fields  | @nocobase-sample/plugin-data-source-main-custom-preset-fields   |
| Calendar Register Color Field     | @nocobase-sample/plugin-calendar-register-color-field           |
| Calendar Register Title Field     | @nocobase-sample/plugin-calendar-register-title-field           |
| Formula Register Expression Field | @nocobase-sample/plugin-field-formula-register-expression-field |
| Kanban Register Group Field       | @nocobase-sample/plugin-kanban-register-group-field             |
| Register Filter Operator          | @nocobase-sample/plugin-register-filter-operator                |
| File Storage Extension            | @nocobase-sample/plugin-file-storage-demo                       |

## Breaking Changes

### Update to Token Policy

In version 1.6, a new [Token Policy](https://docs.nocobase.com/handbook/token-policy) was introduced. When authentication fails, a 401 error will be returned along with a redirection to the login page. This behavior differs from previous versions. To bypass the check, refer to the following examples:

Frontend Request:

```javascript
useRequest({
  url: '/test',
  skipAuth: true,
});

api.request({
  url: '/test',
  skipAuth: true,
});
```

Backend Middleware:

```javascript
class PluginMiddlewareExampleServer extends plugin {
  middlewareExample = (ctx, next) => {
    if (ctx.path === '/path/to') {
      ctx.skipAuthCheck = true;
    }
    await next();
  };
  async load() {
    this.app.dataSourceManager.afterAddDataSource((dataSource) => {
      dataSource.resourceManager.use(this.middlewareExample, {
        before: 'auth',
      });
    });
  }
}
```

### Unit Test Function agent.login Changed from Synchronous to Asynchronous

Due to several asynchronous operations required in the authentication process, the test function login is now asynchronous. Example:

```TypeScript
import { createMockServer } from '@nocobase/test';

describe('my db suite', () => {
  let app;
  let agent;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl'],
    });
    agent = await app.agent().login(1);
  });

  test('case1', async () => {
    await agent.get('/examples');
    await agent.get('/examples');
    await agent.resource('examples').create();
  });
});
```

### New Extension API for User Center Settings Items

API:

```TypeScript
type UserCenterSettingsItemOptions = SchemaSettingsItemType & { aclSnippet?: string };

class Application {
  addUserCenterSettingsItem(options: UserCenterSettingsItemOptions);
}
```

Example:

```javascript
class PluginUserCenterSettingsExampleClient extends plugin {
  async load() {
    this.app.addUserCenterSettingsItem({
      name: 'nickName',
      Component: NickName,
      sort: 0,
    });
  }
}
```

## [v1.5.25](https://github.com/nocobase/nocobase/compare/v1.5.24...v1.5.25) - 2025-03-09

### 🐛 Bug Fixes

- **[server]** Incorrect browser cache after running `yarn start` command ([#6394](https://github.com/nocobase/nocobase/pull/6394)) by @gchust

- **[Workflow: Approval]** Avoid wrong assignees configuration query all users by @mytharcher

- **[WeCom]** fix login prompt link and dingtalk login error by @chenzhizdt

## [v1.5.24](https://github.com/nocobase/nocobase/compare/v1.5.23...v1.5.24) - 2025-03-07

### 🎉 New Features

- **[Data visualization]** Support NULLS sorting in chart queries ([#6383](https://github.com/nocobase/nocobase/pull/6383)) by @2013xile

### 🚀 Improvements

- **[Workflow]** Allow skip to trigger collection workflow in database event ([#6379](https://github.com/nocobase/nocobase/pull/6379)) by @mytharcher

### 🐛 Bug Fixes

- **[Action: Import records Pro]** Use additional option to determine whether to trigger workflow or not by @mytharcher

- **[Action: Export records Pro]** pro export action missing sort params by @katherinehhh

## [v1.5.23](https://github.com/nocobase/nocobase/compare/v1.5.22...v1.5.23) - 2025-03-06

### 🐛 Bug Fixes

- **[client]**
  - timezone-related issue causing one hour less in date picker ([#6359](https://github.com/nocobase/nocobase/pull/6359)) by @katherinehhh

  - missing sortable setting for inherited collection fields ([#6372](https://github.com/nocobase/nocobase/pull/6372)) by @katherinehhh

## [v1.5.22](https://github.com/nocobase/nocobase/compare/v1.5.21...v1.5.22) - 2025-03-06

### 🚀 Improvements

- **[client]** Add debounce handling to buttons ([#6351](https://github.com/nocobase/nocobase/pull/6351)) by @Cyx649312038

### 🐛 Bug Fixes

- **[database]** Fix error when retrieving relation collection records if the source key in relation fields is a numeric string ([#6360](https://github.com/nocobase/nocobase/pull/6360)) by @2013xile

## [v1.5.21](https://github.com/nocobase/nocobase/compare/v1.5.20...v1.5.21) - 2025-03-05

### 🚀 Improvements

- **[Workflow]** Lazy load job result for better performance ([#6344](https://github.com/nocobase/nocobase/pull/6344)) by @mytharcher

- **[Workflow: Aggregate node]** Add round process for aggregated number based on double type ([#6358](https://github.com/nocobase/nocobase/pull/6358)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - subform components not aligning with main form when label is hidden ([#6357](https://github.com/nocobase/nocobase/pull/6357)) by @katherinehhh

  - association block not rendering in popup within collection  inheritance ([#6303](https://github.com/nocobase/nocobase/pull/6303)) by @katherinehhh

  - Fix error thrown when creating file collection ([#6363](https://github.com/nocobase/nocobase/pull/6363)) by @mytharcher

- **[Workflow]** Fix acl for getting job ([#6352](https://github.com/nocobase/nocobase/pull/6352)) by @mytharcher

## [v1.5.20](https://github.com/nocobase/nocobase/compare/v1.5.19...v1.5.20) - 2025-03-03

### 🐛 Bug Fixes

- **[client]** Pages with custom favicon briefly flash the NocoBase favicon during loading ([#6337](https://github.com/nocobase/nocobase/pull/6337)) by @zhangzhonghe

- **[Block: Map]** Configuration settings for map field are missing/not visible ([#6336](https://github.com/nocobase/nocobase/pull/6336)) by @zhangzhonghe

- **[Custom brand]** Pages with custom favicon briefly flash the NocoBase favicon during loading by @zhangzhonghe

- **[Template print]** Restore from local failed when action template print and backup manager plugins were both enabled by @gchust

## [v1.5.19](https://github.com/nocobase/nocobase/compare/v1.5.18...v1.5.19) - 2025-03-01

### 🐛 Bug Fixes

- **[client]** add new button appears on hover in association field read-only mode ([#6322](https://github.com/nocobase/nocobase/pull/6322)) by @katherinehhh

- **[Action: Export records Pro]** remove 'add block' option in export attachment button settings by @katherinehhh

- **[Action: Import records Pro]** association block import button duplicate record detection shows no data in field dropdown by @katherinehhh

## [v1.5.18](https://github.com/nocobase/nocobase/compare/v1.5.17...v1.5.18) - 2025-02-27

### 🐛 Bug Fixes

- **[Block: Action panel]** Setting the height of the action panel is invalid ([#6321](https://github.com/nocobase/nocobase/pull/6321)) by @zhangzhonghe

## [v1.5.17](https://github.com/nocobase/nocobase/compare/v1.5.16...v1.5.17) - 2025-02-27

### 🐛 Bug Fixes

- **[client]**
  - error when creating comment block without comment collection ([#6309](https://github.com/nocobase/nocobase/pull/6309)) by @katherinehhh

  - Error occurs when clicking tree block node ([#6314](https://github.com/nocobase/nocobase/pull/6314)) by @zhangzhonghe

  - After clicking the left menu, the sub-page is abnormally closed ([#6305](https://github.com/nocobase/nocobase/pull/6305)) by @zhangzhonghe

  - Do not clear field value when the expression value is empty ([#6300](https://github.com/nocobase/nocobase/pull/6300)) by @zhangzhonghe

- **[Collection field: Sequence]** Fix sequence field not disabled when on read-only mode ([#6274](https://github.com/nocobase/nocobase/pull/6274)) by @mytharcher

- **[File manager]** Fix migration for inherited collection ([#6310](https://github.com/nocobase/nocobase/pull/6310)) by @mytharcher

- **[Access control]** Incorrect data records when using many to many fields as data scope in collection permissions ([#6304](https://github.com/nocobase/nocobase/pull/6304)) by @2013xile

- **[Block: Kanban]** Incorrect data filtering in popup Kanban block using popup record variables ([#6290](https://github.com/nocobase/nocobase/pull/6290)) by @katherinehhh

- **[Block: Tree]** Error occurs when clicking tree block node by @zhangzhonghe

## [v1.5.16](https://github.com/nocobase/nocobase/compare/v1.5.15...v1.5.16) - 2025-02-26

### 🚀 Improvements

- **[Backup manager]** Allow restoring backup to an application even it is missing some plugins by @gchust

### 🐛 Bug Fixes

- **[client]** rich text field component cannot be fully cleared ([#6287](https://github.com/nocobase/nocobase/pull/6287)) by @katherinehhh

- **[File manager]**
  - Fix migration and add test cases ([#6288](https://github.com/nocobase/nocobase/pull/6288)) by @mytharcher

  - Fix `path` column type of file collection ([#6294](https://github.com/nocobase/nocobase/pull/6294)) by @mytharcher

  - Fix migration and add test cases ([#6288](https://github.com/nocobase/nocobase/pull/6288)) by @mytharcher

## [v1.5.15](https://github.com/nocobase/nocobase/compare/v1.5.14...v1.5.15) - 2025-02-25

### 🚀 Improvements

- **[File manager]**
  - Increase URL length to 1024 ([#6275](https://github.com/nocobase/nocobase/pull/6275)) by @mytharcher

  - File names during upload will change from random to the original name with a random suffix. ([#6217](https://github.com/nocobase/nocobase/pull/6217)) by @chenos

- **[Block: Action panel]** Optimize mobile styles ([#6270](https://github.com/nocobase/nocobase/pull/6270)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[cli]** Improve internal logic of nocobase upgrade command ([#6280](https://github.com/nocobase/nocobase/pull/6280)) by @chenos

## [v1.5.14](https://github.com/nocobase/nocobase/compare/v1.5.13...v1.5.14) - 2025-02-24

### 🐛 Bug Fixes

- **[Backup manager]** The delete icon of the restore from local operation dialog is not working by @gchust

## [v1.5.13](https://github.com/nocobase/nocobase/compare/v1.5.12...v1.5.13) - 2025-02-22

### 🐛 Bug Fixes

- **[client]** Fix uploaded file missed when one by one ([#6260](https://github.com/nocobase/nocobase/pull/6260)) by @mytharcher

- **[Workflow: Pre-action event]** Fix error message from response message node not shown by @mytharcher

## [v1.5.12](https://github.com/nocobase/nocobase/compare/v1.5.11...v1.5.12) - 2025-02-21

### 🚀 Improvements

- **[Workflow]** Hide node id from node card in workflow canvas ([#6251](https://github.com/nocobase/nocobase/pull/6251)) by @mytharcher

### 🐛 Bug Fixes

- **[File manager]** Upgrade AWS SDK version to fix MinIO upload bug ([#6253](https://github.com/nocobase/nocobase/pull/6253)) by @mytharcher

## [v1.5.11](https://github.com/nocobase/nocobase/compare/v1.5.10...v1.5.11) - 2025-02-20

### 🎉 New Features

- **[Workflow]** Support to extend group of instruction in workflow ([#6237](https://github.com/nocobase/nocobase/pull/6237)) by @mytharcher
Reference: [Extends Node Group](https://docs.nocobase.com/handbook/workflow/development/api#registerinstructiongroup)
### 🐛 Bug Fixes

- **[client]**
  - association block associate action popup issue on mobile ([#6235](https://github.com/nocobase/nocobase/pull/6235)) by @katherinehhh

  - picker format mismatch in filter form field ([#6234](https://github.com/nocobase/nocobase/pull/6234)) by @katherinehhh

  - Show `<Variable.TextArea />` component correctly in disabled mode ([#6197](https://github.com/nocobase/nocobase/pull/6197)) by @mytharcher

  - Fix files missed after uploaded ([#6247](https://github.com/nocobase/nocobase/pull/6247)) by @mytharcher

- **[Workflow]**
  - Fix style details in workflow canvas ([#6240](https://github.com/nocobase/nocobase/pull/6240)) by @mytharcher

  - Support to trigger workflow when change password ([#6248](https://github.com/nocobase/nocobase/pull/6248)) by @mytharcher

## [v1.5.10](https://github.com/nocobase/nocobase/compare/v1.5.9...v1.5.10) - 2025-02-17

### 🚀 Improvements

- **[Collection field: Markdown(Vditor)]** Vditor CDN use local resources ([#6229](https://github.com/nocobase/nocobase/pull/6229)) by @chenos

### 🐛 Bug Fixes

- **[Workflow: Loop node]** Fix loop exit earlier when node inside pending ([#6236](https://github.com/nocobase/nocobase/pull/6236)) by @mytharcher

## [v1.5.9](https://github.com/nocobase/nocobase/compare/v1.5.8...v1.5.9) - 2025-02-17

### 🐛 Bug Fixes

- **[client]**
  - horizontal scrollbar issue on the page ([#6232](https://github.com/nocobase/nocobase/pull/6232)) by @katherinehhh

  - When closing the sub-page, multiple block data requests are triggered ([#6233](https://github.com/nocobase/nocobase/pull/6233)) by @zhangzhonghe

  - Missing unique key for association fields submenu in UI ([#6230](https://github.com/nocobase/nocobase/pull/6230)) by @gchust

- **[Data visualization]** Filterting error occurs when the data source name contains a hyphen `-` ([#6231](https://github.com/nocobase/nocobase/pull/6231)) by @2013xile

## [v1.5.8](https://github.com/nocobase/nocobase/compare/v1.5.7...v1.5.8) - 2025-02-16

### 🐛 Bug Fixes

- **[client]**
  - Can't open field link popup in embed page ([#6222](https://github.com/nocobase/nocobase/pull/6222)) by @gchust

  - In the edit form, the displayed association field value does not change when the associated field updates ([#6210](https://github.com/nocobase/nocobase/pull/6210)) by @Cyx649312038

- **[Mobile]** Mobile menu data is incomplete in permission configuration table ([#6219](https://github.com/nocobase/nocobase/pull/6219)) by @zhangzhonghe

## [v1.5.7](https://github.com/nocobase/nocobase/compare/v1.5.6...v1.5.7) - 2025-02-13

### 🚀 Improvements

- **[Notification: In-app message]** Remove console error logging for SSE connection retries. ([#6205](https://github.com/nocobase/nocobase/pull/6205)) by @sheldon66

### 🐛 Bug Fixes

- **[client]**
  - missing drag setting in relation data quick-create operation modal ([#6201](https://github.com/nocobase/nocobase/pull/6201)) by @katherinehhh

  - issue with high precision number formatting not applying ([#6202](https://github.com/nocobase/nocobase/pull/6202)) by @katherinehhh

  - Fix an issue where clearing a association field in a form doesn't actually clear the field value when submitting the form ([#5540](https://github.com/nocobase/nocobase/pull/5540)) by @zhangzhonghe

  - Block does not refresh after form submission ([#6206](https://github.com/nocobase/nocobase/pull/6206)) by @zhangzhonghe

  - linked field value persisting on submission after relation field reset ([#6207](https://github.com/nocobase/nocobase/pull/6207)) by @katherinehhh

  - update action displaying for rows without update permissions in table ([#6204](https://github.com/nocobase/nocobase/pull/6204)) by @katherinehhh

- **[Collection field: Sort]** Fix sort field type not registered in external data source ([#6212](https://github.com/nocobase/nocobase/pull/6212)) by @mytharcher

- **[Authentication]** WebSocket authentication issue ([#6209](https://github.com/nocobase/nocobase/pull/6209)) by @2013xile

- **[Collection field: Attachment(URL)]** Fix deprecated request URL in hook by @mytharcher

## [v1.5.6](https://github.com/nocobase/nocobase/compare/v1.5.5...v1.5.6) - 2025-02-12

### 🐛 Bug Fixes

- **[client]**
  - Block does not refresh after page navigation ([#6200](https://github.com/nocobase/nocobase/pull/6200)) by @zhangzhonghe

  - Form block not displayed when adding a create form via a popup action in a table row ([#6190](https://github.com/nocobase/nocobase/pull/6190)) by @katherinehhh

  - table block height setting not applied when there is no data ([#6192](https://github.com/nocobase/nocobase/pull/6192)) by @katherinehhh

- **[Action: Custom request]**
  - Incorrect 'Current record' variable value in custom request button ([#6196](https://github.com/nocobase/nocobase/pull/6196)) by @zhangzhonghe

  - Custom request button compatibility with legacy variables ([#6194](https://github.com/nocobase/nocobase/pull/6194)) by @zhangzhonghe

- **[Data visualization]** Chart blocks do not display when added to the popups of action panel ([#6198](https://github.com/nocobase/nocobase/pull/6198)) by @2013xile

## [v1.5.5](https://github.com/nocobase/nocobase/compare/v1.5.4...v1.5.5) - 2025-02-11

### 🚀 Improvements

- **[Notification: In-app message]** Add test for retrieving latest message title and timestamp in in-app channels. ([#6189](https://github.com/nocobase/nocobase/pull/6189)) by @sheldon66

## [v1.5.4](https://github.com/nocobase/nocobase/compare/v1.5.3...v1.5.4) - 2025-02-10

### 🚀 Improvements

- **[Workflow]** Add loading to duplicate action ([#6179](https://github.com/nocobase/nocobase/pull/6179)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix error thrown in create node field settings ([#6187](https://github.com/nocobase/nocobase/pull/6187)) by @mytharcher

  - The 'Allow Multiple Selection' configuration option for association fields is not displayed in Filter Forms ([#6174](https://github.com/nocobase/nocobase/pull/6174)) by @zhangzhonghe

  - Field remains hidden after being hidden by linkage rules ([#6182](https://github.com/nocobase/nocobase/pull/6182)) by @zhangzhonghe

- **[utils]** optimize the storage/plugins reading logic ([#6186](https://github.com/nocobase/nocobase/pull/6186)) by @chenos

- **[Notification: In-app message]** Fix: Add user filter to message timestamp and title subqueries in channel list API to ensure data isolation. ([#6185](https://github.com/nocobase/nocobase/pull/6185)) by @deepure

- **[Backup manager]** Files were not copied from the backup to the uploads folder during tolerant mode restore by @gchust

## [v1.5.3](https://github.com/nocobase/nocobase/compare/v1.5.2...v1.5.3) - 2025-02-07

### 🐛 Bug Fixes

- **[client]**
  - The popup opened by clicking the belongsToArray field is fetching incorrect data ([#6173](https://github.com/nocobase/nocobase/pull/6173)) by @zhangzhonghe

  - time field operator set to "between" in filter form, but component didn't change to time range picker ([#6170](https://github.com/nocobase/nocobase/pull/6170)) by @katherinehhh

  - Kanban and calendar block popup edit form didn't show "Unsaved changes" ([#6172](https://github.com/nocobase/nocobase/pull/6172)) by @katherinehhh

## [v1.5.2](https://github.com/nocobase/nocobase/compare/v1.5.1...v1.5.2) - 2025-02-06

### 🚀 Improvements

- **[Mobile]** Hide mobile config page header when no config permission ([#6171](https://github.com/nocobase/nocobase/pull/6171)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[Workflow: notification node]** Ensured notifications are sent correctly when user input contains Handlebars-like syntax. ([#6164](https://github.com/nocobase/nocobase/pull/6164)) by @sheldon66

- **[Workflow: Manual node]** Fix form values not parsed in terminal button submitting ([#6160](https://github.com/nocobase/nocobase/pull/6160)) by @mytharcher

## [v1.5.1](https://github.com/nocobase/nocobase/compare/v1.5.0...v1.5.1) - 2025-02-06

### 🐛 Bug Fixes

- **[client]**
  - Incorrect translation for title of `Sub-form(Popover)` ([#6159](https://github.com/nocobase/nocobase/pull/6159)) by @gchust

  - When the subform field is set to 'Hidden (reserved value)', its default value variables fail to function properly ([#6165](https://github.com/nocobase/nocobase/pull/6165)) by @zhangzhonghe

## [v1.5.0](https://github.com/nocobase/nocobase/compare/v1.4.34...v1.5.0) - 2025-02-05

## Core Optimizations

### Enable Links in Single-line Text Fields

The open mode supports drawer, dialog and page.

![20250207212903](https://static-docs.nocobase.com/20250207212903.png)

### Association Block Supports Associate/Disassociate Actions

You can now perform association and disassociation actions directly in the association block.

![20250207211837](https://static-docs.nocobase.com/20250207211837.png)

### Debugging Workflow

You can now directly trigger workflows during configuration to debug them.

<video width="100%" controls>
      <source src="https://static-docs.nocobase.com/20250207213343_rec_.mp4" type="video/mp4">
</video>

### Improved Mobile Interaction for Date Components

Enhanced interaction experience for date-related components on mobile devices.

![0084553986f6b3de21ca62f22d09a91a.png](https://static-docs.nocobase.com/0084553986f6b3de21ca62f22d09a91a.png)

### Frontend Performance Optimizations

* Optimized initial screen load speed.
* Changed the frontend build tool to **rspack**.
* Reduced the bundle size of entry files for various plugin packages.
* Enhanced rendering performance for large data tables.
* Reduced stuttering during menu transitions.
* Introduced on-demand loading methods with the new `lazy` and `useLazy` libraries.

Below is a brief introduction to using `lazy` and `useLazy`:

```ts
import { lazy, useLazy } from '@nocobase/client';

// Export a single component:
const { RolesManagement } = lazy(() => import('./RolesManagement'), 'RolesManagement');

// Export multiple components:
const { AuthLayout, SignInPage, SignUpPage } = lazy(() => import('./pages'), 'AuthLayout', 'SignInPage', 'SignUpPage');

// Export a default component:
const ThemeList = lazy(() => import('./components/ThemeList'));

// Return a hook:
const useReactToPrint = useLazy<typeof import('react-to-print').useReactToPrint>(
  () => import('react-to-print'),
  'useReactToPrint',
);
  
// Return a library:
const parseExpression = useLazy<typeof import('cron-parser').parseExpression>(
  () => import('cron-parser'),
  'parseExpression',
);
```

---

## New Plugins

### Import Pro

Supports asynchronous import operations that run on a separate thread. This feature enables the import of large volumes of data with enhanced performance.

![20250119221221](https://static-docs.nocobase.com/20250119221221.png)

Reference: [Import Pro](https://docs.nocobase.com/handbook/action-import-pro)

### Export Pro

Enables asynchronous export operations that run on a separate thread, supporting large-scale data exports as well as attachment exports.

![20250119221237](https://static-docs.nocobase.com/20250119221237.png)

Reference: [Export Pro](https://docs.nocobase.com/handbook/action-export-pro)

### Template Print

The Template Printing plugin allows you to edit template files using Word, Excel, or PowerPoint (supporting the `.docx`, `.xlsx`, and `.pptx` formats). By setting placeholders and logical structures within the template, you can dynamically generate files in predetermined formats such as `.docx`, `.xlsx`, `.pptx`, and even `.pdf`. This functionality is widely applicable for creating various business documents, including quotes, invoices, contracts, and more.

**Main Features**

* **Multi-format Support**: Compatible with Word, Excel, and PowerPoint templates to meet diverse document generation needs.
* **Dynamic Data Filling**: Automatically populates document content based on defined placeholders and logic.
* **Flexible Template Management**: Easily add, edit, delete, and categorize templates for better maintenance and usage.
* **Rich Template Syntax**: Supports basic replacement, array access, loops, conditional output, and other template syntax for complex document generation.
* **Formatter Support**: Provides conditional outputs, date formatting, number formatting, and more to enhance document clarity and professionalism.
* **Efficient Output Options**: Supports direct PDF generation for easy sharing and printing.

![20250119221258](https://static-docs.nocobase.com/20250119221258.png)

Reference: [Template Print](https://docs.nocobase.com/handbook/action-template-print)

### Audit Logger

This plugin records and tracks user activities as well as resource operation histories within the system.

![20250119221319](https://static-docs.nocobase.com/20250119221319.png)

Reference: [Audit Logger](https://docs.nocobase.com/handbook/audit-logger)

### Workflow: Subflow

This feature allows one workflow to call another process. You can use variables from the current workflow as input for the subflow, and then use the subflow’s output as variables in subsequent nodes.

![20250119221334](https://static-docs.nocobase.com/20250119221334.png)

Reference: [Workflow: Subflow](https://docs.nocobase.com/handbook/workflow-subflow)

### Email Manager

Integrate your Google or Microsoft email accounts into NocoBase to send, receive, view, and manage emails. Additionally, emails can be embedded directly into pages.

![20250119221346](https://static-docs.nocobase.com/20250119221346.png)

Reference: [Email Manager](https://docs.nocobase.com/handbook/email-manager/usage-admin)

### File Storage: S3 (Pro)

Supports file storage types that are compatible with the S3 protocol, including Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, and more. This plugin also supports direct file uploads and private access.

![20250119221404](https://static-docs.nocobase.com/20250119221404.png)

Reference: [File Storage: S3(Pro)](https://docs.nocobase.com/handbook/file-manager/storage/s3-pro)

## [v1.4.34](https://github.com/nocobase/nocobase/compare/v1.4.33...v1.4.34) - 2025-02-02

### 🐛 Bug Fixes

- **[client]** Unable to submit when selecting data ([#6148](https://github.com/nocobase/nocobase/pull/6148)) by @zhangzhonghe

## [v1.4.33](https://github.com/nocobase/nocobase/compare/v1.4.32...v1.4.33) - 2025-01-28

### 🐛 Bug Fixes

- **[Auth: OIDC]** Set the `same-site` policy of state cookie to `lax` by @2013xile

## [v1.4.32](https://github.com/nocobase/nocobase/compare/v1.4.31...v1.4.32) - 2025-01-27

### 🐛 Bug Fixes

- **[actions]** Fix "move" action to trigger workflow ([#6144](https://github.com/nocobase/nocobase/pull/6144)) by @mytharcher

## [v1.4.31](https://github.com/nocobase/nocobase/compare/v1.4.30...v1.4.31) - 2025-01-26

### 🚀 Improvements

- **[client]** optimize filter component in filter form to match filterable settings ([#6110](https://github.com/nocobase/nocobase/pull/6110)) by @katherinehhh

- **[File manager]** Allow to delete files when file (attachment) record is deleted ([#6127](https://github.com/nocobase/nocobase/pull/6127)) by @mytharcher

### 🐛 Bug Fixes

- **[database]**
  - fix filter by uuid field ([#6138](https://github.com/nocobase/nocobase/pull/6138)) by @chareice

  - Fix update collection that without primary keys ([#6124](https://github.com/nocobase/nocobase/pull/6124)) by @chareice

- **[client]**
  - The data source management page is reporting an error ([#6141](https://github.com/nocobase/nocobase/pull/6141)) by @zhangzhonghe

  - When the linkage rule's conditions involve association fields that are not displayed, the button's linkage rule becomes ineffective ([#6140](https://github.com/nocobase/nocobase/pull/6140)) by @zhangzhonghe

  - Fix  incorrect variable display in association field quick-add form ([#6119](https://github.com/nocobase/nocobase/pull/6119)) by @katherinehhh

  - The content is not displayed in the quick add popup ([#6123](https://github.com/nocobase/nocobase/pull/6123)) by @zhangzhonghe

  - Fix the issue where association field blocks do not request data ([#6125](https://github.com/nocobase/nocobase/pull/6125)) by @zhangzhonghe

  - Fix linkage rules in subtable/subform affecting blocks in association field popups ([#5543](https://github.com/nocobase/nocobase/pull/5543)) by @katherinehhh

- **[Collection field: administrative divisions of China]** fix acl permission with chinaRegion ([#6137](https://github.com/nocobase/nocobase/pull/6137)) by @chareice

- **[Workflow]** Fix incorrectly generated SQL ([#6128](https://github.com/nocobase/nocobase/pull/6128)) by @mytharcher

- **[Collection field: Many to many (array)]** Fix the issue where updating many to many (array) fields in a subform is not working ([#6136](https://github.com/nocobase/nocobase/pull/6136)) by @2013xile

- **[Mobile]** Fix select in read-only mode clickable and text overflow issue on mobile ([#6130](https://github.com/nocobase/nocobase/pull/6130)) by @katherinehhh

## [v1.4.30](https://github.com/nocobase/nocobase/compare/v1.4.29...v1.4.30) - 2025-01-23

### 🐛 Bug Fixes

- **[client]** Fix an issue with displaying N/A for association fields in Table ([#6109](https://github.com/nocobase/nocobase/pull/6109)) by @zhangzhonghe

- **[Collection: Tree]** Disallow setting a node of tree collection as its own parent ([#6122](https://github.com/nocobase/nocobase/pull/6122)) by @2013xile

- **[Workflow: HTTP request node]** Fix request node pending in loop ([#6120](https://github.com/nocobase/nocobase/pull/6120)) by @mytharcher

- **[Workflow: test kit]** To fix mock datasource test cases depend on ACL ([#6116](https://github.com/nocobase/nocobase/pull/6116)) by @mytharcher

- **[Backup manager]** Fixed an issue where some backup files could not be properly extracted and restored by @gchust

## [v1.4.29](https://github.com/nocobase/nocobase/compare/v1.4.28...v1.4.29) - 2025-01-21

### 🎉 New Features

- **[Block: Action panel]** Support configuring  the number of icons per row in the mobile  action penal ([#6106](https://github.com/nocobase/nocobase/pull/6106)) by @katherinehhh

## [v1.4.28](https://github.com/nocobase/nocobase/compare/v1.4.27...v1.4.28) - 2025-01-21

### 🐛 Bug Fixes

- **[client]** The default value of the assocation field has not been updated ([#6103](https://github.com/nocobase/nocobase/pull/6103)) by @chenos

- **[Action: Batch edit]** Remove form data template from bulk edit action form  settings ([#6098](https://github.com/nocobase/nocobase/pull/6098)) by @katherinehhh

- **[Verification]** Fix provider ID could be edit ([#6097](https://github.com/nocobase/nocobase/pull/6097)) by @mytharcher

## [v1.4.27](https://github.com/nocobase/nocobase/compare/v1.4.26...v1.4.27) - 2025-01-18

### 🐛 Bug Fixes

- **[client]** Fix the issue where block data is empty in the popup window on the embedded page ([#6086](https://github.com/nocobase/nocobase/pull/6086)) by @zhangzhonghe

- **[Workflow]** Fix dispatch not process in preparing phase ([#6087](https://github.com/nocobase/nocobase/pull/6087)) by @mytharcher

## [v1.4.26](https://github.com/nocobase/nocobase/compare/v1.4.25...v1.4.26) - 2025-01-16

### 🚀 Improvements

- **[client]** Allows to add descriptions for SQL collections ([#6081](https://github.com/nocobase/nocobase/pull/6081)) by @2013xile

- **[resourcer]** Allow empty object as values in action ([#6070](https://github.com/nocobase/nocobase/pull/6070)) by @mytharcher

### 🐛 Bug Fixes

- **[Localization]** Avoid API request when attempting to delete an empty translation ([#6078](https://github.com/nocobase/nocobase/pull/6078)) by @2013xile

## [v1.4.25](https://github.com/nocobase/nocobase/compare/v1.4.24...v1.4.25) - 2025-01-15

### 🚀 Improvements

- **[client]** Improve the extensibility of file-storage ([#6071](https://github.com/nocobase/nocobase/pull/6071)) by @chenos

- **[Workflow]** Fix repeat field component in schedule configuration ([#6067](https://github.com/nocobase/nocobase/pull/6067)) by @mytharcher

### 🐛 Bug Fixes

- **[Mobile]** Fix the issue of bottom buttons being obscured on mobile devices ([#6068](https://github.com/nocobase/nocobase/pull/6068)) by @zhangzhonghe

- **[Workflow: Custom action event]** Fix context for http collection by @mytharcher

- **[Backup manager]** Fixed a possible backup error when the collection-fdw plugin is not enabled by @gchust

- **[Departments]** Fix custom action event cannot be triggered on departments collection by @mytharcher

## [v1.4.24](https://github.com/nocobase/nocobase/compare/v1.4.23...v1.4.24) - 2025-01-14

### 🚀 Improvements

- **[client]** datePicker component input read only ([#6061](https://github.com/nocobase/nocobase/pull/6061)) by @Cyx649312038

### 🐛 Bug Fixes

- **[client]**
  - Fix incorrect loading of modal association  fields in table block ([#6060](https://github.com/nocobase/nocobase/pull/6060)) by @katherinehhh

  - Fix style issue in sub-table in detail block ([#6049](https://github.com/nocobase/nocobase/pull/6049)) by @katherinehhh

  - Fix number field format in readPretty mode affecting edit mode ([#6050](https://github.com/nocobase/nocobase/pull/6050)) by @katherinehhh

  - Fix table header cell style issue in ant-table ([#6052](https://github.com/nocobase/nocobase/pull/6052)) by @katherinehhh

- **[database]** fix an issue when init sort field with primary key ([#6059](https://github.com/nocobase/nocobase/pull/6059)) by @chareice

- **[Data visualization]** Remove the `LIMIT` clause when using aggregate functions without setting dimensions in chart queries ([#6062](https://github.com/nocobase/nocobase/pull/6062)) by @2013xile

- **[Backup manager]** Fixed backup download error for users only logged into sub-app by @gchust

## [v1.4.23](https://github.com/nocobase/nocobase/compare/v1.4.22...v1.4.23) - 2025-01-13

### 🐛 Bug Fixes

- **[client]** Fix the issue where fixed actions column are not working properly in tables ([#6048](https://github.com/nocobase/nocobase/pull/6048)) by @zhangzhonghe

- **[Users]** Disable browser autofill when setting passwords for users in user management ([#6041](https://github.com/nocobase/nocobase/pull/6041)) by @2013xile

- **[Workflow]** Fix date field based schedule event not triggers after app started ([#6042](https://github.com/nocobase/nocobase/pull/6042)) by @mytharcher

## [v1.4.22](https://github.com/nocobase/nocobase/compare/v1.4.21...v1.4.22) - 2025-01-10

### 🚀 Improvements

- **[evaluators]** Upgrade version of library formula.js to 4.4.9 ([#6037](https://github.com/nocobase/nocobase/pull/6037)) by @mytharcher

- **[Workflow]** Fix logger API of workflow plugin ([#6036](https://github.com/nocobase/nocobase/pull/6036)) by @mytharcher

### 🐛 Bug Fixes

- **[Workflow]** Add defensive logic to avoid duplicate triggering ([#6022](https://github.com/nocobase/nocobase/pull/6022)) by @mytharcher

## [v1.4.21](https://github.com/nocobase/nocobase/compare/v1.4.20...v1.4.21) - 2025-01-10

### 🚀 Improvements

- **[client]** Support linkage rules in the details block to hide(reserved value) ([#6031](https://github.com/nocobase/nocobase/pull/6031)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]**
  - Resolve missing public path in icon file paths ([#6034](https://github.com/nocobase/nocobase/pull/6034)) by @chenos

  - Fix the issue where form linkage rules fail when they depend on field values from subtables ([#5876](https://github.com/nocobase/nocobase/pull/5876)) by @zhangzhonghe

  - Fix incorrect field of 'Current record' variable in sub-details ([#6030](https://github.com/nocobase/nocobase/pull/6030)) by @zhangzhonghe

- **[Backup manager]** Fixed backup download failure when env API_BASE_PATH is not /api by @gchust

## [v1.4.20](https://github.com/nocobase/nocobase/compare/v1.4.19...v1.4.20) - 2025-01-09

### 🎉 New Features

- **[client]** Add app.getHref() method ([#6019](https://github.com/nocobase/nocobase/pull/6019)) by @chenos

### 🚀 Improvements

- **[client]**
  - Allow to sort workflows when binding to action button ([#6017](https://github.com/nocobase/nocobase/pull/6017)) by @mytharcher

  - Change reference links of evaluators to doc site ([#6021](https://github.com/nocobase/nocobase/pull/6021)) by @mytharcher

  - support maxTagCount: 'responsive' in multi-select dropdown component ([#6007](https://github.com/nocobase/nocobase/pull/6007)) by @katherinehhh

  - Set default end time for time scope component in filter block to 23:59:59" ([#6012](https://github.com/nocobase/nocobase/pull/6012)) by @katherinehhh

- **[Action: Batch edit]** Refactor bulk edit form submit button: remove field assignment and linkage rule ([#6008](https://github.com/nocobase/nocobase/pull/6008)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]**
  - Fix required validation not working after deleting data in rich text editor ([#6006](https://github.com/nocobase/nocobase/pull/6006)) by @katherinehhh

  - Fix misalignment issue when action column buttons are hidden ([#6014](https://github.com/nocobase/nocobase/pull/6014)) by @katherinehhh

  - Fix Create Collections button issue on clicking Collections tab in REST API page ([#5992](https://github.com/nocobase/nocobase/pull/5992)) by @katherinehhh

  - Fix  resolve issue where targetKey can't select NanoID field in one-to-many ([#5999](https://github.com/nocobase/nocobase/pull/5999)) by @katherinehhh

  - Fix style of setting button in compact theme ([#6001](https://github.com/nocobase/nocobase/pull/6001)) by @katherinehhh

  - Fix list component style ([#5998](https://github.com/nocobase/nocobase/pull/5998)) by @mytharcher

  - Fixed the issue where headers included in client requests were being overwritten ([#6009](https://github.com/nocobase/nocobase/pull/6009)) by @2013xile

  - Fix foreignKey, targetKey, and sourceKey  should support filtering by Chinese characters ([#5997](https://github.com/nocobase/nocobase/pull/5997)) by @katherinehhh

- **[Action: Import records]** fix import with belongs to many associations that use different target key ([#6024](https://github.com/nocobase/nocobase/pull/6024)) by @chareice

- **[Block: Map]** Fix map field in detail block should  render as map block ([#6010](https://github.com/nocobase/nocobase/pull/6010)) by @katherinehhh

- **[Embed NocoBase]** The token for embed conflicts with auth by @chenos

## [v1.4.19](https://github.com/nocobase/nocobase/compare/v1.4.18...v1.4.19) - 2025-01-06

### 🐛 Bug Fixes

- **[client]** Fix date range picker in filter form/action not showing time picker when showTime is set ([#5994](https://github.com/nocobase/nocobase/pull/5994)) by @katherinehhh

## [v1.4.18](https://github.com/nocobase/nocobase/compare/v1.4.17...v1.4.18) - 2025-01-06

### 🚀 Improvements

- **[Workflow: test kit]** Fix date fields precision in test collection ([#5983](https://github.com/nocobase/nocobase/pull/5983)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix scrollbar issue when setting full height for data block in subpage ([#5989](https://github.com/nocobase/nocobase/pull/5989)) by @katherinehhh

  - Fix alignment issue when action column buttons are hidden ([#5987](https://github.com/nocobase/nocobase/pull/5987)) by @katherinehhh

  - Fix issue with batch deletion of system and general fields in collection manager ([#5988](https://github.com/nocobase/nocobase/pull/5988)) by @katherinehhh

  - Fix the issue where the 'URL search params' variable is not working on mobile page ([#5968](https://github.com/nocobase/nocobase/pull/5968)) by @Cyx649312038

- **[server]** Fixed a potential app crash during backup restoration ([#5981](https://github.com/nocobase/nocobase/pull/5981)) by @gchust

- **[Mobile]** Fix the issue of bottom buttons being obscured on mobile devices ([#5991](https://github.com/nocobase/nocobase/pull/5991)) by @zhangzhonghe

- **[Data visualization]** Fixed the issue where "current popup variables" used on charts in subpages became empty after refreshing the page ([#5984](https://github.com/nocobase/nocobase/pull/5984)) by @2013xile

- **[Block: Kanban]** Fix parent collection fields not loaded in the kanban ([#5985](https://github.com/nocobase/nocobase/pull/5985)) by @katherinehhh

## [v1.4.17](https://github.com/nocobase/nocobase/compare/v1.4.16...v1.4.17) - 2024-12-31

### 🎉 New Features

- **[client]** Supports using "Table selected records" variable in m2m array fields ([#5974](https://github.com/nocobase/nocobase/pull/5974)) by @2013xile

### 🚀 Improvements

- **[undefined]** Enable theme plugin by default ([#5957](https://github.com/nocobase/nocobase/pull/5957)) by @zhangzhonghe

- **[Data source: Main]** Added name conflict validation to prevent users from creating Collections with the same name as system Collections ([#5962](https://github.com/nocobase/nocobase/pull/5962)) by @chareice

- **[Workflow]** Avoid to misuse date range variables in most place unless filter component ([#5954](https://github.com/nocobase/nocobase/pull/5954)) by @mytharcher

### 🐛 Bug Fixes

- **[database]**
  - Fixed an issue in destory action where filterByTk with filter parameter could not delete data ([#5976](https://github.com/nocobase/nocobase/pull/5976)) by @chareice

  - the firstOrCreate and updateOrCreate methods of the repository lose context ([#5973](https://github.com/nocobase/nocobase/pull/5973)) by @chenos

- **[client]**
  - Fix  issue  when adding a one-to-one relationship field in the form ([#5975](https://github.com/nocobase/nocobase/pull/5975)) by @katherinehhh

  - Fix issue with field assignment in subtable when re-select data after deleting data ([#5958](https://github.com/nocobase/nocobase/pull/5958)) by @katherinehhh

  - Fix the table block error caused by data containing fields named 'children' ([#5951](https://github.com/nocobase/nocobase/pull/5951)) by @zhangzhonghe

- **[Data source: Main]** Fix legacy support issues with the unixTimestamp field. ([#5967](https://github.com/nocobase/nocobase/pull/5967)) by @chareice

- **[Workflow]** Fix sub-details block throwing error in manual node UI configuration ([#5953](https://github.com/nocobase/nocobase/pull/5953)) by @mytharcher

## [v1.4.16](https://github.com/nocobase/nocobase/compare/v1.4.15...v1.4.16) - 2024-12-26

### 🐛 Bug Fixes

- **[client]** Fix UnixTimestamp field precision conversion issue ([#5931](https://github.com/nocobase/nocobase/pull/5931)) by @chenos

- **[Action: Duplicate record]** Fix o2o association field not  displaying configured target collection field in detail and form blocks ([#5921](https://github.com/nocobase/nocobase/pull/5921)) by @katherinehhh

- **[Backup manager]** Fixed backup error when the mysqldump version is below 8 by @gchust

## [v1.4.15](https://github.com/nocobase/nocobase/compare/v1.4.14...v1.4.15) - 2024-12-24

### 🐛 Bug Fixes

- **[server]** Collections were not automatically created when enabling the plugin ([#5939](https://github.com/nocobase/nocobase/pull/5939)) by @chenos

- **[client]** Fix property field search in linkage rules not matching correct data ([#5925](https://github.com/nocobase/nocobase/pull/5925)) by @katherinehhh

- **[Workflow]**
  - Fix schedule trigger on date field without timezone ([#5938](https://github.com/nocobase/nocobase/pull/5938)) by @mytharcher

  - Fix date scope variable translation ([#5919](https://github.com/nocobase/nocobase/pull/5919)) by @mytharcher

## [v1.4.14](https://github.com/nocobase/nocobase/compare/v1.4.13...v1.4.14) - 2024-12-21

### 🐛 Bug Fixes

- **[Data visualization]** Fix the error when filtering with nested many to many associations in chart query. ([#5917](https://github.com/nocobase/nocobase/pull/5917)) by @2013xile

- **[Workflow: Aggregate node]** Fix incorrect aggregation result caused by transaction ([#5916](https://github.com/nocobase/nocobase/pull/5916)) by @mytharcher

## [v1.4.13](https://github.com/nocobase/nocobase/compare/v1.4.12...v1.4.13) - 2024-12-19

### 🚀 Improvements

- **[Collection: SQL]** Prohibit the use of dangerous keywords and functions in SQL. ([#5913](https://github.com/nocobase/nocobase/pull/5913)) by @2013xile

- **[Theme editor]** Optimize API validation for user profile editing and password updates ([#5912](https://github.com/nocobase/nocobase/pull/5912)) by @2013xile

### 🐛 Bug Fixes

- **[Data source: Main]** Fixed foreign key loading issues ([#5903](https://github.com/nocobase/nocobase/pull/5903)) by @chareice

- **[Collection: SQL]** Fix the issue where fields disappear after updating an SQL Collection. ([#5909](https://github.com/nocobase/nocobase/pull/5909)) by @chareice

- **[Backup manager]** Fixed restore backup is not working on Windows by @gchust

## [v1.4.11](https://github.com/nocobase/nocobase/compare/v1.4.10...v1.4.11) - 2024-12-18

### 🚀 Improvements

- **[client]** Make more components support the 'Ellipsis overflow content' configuration item ([#5888](https://github.com/nocobase/nocobase/pull/5888)) by @zhangzhonghe

- **[database]** add firstOrCreate & updateOrCreate  to relation repository ([#5894](https://github.com/nocobase/nocobase/pull/5894)) by @chareice

### 🐛 Bug Fixes

- **[client]**
  - Fix missing x-data-source parameter in duplicate request template for external data source block ([#5882](https://github.com/nocobase/nocobase/pull/5882)) by @katherinehhh

  - Fix horizontal scrollbar issue in table within plugin ([#5899](https://github.com/nocobase/nocobase/pull/5899)) by @katherinehhh

  - Fix the issue where extra 'N/A' options sometimes appear in association field dropdowns ([#5878](https://github.com/nocobase/nocobase/pull/5878)) by @zhangzhonghe

  - Fix PG view creation issue, resolve error when selecting views across schemas ([#5881](https://github.com/nocobase/nocobase/pull/5881)) by @katherinehhh

  - Fix issue with group styles in form blocks when layout is set to horizontal ([#5884](https://github.com/nocobase/nocobase/pull/5884)) by @katherinehhh

- **[Users]**
  - Fix the issue where the form is not reset after adding or editing a user in user management. ([#5875](https://github.com/nocobase/nocobase/pull/5875)) by @2013xile

  - Fix the issues where pagination settings are reset after editing and submitting user profiles on the user management  following a page switch or a change of page size. ([#5893](https://github.com/nocobase/nocobase/pull/5893)) by @2013xile

- **[Data source manager]** Fix the filtering issues with the external data source Collection ([#5890](https://github.com/nocobase/nocobase/pull/5890)) by @chareice

- **[Public forms]** Fix issue where global theme switch affects public form preview page theme ([#5883](https://github.com/nocobase/nocobase/pull/5883)) by @katherinehhh

## [v1.4.10](https://github.com/nocobase/nocobase/compare/v1.4.9...v1.4.10) - 2024-12-12

### 🎉 New Features

- **[Action: Custom request]** Support using 'Current form' variable in custom request buttons ([#5871](https://github.com/nocobase/nocobase/pull/5871)) by @zhangzhonghe

### 🚀 Improvements

- **[Data visualization]** Allows to use foreign keys in query configuration of charts ([#5869](https://github.com/nocobase/nocobase/pull/5869)) by @2013xile

### 🐛 Bug Fixes

- **[client]** Fix issue where file table selector is not display in non-configuration mode when using file select ([#5874](https://github.com/nocobase/nocobase/pull/5874)) by @katherinehhh

- **[Access control]** Fixed issues related to replication records after configuring permissions ([#5839](https://github.com/nocobase/nocobase/pull/5839)) by @chareice

- **[Workflow]** Fix transaction timeout when deleting execution automatically ([#5870](https://github.com/nocobase/nocobase/pull/5870)) by @mytharcher

## [v1.4.9](https://github.com/nocobase/nocobase/compare/v1.4.8...v1.4.9) - 2024-12-12

### 🐛 Bug Fixes

- **[sdk]** Remove the default locale ([#5867](https://github.com/nocobase/nocobase/pull/5867)) by @chenos

- **[client]**
  - Fix the issue where nested association field variables in data scope have empty values ([#5866](https://github.com/nocobase/nocobase/pull/5866)) by @zhangzhonghe

  - Fix  scroll bar appearing when there are fewer columns with a right fixed column ([#5864](https://github.com/nocobase/nocobase/pull/5864)) by @katherinehhh

  - Fix wrong position style of `FilterItem` component ([#5851](https://github.com/nocobase/nocobase/pull/5851)) by @mytharcher

- **[Backup manager]** Fixed backup download failure for sub-apps with custom domain by @gchust

## [v1.4.8](https://github.com/nocobase/nocobase/compare/v1.4.7...v1.4.8) - 2024-12-10

### 🐛 Bug Fixes

- **[client]**
  - Fix data template issue in filter form configured in association field record picker ([#5837](https://github.com/nocobase/nocobase/pull/5837)) by @katherinehhh

  - Fix issue with Markdown string templates not loading data of association data  （External dataSource） ([#5791](https://github.com/nocobase/nocobase/pull/5791)) by @katherinehhh

- **[User data synchronization]** Skip unsupported data types during synchronization instead of throwing an error. ([#5835](https://github.com/nocobase/nocobase/pull/5835)) by @chenzhizdt

- **[Backup manager]**
  - Fixed slow popup of download window for large backup files by @gchust

  - Fixed the issue where restoring a backup sub-application causes all applications to restart by @gchust

## [v1.4.7](https://github.com/nocobase/nocobase/compare/v1.4.6...v1.4.7) - 2024-12-09

### 🐛 Bug Fixes

- **[Mobile]** Fix mobile background color display issue ([#5809](https://github.com/nocobase/nocobase/pull/5809)) by @katherinehhh

## [v1.4.6](https://github.com/nocobase/nocobase/compare/v1.4.5...v1.4.6) - 2024-12-08

### 🐛 Bug Fixes

- **[Action: Import records]** fix import data with table in associations ([#5833](https://github.com/nocobase/nocobase/pull/5833)) by @chareice

- **[Access control]** Fix the problem of using fields to query the relationship in the ACL ([#5832](https://github.com/nocobase/nocobase/pull/5832)) by @chareice

## [v1.4.5](https://github.com/nocobase/nocobase/compare/v1.4.4...v1.4.5) - 2024-12-08

### 🐛 Bug Fixes

- **[Access control]** Refresh the page when the user's role is incorrect ([#5821](https://github.com/nocobase/nocobase/pull/5821)) by @chenos

## [v1.4.4](https://github.com/nocobase/nocobase/compare/v1.4.3...v1.4.4) - 2024-12-08

### 🐛 Bug Fixes

- **[client]**
  - Fix  issue with external data source fields not display in table block ([#5825](https://github.com/nocobase/nocobase/pull/5825)) by @katherinehhh

  - Fix display issue for inherited fields in form configuration ([#5822](https://github.com/nocobase/nocobase/pull/5822)) by @katherinehhh

  - Fix inherited fields not appear in field list and cannot override ([#5800](https://github.com/nocobase/nocobase/pull/5800)) by @katherinehhh

- **[Data visualization]** Fix the issue when formatting timezone-aware date fields in MySQL ([#5829](https://github.com/nocobase/nocobase/pull/5829)) by @2013xile

- **[Workflow]**
  - Fix transaction across data sources which cause collection event error ([#5818](https://github.com/nocobase/nocobase/pull/5818)) by @mytharcher

  - Fix date type missed in date field based schedule configuration ([#5816](https://github.com/nocobase/nocobase/pull/5816)) by @mytharcher

- **[Collection field: Many to many (array)]** Fix the issue where updating m2m array fields in single relation collection does not take effect ([#5820](https://github.com/nocobase/nocobase/pull/5820)) by @2013xile

- **[Calendar]**
  - Fix  error when clicking on a blank date in the calendar ([#5803](https://github.com/nocobase/nocobase/pull/5803)) by @katherinehhh

  - Fix the issue where closing a popup opened through the 'Calendar Block' causes all popups to close ([#5793](https://github.com/nocobase/nocobase/pull/5793)) by @zhangzhonghe

- **[Public forms]** Fix incorrect QC code scan path in sub-application public form ([#5799](https://github.com/nocobase/nocobase/pull/5799)) by @katherinehhh

## [v1.4.3](https://github.com/nocobase/nocobase/compare/v1.4.2...v1.4.3) - 2024-12-05

### 🚀 Improvements

- **[test]** Allow login with role name in test cases ([#5794](https://github.com/nocobase/nocobase/pull/5794)) by @mytharcher

- **[Notification: In-app message]** update titles for detail URLs in in-app-message forms and localization files ([#5742](https://github.com/nocobase/nocobase/pull/5742)) by @sheldon66

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where the token is not cleared after a user without a role encounters a sign in error and clicks the “Sign in with another account” button ([#5790](https://github.com/nocobase/nocobase/pull/5790)) by @2013xile

  - Loss of request headers on silent requests ([#5795](https://github.com/nocobase/nocobase/pull/5795)) by @chenos

  - Blank page when user has no role ([#5797](https://github.com/nocobase/nocobase/pull/5797)) by @chenos

  - Fix scrollbar issue in sub-table with size small under compact theme ([#5796](https://github.com/nocobase/nocobase/pull/5796)) by @katherinehhh

## [v1.4.2](https://github.com/nocobase/nocobase/compare/v1.4.1...v1.4.2) - 2024-12-04

### 🐛 Bug Fixes

- **[Workflow]** Fix async workflow tag disappeared in workflow table ([#5787](https://github.com/nocobase/nocobase/pull/5787)) by @mytharcher

## [v1.4.1](https://github.com/nocobase/nocobase/compare/v1.4.0...v1.4.1) - 2024-12-04

### 🚀 Improvements

- **[cli]** optimize the pkg command ([#5785](https://github.com/nocobase/nocobase/pull/5785)) by @chenos

### 🐛 Bug Fixes

- **[Mobile]** Fix missing date input field in filter operation on mobile ([#5786](https://github.com/nocobase/nocobase/pull/5786)) by @katherinehhh

## [v1.4.0](https://github.com/nocobase/nocobase/compare/v1.3.53...v1.4.0) - 2024-12-03

## 🎉 Major New Features

### Simplify the process of adding and updating plugins

![20241201170853](https://static-docs.nocobase.com/20241201170853.png)

* The plugin list now reads directly from the local directory.
* Combined the processes for adding and updating plugins.
* Interface supports batch activation of plugins.
* Simplified the download and upgrade process for commercial plugins.

Reference documentation:

* [Release Notes / Simplify the process of adding and updating plugins](https://www.nocobase.com/en/blog/simplify-the-process-of-adding-and-updating-plugins)

### Notification

![20241201171806](https://static-docs.nocobase.com/20241201171806.png)

* **Notification: In-app message**
  It supports users in receiving real-time message notifications within the NocoBase application;
* **Notification: Email**
  Used for sending email notifications with built-in SMTP transport. Details;
* **Notification: WeCom**
  Sends notifications through the WeCom channel.

Reference documentation:

* [Notification Management](https://docs.nocobase.com/handbook/notification-manager)

### User Data Synchronization

![20241201172843](https://static-docs.nocobase.com/20241201172843.png)

Reference documentation:

* [User Data Synchronization](https://docs.nocobase.com/handbook/user-data-sync)

### Backup Manager

![20241201170237](https://static-docs.nocobase.com/20241201170237.png)

Reference documentation:

* [Backup Manager](https://docs.nocobase.com/handbook/backups)

### Public Forms

Share public forms externally to collect information from anonymous users.

![20241201165614](https://static-docs.nocobase.com/20241201165614.png)

Reference documentation:

* [Public Forms](https://docs.nocobase.com/handbook/public-forms)

### Data Source: KingbaseES

Use the KingbaseES database as a data source, either as the main database or an external database.

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

Reference documentation:

* [Data Source - KingbaseES](https://docs.nocobase.com/handbook/data-source-kingbase)

### Data Source: External Oracle

Use external Oracle databases as a data source.

![628abc5eb797e6b903d4b548f773a13b.png](https://static-docs.nocobase.com/628abc5eb797e6b903d4b548f773a13b.png)

Reference documentation:

* [External Data Source - Oracle](https://docs.nocobase.com/handbook/data-source-external-oracle)

### Collection Field: Attachments (URL)

Supports URL-based attachments.

![e8772bec3d4b1771c1b21d087c9a4185.png](https://static-docs.nocobase.com/e8772bec3d4b1771c1b21d087c9a4185.png)

Reference documentation:

* [Data Table Field: Attachments (URL)](https://docs.nocobase.com/handbook/field-attachment-url)

### Field Component: Mask

![20241201165938](https://static-docs.nocobase.com/20241201165938.png)

Reference documentation:

* [Field component: Mask](https://docs.nocobase.com/handbook/field-component-mask)

### Workflow: JavaScript

JavaScript nodes allow users to execute JavaScript within a workflow. The script can use variables from upstream nodes in the process as parameters and the return value of the script can be used in downstream nodes.

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

Reference documentation:

* [Workflow - JavaScript](https://docs.nocobase.com/handbook/workflow-javascript)

### Data Visualization: ECharts

Added ECharts, supporting funnel, radar and more charts, and providing more user-friendly configurations.

![data-visualization-echarts](https://static-docs.nocobase.com/202410091022965.png)

Reference documentation:

* [Data Visualization: Echarts](https://docs.nocobase.com/handbook/data-visualization-echarts)

### Block: Multi-step form

![a503e153e8d714b9ca56f512142aeef1.png](https://static-docs.nocobase.com/a503e153e8d714b9ca56f512142aeef1.png)

Reference documentation:

* [Multi-step form](https://docs.nocobase.com/handbook/block-multi-step-from)

### Block: Action Panel

Designed to house various quick actions, currently supports:

* Link
* Scan QR code
* Popup
* Custom request

Supports both grid and list layouts

![9942e6741e99195713f9e2981b02f228.png](https://static-docs.nocobase.com/9942e6741e99195713f9e2981b02f228.png)

Reference documentation:

* [Action Panel](https://docs.nocobase.com/handbook/block-action-panel)

## [v1.3.55](https://github.com/nocobase/nocobase/compare/v1.3.54...v1.3.55) - 2024-12-03

### 🚀 Improvements

- **[client]** To use icons with more accurate meanings for block initializers ([#5757](https://github.com/nocobase/nocobase/pull/5757)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - Fix E2E cases based on changed icons ([#5768](https://github.com/nocobase/nocobase/pull/5768)) by @mytharcher

  - Fix select field to display blank when data is empty ([#5762](https://github.com/nocobase/nocobase/pull/5762)) by @katherinehhh

- **[database]** Fix update hasOne/belongsTo association values without foreign key ([#5754](https://github.com/nocobase/nocobase/pull/5754)) by @chareice

- **[Data source manager]** Fix  incorrect display of source key ([#5771](https://github.com/nocobase/nocobase/pull/5771)) by @katherinehhh

- **[Workflow: Custom action event]**
  - Allow all roles to triggering custom action event in external data sources by @mytharcher

  - Fix default data source as main by @mytharcher

  - Fix data source error when not matched by @mytharcher

  - Fix custom action trigger not triggering on association by @mytharcher

## [v1.3.53](https://github.com/nocobase/nocobase/compare/v1.3.52...v1.3.53) - 2024-11-28

### 🚀 Improvements

- **[client]**
  - export essential hook ([#5702](https://github.com/nocobase/nocobase/pull/5702)) by @mytharcher

  - china region field plugin remove from built-in plugins ([#5693](https://github.com/nocobase/nocobase/pull/5693)) by @katherinehhh

- **[Workflow: Pre-action event]** remove waring log in request interceptor by @mytharcher

### 🐛 Bug Fixes

- **[cli]** Daemon mode does not delete sock files ([#5750](https://github.com/nocobase/nocobase/pull/5750)) by @chenos

- **[client]**
  - Fix issue with association fields affecting each other when  multiple association fields has the same target collection ([#5744](https://github.com/nocobase/nocobase/pull/5744)) by @katherinehhh

  - Fix issue with checkbox alignment in sub-table ([#5735](https://github.com/nocobase/nocobase/pull/5735)) by @katherinehhh

  - Fix foreign key field display issue in the data selector ([#5734](https://github.com/nocobase/nocobase/pull/5734)) by @katherinehhh

  - Fix adjust feedbackLayout to improve validation messaging in sub-table ([#5700](https://github.com/nocobase/nocobase/pull/5700)) by @katherinehhh

- **[server]** Load plugins in dependency order ([#5706](https://github.com/nocobase/nocobase/pull/5706)) by @chenos

- **[Block: Map]** Fix error when changing zoom levels in Google Maps ([#5722](https://github.com/nocobase/nocobase/pull/5722)) by @katherinehhh

- **[Data source: Main]** Fix infer field name in view collection ([#5729](https://github.com/nocobase/nocobase/pull/5729)) by @chareice

- **[File manager]** when the endpoint is not empty, forcePathStyle is set to true ([#5712](https://github.com/nocobase/nocobase/pull/5712)) by @chenos

## [v1.3.52](https://github.com/nocobase/nocobase/compare/v1.3.51...v1.3.52) - 2024-11-21

### 🚀 Improvements

- **[Workflow]**
  - remove page limit in query node ([#5694](https://github.com/nocobase/nocobase/pull/5694)) by @mytharcher

  - change executions not to be deleted when workflow deleted ([#5666](https://github.com/nocobase/nocobase/pull/5666)) by @mytharcher

- **[Data source: REST API]** Optimize REST API plugin text descriptions by @katherinehhh

## [v1.3.51](https://github.com/nocobase/nocobase/compare/v1.3.50-beta...v1.3.51) - 2024-11-19

### 🐛 Bug Fixes

- **[client]**
  - Fix  field permission check not affected by association field context ([#5672](https://github.com/nocobase/nocobase/pull/5672)) by @katherinehhh

  - Fix linkage rule saving empty value changes to static empty value ([#5667](https://github.com/nocobase/nocobase/pull/5667)) by @katherinehhh

- **[Collection field: Many to many (array)]** Fix the issue where retrieving records in an association collection with many to many (array) fields causes an error ([#5661](https://github.com/nocobase/nocobase/pull/5661)) by @2013xile

- **[Block: Gantt]** Fix gantt block template incorrectly calls the calendar block when adding ([#5673](https://github.com/nocobase/nocobase/pull/5673)) by @katherinehhh

- **[Data visualization]** Fix the issue where data transformations do not work on tooltip in dual-axes charts ([#5649](https://github.com/nocobase/nocobase/pull/5649)) by @2013xile

## [v1.3.50-beta](https://github.com/nocobase/nocobase/compare/v1.3.49-beta...v1.3.50-beta) - 2024-11-14

### 🐛 Bug Fixes

- **[client]** Fix issue preventing linkage rule title from being cleared during editing ([#5644](https://github.com/nocobase/nocobase/pull/5644)) by @katherinehhh

- **[Comments]** Fix data scope setting not working in comment block by @katherinehhh

## [v1.3.49-beta](https://github.com/nocobase/nocobase/compare/v1.3.48-beta...v1.3.49-beta) - 2024-11-13

### 🚀 Improvements

- **[client]** support one-to-one and many-to-many (array) field to use file collection ([#5637](https://github.com/nocobase/nocobase/pull/5637)) by @mytharcher

- **[evaluators]** use Formula.js as default evaluator in calculation node ([#5626](https://github.com/nocobase/nocobase/pull/5626)) by @mytharcher

### 🐛 Bug Fixes

- **[client]** Fix  reset issue that reverts filter button title to default ([#5635](https://github.com/nocobase/nocobase/pull/5635)) by @katherinehhh

- **[Action: Import records]** Fixed the issue that many-to-many relationship data cannot be imported through the id field ([#5623](https://github.com/nocobase/nocobase/pull/5623)) by @chareice

## [v1.3.48-beta](https://github.com/nocobase/nocobase/compare/v1.3.47-beta...v1.3.48-beta) - 2024-11-11

### 🚀 Improvements

- **[client]** support hiding menu items ([#5624](https://github.com/nocobase/nocobase/pull/5624)) by @chenos

- **[server]** add  DB_SQL_BENCHMARK  environment variable ([#5615](https://github.com/nocobase/nocobase/pull/5615)) by @chareice

### 🐛 Bug Fixes

- **[client]** support file collection as target of one-to-many association ([#5619](https://github.com/nocobase/nocobase/pull/5619)) by @mytharcher

- **[Action: Import records]** Fixed the issue that many-to-many relationship data cannot be imported through the id field ([#5623](https://github.com/nocobase/nocobase/pull/5623)) by @chareice

## [v1.3.47-beta](https://github.com/nocobase/nocobase/compare/v1.3.46-beta...v1.3.47-beta) - 2024-11-08

### 🚀 Improvements

- **[Authentication]** Optimize error message for sign in and sign up ([#5612](https://github.com/nocobase/nocobase/pull/5612)) by @2013xile

### 🐛 Bug Fixes

- **[client]**
  - Fix default value issues in subtable ([#5607](https://github.com/nocobase/nocobase/pull/5607)) by @zhangzhonghe

  - Fix issue with fuzzy search support for association fields with string type title field ([#5611](https://github.com/nocobase/nocobase/pull/5611)) by @katherinehhh

- **[Authentication]** Fix the issue where users can't change password when signing in with a non-password authenticator ([#5609](https://github.com/nocobase/nocobase/pull/5609)) by @2013xile

## [v1.3.45-beta](https://github.com/nocobase/nocobase/compare/v1.3.44-beta...v1.3.45-beta) - 2024-11-06

### 🐛 Bug Fixes

- **[client]** permission for the association table field in the table is based on the permission of the corresponding association field ([#5569](https://github.com/nocobase/nocobase/pull/5569)) by @katherinehhh

- **[Action: Export records]** Fix export with i18n ([#5591](https://github.com/nocobase/nocobase/pull/5591)) by @chareice

- **[Action: Import records]** fix issue with import belongs to association ([#5417](https://github.com/nocobase/nocobase/pull/5417)) by @chareice

## [v1.3.44-beta](https://github.com/nocobase/nocobase/compare/v1.3.43-beta...v1.3.44-beta) - 2024-11-05

### 🎉 New Features

- **[Auth: OIDC]** Add an option "enable RP-initiated logout" by @2013xile

### 🐛 Bug Fixes

- **[client]** Fix filter issue when setting single-select field as title field in association select ([#5581](https://github.com/nocobase/nocobase/pull/5581)) by @katherinehhh

## [v1.3.43-beta](https://github.com/nocobase/nocobase/compare/v1.3.42-beta...v1.3.43-beta) - 2024-11-05

### 🚀 Improvements

- **[client]** numeric precision can be configured to 8 digits ([#5552](https://github.com/nocobase/nocobase/pull/5552)) by @chenos

### 🐛 Bug Fixes

- **[client]** Fix linkage style not updating in form. ([#5539](https://github.com/nocobase/nocobase/pull/5539)) by @sheldon66

- **[Auth: API keys]** Fix the URL path for API keys settings page ([#5562](https://github.com/nocobase/nocobase/pull/5562)) by @2013xile

- **[Mobile]** Fix the issue of preview images being covered by page ([#5535](https://github.com/nocobase/nocobase/pull/5535)) by @zhangzhonghe

- **[Block: Map]** resolve map rendering in sub-details and incorrect value display for empty fields ([#5526](https://github.com/nocobase/nocobase/pull/5526)) by @katherinehhh

- **[Collection: Tree]** Fix errors when updating path collection ([#5551](https://github.com/nocobase/nocobase/pull/5551)) by @2013xile

## [v1.3.42-beta](https://github.com/nocobase/nocobase/compare/v1.3.41-beta...v1.3.42-beta) - 2024-10-28

### 🐛 Bug Fixes

- **[Collection: Tree]** Fix the issue where node paths are not updated when disassociate children ([#5522](https://github.com/nocobase/nocobase/pull/5522)) by @2013xile

## [v1.3.41-beta](https://github.com/nocobase/nocobase/compare/v1.3.40-beta...v1.3.41-beta) - 2024-10-27

### 🚀 Improvements

- **[Access control]** Optimize performance for large tables in acl ([#5496](https://github.com/nocobase/nocobase/pull/5496)) by @chareice

## [v1.3.40-beta](https://github.com/nocobase/nocobase/compare/v1.3.39-beta...v1.3.40-beta) - 2024-10-25

### 🎉 New Features

- **[Auth: OIDC]** Add an option for allowing skip ssl verification by @2013xile

### 🚀 Improvements

- **[client]** show disabled unchecked checkbox for unselected fields ([#5503](https://github.com/nocobase/nocobase/pull/5503)) by @katherinehhh

### 🐛 Bug Fixes

- **[database]** Fix the issue where string operators "contains" and "does not contain do not properly handle `null` values ([#5509](https://github.com/nocobase/nocobase/pull/5509)) by @2013xile

- **[client]** Fix linkage rule to correctly evaluate URL parameter variables ([#5504](https://github.com/nocobase/nocobase/pull/5504)) by @katherinehhh

- **[Block: Map]** Fixed the issue where some maps are displayed incorrectly when multiple maps exist due to multiple calls to the `load` method of AMap ([#5490](https://github.com/nocobase/nocobase/pull/5490)) by @Cyx649312038

## [v1.3.39-beta](https://github.com/nocobase/nocobase/compare/v1.3.38-beta...v1.3.39-beta) - 2024-10-24

### 🐛 Bug Fixes

- **[client]** Fix the issue where filter blocks cannot be added in the popup ([#5502](https://github.com/nocobase/nocobase/pull/5502)) by @zhangzhonghe

## [v1.3.38-beta](https://github.com/nocobase/nocobase/compare/v1.3.37-beta...v1.3.38-beta) - 2024-10-24

### 🐛 Bug Fixes

- **[client]**
  - pagination issue in list block with simple pagination collection ([#5500](https://github.com/nocobase/nocobase/pull/5500)) by @katherinehhh

  - In non-config mode, display only the current collection  in the edit form. ([#5499](https://github.com/nocobase/nocobase/pull/5499)) by @katherinehhh

- **[Workflow: HTTP request node]** fix special white space appears when paste content into variable textarea caused issue ([#5497](https://github.com/nocobase/nocobase/pull/5497)) by @mytharcher

- **[Departments]** Fix the issue of incorrect external data source permissions check under the department role by @2013xile

## [v1.3.37-beta](https://github.com/nocobase/nocobase/compare/v1.3.36-beta...v1.3.37-beta) - 2024-10-23

### 🚀 Improvements

- **[client]** Adjust hint in configuration panel of binding workflow to a button ([#5494](https://github.com/nocobase/nocobase/pull/5494)) by @mytharcher

### 🐛 Bug Fixes

- **[File manager]** fix upload and destroy file record within an association block ([#5493](https://github.com/nocobase/nocobase/pull/5493)) by @mytharcher

## [v1.3.36-beta](https://github.com/nocobase/nocobase/compare/v1.3.35-beta...v1.3.36-beta) - 2024-10-22

### 🐛 Bug Fixes

- **[Collection: Tree]** Fix the issue where the path collection for the inheritance tree collection is not automatically created ([#5486](https://github.com/nocobase/nocobase/pull/5486)) by @2013xile

- **[Calendar]** show pagination bar with data in the table ([#5480](https://github.com/nocobase/nocobase/pull/5480)) by @katherinehhh

- **[File manager]** fix file can not be uploaded due to rule hook. ([#5460](https://github.com/nocobase/nocobase/pull/5460)) by @mytharcher

- **[Collection field: Formula]** Fix incorrect formula calculation in nested multi-level sub-table ([#5469](https://github.com/nocobase/nocobase/pull/5469)) by @gu-zhichao

## [v1.3.35-beta](https://github.com/nocobase/nocobase/compare/v1.3.34-beta...v1.3.35-beta) - 2024-10-21

### 🚀 Improvements

- **[Workflow: mailer node]** add placeholder to mailer node ([#5470](https://github.com/nocobase/nocobase/pull/5470)) by @mytharcher

## [v1.3.34-beta](https://github.com/nocobase/nocobase/compare/v1.3.33-beta...v1.3.34-beta) - 2024-10-21

### 🎉 New Features

- **[test]** Association fields in filter forms support configuring whether multiple selection is allowed ([#5451](https://github.com/nocobase/nocobase/pull/5451)) by @zhangzhonghe

- **[client]** Add a variable named "Parent object" ([#5449](https://github.com/nocobase/nocobase/pull/5449)) by @zhangzhonghe
Reference: [Parent object](https://docs.nocobase.com/handbook/ui/variables#parent-object)
### 🐛 Bug Fixes

- **[client]**
  - Fix URL search params variables not being parsed ([#5454](https://github.com/nocobase/nocobase/pull/5454)) by @zhangzhonghe

  - Fix data clearing bug when selecting association data with data scope in nested sub-tables ([#5441](https://github.com/nocobase/nocobase/pull/5441)) by @katherinehhh

  - fix selected background color of table row ([#5445](https://github.com/nocobase/nocobase/pull/5445)) by @mytharcher

- **[Block: Map]** remove zoom level configuration for map fields in table column ([#5457](https://github.com/nocobase/nocobase/pull/5457)) by @katherinehhh

- **[File manager]** fix calling storage rule hook on read-pretty fields ([#5447](https://github.com/nocobase/nocobase/pull/5447)) by @mytharcher

- **[Data source: Main]** fix e2e case failed due to component changed ([#5437](https://github.com/nocobase/nocobase/pull/5437)) by @mytharcher

## [v1.3.33-beta](https://github.com/nocobase/nocobase/compare/v1.3.32-beta...v1.3.33-beta) - 2024-10-16

### 🚀 Improvements

- **[Workflow]** add association field related hint to the batch mode of update node ([#5426](https://github.com/nocobase/nocobase/pull/5426)) by @mytharcher

### 🐛 Bug Fixes

- **[client]**
  - fix the issue of Edit profile drawer being covered by subpage ([#5409](https://github.com/nocobase/nocobase/pull/5409)) by @zhangzhonghe

  - Workflow node variables do not display inherited collection fields ([#5415](https://github.com/nocobase/nocobase/pull/5415)) by @chenos

  - pagination not resetting after clearing filter data in table filtering block ([#5411](https://github.com/nocobase/nocobase/pull/5411)) by @katherinehhh

- **[File manager]** remove the 20 items limit of loading storages in file template collection configuration ([#5430](https://github.com/nocobase/nocobase/pull/5430)) by @mytharcher

- **[Action: Duplicate record]** Fix the issue where the bulk edit popup does not display content ([#5412](https://github.com/nocobase/nocobase/pull/5412)) by @zhangzhonghe

- **[Data visualization]** Fix the issue of default values not displaying in the chart filter block ([#5405](https://github.com/nocobase/nocobase/pull/5405)) by @zhangzhonghe

## [v1.3.32-beta](https://github.com/nocobase/nocobase/compare/v1.3.31-beta...v1.3.32-beta) - 2024-10-13

### 🐛 Bug Fixes

- **[client]** required relational field still triggers validation error after selecting a value with a variable in data scope ([#5399](https://github.com/nocobase/nocobase/pull/5399)) by @katherinehhh

## [v1.3.31-beta](https://github.com/nocobase/nocobase/compare/v1.3.30-beta...v1.3.31-beta) - 2024-10-11

### 🐛 Bug Fixes

- **[client]** Fix the issue where using the chinaRegion field in the filter form fails to correctly filter out values ([#5390](https://github.com/nocobase/nocobase/pull/5390)) by @zhangzhonghe

- **[Action: Import records]** fix import error with wps file ([#5397](https://github.com/nocobase/nocobase/pull/5397)) by @chareice

## [v1.3.30-beta](https://github.com/nocobase/nocobase/compare/v1.3.29-beta...v1.3.30-beta) - 2024-10-11

### 🐛 Bug Fixes

- **[client]**
  - Fix the rendering error that occurs when displaying file collection relationship fields on mobile devices ([#5387](https://github.com/nocobase/nocobase/pull/5387)) by @zhangzhonghe

  - Fix Create Block menu not loading more data collections ([#5388](https://github.com/nocobase/nocobase/pull/5388)) by @zhangzhonghe

- **[Workflow: Custom action event]**
  - Fix custom workflow event did not redirect after successful submission by @katherinehhh

  - Fix custom workflow event did not redirect after successful submission by @katherinehhh

## [v1.3.29-beta](https://github.com/nocobase/nocobase/compare/v1.3.28-beta...v1.3.29-beta) - 2024-10-10

### 🚀 Improvements

- **[client]** Date variables are also not prohibited in create form ([#5376](https://github.com/nocobase/nocobase/pull/5376)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[Workflow: SQL node]** fix error when no result when calling stored procedure in SQL instruction ([#5385](https://github.com/nocobase/nocobase/pull/5385)) by @mytharcher

- **[Workflow]** fix date field based schedule trigger caused app crash, and also support other data source ([#5364](https://github.com/nocobase/nocobase/pull/5364)) by @mytharcher

## [v1.3.28-beta](https://github.com/nocobase/nocobase/compare/v1.3.27-beta...v1.3.28-beta) - 2024-10-09

### 🚀 Improvements

- **[client]** Save cdn links as local resources to prevent requesting external resources when deploying on the intranet ([#5375](https://github.com/nocobase/nocobase/pull/5375)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue where popups opened in the "Users & Permissions" configuration page are obscured by other popups ([#5373](https://github.com/nocobase/nocobase/pull/5373)) by @zhangzhonghe

  - Fix the problem that after deleting a tab in a subpage, it does not take effect after opening it again ([#5362](https://github.com/nocobase/nocobase/pull/5362)) by @zhangzhonghe

  - Fix the issue where inherited collection association fields cannot properly use variables ([#5346](https://github.com/nocobase/nocobase/pull/5346)) by @zhangzhonghe

  - Fix the issue of current and association collection fields affecting each other in configuration ([#5343](https://github.com/nocobase/nocobase/pull/5343)) by @katherinehhh

- **[Action: Import records]** fixed issue with incorrect results for importing large dates ([#5356](https://github.com/nocobase/nocobase/pull/5356)) by @chareice

- **[Workflow]** fix switching component of association field in assigned fields caused page crash in create/update node ([#5366](https://github.com/nocobase/nocobase/pull/5366)) by @mytharcher

- **[Block: Gantt]** Fix the issue where opening a popup in the Gantt block and then closing it causes the subpage to also close ([#5370](https://github.com/nocobase/nocobase/pull/5370)) by @zhangzhonghe

## [v1.3.27-beta](https://github.com/nocobase/nocobase/compare/v1.3.26-beta...v1.3.27-beta) - 2024-09-30

### 🐛 Bug Fixes

- **[client]** Fix variable "Table selected records" ([#5337](https://github.com/nocobase/nocobase/pull/5337)) by @zhangzhonghe

- **[Workflow: Custom action event]** fix custom action event not triggers in association block by @mytharcher

## [v1.3.26-beta](https://github.com/nocobase/nocobase/compare/v1.3.25-beta...v1.3.26-beta) - 2024-09-29

### 🚀 Improvements

- **[client]** Hide scrollbars on mobile ([#5339](https://github.com/nocobase/nocobase/pull/5339)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - Fix the issue of not being able to open sub-pages in embedded pages ([#5335](https://github.com/nocobase/nocobase/pull/5335)) by @zhangzhonghe

  - Fix the issue of pop-up windows being obscured ([#5338](https://github.com/nocobase/nocobase/pull/5338)) by @zhangzhonghe

  - Fix the issue of abnormal style when creating blocks with data templates in mobile subpages ([#5340](https://github.com/nocobase/nocobase/pull/5340)) by @zhangzhonghe

  - Fix the issue of not refreshing the page block data when closing a subpage via the page menu ([#5331](https://github.com/nocobase/nocobase/pull/5331)) by @zhangzhonghe

- **[Action: Export records]** fix export format for decimal type fields ([#5316](https://github.com/nocobase/nocobase/pull/5316)) by @chareice

- **[Block: Kanban]** Fix the issue that the popup window could not be opened after clicking on the Kanban card in the embedded page ([#5326](https://github.com/nocobase/nocobase/pull/5326)) by @zhangzhonghe

## [v1.3.25-beta](https://github.com/nocobase/nocobase/compare/v1.3.24-beta...v1.3.25-beta) - 2024-09-25

### 🚀 Improvements

- **[client]** update and improve Japanese translations in ja_JP files ([#5292](https://github.com/nocobase/nocobase/pull/5292)) by @Albert-mah

- **[Workflow]** add error handling for unregistered node type ([#5319](https://github.com/nocobase/nocobase/pull/5319)) by @mytharcher

### 🐛 Bug Fixes

- **[client]** Fix for not displaying full fields in variables ([#5310](https://github.com/nocobase/nocobase/pull/5310)) by @zhangzhonghe

- **[Workflow]** fix non-existed field in collection trigger causes error ([#5318](https://github.com/nocobase/nocobase/pull/5318)) by @mytharcher

- **[Action: Export records]** Fix fields from assicated tables are not processed by the field interface ([#5296](https://github.com/nocobase/nocobase/pull/5296)) by @gchust

## [v1.3.24-beta](https://github.com/nocobase/nocobase/compare/v1.3.23-beta...v1.3.24-beta) - 2024-09-23

### 🐛 Bug Fixes

- **[client]**
  - markdown report error with using `#each` in handlebars ([#5305](https://github.com/nocobase/nocobase/pull/5305)) by @katherinehhh

  - Fix issue where the collection from external  data source does not support sorting on table columns ([#5293](https://github.com/nocobase/nocobase/pull/5293)) by @katherinehhh

- **[Data visualization]** Fix style issues of chart blocks when using dark mode themes ([#5302](https://github.com/nocobase/nocobase/pull/5302)) by @2013xile

## [v1.3.23-beta](https://github.com/nocobase/nocobase/compare/v1.3.22-beta...v1.3.23-beta) - 2024-09-19

### 🚀 Improvements

- **[Users]** Optimize performance for rendering the user management table ([#5276](https://github.com/nocobase/nocobase/pull/5276)) by @2013xile

- **[Departments]** Optimize performance for rendering the user table in department management by @2013xile

### 🐛 Bug Fixes

- **[client]**
  - Fix incorrect `rowKey` of the `General action permissions table` in Users & Permissions page ([#5287](https://github.com/nocobase/nocobase/pull/5287)) by @gchust

  - Fix the issue where setting a date variable for the date field in the filter form results in incorrect filter results ([#5257](https://github.com/nocobase/nocobase/pull/5257)) by @zhangzhonghe

  - column width issue with scroll.y when table has no data ([#5256](https://github.com/nocobase/nocobase/pull/5256)) by @katherinehhh

  - Fix the problem of blank rows at the beginning of a table block ([#5284](https://github.com/nocobase/nocobase/pull/5284)) by @zhangzhonghe

- **[create-nocobase-app]** Fix the issue where the popup for configuring Sequence rules lacked a submit button when adding a new Sequence field ([#5281](https://github.com/nocobase/nocobase/pull/5281)) by @zhangzhonghe

- **[database]** import with checkbox field ([#4992](https://github.com/nocobase/nocobase/pull/4992)) by @chareice

- **[evaluators]** Fix error caused by `Matrix` type from mathjs ([#5270](https://github.com/nocobase/nocobase/pull/5270)) by @mytharcher

- **[Calendar]** Cannot select the option to delete the schedule popup ([#5274](https://github.com/nocobase/nocobase/pull/5274)) by @katherinehhh

- **[Action: Export records]** Fix missing request context when generating data sheet in export action ([#5286](https://github.com/nocobase/nocobase/pull/5286)) by @gchust

## [v1.3.22-beta](https://github.com/nocobase/nocobase/compare/v1.3.21-beta...v1.3.22-beta) - 2024-09-12

### 🎉 New Features

- **[Action: Custom request]** Support for API token variables in the "Custom Request Button" configuration ([#5263](https://github.com/nocobase/nocobase/pull/5263)) by @zhangzhonghe
Reference: [Custom request](https://docs.nocobase.com/handbook/action-custom-request)
### 🚀 Improvements

- **[Collection field: Markdown(Vditor)]** Support Vidtor when selecting fields in the UI for external data sources ([#5246](https://github.com/nocobase/nocobase/pull/5246)) by @katherinehhh

### 🐛 Bug Fixes

- **[Calendar]** issue where the calendar block cannot display correctly when the end date crosses months ([#5239](https://github.com/nocobase/nocobase/pull/5239)) by @katherinehhh

## [v1.3.21-beta](https://github.com/nocobase/nocobase/compare/v1.3.20-beta...v1.3.21-beta) - 2024-09-10

### 🐛 Bug Fixes

- **[client]** Fix error when using linkage rules (NocoBase installed via create-nocobase-app) ([#5249](https://github.com/nocobase/nocobase/pull/5249)) by @zhangzhonghe

## [v1.3.20-beta](https://github.com/nocobase/nocobase/compare/v1.3.19-beta...v1.3.20-beta) - 2024-09-10

### 🚀 Improvements

- **[client]** Support for displaying deeper level association fields in data blocks ([#5243](https://github.com/nocobase/nocobase/pull/5243)) by @zhangzhonghe

### 🐛 Bug Fixes

- **[client]**
  - Menu modifications do not take effect in real-time ([#5207](https://github.com/nocobase/nocobase/pull/5207)) by @katherinehhh

  - Support association field preloading in Handlebars templates ([#5236](https://github.com/nocobase/nocobase/pull/5236)) by @katherinehhh

- **[Data visualization]** Fix incorrect data source context when multiple data sources exist ([#5237](https://github.com/nocobase/nocobase/pull/5237)) by @2013xile

## [v1.3.19-beta](https://github.com/nocobase/nocobase/compare/v1.3.18-beta...v1.3.19-beta) - 2024-09-08

### 🐛 Bug Fixes

- **[client]** Fix URL anomalies caused by using popups together with Link buttons ([#5219](https://github.com/nocobase/nocobase/pull/5219)) by @zhangzhonghe

## [v1.3.18-beta](https://github.com/nocobase/nocobase/compare/v1.3.17-beta...v1.3.18-beta) - 2024-09-08

### 🐛 Bug Fixes

- **[Collection field: Many to many (array)]** Fix the error when deleting a collection contains m2m array fields ([#5231](https://github.com/nocobase/nocobase/pull/5231)) by @2013xile

## [v1.3.17-beta](https://github.com/nocobase/nocobase/compare/v1.3.16-beta...v1.3.17-beta) - 2024-09-07

### 🎉 New Features

- **[client]** Supports configuration of linkage rules in sub-forms and sub-forms. ([#5159](https://github.com/nocobase/nocobase/pull/5159)) by @zhangzhonghe

### 🚀 Improvements

- **[client]**
  - default time for display is 00:00:00 ([#5226](https://github.com/nocobase/nocobase/pull/5226)) by @chenos

  - plugins can also be enabled when the plugin dependency version is inconsistent ([#5225](https://github.com/nocobase/nocobase/pull/5225)) by @chenos

- **[server]** provide more user-friendly application-level error messages ([#5220](https://github.com/nocobase/nocobase/pull/5220)) by @chenos

### 🐛 Bug Fixes

- **[client]** Fix the "Maximum call stack size exceeded" error that occurs in the details block ([#5228](https://github.com/nocobase/nocobase/pull/5228)) by @zhangzhonghe

- **[Collection field: Many to many (array)]** Fix the error where setting a field of `uid` type as target key for a many to many (array) field ([#5229](https://github.com/nocobase/nocobase/pull/5229)) by @2013xile

- **[UI schema storage]** Fix the issue that member roles clicking the button reported no permission ([#5206](https://github.com/nocobase/nocobase/pull/5206)) by @zhangzhonghe

- **[Workflow]** Fix trigger type column showing wrong text after new workflow created ([#5222](https://github.com/nocobase/nocobase/pull/5222)) by @mytharcher

- **[Users]** Remove phone format validation when editing user phones in user management ([#5221](https://github.com/nocobase/nocobase/pull/5221)) by @2013xile

## [v1.3.16-beta](https://github.com/nocobase/nocobase/compare/v1.3.15-beta...v1.3.16-beta) - 2024-09-06

### 🚀 Improvements

- **[client]**
  - Placeholder added when the user has UI configuration permissions but no view permissions for the collection ([#5208](https://github.com/nocobase/nocobase/pull/5208)) by @katherinehhh

  - Display system title when logo is missing. ([#5175](https://github.com/nocobase/nocobase/pull/5175)) by @maoyutofu

- **[Authentication]** support line break in system title ([#5211](https://github.com/nocobase/nocobase/pull/5211)) by @chenos

- **[Workflow: SQL node]** Change result data structure of SQL node to only contains data. ([#5189](https://github.com/nocobase/nocobase/pull/5189)) by @mytharcher
Reference: [SQL Operation](https://docs.nocobase.com/handbook/workflow/nodes/sql)
- **[Access control]** Make the `Permissions` Tab pannel of the `Users & Permissions` configuration page expandable. ([#5216](https://github.com/nocobase/nocobase/pull/5216)) by @zhangzhonghe
Reference: [Development Guide](https://docs.nocobase.com/handbook/acl#development-guide)
- **[Action: Batch edit]** batch updated and batch edit, change 'All' to 'Entire collection" ([#5200](https://github.com/nocobase/nocobase/pull/5200)) by @katherinehhh

### 🐛 Bug Fixes

- **[client]**
  - component display error when switching assignment types in linkage rules ([#5180](https://github.com/nocobase/nocobase/pull/5180)) by @katherinehhh

  - Fix an issue where using variables in data scope reported an error. ([#5195](https://github.com/nocobase/nocobase/pull/5195)) by @zhangzhonghe

  - issue with  custom request refreshDataBlockRequest ([#5188](https://github.com/nocobase/nocobase/pull/5188)) by @katherinehhh

- **[Data visualization]** Fixed the issue of getting wrong value when aggregating select fields ([#5214](https://github.com/nocobase/nocobase/pull/5214)) by @2013xile

- **[Data source manager]** Fixed incorrect `rowKey` of the datasource table in `Users & Permissions` page ([#5215](https://github.com/nocobase/nocobase/pull/5215)) by @gchust

- **[Workflow: HTTP request node]** Fix error when using non-string variable in request parameters. ([#5204](https://github.com/nocobase/nocobase/pull/5204)) by @mytharcher

- **[Collection field: Formula]** fix formula field serve test ([#5197](https://github.com/nocobase/nocobase/pull/5197)) by @katherinehhh

- **[App backup & restore (deprecated)]** fix test case errors ([#5201](https://github.com/nocobase/nocobase/pull/5201)) by @chenos

- **[Data source: REST API]**
  - collection name should be disabled in rest-api collection by @katherinehhh

  - Rest api locale improve by @katherinehhh

## [v1.3.15-beta](https://github.com/nocobase/nocobase/compare/v1.3.14-beta...v1.3.15-beta) - 2024-09-04

### 🐛 Bug Fixes

- **[Workflow]** Fix missed fields in workflow variables. ([#5187](https://github.com/nocobase/nocobase/pull/5187)) by @mytharcher

- **[Collection field: Markdown(Vditor)]** issue with markdown(Vditor) ([#5176](https://github.com/nocobase/nocobase/pull/5176)) by @katherinehhh

## [v1.3.14-beta](https://github.com/nocobase/nocobase/compare/v1.3.13-beta...v1.3.14-beta) - 2024-09-03

### 🎉 New Features

- **[client]** Add support for many-to-many association fields. ([#5178](https://github.com/nocobase/nocobase/pull/5178)) by @zhangzhonghe

### 🚀 Improvements

- **[Action: Custom request]** remove linkageRule for custom request in create form ([#5179](https://github.com/nocobase/nocobase/pull/5179)) by @katherinehhh

### 🐛 Bug Fixes

- **[Collection field: Formula]** formula field adaptation time field ([#5168](https://github.com/nocobase/nocobase/pull/5168)) by @katherinehhh

## [v1.3.13-beta](https://github.com/nocobase/nocobase/compare/v1.3.12-beta...v1.3.13-beta) - 2024-09-03

### 🐛 Bug Fixes

- **[Action: Export records]** Fixed incorrect export of relational data ([#5170](https://github.com/nocobase/nocobase/pull/5170)) by @chareice

## [v1.3.12-beta](https://github.com/nocobase/nocobase/compare/v1.3.11-beta...v1.3.12-beta) - 2024-09-01

### Merged

- fix(mobile): fix permission [`#5163`](https://github.com/nocobase/nocobase/pull/5163)

### Commits

- chore(versions): 😊 publish v1.3.12-beta [`774c296`](https://github.com/nocobase/nocobase/commit/774c2961d47aa17d1a9da7a595bb070f34aee11b)
- chore: update changelog [`7f9a116`](https://github.com/nocobase/nocobase/commit/7f9a11698f3126257529ce4a91670239900f2ec3)
- chore: update e2e test [`49db3e4`](https://github.com/nocobase/nocobase/commit/49db3e490821cd59aaba2f58ed2bb78051a86ad9)

## [v1.3.11-beta](https://github.com/nocobase/nocobase/compare/v1.3.10-beta...v1.3.11-beta) - 2024-08-31

### Commits

- chore(versions): 😊 publish v1.3.11-beta [`517e199`](https://github.com/nocobase/nocobase/commit/517e199ed7a8e7dc81a06c50389ef41b6891b133)
- chore: update changelog [`373f517`](https://github.com/nocobase/nocobase/commit/373f51773b772886cc8db3cb50184562113c62eb)

## [v1.3.10-beta](https://github.com/nocobase/nocobase/compare/v1.3.9-beta...v1.3.10-beta) - 2024-08-31

### Merged

- fix:  issue with association select data scope linkage in sub-table [`#5160`](https://github.com/nocobase/nocobase/pull/5160)
- fix: issue in  data selector other block  should display  Markdown, not 'Add Text' [`#5161`](https://github.com/nocobase/nocobase/pull/5161)
- fix(data-vi): issue of parsing variables in filter block [`#5157`](https://github.com/nocobase/nocobase/pull/5157)
- fix(data-vi): transform the values of decimal fields from type string to number [`#5155`](https://github.com/nocobase/nocobase/pull/5155)

### Commits

- chore(versions): 😊 publish v1.3.10-beta [`5afac9c`](https://github.com/nocobase/nocobase/commit/5afac9cf82c78db4a7ee8ddb01a60597939ac82d)
- chore: update changelog [`6fceac1`](https://github.com/nocobase/nocobase/commit/6fceac15827a10b6fba65e98314c37f3f9e697ba)
- chore: update comment [`6e45780`](https://github.com/nocobase/nocobase/commit/6e4578056556c1c60ac721ff990a81ed37339074)

## [v1.3.9-beta](https://github.com/nocobase/nocobase/compare/v1.3.8-beta...v1.3.9-beta) - 2024-08-29

### Merged

- fix(mobile): should not force redirect to mobile page [`#5152`](https://github.com/nocobase/nocobase/pull/5152)
- chore: support year data type in mysql [`#5123`](https://github.com/nocobase/nocobase/pull/5123)

### Commits

- chore(versions): 😊 publish v1.3.9-beta [`bf5011f`](https://github.com/nocobase/nocobase/commit/bf5011f75a7a9b26db7fef7aa4be28d7e4e077b4)
- chore: update changelog [`b2fc646`](https://github.com/nocobase/nocobase/commit/b2fc646e5aa64d2ade03ce6fca78753cfddc26ec)

## [v1.3.8-beta](https://github.com/nocobase/nocobase/compare/v1.3.7-beta...v1.3.8-beta) - 2024-08-29

### Commits

- chore(versions): 😊 publish v1.3.8-beta [`39d021a`](https://github.com/nocobase/nocobase/commit/39d021a9aa29bef9cf15d4af546060fc4b1dbd10)
- chore: update changelog [`9f66c14`](https://github.com/nocobase/nocobase/commit/9f66c14968639d90b399d087eefac7a0c4ea4383)

## [v1.3.7-beta](https://github.com/nocobase/nocobase/compare/v1.3.6-beta...v1.3.7-beta) - 2024-08-29

### Merged

- fix: add text support handlebars [`#5150`](https://github.com/nocobase/nocobase/pull/5150)

### Commits

- chore(versions): 😊 publish v1.3.7-beta [`f429d13`](https://github.com/nocobase/nocobase/commit/f429d1326433e7f290e552ca91548d21b5af92e4)
- chore: update changelog [`b41e477`](https://github.com/nocobase/nocobase/commit/b41e47757ec0d1f7b0af917e25ff5b4a436042aa)

## [v1.3.6-beta](https://github.com/nocobase/nocobase/compare/v1.3.5-beta...v1.3.6-beta) - 2024-08-29

### Merged

- fix: association select data scope linkage should support edit form [`#5149`](https://github.com/nocobase/nocobase/pull/5149)

### Commits

- chore(versions): 😊 publish v1.3.6-beta [`39c7ce4`](https://github.com/nocobase/nocobase/commit/39c7ce4741801819b98970b95c1663915a8c3bff)
- chore: update changelog [`cfbc2a6`](https://github.com/nocobase/nocobase/commit/cfbc2a6c15a5dfb8c0684051df1cf01499ff30ac)

## [v1.3.5-beta](https://github.com/nocobase/nocobase/compare/v1.3.4-beta...v1.3.5-beta) - 2024-08-28

### Merged

- fix: association select data scope linkage should be  supported in  sub-form [`#5146`](https://github.com/nocobase/nocobase/pull/5146)
- fix(mobile): resovle redirect issue [`#5145`](https://github.com/nocobase/nocobase/pull/5145)
- feat(plugin-workflow): allow to delete execution in list [`#5135`](https://github.com/nocobase/nocobase/pull/5135)
- fix(defaultValue): ignores variable values that do not match the current field [`#5122`](https://github.com/nocobase/nocobase/pull/5122)
- chore(deps-dev): bump eslint-plugin-jest-dom from 5.1.0 to 5.4.0 [`#5138`](https://github.com/nocobase/nocobase/pull/5138)
- chore(deps): bump @ant-design/pro-layout from 7.17.16 to 7.19.12 [`#5137`](https://github.com/nocobase/nocobase/pull/5137)
- fix(template): fix error on form block submission [`#5133`](https://github.com/nocobase/nocobase/pull/5133)
- feat: add support for opening via URL [`#5098`](https://github.com/nocobase/nocobase/pull/5098)
- fix(release): decrypt token error occasionally [`#5143`](https://github.com/nocobase/nocobase/pull/5143)

### Commits

- chore(versions): 😊 publish v1.3.5-beta [`35e8f89`](https://github.com/nocobase/nocobase/commit/35e8f89c75800a612db27485c96196555f922273)
- Revert "chore(deps): bump @ant-design/pro-layout from 7.17.16 to 7.19.12 (#5137)" [`3f461ad`](https://github.com/nocobase/nocobase/commit/3f461ad8f079b4c2cf5975c1e26271f55021e08a)
- fix(release): pro image ci [`e45d450`](https://github.com/nocobase/nocobase/commit/e45d45015792138e7378741bdaf488de714b365d)

## [v1.3.4-beta](https://github.com/nocobase/nocobase/compare/v1.3.3-beta...v1.3.4-beta) - 2024-08-27

### Merged

- refactor:  set remainsTheSame as the default value for field editing in bulk editing action [`#5124`](https://github.com/nocobase/nocobase/pull/5124)

### Commits

- chore(versions): 😊 publish v1.3.4-beta [`a011748`](https://github.com/nocobase/nocobase/commit/a0117480e037e48a23f59921110003047a1a174b)
- chore: update changelog [`3403e8d`](https://github.com/nocobase/nocobase/commit/3403e8d76684950d6962a6110a4440eb95856a35)

## [v1.3.3-beta](https://github.com/nocobase/nocobase/compare/v1.3.2-beta...v1.3.3-beta) - 2024-08-27

### Merged

- fix: use the built-in logo file [`#5032`](https://github.com/nocobase/nocobase/pull/5032)
- chore: optimize pro image build ci [`#5140`](https://github.com/nocobase/nocobase/pull/5140)

### Commits

- chore(versions): 😊 publish v1.3.3-beta [`9dffefb`](https://github.com/nocobase/nocobase/commit/9dffefb90a662789f9c4e12d2a088a73363c89db)
- chore: update changelog [`7c28f4d`](https://github.com/nocobase/nocobase/commit/7c28f4d06690d6b36701f773a933287c0a395a6d)
- fix(release): remove continue-on-error for build step [`5a41ab0`](https://github.com/nocobase/nocobase/commit/5a41ab063c8eea8bb0240cc6baf5d485b4fe9f84)

## [v1.3.2-beta](https://github.com/nocobase/nocobase/compare/v1.3.1-beta...v1.3.2-beta) - 2024-08-26

### Commits

- chore(versions): 😊 publish v1.3.2-beta [`dcadaa6`](https://github.com/nocobase/nocobase/commit/dcadaa666583b3fdc8e7caa6befd37ad442f56e6)
- chore(release): optimize release workflow [`6987d46`](https://github.com/nocobase/nocobase/commit/6987d46b3eb5d928f7fc3e1d3226578913b68820)
- chore: update changelog [`388b0e2`](https://github.com/nocobase/nocobase/commit/388b0e2a8869862c86cc365ae5f347b74a372e7e)

## [v1.3.1-beta](https://github.com/nocobase/nocobase/compare/v1.3.0-beta...v1.3.1-beta) - 2024-08-26

### Merged

- feat(publish): publish pro repos [`#5129`](https://github.com/nocobase/nocobase/pull/5129)
- fix(tree): missing collection schema [`#5131`](https://github.com/nocobase/nocobase/pull/5131)
- fix(cli): support upgrade to next [`#5130`](https://github.com/nocobase/nocobase/pull/5130)
- fix(client): fix field names of variable input [`#5128`](https://github.com/nocobase/nocobase/pull/5128)
- fix: cannot access 'ActionPage' before initialization [`#5125`](https://github.com/nocobase/nocobase/pull/5125)

### Commits

- chore(versions): 😊 publish v1.3.1-beta [`4aff92a`](https://github.com/nocobase/nocobase/commit/4aff92ad3bf338a8f798b3cc7460b32316f83d65)
- chore: update changelog [`4515f02`](https://github.com/nocobase/nocobase/commit/4515f0220f2b5854d5b3abbbdab8d116ba818669)
- fix: missing schema [`c4b8195`](https://github.com/nocobase/nocobase/commit/c4b819528a15f3f7294ce4027ea64342742881f3)

## [v1.3.0-beta](https://github.com/nocobase/nocobase/compare/v1.2.39-alpha...v1.3.0-beta) - 2024-08-25

### Merged

- feat(plugin-workflow-mailer): add variables [`#5120`](https://github.com/nocobase/nocobase/pull/5120)
- feat(client): add constant props api for variable input [`#5116`](https://github.com/nocobase/nocobase/pull/5116)
- fix(data-vi): add size settings for pie, bar and dualAxes [`#5113`](https://github.com/nocobase/nocobase/pull/5113)
- fix(mobile): avoid crashing [`#5109`](https://github.com/nocobase/nocobase/pull/5109)
- fix(varaible): resolve error on template block submission [`#5103`](https://github.com/nocobase/nocobase/pull/5103)
- feat: allows to filter child nodes in tree table blocks [`#5096`](https://github.com/nocobase/nocobase/pull/5096)
- feat: allow to set distinct for query measures [`#5091`](https://github.com/nocobase/nocobase/pull/5091)
- feat(kanban): add support for opening via URL [`#5083`](https://github.com/nocobase/nocobase/pull/5083)
- feat: create file record via path [`#5088`](https://github.com/nocobase/nocobase/pull/5088)
- refactor: update Chinese translation for "Style" [`#5078`](https://github.com/nocobase/nocobase/pull/5078)
- fix: resolve tab switching issue [`#5081`](https://github.com/nocobase/nocobase/pull/5081)
- fix(kanban): correct componentType to 'Kanban' [`#5080`](https://github.com/nocobase/nocobase/pull/5080)
- refactor: markdown rendering engine [`#5079`](https://github.com/nocobase/nocobase/pull/5079)
- fix(embed): fix the problem that switching tabs doesn't work [`#5074`](https://github.com/nocobase/nocobase/pull/5074)
- refactor: datetime field support timezone, defaultToCurrentTime, and onUpdateToCurrentTime [`#5012`](https://github.com/nocobase/nocobase/pull/5012)
- feat(data-vi): allow to set link for statistic chart [`#5073`](https://github.com/nocobase/nocobase/pull/5073)
- refactor(plugin-workflow): add calculation nodes group [`#5035`](https://github.com/nocobase/nocobase/pull/5035)
- fix(mobile): fix 'Edit link' setting [`#5068`](https://github.com/nocobase/nocobase/pull/5068)
- fix: html rendering in markdown block [`#5064`](https://github.com/nocobase/nocobase/pull/5064)
- fix: gridCard blocks cannot flip pages when using API data sources [`#5066`](https://github.com/nocobase/nocobase/pull/5066)
- fix(template): refresh parent data on submit button click in referenced template block [`#5057`](https://github.com/nocobase/nocobase/pull/5057)
- fix: html rendering in markdown block [`#5062`](https://github.com/nocobase/nocobase/pull/5062)
- fix(m2m-array): check naming collision [`#5059`](https://github.com/nocobase/nocobase/pull/5059)
- style: table column congirure fields bar style improve [`#5055`](https://github.com/nocobase/nocobase/pull/5055)
- fix(inherit): fix 'Add new' button for inherited collectons [`#5049`](https://github.com/nocobase/nocobase/pull/5049)
- feat(client): add parse options for variable input [`#5043`](https://github.com/nocobase/nocobase/pull/5043)
- fix(iframe): fix the popup contained Iframe block does not work [`#5039`](https://github.com/nocobase/nocobase/pull/5039)
- fix(plugin-workflow-aggregate): limit aggregate instruction to only work on db data source [`#5033`](https://github.com/nocobase/nocobase/pull/5033)
- fix: extend collection cache bug [`#5031`](https://github.com/nocobase/nocobase/pull/5031)
- feat: encryption field [`#4975`](https://github.com/nocobase/nocobase/pull/4975)
- fix: mobile auth [`#5015`](https://github.com/nocobase/nocobase/pull/5015)
- fix(client): show original field input component after cleared variable [`#5028`](https://github.com/nocobase/nocobase/pull/5028)
- feat: support to add Settings block in mobile [`#5025`](https://github.com/nocobase/nocobase/pull/5025)
- style: action style improve [`#5018`](https://github.com/nocobase/nocobase/pull/5018)
- fix: bug [`#5009`](https://github.com/nocobase/nocobase/pull/5009)
- feat: adapt desktop blocks to mobile [`#4945`](https://github.com/nocobase/nocobase/pull/4945)
- fix(CI): continue on error [`#4999`](https://github.com/nocobase/nocobase/pull/4999)
- fix:  markdown block should  supports the markdown syntax [`#5003`](https://github.com/nocobase/nocobase/pull/5003)
- fix: disabled action to maintain font color on mouse hover (#4988) [`#5000`](https://github.com/nocobase/nocobase/pull/5000)
- fix: disabled action to maintain font color on mouse hover (#4988) [`#4998`](https://github.com/nocobase/nocobase/pull/4998)
- refactor: support dynamic field component [`#4932`](https://github.com/nocobase/nocobase/pull/4932)
- feat: mobile modal bug [`#4976`](https://github.com/nocobase/nocobase/pull/4976)
- fix(T-4927): table performance bug [`#4978`](https://github.com/nocobase/nocobase/pull/4978)
- refactor:  pc block & action  compatible with mobile devices [`#4935`](https://github.com/nocobase/nocobase/pull/4935)
- feat: markdown & iframe html support handlebars as  rendering engin [`#4946`](https://github.com/nocobase/nocobase/pull/4946)
- fix(data-vi): issue of fixed height setting has no effect [`#4960`](https://github.com/nocobase/nocobase/pull/4960)
- fix(client): fix variable input value type [`#4955`](https://github.com/nocobase/nocobase/pull/4955)
- fix: remove theme token [`#4947`](https://github.com/nocobase/nocobase/pull/4947)
- fix: ignore pro [`#4928`](https://github.com/nocobase/nocobase/pull/4928)
- fix: prevent URL change on clicking unconfigured association field [`#4919`](https://github.com/nocobase/nocobase/pull/4919)
- feat(data-vi): optimize style settings for chart blocks [`#4940`](https://github.com/nocobase/nocobase/pull/4940)
- chore: skip app supervisor [`#4937`](https://github.com/nocobase/nocobase/pull/4937)
- fix: mobile style bug [`#4934`](https://github.com/nocobase/nocobase/pull/4934)
- fix: build image ci [`#4929`](https://github.com/nocobase/nocobase/pull/4929)
- feat: plugin mobile v2 [`#4777`](https://github.com/nocobase/nocobase/pull/4777)
- refactor(test): change mock cluster constructor arguments [`#4917`](https://github.com/nocobase/nocobase/pull/4917)
- fix: fix custom request linkage  rules problem [`#4913`](https://github.com/nocobase/nocobase/pull/4913)
- refactor(server): simplify api for publishing sync message [`#4912`](https://github.com/nocobase/nocobase/pull/4912)
- chore: data source api [`#4588`](https://github.com/nocobase/nocobase/pull/4588)
- feat(server): add cluster mode for starting app [`#4895`](https://github.com/nocobase/nocobase/pull/4895)
- Revert "fix(client): sub application name (#4886)" [`#4887`](https://github.com/nocobase/nocobase/pull/4887)
- fix(client): sub application name [`#4886`](https://github.com/nocobase/nocobase/pull/4886)
- refactor: optimize e2e workflow [`#4883`](https://github.com/nocobase/nocobase/pull/4883)
- refactor(client): allow to select null value explicitly in variable input [`#4869`](https://github.com/nocobase/nocobase/pull/4869)
- chore: next release ci [`#4861`](https://github.com/nocobase/nocobase/pull/4861)
- test: add locator for approval workflow to enable the withdraw button [`#4859`](https://github.com/nocobase/nocobase/pull/4859)
- refactor(server): sync manager and ci [`#4858`](https://github.com/nocobase/nocobase/pull/4858)
- fix(Table): fix styling issue with fixed columns [`#4857`](https://github.com/nocobase/nocobase/pull/4857)
- feat(database): new field type many to many (array) [`#4708`](https://github.com/nocobase/nocobase/pull/4708)
- feat(server): add sync-manager [`#4780`](https://github.com/nocobase/nocobase/pull/4780)
- chore(router): disable using replace strategy when closing popups or subpages [`#4838`](https://github.com/nocobase/nocobase/pull/4838)
- fix(plugin-manager): fix issue with inability to scroll on plugin management page [`#4837`](https://github.com/nocobase/nocobase/pull/4837)
- fix: adjust the margin of the Add block button in the grid layout [`#4820`](https://github.com/nocobase/nocobase/pull/4820)
- fix: base ref [`#4829`](https://github.com/nocobase/nocobase/pull/4829)
- feat: open subpages within the main page [`#4797`](https://github.com/nocobase/nocobase/pull/4797)
- feat(client): add `disabled` option to props of SchemaSettingsItem [`#4817`](https://github.com/nocobase/nocobase/pull/4817)
- fix(popups): correct value for filterByTk [`#4792`](https://github.com/nocobase/nocobase/pull/4792)
- refactor: include sourceId in popup URL [`#4788`](https://github.com/nocobase/nocobase/pull/4788)
- Merge branch 'main' into next [`#4791`](https://github.com/nocobase/nocobase/pull/4791)
- feat(client): support linkage style in table and form [`#4467`](https://github.com/nocobase/nocobase/pull/4467)
- feat: enable direct dialog opening via URL and support for page mode [`#4706`](https://github.com/nocobase/nocobase/pull/4706)
- refactor: rewrite the UI of the code scanner. [`#4677`](https://github.com/nocobase/nocobase/pull/4677)
- feat(plugin-workflow): add date range options to system variables [`#4728`](https://github.com/nocobase/nocobase/pull/4728)

### Commits

- Revert "refactor: datetime field support timezone, defaultToCurrentTime, and onUpdateToCurrentTime (#5012)" [`ded5f26`](https://github.com/nocobase/nocobase/commit/ded5f26c09afed11d27652933ac8550375b3a34d)
- fix: remove schema [`f696c67`](https://github.com/nocobase/nocobase/commit/f696c67b5e5f47ce344e2691d970ec74f451d183)
- chore(versions): 😊 publish v1.3.0-beta [`dea6a58`](https://github.com/nocobase/nocobase/commit/dea6a58878acaf9220f7cf13868adc8cdf38f780)

## [v1.2.39-alpha](https://github.com/nocobase/nocobase/compare/v1.2.38-alpha...v1.2.39-alpha) - 2024-08-25

### Merged

- fix: the time zone defaults to the system time zone [`#5121`](https://github.com/nocobase/nocobase/pull/5121)
- fix(plugin-workflow-parallel): fix missed transaction causing dead lock in mysql [`#5118`](https://github.com/nocobase/nocobase/pull/5118)
- fix: action linkage rules not working correctly in tree table [`#5107`](https://github.com/nocobase/nocobase/pull/5107)
- fix(data-vi): allow to map integer enum value [`#5115`](https://github.com/nocobase/nocobase/pull/5115)
- fix: markdown test [`#5117`](https://github.com/nocobase/nocobase/pull/5117)
- chore(deps): bump tsconfig-paths from 3.15.0 to 4.2.0 [`#5051`](https://github.com/nocobase/nocobase/pull/5051)
- fix：markdown demo rendering failure [`#5114`](https://github.com/nocobase/nocobase/pull/5114)
- fix(filter): should not filter out zero [`#5106`](https://github.com/nocobase/nocobase/pull/5106)
- style: filter form block action bar style improve [`#5108`](https://github.com/nocobase/nocobase/pull/5108)
- refactor: description for simple pagination mode [`#5110`](https://github.com/nocobase/nocobase/pull/5110)

### Commits

- chore(versions): 😊 publish v1.2.39-alpha [`9e30752`](https://github.com/nocobase/nocobase/commit/9e3075218ade26c156b583af8d7166fd630c4d17)
- chore: update changelog [`2b34f3b`](https://github.com/nocobase/nocobase/commit/2b34f3b6bd09d9d8a83a23c6e701cee748460ad4)
- Update README.zh-CN.md [`75c7fd6`](https://github.com/nocobase/nocobase/commit/75c7fd67964d74d291c2f97efa0c458113b7870b)

## [v1.2.38-alpha](https://github.com/nocobase/nocobase/compare/v1.2.37-alpha...v1.2.38-alpha) - 2024-08-22

### Merged

- fix: issue where data couldn't be submitted after deleting a row with required field in the subform [`#5101`](https://github.com/nocobase/nocobase/pull/5101)
- refactor: collection support simplePaginate [`#5099`](https://github.com/nocobase/nocobase/pull/5099)
- fix: button field assignment to only update visible fields [`#5104`](https://github.com/nocobase/nocobase/pull/5104)
- fix(client): fix upload preview image [`#5102`](https://github.com/nocobase/nocobase/pull/5102)
- fix: column index calculation error in table block [`#5100`](https://github.com/nocobase/nocobase/pull/5100)
- chore: optimize translation [`#5092`](https://github.com/nocobase/nocobase/pull/5092)

### Commits

- chore(versions): 😊 publish v1.2.38-alpha [`ce19841`](https://github.com/nocobase/nocobase/commit/ce198410f9e49a842ca91bccf8100c2602f7acfe)
- chore: update changelog [`8d29a6e`](https://github.com/nocobase/nocobase/commit/8d29a6ee81436301bb03bcf39ead38ba084477bb)

## [v1.2.37-alpha](https://github.com/nocobase/nocobase/compare/v1.2.36-alpha...v1.2.37-alpha) - 2024-08-21

### Merged

- refactor: support simple Paginate [`#5093`](https://github.com/nocobase/nocobase/pull/5093)
- fix: error adjusting order of linkage rules [`#5086`](https://github.com/nocobase/nocobase/pull/5086)

### Commits

- chore(versions): 😊 publish v1.2.37-alpha [`5b65985`](https://github.com/nocobase/nocobase/commit/5b65985c1431febd1fde55954e4c490545f908eb)
- chore: update changelog [`a1552b5`](https://github.com/nocobase/nocobase/commit/a1552b50c4782186a844cb24b168a5857fc7eaf7)

## [v1.2.36-alpha](https://github.com/nocobase/nocobase/compare/v1.2.35-alpha...v1.2.36-alpha) - 2024-08-19

### Merged

- 日本語readmeを追加する [`#4971`](https://github.com/nocobase/nocobase/pull/4971)
- fix: mysql2 version [`#5082`](https://github.com/nocobase/nocobase/pull/5082)
- fix: sorting of Table block data [`#5071`](https://github.com/nocobase/nocobase/pull/5071)
- fix: the selected data in the sub table is overwritten by default values [`#5075`](https://github.com/nocobase/nocobase/pull/5075)

### Commits

- chore(versions): 😊 publish v1.2.36-alpha [`271a829`](https://github.com/nocobase/nocobase/commit/271a82944ea1fd88ff0f32ce1ff4084a614d693e)
- chore: update changelog [`84ca0eb`](https://github.com/nocobase/nocobase/commit/84ca0eb29609d1575874e2392bbe319bad82bf7c)
- Update README.ja-JP.md [`d5b8f1f`](https://github.com/nocobase/nocobase/commit/d5b8f1fe22fdfa5dcae556c7b4b69c7fdeb3494f)

## [v1.2.35-alpha](https://github.com/nocobase/nocobase/compare/v1.2.34-alpha...v1.2.35-alpha) - 2024-08-16

### Merged

- fix: the display of data source status [`#5069`](https://github.com/nocobase/nocobase/pull/5069)
- chore: upgrade mysql2 version [`#5070`](https://github.com/nocobase/nocobase/pull/5070)
- fix: filter form action bar stye improve [`#5054`](https://github.com/nocobase/nocobase/pull/5054)
- fix: quote table name in mysql query interface [`#5065`](https://github.com/nocobase/nocobase/pull/5065)
- fix: collection with non ID as the primary key will encounter an error when using gantt [`#5061`](https://github.com/nocobase/nocobase/pull/5061)
- fix: increase the upload file size limit of field-markdown-vditor [`#5063`](https://github.com/nocobase/nocobase/pull/5063)
- fix(data-vi): dependency typo [`#5060`](https://github.com/nocobase/nocobase/pull/5060)
- chore(deps): bump @babel/plugin-transform-modules-amd from 7.22.5 to 7.24.7 [`#5052`](https://github.com/nocobase/nocobase/pull/5052)
- chore(deps): bump xpipe from 1.0.5 to 1.0.7 [`#5050`](https://github.com/nocobase/nocobase/pull/5050)
- chore(deps): bump tsup from 7.2.0 to 8.2.4 [`#5046`](https://github.com/nocobase/nocobase/pull/5046)
- fix(inherit): correct title for inherited sub-collection association block [`#5048`](https://github.com/nocobase/nocobase/pull/5048)
- fix: load parent field in inherited collection [`#5044`](https://github.com/nocobase/nocobase/pull/5044)
- fix: disable edit and delete button for all records and own record in data scope configuration [`#5041`](https://github.com/nocobase/nocobase/pull/5041)
- fix(Collapse): fix issue with data scope settings being ineffective [`#4914`](https://github.com/nocobase/nocobase/pull/4914)
- fix(Table): should not error when open a popup by clicking a multi-level field [`#5038`](https://github.com/nocobase/nocobase/pull/5038)
- fix(linkageRules): fix an exception when the condition contains a association field [`#5037`](https://github.com/nocobase/nocobase/pull/5037)
- fix(client): missing sort parameter [`#5034`](https://github.com/nocobase/nocobase/pull/5034)
- fix(database): skip table doesn't exist [`#5023`](https://github.com/nocobase/nocobase/pull/5023)
- fix(variable): the chinaRegions field should not be a submenu [`#5030`](https://github.com/nocobase/nocobase/pull/5030)
- style: quick add button for association field in the form, compact theme style without adaptation [`#5024`](https://github.com/nocobase/nocobase/pull/5024)
- fix: correct foreign key value errors [`#5027`](https://github.com/nocobase/nocobase/pull/5027)
- fix: source field type filtering association fields in sql collection & view collection [`#5014`](https://github.com/nocobase/nocobase/pull/5014)
- fix: allowMultiple should not appear on read-only association fields [`#5017`](https://github.com/nocobase/nocobase/pull/5017)

### Commits

- chore(versions): 😊 publish v1.2.35-alpha [`39bc571`](https://github.com/nocobase/nocobase/commit/39bc5717881454cb1bf210673418e1be49f45614)
- chore: update changelog [`d37c71a`](https://github.com/nocobase/nocobase/commit/d37c71aaed459a1364a2b04bd478f529472a5ae0)
- Update LICENSE.txt [`28c2fff`](https://github.com/nocobase/nocobase/commit/28c2fff0e48ed135322839ae9f27d1740a351902)

## [v1.2.34-alpha](https://github.com/nocobase/nocobase/compare/v1.2.33-alpha...v1.2.34-alpha) - 2024-08-08

### Merged

- fix(plugin-workflow): fix event key in date field schedule mode [`#5010`](https://github.com/nocobase/nocobase/pull/5010)
- fix: backup file dir of sub apps [`#4985`](https://github.com/nocobase/nocobase/pull/4985)

### Commits

- chore(versions): 😊 publish v1.2.34-alpha [`0fd0f94`](https://github.com/nocobase/nocobase/commit/0fd0f9406babc3f99570d369e55468d3502ea5f7)
- chore: update changelog [`c25be38`](https://github.com/nocobase/nocobase/commit/c25be38e4573275c6078d3fcb72da8e62a986479)

## [v1.2.33-alpha](https://github.com/nocobase/nocobase/compare/v1.2.32-alpha...v1.2.33-alpha) - 2024-08-07

### Merged

- feat: support dynamic field component [`#5006`](https://github.com/nocobase/nocobase/pull/5006)
- fix: required validate rule with trim [`#5004`](https://github.com/nocobase/nocobase/pull/5004)
- fix:  acl permission check issue for 'Delete Event' action [`#5002`](https://github.com/nocobase/nocobase/pull/5002)

### Commits

- chore(versions): 😊 publish v1.2.33-alpha [`cfccf93`](https://github.com/nocobase/nocobase/commit/cfccf93f9c2f88dde2d00f55cc857fca7588a507)
- chore: update changelog [`0bfcfad`](https://github.com/nocobase/nocobase/commit/0bfcfadc4d17f4746fa1f6f36779347e3fa92ffe)

## [v1.2.32-alpha](https://github.com/nocobase/nocobase/compare/v1.2.31-alpha...v1.2.32-alpha) - 2024-08-06

### Commits

- chore(versions): 😊 publish v1.2.32-alpha [`e3d3de0`](https://github.com/nocobase/nocobase/commit/e3d3de0386cd490e00993b39f78bc9d254a94614)
- chore: update changelog [`95b5d12`](https://github.com/nocobase/nocobase/commit/95b5d12a2ea189862b06facb1a22046faed51b38)

## [v1.2.31-alpha](https://github.com/nocobase/nocobase/compare/v1.2.30-alpha...v1.2.31-alpha) - 2024-08-06

### Commits

- chore(versions): 😊 publish v1.2.31-alpha [`1a00e03`](https://github.com/nocobase/nocobase/commit/1a00e031e4f8291ec42e545820c5193d252f6a87)
- chore: update changelog [`71b94b6`](https://github.com/nocobase/nocobase/commit/71b94b6bc130cc4756f84af37cbc69e0ffcad85f)

## [v1.2.30-alpha](https://github.com/nocobase/nocobase/compare/v1.2.29-alpha...v1.2.30-alpha) - 2024-08-06

### Merged

- fix: unable to clear china region field [`#4991`](https://github.com/nocobase/nocobase/pull/4991)
- fix(T-4927): table performance bug [`#4978`](https://github.com/nocobase/nocobase/pull/4978)
- fix: disabled action to maintain font color on mouse hover [`#4988`](https://github.com/nocobase/nocobase/pull/4988)
- fix: issue with ACLCollectionFieldProvider field permission evaluation [`#4989`](https://github.com/nocobase/nocobase/pull/4989)
- fix(plugin-workflow-manual): fix assign field value for all action buttons of manual node [`#4983`](https://github.com/nocobase/nocobase/pull/4983)
- fix(plugin-workflow): fix collection trigger in async mode after transaction committed [`#4994`](https://github.com/nocobase/nocobase/pull/4994)

### Commits

- fix: manual release [`f8bc360`](https://github.com/nocobase/nocobase/commit/f8bc36066e32c713854c4a597cca6cdfed47049e)
- chore(versions): 😊 publish v1.2.30-alpha [`e0b36fb`](https://github.com/nocobase/nocobase/commit/e0b36fbeeb0894e37c1b2e0a327ace4377167ef2)
- chore(versions): 😊 publish v1.3.0-alpha [`ca87866`](https://github.com/nocobase/nocobase/commit/ca8786695936bed2cd4b670ed4a505fc250a282d)

## [v1.2.29-alpha](https://github.com/nocobase/nocobase/compare/v1.2.28-alpha...v1.2.29-alpha) - 2024-08-05

### Merged

- chore: optimize text for data loading mode [`#4918`](https://github.com/nocobase/nocobase/pull/4918)
- fix: action linkage rule [`#4980`](https://github.com/nocobase/nocobase/pull/4980)
- chore(action-export): error message when field not found [`#4890`](https://github.com/nocobase/nocobase/pull/4890)
- refactor: filter FilterTargetKeys options based on titleUsable [`#4981`](https://github.com/nocobase/nocobase/pull/4981)
- fix(plugin-workflow-manual): fix disabled status in clicked button of manual todo [`#4982`](https://github.com/nocobase/nocobase/pull/4982)
- refactor: set field required in sub-table should  display required indicator in column header [`#4972`](https://github.com/nocobase/nocobase/pull/4972)
- fix: enable date variables in filter forms [`#4916`](https://github.com/nocobase/nocobase/pull/4916)
- fix: required constraint becomes invalid after setting validation rules on form fields [`#4977`](https://github.com/nocobase/nocobase/pull/4977)

### Commits

- chore(versions): 😊 publish v1.2.29-alpha [`769d2b9`](https://github.com/nocobase/nocobase/commit/769d2b9365c67135690348fdcaa85691272d0616)
- chore: update changelog [`b081790`](https://github.com/nocobase/nocobase/commit/b081790f81d73ad1344a23fbcd375c70c3c2ef91)

## [v1.2.28-alpha](https://github.com/nocobase/nocobase/compare/v1.2.27-alpha...v1.2.28-alpha) - 2024-08-01

### Merged

- fix: collection manager support filterTargetKey setting [`#4968`](https://github.com/nocobase/nocobase/pull/4968)
- chore(action-export): format of number field [`#4974`](https://github.com/nocobase/nocobase/pull/4974)
- fix(acl): get allowedAction when condition is empty [`#4973`](https://github.com/nocobase/nocobase/pull/4973)
- fix(plugin-workflow): fix formula validation for expression [`#4957`](https://github.com/nocobase/nocobase/pull/4957)

### Commits

- chore(versions): 😊 publish v1.2.28-alpha [`40b3901`](https://github.com/nocobase/nocobase/commit/40b390111823c1420d15f4bf0d3e054ebeb73585)
- chore: update changelog [`f7db3bd`](https://github.com/nocobase/nocobase/commit/f7db3bd291912e32cdac906eeabb2681caf70a92)

## [v1.2.27-alpha](https://github.com/nocobase/nocobase/compare/v1.2.26-alpha...v1.2.27-alpha) - 2024-07-30

### Merged

- fix: the date string in filter should not be UTC [`#4967`](https://github.com/nocobase/nocobase/pull/4967)
- fix(plugin-workflow): fix admin role with workflow plugin permission can not delete executions [`#4961`](https://github.com/nocobase/nocobase/pull/4961)
- fix: improve i18n `tStr()` [`#4966`](https://github.com/nocobase/nocobase/pull/4966)

### Commits

- chore(versions): 😊 publish v1.2.27-alpha [`eafbd1f`](https://github.com/nocobase/nocobase/commit/eafbd1fe97db1727046dcf3d6e23086734157014)
- chore: update changelog [`80182dc`](https://github.com/nocobase/nocobase/commit/80182dc156608084f890a5c2f6363bc746c193bd)

## [v1.2.26-alpha](https://github.com/nocobase/nocobase/compare/v1.2.25-alpha...v1.2.26-alpha) - 2024-07-30

### Merged

- fix: remove i18n fallbackNS [`#4964`](https://github.com/nocobase/nocobase/pull/4964)
- fix(plugin-workflow): fix delete action button to bind pre-action workflow [`#4963`](https://github.com/nocobase/nocobase/pull/4963)
- fix: i18n plugin utils [`#4962`](https://github.com/nocobase/nocobase/pull/4962)
- fix: plugin template add locale [`#4943`](https://github.com/nocobase/nocobase/pull/4943)
- chore: upgrade playwright to v1.45.3 [`#4954`](https://github.com/nocobase/nocobase/pull/4954)
- test: custom action e2e [`#4956`](https://github.com/nocobase/nocobase/pull/4956)
- fix: create multiple auto increment fields in mysql [`#4951`](https://github.com/nocobase/nocobase/pull/4951)

### Commits

- chore(versions): 😊 publish v1.2.26-alpha [`0983e86`](https://github.com/nocobase/nocobase/commit/0983e86740db4af398902bca16991b535fe9e42a)
- chore: update changelog [`3413bd5`](https://github.com/nocobase/nocobase/commit/3413bd57e89867d76a815ed4b237a1e8b1a96f49)

## [v1.2.25-alpha](https://github.com/nocobase/nocobase/compare/v1.2.24-alpha...v1.2.25-alpha) - 2024-07-27

### Merged

- fix(plugin-workflow): hide condition configuration in destroy collection event [`#4952`](https://github.com/nocobase/nocobase/pull/4952)
- fix(plugin-workflow): fix schedule event on date field [`#4953`](https://github.com/nocobase/nocobase/pull/4953)
- refactor(client): allow select to show null option as tag in read pretty mode if configured [`#4950`](https://github.com/nocobase/nocobase/pull/4950)
- fix: clear default value immediately after field deletion [`#4915`](https://github.com/nocobase/nocobase/pull/4915)
- fix: autoGenId default value  should be false when adding collection [`#4942`](https://github.com/nocobase/nocobase/pull/4942)
- refactor: migrate DataBlockCollector to DataBlockProvider [`#4938`](https://github.com/nocobase/nocobase/pull/4938)
- fix(action-import): import with createdBy & updatedBy field [`#4939`](https://github.com/nocobase/nocobase/pull/4939)

### Commits

- chore(versions): 😊 publish v1.2.25-alpha [`306035c`](https://github.com/nocobase/nocobase/commit/306035c607d2d8d22b540e5653cd9095abf906f0)
- chore: update changelog [`b2f82a2`](https://github.com/nocobase/nocobase/commit/b2f82a26dfc113db7a8bad9e2c21ddcad4d71a0b)
- Update LICENSE.txt [`027d54d`](https://github.com/nocobase/nocobase/commit/027d54dc8785a01c0af0d7e7a33aedb0af166e4e)

## [v1.2.24-alpha](https://github.com/nocobase/nocobase/compare/v1.2.23-alpha...v1.2.24-alpha) - 2024-07-23

### Merged

- fix(subTable): ensure real-time update of formula field values [`#4930`](https://github.com/nocobase/nocobase/pull/4930)
- fix: required  not applied when changing field from hidden to visible and setting it as required [`#4927`](https://github.com/nocobase/nocobase/pull/4927)
- fix(plugin-workflow): fix or condition bug in collection trigger [`#4925`](https://github.com/nocobase/nocobase/pull/4925)

### Commits

- chore(versions): 😊 publish v1.2.24-alpha [`73d6905`](https://github.com/nocobase/nocobase/commit/73d6905f3b8893c6cf9cb2d838cbcf69c5d814fa)
- chore: update changelog [`c07084c`](https://github.com/nocobase/nocobase/commit/c07084ca22dd795ab30a3653da9438e01656430d)
- Revert "fix(subTable): ensure real-time update of formula field values" [`747910f`](https://github.com/nocobase/nocobase/commit/747910f48254c94683d60fa4a3f8520c6b879c18)

## [v1.2.23-alpha](https://github.com/nocobase/nocobase/compare/v1.2.22-alpha...v1.2.23-alpha) - 2024-07-22

### Merged

- refactor: collection fields to initializer items [`#4900`](https://github.com/nocobase/nocobase/pull/4900)
- fix(variable): fix context error with 'current object' variable [`#4901`](https://github.com/nocobase/nocobase/pull/4901)
- feat(Link): add 'Open in new window' option [`#4898`](https://github.com/nocobase/nocobase/pull/4898)
- refactor: adjust the markdown field to use the input component in filtering [`#4899`](https://github.com/nocobase/nocobase/pull/4899)

### Commits

- chore(versions): 😊 publish v1.2.23-alpha [`bbbc349`](https://github.com/nocobase/nocobase/commit/bbbc349008ad18b5fa2b8159aaa663db40fa8750)
- Update LICENSE.txt [`a226d98`](https://github.com/nocobase/nocobase/commit/a226d986b27043f1f07447303d9571e92c263d9e)
- chore: add translation [`b634774`](https://github.com/nocobase/nocobase/commit/b634774feca4d53ff76e788fa86dc9eb228b2f29)

## [v1.2.22-alpha](https://github.com/nocobase/nocobase/compare/v1.2.21-alpha...v1.2.22-alpha) - 2024-07-18

### Merged

- fix: exception when deleting object with formula fields in sub-form [`#4897`](https://github.com/nocobase/nocobase/pull/4897)
- chore: external data source api [`#4782`](https://github.com/nocobase/nocobase/pull/4782)
- fix: association field data scope should not persist when switching from select to cascader [`#4893`](https://github.com/nocobase/nocobase/pull/4893)
- fix: image style issues in rich text field [`#4892`](https://github.com/nocobase/nocobase/pull/4892)
- fix: correct issue with filter form field operator settings being ineffective [`#4891`](https://github.com/nocobase/nocobase/pull/4891)

### Commits

- chore(versions): 😊 publish v1.2.22-alpha [`645ccaf`](https://github.com/nocobase/nocobase/commit/645ccaf3dedcfae445bfbf3bdbe1cd4378dd3513)
- chore: update changelog [`95eaab2`](https://github.com/nocobase/nocobase/commit/95eaab20f1db545efa20ba121e2ca3b139a7fd80)

## [v1.2.21-alpha](https://github.com/nocobase/nocobase/compare/v1.2.20-alpha...v1.2.21-alpha) - 2024-07-17

### Merged

- feat: add 'Clear default value' settings for Reset action [`#4889`](https://github.com/nocobase/nocobase/pull/4889)

### Commits

- chore(versions): 😊 publish v1.2.21-alpha [`235a689`](https://github.com/nocobase/nocobase/commit/235a6897e5dbc290108cb1d42ec6a9df838a9773)
- chore: update changelog [`9dc7136`](https://github.com/nocobase/nocobase/commit/9dc713637a19e26dd1da3671142a59f3d0b9bca0)

## [v1.2.20-alpha](https://github.com/nocobase/nocobase/compare/v1.2.19-alpha...v1.2.20-alpha) - 2024-07-16

### Merged

- refactor: adjust rich text filter to Input component [`#4888`](https://github.com/nocobase/nocobase/pull/4888)

### Commits

- chore(versions): 😊 publish v1.2.20-alpha [`d086e93`](https://github.com/nocobase/nocobase/commit/d086e937a2ea641869e4d8f081380990b8565eaf)
- chore: auto merge [`32b8bf6`](https://github.com/nocobase/nocobase/commit/32b8bf6cdf5f42554390d787a9131186e8885cd6)
- chore: update changelog [`b5c2107`](https://github.com/nocobase/nocobase/commit/b5c21078c4559800392bd9c1ebf5d355633beb7d)

## [v1.2.19-alpha](https://github.com/nocobase/nocobase/compare/v1.2.18-alpha...v1.2.19-alpha) - 2024-07-16

### Commits

- chore(versions): 😊 publish v1.2.19-alpha [`c56b873`](https://github.com/nocobase/nocobase/commit/c56b873f42944d5c330734822c9746d51103fcfb)
- chore: update release ci [`393b6bb`](https://github.com/nocobase/nocobase/commit/393b6bb27ed8d58653033874da976b065eb93f66)
- chore: update changelog [`bef2a3f`](https://github.com/nocobase/nocobase/commit/bef2a3ffe1ec16ac1663729b180e4de4562d57c1)

## [v1.2.18-alpha](https://github.com/nocobase/nocobase/compare/v1.2.17-alpha...v1.2.18-alpha) - 2024-07-16

### Commits

- chore(versions): 😊 publish v1.2.18-alpha [`f69d552`](https://github.com/nocobase/nocobase/commit/f69d5526f1c101de685e8a7e788609b9bb187fc7)
- chore: update release ci [`31c5489`](https://github.com/nocobase/nocobase/commit/31c54896fb420c246adcadea557cc0b56aeb02d5)
- chore: update changelog [`2c0721b`](https://github.com/nocobase/nocobase/commit/2c0721b18222cffa170688176ec3798509f095ec)

## [v1.2.17-alpha](https://github.com/nocobase/nocobase/compare/v1.2.16-alpha...v1.2.17-alpha) - 2024-07-16

### Merged

- fix: dataSourceKey parameter error for external  data sources in acl  data scope list [`#4882`](https://github.com/nocobase/nocobase/pull/4882)
- chore: clear listener after transaction commited [`#4879`](https://github.com/nocobase/nocobase/pull/4879)
- chore(action-import): report sequelize error message [`#4878`](https://github.com/nocobase/nocobase/pull/4878)
- fix: create multiple auto incr field in mysql [`#4839`](https://github.com/nocobase/nocobase/pull/4839)
- fix: default values for fields should not be cleared after submission [`#4877`](https://github.com/nocobase/nocobase/pull/4877)
- fix(form): resolve issue with association fields not displaying content due to referenced templates [`#4876`](https://github.com/nocobase/nocobase/pull/4876)
- fix: real-time update issue for association field data scope in sub-table [`#4872`](https://github.com/nocobase/nocobase/pull/4872)
- fix: useImportStartAction [`#4875`](https://github.com/nocobase/nocobase/pull/4875)

### Commits

- chore(versions): 😊 publish v1.2.17-alpha [`c65c7f7`](https://github.com/nocobase/nocobase/commit/c65c7f708ecdb48740c0043ebcd615ae6201cca5)
- chore: update changelog [`b3efafc`](https://github.com/nocobase/nocobase/commit/b3efafc1b73fab1047618f8db6fe0099d1d9724a)
- Update bug_report.md [`596aa81`](https://github.com/nocobase/nocobase/commit/596aa81faba08149b7e074e949f189679e2c1735)

## [v1.2.16-alpha](https://github.com/nocobase/nocobase/compare/v1.2.15-alpha...v1.2.16-alpha) - 2024-07-12

### Merged

- fix: issue with iframe URL not opening correctly [`#4873`](https://github.com/nocobase/nocobase/pull/4873)

### Commits

- chore(versions): 😊 publish v1.2.16-alpha [`a64015d`](https://github.com/nocobase/nocobase/commit/a64015d1cb8f4926652de19e1ebe1175776e8b33)
- chore: update .env.example [`df4abfd`](https://github.com/nocobase/nocobase/commit/df4abfdfb79b26e52ab07ed13cbf5f9b82775db4)
- chore: update changelog [`a7b0c36`](https://github.com/nocobase/nocobase/commit/a7b0c36af1fffe658513ca87b5af1498bf8e1449)

## [v1.2.15-alpha](https://github.com/nocobase/nocobase/compare/v1.2.14-alpha...v1.2.15-alpha) - 2024-07-11

### Merged

- fix: initializer select close [`#4865`](https://github.com/nocobase/nocobase/pull/4865)
- fix(data-vi): fix the permission issue when using external data sources in data-vi plugin [`#4864`](https://github.com/nocobase/nocobase/pull/4864)

### Commits

- Revert "fix: skip mysql server" [`30cdd25`](https://github.com/nocobase/nocobase/commit/30cdd25b0cea7fa37b15df2b34ff9d3aa98db406)
- fix: skip mysql server [`f6bc113`](https://github.com/nocobase/nocobase/commit/f6bc113ba78122ce7da3c36d63e8b1c87ecd3f51)
- chore(versions): 😊 publish v1.2.15-alpha [`11fdb51`](https://github.com/nocobase/nocobase/commit/11fdb5131c32b19825c0bb6a661ae89b357f4524)

## [v1.2.14-alpha](https://github.com/nocobase/nocobase/compare/v1.2.13-alpha...v1.2.14-alpha) - 2024-07-11

### Merged

- fix(Safari): resolve issue with menu page not refreshing in Safari [`#4835`](https://github.com/nocobase/nocobase/pull/4835)
- chore(bot): optimize comment content [`#4856`](https://github.com/nocobase/nocobase/pull/4856)
- chore: fetch-depth=0 [`#4854`](https://github.com/nocobase/nocobase/pull/4854)

### Commits

- chore(versions): 😊 publish v1.2.14-alpha [`4e53736`](https://github.com/nocobase/nocobase/commit/4e537360dd8c5eaf15dbea254cffd24ea5e3f244)
- chore: update release ci [`b564221`](https://github.com/nocobase/nocobase/commit/b56422139f2590a68f95df80e3dd30866f2e8c1f)
- chore: update changelog [`a89a95c`](https://github.com/nocobase/nocobase/commit/a89a95cfbc84f1d462c7824351f984b6c6cbab7a)

## [v1.2.13-alpha](https://github.com/nocobase/nocobase/compare/v1.2.12-alpha...v1.2.13-alpha) - 2024-07-10

### Merged

- feat(Menu): add support for setting search params and using variables in links [`#4855`](https://github.com/nocobase/nocobase/pull/4855)
- fix(template): restrict block templates to their respective block types [`#4842`](https://github.com/nocobase/nocobase/pull/4842)
- feat(variable): add a new variable named 'API token' [`#4850`](https://github.com/nocobase/nocobase/pull/4850)
- fix: ineffective conditional checks for checkbox fields as linkage rule under m2o association field [`#4849`](https://github.com/nocobase/nocobase/pull/4849)
- fix(client): fix output time in date-picker in date-only mode [`#4778`](https://github.com/nocobase/nocobase/pull/4778)
- fix: page freeze issue when hiding formula fields through linkage rules [`#4846`](https://github.com/nocobase/nocobase/pull/4846)
- fix(ci): fix ci script error for pro [`#4845`](https://github.com/nocobase/nocobase/pull/4845)
- chore(data-source-main): i18n of field depended error [`#4843`](https://github.com/nocobase/nocobase/pull/4843)
- fix(action-export): export with custom field title [`#4825`](https://github.com/nocobase/nocobase/pull/4825)
- chore: disable search engine indexing [`#4841`](https://github.com/nocobase/nocobase/pull/4841)
- chore(datasource-main): throw error when destory field if field is used by association field [`#4833`](https://github.com/nocobase/nocobase/pull/4833)
- fix: adjust the margin of the Add block button in the grid layout [`#4820`](https://github.com/nocobase/nocobase/pull/4820)
- chore: mutex task message of import and export [`#4834`](https://github.com/nocobase/nocobase/pull/4834)
- chore(CI): sync changes from next branch [`#4832`](https://github.com/nocobase/nocobase/pull/4832)
- chore(CI): add a job for E2E of workflow-approval [`#4831`](https://github.com/nocobase/nocobase/pull/4831)
- chore(plugin-workflow): expose entire error into node result [`#4799`](https://github.com/nocobase/nocobase/pull/4799)

### Commits

- chore(versions): 😊 publish v1.2.13-alpha [`3b02b0c`](https://github.com/nocobase/nocobase/commit/3b02b0c992786293ee2892c50b42b788adff49e8)
- chore: update changelog [`4c63f81`](https://github.com/nocobase/nocobase/commit/4c63f815e0f3ace2cdbc76591c003810771c048c)
- Update pull_request_template.md [`8792cbf`](https://github.com/nocobase/nocobase/commit/8792cbf61c73e731c6bd002714f3ceba9b0c8d9d)

## [v1.2.12-alpha](https://github.com/nocobase/nocobase/compare/v1.2.11-alpha...v1.2.12-alpha) - 2024-07-05

### Merged

- style: list block overflowY [`#4822`](https://github.com/nocobase/nocobase/pull/4822)
- fix: external data source filterTargetKey undefined in filter action [`#4815`](https://github.com/nocobase/nocobase/pull/4815)
- fix(database): should not add field when binding error [`#4804`](https://github.com/nocobase/nocobase/pull/4804)
- feat: beforeAddDataSource hook [`#4810`](https://github.com/nocobase/nocobase/pull/4810)
- fix: target key value is empty [`#4796`](https://github.com/nocobase/nocobase/pull/4796)
- chore(ci): release database after closed [`#4819`](https://github.com/nocobase/nocobase/pull/4819)
- fix: bug [`#4816`](https://github.com/nocobase/nocobase/pull/4816)
- chore: add import export permission to admin & member user [`#4809`](https://github.com/nocobase/nocobase/pull/4809)
- chore: add import export permission to member user [`#4808`](https://github.com/nocobase/nocobase/pull/4808)
- fix: sub-form acl check [`#4806`](https://github.com/nocobase/nocobase/pull/4806)
- fix: version calculation error when creating migration [`#4805`](https://github.com/nocobase/nocobase/pull/4805)
- chore(e2e): optimize timeout to avoid lost report [`#4798`](https://github.com/nocobase/nocobase/pull/4798)
- fix: table height shrinking with large data set at full height [`#4787`](https://github.com/nocobase/nocobase/pull/4787)
- fix: incorrect highlight linkage for association field [`#4794`](https://github.com/nocobase/nocobase/pull/4794)
- style: list block style improve [`#4785`](https://github.com/nocobase/nocobase/pull/4785)
- fix: external data source not reloading when title field is updated [`#4786`](https://github.com/nocobase/nocobase/pull/4786)
- test: approvals workflow e2e [`#4781`](https://github.com/nocobase/nocobase/pull/4781)
- refactor: rewrite the UI of the code scanner. [`#4677`](https://github.com/nocobase/nocobase/pull/4677)
- refactor(plugin-workflow): add deferred option for async workflow triggering [`#4772`](https://github.com/nocobase/nocobase/pull/4772)

### Commits

- chore(versions): 😊 publish v1.2.12-alpha [`415eb52`](https://github.com/nocobase/nocobase/commit/415eb52cef1e8b7431132513d91746566f55e8f8)
- chore: update pull request template [`9d48dbd`](https://github.com/nocobase/nocobase/commit/9d48dbdcaa5c99804946b438c83499266f6456fd)
- chore: update package.json [`3da0fcf`](https://github.com/nocobase/nocobase/commit/3da0fcf3dd9af4d79e1de6af4e91b5fc622eb5ae)

## [v1.2.11-alpha](https://github.com/nocobase/nocobase/compare/v1.2.10-alpha...v1.2.11-alpha) - 2024-06-28

### Merged

- fix(data-scope): avoid cyclic invocation of the same API [`#4773`](https://github.com/nocobase/nocobase/pull/4773)
-  feat(client): add searchbar and increase ux of select popover in icon-picker component [`#4609`](https://github.com/nocobase/nocobase/pull/4609)
- feat(data-source-manager): filterTargetKey configuration optimization [`#4766`](https://github.com/nocobase/nocobase/pull/4766)

### Commits

- chore(versions): 😊 publish v1.2.11-alpha [`a2039c2`](https://github.com/nocobase/nocobase/commit/a2039c2f0d13b3628b7fc945e388ca9aaeab7ca1)
- chore: update changelog [`7459da6`](https://github.com/nocobase/nocobase/commit/7459da6aab1db7fcf71f7e5f042267e48689517e)

## [v1.2.10-alpha](https://github.com/nocobase/nocobase/compare/v1.2.9-alpha...v1.2.10-alpha) - 2024-06-27

### Merged

- fix(i18n): incorrect namespaces of plugins [`#4771`](https://github.com/nocobase/nocobase/pull/4771)
- fix(plugin-workflow-mailer): fix payload in sync mode [`#4765`](https://github.com/nocobase/nocobase/pull/4765)
- feat(plugin-workflow): add mode column to show if sync or not [`#4767`](https://github.com/nocobase/nocobase/pull/4767)

### Commits

- chore(versions): 😊 publish v1.2.10-alpha [`734aa1a`](https://github.com/nocobase/nocobase/commit/734aa1a007f67e2f699687eddc8c508bcf3816b5)
- chore: update changelog [`5448795`](https://github.com/nocobase/nocobase/commit/54487959f7ba09df6448e69a815c0deda13dde97)
- chore(e2e): make e2e tests more stable [`405a6ee`](https://github.com/nocobase/nocobase/commit/405a6eef8110e9a01c72905d3fb33ba4ba8b8a8e)

## [v1.2.9-alpha](https://github.com/nocobase/nocobase/compare/v1.2.8-alpha...v1.2.9-alpha) - 2024-06-27

### Merged

- test(plugin-workflow): check for duplicated triggering [`#4762`](https://github.com/nocobase/nocobase/pull/4762)
- fix: missing data on first load in cascading association field component within template block [`#4758`](https://github.com/nocobase/nocobase/pull/4758)
- fix: full height [`#4759`](https://github.com/nocobase/nocobase/pull/4759)
- fix: export filter component [`#4757`](https://github.com/nocobase/nocobase/pull/4757)
- fix(plugin-workflow): fix ui crash with unknown type trigger or node [`#4761`](https://github.com/nocobase/nocobase/pull/4761)
- fix(l10n): error when enabling plugin-localization first time [`#4760`](https://github.com/nocobase/nocobase/pull/4760)
- fix: error when overriding sorting field [`#4752`](https://github.com/nocobase/nocobase/pull/4752)
- fix(pm): parse package name [`#4756`](https://github.com/nocobase/nocobase/pull/4756)
- feat(l10n): allows to use l10n plugin resources in backend [`#4751`](https://github.com/nocobase/nocobase/pull/4751)
- feat(variable): add a new variable named 'Parent popup record' [`#4748`](https://github.com/nocobase/nocobase/pull/4748)
- chore(deps): bump i18next-http-backend from 2.4.2 to 2.5.2 [`#4743`](https://github.com/nocobase/nocobase/pull/4743)
- fix: checkbox style is not aligned when selecting the table [`#4718`](https://github.com/nocobase/nocobase/pull/4718)

### Commits

- chore(versions): 😊 publish v1.2.9-alpha [`4a50647`](https://github.com/nocobase/nocobase/commit/4a506472100b9f7a49f9b403119a63562a7d5c41)
- chore: update changelog [`ce25df2`](https://github.com/nocobase/nocobase/commit/ce25df23ada3f072e2461525a87bb4fe4e196c93)
- fix(pm): search by keywords [`1e44973`](https://github.com/nocobase/nocobase/commit/1e4497339a0ed33bb26a5af0c45b1fb695add9cb)

## [v1.2.8-alpha](https://github.com/nocobase/nocobase/compare/v1.2.7-alpha...v1.2.8-alpha) - 2024-06-25

### Merged

- fix:  missing multiple selection option for to-many association fields in sub-table [`#4742`](https://github.com/nocobase/nocobase/pull/4742)
- chore: update dependencies [`#4747`](https://github.com/nocobase/nocobase/pull/4747)
- fix: bug [`#4744`](https://github.com/nocobase/nocobase/pull/4744)
- fix: adjust print content [`#4746`](https://github.com/nocobase/nocobase/pull/4746)
- fix: double scrollbar on mobile client causing scrolling issues [`#4745`](https://github.com/nocobase/nocobase/pull/4745)
- fix: tag component should support enable link [`#4741`](https://github.com/nocobase/nocobase/pull/4741)
- fix: clear plugin list cache [`#4739`](https://github.com/nocobase/nocobase/pull/4739)
- fix(backup-restore): dump with collection that names were reserved words in mysql [`#4734`](https://github.com/nocobase/nocobase/pull/4734)
- refactor: integer fields with Primary selected will auto-check Auto increment [`#4313`](https://github.com/nocobase/nocobase/pull/4313)

### Commits

- chore(versions): 😊 publish v1.2.8-alpha [`3a8867e`](https://github.com/nocobase/nocobase/commit/3a8867eaef30cbcf119faf8505d8e0e9297f3eed)
- chore: update changelog [`2eb7811`](https://github.com/nocobase/nocobase/commit/2eb781112b611bb68bf19558d47e877f02d03e0f)
- chore: update link [`e69d33a`](https://github.com/nocobase/nocobase/commit/e69d33a09caa387230a5415f5351c93abbc4b6fe)

## [v1.2.7-alpha](https://github.com/nocobase/nocobase/compare/v1.2.6-alpha...v1.2.7-alpha) - 2024-06-24

### Merged

- fix: variable parse issue in link action  with variables in paths [`#4732`](https://github.com/nocobase/nocobase/pull/4732)
- fix(client): fix default size hint of upload component [`#4731`](https://github.com/nocobase/nocobase/pull/4731)
- fix(plugin-workflow): fix duplicating sync workflow [`#4727`](https://github.com/nocobase/nocobase/pull/4727)
- chore(data-vi):  remove `addMigrations` [`#4713`](https://github.com/nocobase/nocobase/pull/4713)
- fix(plugin-workflow): add loading for adding node [`#4726`](https://github.com/nocobase/nocobase/pull/4726)
- fix(plugin-workflow): fix designable of assign fields in create/update node [`#4724`](https://github.com/nocobase/nocobase/pull/4724)
- fix: optimize block template description [`#4721`](https://github.com/nocobase/nocobase/pull/4721)
- fix: subform/subtable height equaling form height when form height is set [`#4717`](https://github.com/nocobase/nocobase/pull/4717)
- fix(client): fix undefined context [`#4719`](https://github.com/nocobase/nocobase/pull/4719)
- fix(grid): grid style [`#4715`](https://github.com/nocobase/nocobase/pull/4715)

### Commits

- chore(versions): 😊 publish v1.2.7-alpha [`9276413`](https://github.com/nocobase/nocobase/commit/927641349f02d4419a0b22219586608f103df2ae)
- chore: cnpm sync [`8725492`](https://github.com/nocobase/nocobase/commit/87254928b610b441974f44fd2c853ef9e7fb9634)
- fix(vditor): lang error [`e2a22d4`](https://github.com/nocobase/nocobase/commit/e2a22d4c2691f4809a8e5809cafc7118b0ebe522)

## [v1.2.6-alpha](https://github.com/nocobase/nocobase/compare/v1.2.5-alpha...v1.2.6-alpha) - 2024-06-20

### Merged

- fix(plugin-workflow): fix client warning [`#4709`](https://github.com/nocobase/nocobase/pull/4709)
- fix(plugin-workflow): fix undefined error of action trigger [`#4710`](https://github.com/nocobase/nocobase/pull/4710)

### Commits

- chore(versions): 😊 publish v1.2.6-alpha [`504f8d1`](https://github.com/nocobase/nocobase/commit/504f8d107c308484702467bddf6d543768bbceea)
- chore: update changelog [`b525362`](https://github.com/nocobase/nocobase/commit/b525362751182a87b0ad0403d1a0b288fc70755a)

## [v1.2.5-alpha](https://github.com/nocobase/nocobase/compare/v1.2.4-alpha...v1.2.5-alpha) - 2024-06-19

### Merged

- fix(plugin-fm): fix thumbnail rule [`#4707`](https://github.com/nocobase/nocobase/pull/4707)
- fix(plugin-workflow): fix locale key in storage [`#4704`](https://github.com/nocobase/nocobase/pull/4704)
- fix: select field set as title field [`#4703`](https://github.com/nocobase/nocobase/pull/4703)
- fix: refresh list automatically after closing modal following add operation [`#4699`](https://github.com/nocobase/nocobase/pull/4699)
- fix(backup-restore): snippet name [`#4700`](https://github.com/nocobase/nocobase/pull/4700)
- fix(client): fix upload progress style [`#4698`](https://github.com/nocobase/nocobase/pull/4698)
- fix(variable): resolve the issue of incorrect sourceKey in variable lazy loading [`#4691`](https://github.com/nocobase/nocobase/pull/4691)
- refactor: sub-table disabled dragSort [`#4696`](https://github.com/nocobase/nocobase/pull/4696)
- fix: height calculation for full-height tabs in approval initiation and approval block [`#4686`](https://github.com/nocobase/nocobase/pull/4686)
- chore(data-source-main): field name exists error message [`#4689`](https://github.com/nocobase/nocobase/pull/4689)
- chore(database): mediumtext type support [`#4697`](https://github.com/nocobase/nocobase/pull/4697)
- fix(database): find model in hooks [`#4694`](https://github.com/nocobase/nocobase/pull/4694)
- feat(plugin-field-sequence): allow to customize date format [`#4685`](https://github.com/nocobase/nocobase/pull/4685)
- refactor(plugin-workflow-dc): move collection template to plugin and remove sort field [`#4682`](https://github.com/nocobase/nocobase/pull/4682)
- refactor: workflow block && template block support setting block height  [`#4678`](https://github.com/nocobase/nocobase/pull/4678)
- fix: restore field height spacing after removing description in form [`#4679`](https://github.com/nocobase/nocobase/pull/4679)

### Commits

- chore(versions): 😊 publish v1.2.5-alpha [`9968eda`](https://github.com/nocobase/nocobase/commit/9968eda02b5836af34f118f38826590cf0f60b04)
- chore: add cnpm sync script [`ac472ef`](https://github.com/nocobase/nocobase/commit/ac472efd23367a3ecac995c565e4d801fec6319c)
- chore: update changelog [`6a751b5`](https://github.com/nocobase/nocobase/commit/6a751b596fcfffd9b1224cf59818ccf7c4f27627)

## [v1.2.4-alpha](https://github.com/nocobase/nocobase/compare/v1.2.3-alpha...v1.2.4-alpha) - 2024-06-17

### Merged

- fix: action modal icon and Initializer menu close when click [`#4664`](https://github.com/nocobase/nocobase/pull/4664)
- fix(data-vi): custom filter conditions are not applied [`#4671`](https://github.com/nocobase/nocobase/pull/4671)
- fix: chart block actionBar style [`#4666`](https://github.com/nocobase/nocobase/pull/4666)
- feat(data-vi): allows to use json5 in chart json config [`#4668`](https://github.com/nocobase/nocobase/pull/4668)
- fix(duplicate): resolve error on click [`#4658`](https://github.com/nocobase/nocobase/pull/4658)
- style: list block [`#4665`](https://github.com/nocobase/nocobase/pull/4665)
- chore(action-import):   validate association & select field value [`#4643`](https://github.com/nocobase/nocobase/pull/4643)
- fix: form/detail/filter block height [`#4652`](https://github.com/nocobase/nocobase/pull/4652)
- chore(test): skipping websocket-related tests currently causes vitest to hang [`#4644`](https://github.com/nocobase/nocobase/pull/4644)
- fix(plugin-workflow): fix incorrectly schema reaction [`#4661`](https://github.com/nocobase/nocobase/pull/4661)
- Update ja_JP.json [`#4650`](https://github.com/nocobase/nocobase/pull/4650)
- fix(logger): fix the issue where workflow log files do not output [`#4657`](https://github.com/nocobase/nocobase/pull/4657)
- fix(plugin-fm): add migration for fixing new added legacy attachment field [`#4649`](https://github.com/nocobase/nocobase/pull/4649)
- fix(plugin-fm): set invalid when uploading is not completed to avoid submit [`#4653`](https://github.com/nocobase/nocobase/pull/4653)
- fix: client test [`#4648`](https://github.com/nocobase/nocobase/pull/4648)

### Commits

- chore(versions): 😊 publish v1.2.4-alpha [`9de4853`](https://github.com/nocobase/nocobase/commit/9de485303051750250d04135cdb9346fbd649742)
- chore: update changelog [`92cf3d7`](https://github.com/nocobase/nocobase/commit/92cf3d750e6589d80e4e344396d6148e9d2a4917)
- fix(mock-collections): syntax error at or near "-" [`6c431ca`](https://github.com/nocobase/nocobase/commit/6c431caec42abab960fddb0bd80d0d78a937b325)

## [v1.2.3-alpha](https://github.com/nocobase/nocobase/compare/v1.2.2-alpha...v1.2.3-alpha) - 2024-06-13

### Merged

- style(client): grid style improve [`#4647`](https://github.com/nocobase/nocobase/pull/4647)
- refactor(plugin-workflow): add card layout for assigning fields [`#4642`](https://github.com/nocobase/nocobase/pull/4642)
- style: markdown block style improve [`#4639`](https://github.com/nocobase/nocobase/pull/4639)

### Commits

- chore(versions): 😊 publish v1.2.3-alpha [`deacbf2`](https://github.com/nocobase/nocobase/commit/deacbf25e9b057c59b4f5c84d353ba18676b3b9e)
- chore: update changelog [`b2775fa`](https://github.com/nocobase/nocobase/commit/b2775fa6cb5ea94e51f0da2ffcf0770fd7d42bc8)

## [v1.2.2-alpha](https://github.com/nocobase/nocobase/compare/v1.2.1-alpha...v1.2.2-alpha) - 2024-06-12

### Merged

- feat: support qrcode embed in markdown and scan in mobile  [`#4638`](https://github.com/nocobase/nocobase/pull/4638)
- refactor(plugin-workflow): use assigned fields for create/update node values [`#4546`](https://github.com/nocobase/nocobase/pull/4546)
- fix(plugin-workflow-request): fix test [`#4634`](https://github.com/nocobase/nocobase/pull/4634)
- fix: block height calculation [`#4629`](https://github.com/nocobase/nocobase/pull/4629)

### Commits

- chore(versions): 😊 publish v1.2.2-alpha [`e45bdb7`](https://github.com/nocobase/nocobase/commit/e45bdb7d2f44437e7ef1f6862c6f72fad5649104)
- chore: update changelog [`20f85cd`](https://github.com/nocobase/nocobase/commit/20f85cd6e5bb276add156610958c8a693e979937)

## [v1.2.1-alpha](https://github.com/nocobase/nocobase/compare/v1.2.0-alpha...v1.2.1-alpha) - 2024-06-12

### Merged

- chore(action-import): skip reset sequence if no auto-increment primary is imported [`#4631`](https://github.com/nocobase/nocobase/pull/4631)

### Commits

- chore(versions): 😊 publish v1.2.1-alpha [`0d6ebe1`](https://github.com/nocobase/nocobase/commit/0d6ebe16cf7e6c4ff8e3cb3578927f2315588aa4)
- chore: update changelog [`93d3313`](https://github.com/nocobase/nocobase/commit/93d33131e60ebd8c3e88df074622e46565b0d31a)
- fix: use dataSource.collectionManager.getCollection [`75f5098`](https://github.com/nocobase/nocobase/commit/75f5098dedb4fdf636c1c568ba118c59fbb751ae)

## [v1.2.0-alpha](https://github.com/nocobase/nocobase/compare/v1.1.0-alpha.0...v1.2.0-alpha) - 2024-06-12

### Merged

- chore: update release ci [`#4632`](https://github.com/nocobase/nocobase/pull/4632)

### Commits

- chore(versions): 😊 publish v1.2.0-alpha [`7963417`](https://github.com/nocobase/nocobase/commit/79634179a4ad17b3a3c1eeec6ac2a63c362ea047)

## [v1.1.0-alpha.0](https://github.com/nocobase/nocobase/compare/v1.0.1-alpha.3...v1.1.0-alpha.0) - 2024-06-12

### Merged

- fix(filter-form): fix auto-trigger filter action without default value [`#4627`](https://github.com/nocobase/nocobase/pull/4627)
- fix: page freeze when handling formula field in sub-table after add,select and delete record [`#4613`](https://github.com/nocobase/nocobase/pull/4613)
- feat: workbench block [`#4555`](https://github.com/nocobase/nocobase/pull/4555)

### Commits

- chore(versions): 😊 publish v1.1.0-alpha.0 [`b6bf12a`](https://github.com/nocobase/nocobase/commit/b6bf12af2292bcf306bc9de7006b7c57ad89a712)
- chore: update release ci [`ae80da7`](https://github.com/nocobase/nocobase/commit/ae80da775419dcc0720c8c5af2996a5173c9948c)
- chore: update changelog [`431df8e`](https://github.com/nocobase/nocobase/commit/431df8ec98593f337baaa24d7c06f55a0ba1cb33)

## [v1.0.1-alpha.3](https://github.com/nocobase/nocobase/compare/v1.0.1-alpha.2...v1.0.1-alpha.3) - 2024-06-11

### Merged

- fix(auth): translation of sign in page [`#4624`](https://github.com/nocobase/nocobase/pull/4624)
- fix: import data with association field [`#4623`](https://github.com/nocobase/nocobase/pull/4623)
- feat: tree block [`#4566`](https://github.com/nocobase/nocobase/pull/4566)
- chore(deps-dev): bump multer-aliyun-oss from 2.1.1 to 2.1.3 [`#4614`](https://github.com/nocobase/nocobase/pull/4614)

### Commits

- chore(versions): 😊 publish v1.0.1-alpha.3 [`c7060ae`](https://github.com/nocobase/nocobase/commit/c7060aecebaed492296092efc37193c43eb073e9)
- chore: update changelog [`1dc8b20`](https://github.com/nocobase/nocobase/commit/1dc8b20f08f7d16143de3ab4d9a8dd71af47e303)
- Update README.zh-CN.md [`c413b3e`](https://github.com/nocobase/nocobase/commit/c413b3eba50a006f829235e1a37775c422717183)

## [v1.0.1-alpha.2](https://github.com/nocobase/nocobase/compare/v1.0.1-alpha.1...v1.0.1-alpha.2) - 2024-06-11

### Merged

- feat(filter-form): auto-trigger filter action when default values exist [`#4622`](https://github.com/nocobase/nocobase/pull/4622)
- fix: missing height in map history block [`#4621`](https://github.com/nocobase/nocobase/pull/4621)
- fix: table block height issue with minimal data [`#4617`](https://github.com/nocobase/nocobase/pull/4617)
- fix(preset): fix plugin-workflow-mailer version [`#4619`](https://github.com/nocobase/nocobase/pull/4619)
- fix(auth): allows to set the auth type title translation from server end [`#4616`](https://github.com/nocobase/nocobase/pull/4616)
- fix(export): export button remaining in loading state after cancel [`#4615`](https://github.com/nocobase/nocobase/pull/4615)
- feat(tree-block): support filtering child nodes [`#4603`](https://github.com/nocobase/nocobase/pull/4603)
- fix(client): fix text wrap in variable input [`#4605`](https://github.com/nocobase/nocobase/pull/4605)
- refactor(plugin-workflow): change variable getter from collection fields [`#4567`](https://github.com/nocobase/nocobase/pull/4567)
- fix: remove grid wrap [`#4612`](https://github.com/nocobase/nocobase/pull/4612)
- feat(client): allow JSON5 value in Form Input of type JSONTextArea [`#4600`](https://github.com/nocobase/nocobase/pull/4600)
- fix: iframe block loses height when set to default [`#4602`](https://github.com/nocobase/nocobase/pull/4602)
- feat(plugin-workflow-smtp-mailer): add new plugin for sending email in workflow [`#4584`](https://github.com/nocobase/nocobase/pull/4584)
- chore: fix typo [`#4589`](https://github.com/nocobase/nocobase/pull/4589)

### Commits

- chore(versions): 😊 publish v1.0.1-alpha.2 [`092f3af`](https://github.com/nocobase/nocobase/commit/092f3afab132ef9dbfc2d7228ca4c14b505f383a)
- chore: update changelog [`6bc8a09`](https://github.com/nocobase/nocobase/commit/6bc8a093ad4ded9ac56b62279e6f6f715796191f)

## [v1.0.1-alpha.1](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.17...v1.0.1-alpha.1) - 2024-06-07

### Merged

- fix: style issues for gridCard in mobile client [`#4599`](https://github.com/nocobase/nocobase/pull/4599)
- fix: style issues for gridCard in mobile client [`#4593`](https://github.com/nocobase/nocobase/pull/4593)
- fix(variable): should remove through collection field [`#4590`](https://github.com/nocobase/nocobase/pull/4590)
- feat(data-vi): support for using url params and current role variables [`#4586`](https://github.com/nocobase/nocobase/pull/4586)
- refactor(variable): support default value setting [`#4583`](https://github.com/nocobase/nocobase/pull/4583)
- fix: compatibility issues with historical kanban and iframe block [`#4587`](https://github.com/nocobase/nocobase/pull/4587)
- fix(linkage-rules): resolve issue with invalid expressions [`#4580`](https://github.com/nocobase/nocobase/pull/4580)
- fix(map): amap reset [`#4574`](https://github.com/nocobase/nocobase/pull/4574)
- feat: url support preview [`#4559`](https://github.com/nocobase/nocobase/pull/4559)
- fix: correct precision conversion error for Unix timestamp in readPretty [`#4569`](https://github.com/nocobase/nocobase/pull/4569)
- feat(plugin-workflow): allow to select any path of a variable in condition node [`#4571`](https://github.com/nocobase/nocobase/pull/4571)
- fix(client): fix action props [`#4568`](https://github.com/nocobase/nocobase/pull/4568)
- refactor: export & import plugin [`#4468`](https://github.com/nocobase/nocobase/pull/4468)
- fix: styling issues during field drag-and-drop in details/form/list block [`#4558`](https://github.com/nocobase/nocobase/pull/4558)
- chore(e2e): make e2e tests more stable [`#4565`](https://github.com/nocobase/nocobase/pull/4565)
- fix: sign up page not found for a new basic authentication [`#4556`](https://github.com/nocobase/nocobase/pull/4556)
- fix(l10n): i18n namespace of page title [`#4557`](https://github.com/nocobase/nocobase/pull/4557)
- feat: iframe support variables [`#4512`](https://github.com/nocobase/nocobase/pull/4512)
- fix(client): fix upload logo in system settings [`#4564`](https://github.com/nocobase/nocobase/pull/4564)
- fix(plugin-fm): fix attachment component selectable check [`#4563`](https://github.com/nocobase/nocobase/pull/4563)
- fix(client): fix waring props [`#4562`](https://github.com/nocobase/nocobase/pull/4562)
- fix(plugin-fm): fix page crash when 413 in local dev [`#4560`](https://github.com/nocobase/nocobase/pull/4560)
- fix defaultImage in constants.ts for google maps [`#4483`](https://github.com/nocobase/nocobase/pull/4483)
- refactor(FormV2): add FormWithDataTemplates component [`#4551`](https://github.com/nocobase/nocobase/pull/4551)
- feat(client): add new variable named 'URL search params' and support link action [`#4506`](https://github.com/nocobase/nocobase/pull/4506)
- feat: data block support setting block height [`#4441`](https://github.com/nocobase/nocobase/pull/4441)
- chore(deps): bump @typescript-eslint/parser from 6.14.0 to 6.21.0 [`#4548`](https://github.com/nocobase/nocobase/pull/4548)
- feat(logger): support for collecting debug informations when rendering failed [`#4524`](https://github.com/nocobase/nocobase/pull/4524)
- fix: data filtering and formula field value errors after subtable record selection [`#4547`](https://github.com/nocobase/nocobase/pull/4547)
- fix: show cascade select when no data in edit form [`#4543`](https://github.com/nocobase/nocobase/pull/4543)
- fix(plugin-workflow): fix workflow version dropdown overflow [`#4542`](https://github.com/nocobase/nocobase/pull/4542)
- test(block-templates): add test cases [`#4540`](https://github.com/nocobase/nocobase/pull/4540)
- feat(client): adjust toolbar for Table Actions [`#4538`](https://github.com/nocobase/nocobase/pull/4538)
- chore(deps): bump sanitize-html from 2.10.0 to 2.13.0 [`#4505`](https://github.com/nocobase/nocobase/pull/4505)
- fix(client): fix data template style [`#4536`](https://github.com/nocobase/nocobase/pull/4536)
- fix(plugin-fm): fix cos path error [`#4537`](https://github.com/nocobase/nocobase/pull/4537)
- fix: prevent deletion of entire association field  when removing the last column in subtable [`#4518`](https://github.com/nocobase/nocobase/pull/4518)
- fix(plugin-fm): fix delete file error of cos [`#4529`](https://github.com/nocobase/nocobase/pull/4529)
- fix: table borded [`#4534`](https://github.com/nocobase/nocobase/pull/4534)
- fix(client): fix the issue where adding block templates in the popup does not display [`#4531`](https://github.com/nocobase/nocobase/pull/4531)
- Fix/initializer improve [`#4533`](https://github.com/nocobase/nocobase/pull/4533)
- fix(i18n): fix i18n namespace for collection titles [`#4530`](https://github.com/nocobase/nocobase/pull/4530)
- fix(plugin-map): add 'Set default zoom level' option for map fields [`#4527`](https://github.com/nocobase/nocobase/pull/4527)
- fix: disable cascading select component for association field in subtable [`#4517`](https://github.com/nocobase/nocobase/pull/4517)
- fix:  association field  enablement affecting block field states [`#4528`](https://github.com/nocobase/nocobase/pull/4528)
- fix(utils): fix json-templates [`#4525`](https://github.com/nocobase/nocobase/pull/4525)
- fix(client): fix deep association select in AppendsTreeSelect component [`#4526`](https://github.com/nocobase/nocobase/pull/4526)
- fix: table drag error [`#4511`](https://github.com/nocobase/nocobase/pull/4511)
- fix(client): fix the issue where setting default values using variabl… [`#4521`](https://github.com/nocobase/nocobase/pull/4521)
- fix(plugin-workflow-manual): fix custom form field wrong interface in manual node [`#4520`](https://github.com/nocobase/nocobase/pull/4520)
- fix(plugin-workflow): fix trigger workflow acl [`#4522`](https://github.com/nocobase/nocobase/pull/4522)
- fix(plugin-workflow-request): fix locale [`#4519`](https://github.com/nocobase/nocobase/pull/4519)
- fix: update form submit action missing linkageRules setting [`#4515`](https://github.com/nocobase/nocobase/pull/4515)
- chore: add group title to Table item action settings [`#4516`](https://github.com/nocobase/nocobase/pull/4516)
- fix(client): fix Variable.TextArea style [`#4513`](https://github.com/nocobase/nocobase/pull/4513)
- fix(acl): use default role when `x-role` does not belong to the current user [`#4507`](https://github.com/nocobase/nocobase/pull/4507)
- feat(plugin-fm): make rules configurable [`#4118`](https://github.com/nocobase/nocobase/pull/4118)
- fix(data-vi): field component invisible when setting default value for filter field [`#4509`](https://github.com/nocobase/nocobase/pull/4509)
- feat(client): refining error fallback for different components when catching errors [`#4459`](https://github.com/nocobase/nocobase/pull/4459)
- refactor: remove all frontend checks for isForeignKey [`#4499`](https://github.com/nocobase/nocobase/pull/4499)
- fix: after update event in single relation repository [`#4503`](https://github.com/nocobase/nocobase/pull/4503)
- chore(auth): change char length limit of username to 1-50 [`#4502`](https://github.com/nocobase/nocobase/pull/4502)
- fix: sub-table support allowAddNew setting [`#4498`](https://github.com/nocobase/nocobase/pull/4498)

### Commits

- chore: update changelog [`b70528a`](https://github.com/nocobase/nocobase/commit/b70528a4ca6f479b5d6e8111db95a2f4a5ce72e8)
- chore(versions): 😊 publish v1.0.1-alpha.1 [`9218319`](https://github.com/nocobase/nocobase/commit/9218319d02fb41523eae42417eedee58a77204de)
- Revert "chore: make e2e tests more stable" [`2dfa7a2`](https://github.com/nocobase/nocobase/commit/2dfa7a2625761f6bf0c64585f6e3438175f7a88a)

## [v1.0.0-alpha.17](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) - 2024-05-27

### Merged

- fix: optimize data scope variable in permission configuration [`#4484`](https://github.com/nocobase/nocobase/pull/4484)
- refactor: form linkage rule to cancel assignment when multiple fields are selected [`#4492`](https://github.com/nocobase/nocobase/pull/4492)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.17 [`53eb054`](https://github.com/nocobase/nocobase/commit/53eb054848d599e624f1cc8bd4f76fddd315797f)
- Update README.md [`3851d49`](https://github.com/nocobase/nocobase/commit/3851d4946909d91ca293488843f25737901a419a)
- chore: update changelog [`8d7bc1f`](https://github.com/nocobase/nocobase/commit/8d7bc1ffdbe703f6b181feb7da739b1f9d6745a1)

## [v1.0.0-alpha.16](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) - 2024-05-27

### Merged

- fix:  numeric field display issue in form linkage rule [`#4482`](https://github.com/nocobase/nocobase/pull/4482)
- fix: export action missing data scope filter [`#4476`](https://github.com/nocobase/nocobase/pull/4476)
- chore: application start error message [`#4477`](https://github.com/nocobase/nocobase/pull/4477)
- fix(subTable): prevent setting default value for fields that have been unmounted [`#4475`](https://github.com/nocobase/nocobase/pull/4475)
- fix: attachment collection permission [`#4470`](https://github.com/nocobase/nocobase/pull/4470)
- fix(database): foreign key index in underscored table [`#4473`](https://github.com/nocobase/nocobase/pull/4473)
- fix: missing app context in modal [`#4457`](https://github.com/nocobase/nocobase/pull/4457)
- chore: avoid misoperation of date variables [`#4452`](https://github.com/nocobase/nocobase/pull/4452)
- fix(plugin): resolve error caused by duplicate addition of custom request [`#4458`](https://github.com/nocobase/nocobase/pull/4458)
- fix: verdaccio/verdaccio:5 [`#4448`](https://github.com/nocobase/nocobase/pull/4448)
- fix(core): support selecting the first level of variables as the default value [`#4439`](https://github.com/nocobase/nocobase/pull/4439)
- fix: table row action linkage rule defect error [`#4436`](https://github.com/nocobase/nocobase/pull/4436)
- fix(plugin-workflow): fix condition node variable error [`#4437`](https://github.com/nocobase/nocobase/pull/4437)
- fix(plugin-workflow): fix empty value in create and update node association values [`#4433`](https://github.com/nocobase/nocobase/pull/4433)
- fix: error in deleting data query after block linkage filtering [`#4434`](https://github.com/nocobase/nocobase/pull/4434)
- docs(client): should name SchemaInitializer starting with a lowercase letter [`#4432`](https://github.com/nocobase/nocobase/pull/4432)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.16 [`2e7744f`](https://github.com/nocobase/nocobase/commit/2e7744f85cffa297bb91c7c41e232fdcf3973e8d)
- fix(client): remove the "you are offline" prompt [`1e230ec`](https://github.com/nocobase/nocobase/commit/1e230ecbc239d36192ada128e56632e4d7697345)
- chore: update changelog [`121b6a8`](https://github.com/nocobase/nocobase/commit/121b6a8f4eaa2a1c68937bf9ab9f9bdad320f1d3)

## [v1.0.0-alpha.15](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) - 2024-05-21

### Merged

- refactor: the default accuracy of the UnixTimestamp field is second [`#4418`](https://github.com/nocobase/nocobase/pull/4418)
- refactor: collection manager setting title field [`#4419`](https://github.com/nocobase/nocobase/pull/4419)
- feat(logger): add `dailyRotateFile` to default transport & add `trace` level [`#4429`](https://github.com/nocobase/nocobase/pull/4429)
- fix: useCurrentFormVariable  [`#4428`](https://github.com/nocobase/nocobase/pull/4428)
- feat(plugin-workflow-request): allow to use response variables [`#4414`](https://github.com/nocobase/nocobase/pull/4414)
- refactor(plugin-workflow): adjust multiple option in query node [`#4412`](https://github.com/nocobase/nocobase/pull/4412)
- fix(filter-form): fix operator not valid in block templates [`#4390`](https://github.com/nocobase/nocobase/pull/4390)
- fix: custom request action should support linkage rule setting [`#4410`](https://github.com/nocobase/nocobase/pull/4410)
- fix: Fix typo in link target [`#4416`](https://github.com/nocobase/nocobase/pull/4416)
- fix: change License link [`#4415`](https://github.com/nocobase/nocobase/pull/4415)
- chore: migration to fix tree fields option [`#4369`](https://github.com/nocobase/nocobase/pull/4369)
- fix: column name ambiguous error in array operator [`#4401`](https://github.com/nocobase/nocobase/pull/4401)
- fix: values to filter with emtpy values [`#4319`](https://github.com/nocobase/nocobase/pull/4319)
- fix(data-vi): transform values of multiple selection fields to labels [`#4398`](https://github.com/nocobase/nocobase/pull/4398)
- feat: add process.env.API_CLIENT_STORAGE_PREFIX [`#4395`](https://github.com/nocobase/nocobase/pull/4395)
- fix: the inherited field should be able to be set as the title field [`#4394`](https://github.com/nocobase/nocobase/pull/4394)
- fix: duplicated items in update associations [`#4393`](https://github.com/nocobase/nocobase/pull/4393)
- fix(data-vi): the custom tooltip for the pie chart is not working [`#4392`](https://github.com/nocobase/nocobase/pull/4392)
- fix(theme-editor): form field spacing should not be affected by token.marginBlock [`#4374`](https://github.com/nocobase/nocobase/pull/4374)
- fix(plugin-workflow-request): fix request hanging when invalid header value [`#4376`](https://github.com/nocobase/nocobase/pull/4376)
- fix(logger): should close log stream after destroying app [`#4380`](https://github.com/nocobase/nocobase/pull/4380)
- fix(plugin-workflow-action-trigger): fix hint [`#4383`](https://github.com/nocobase/nocobase/pull/4383)
- chore: test on windows [`#4375`](https://github.com/nocobase/nocobase/pull/4375)
- fix: data template middleware in data source [`#4378`](https://github.com/nocobase/nocobase/pull/4378)
- chore: split sql collection [`#3650`](https://github.com/nocobase/nocobase/pull/3650)
- refactor: tree collection support presetFieldsDisabledIncludes [`#4371`](https://github.com/nocobase/nocobase/pull/4371)
- fix(data-vi): should use local timezone when formatting date [`#4366`](https://github.com/nocobase/nocobase/pull/4366)
- chore: set main as a reserved character for application name [`#4370`](https://github.com/nocobase/nocobase/pull/4370)
- refactor:  flatten and merge Actions [`#4336`](https://github.com/nocobase/nocobase/pull/4336)
- fix: accuracy loss in bigint field read pretty [`#4360`](https://github.com/nocobase/nocobase/pull/4360)

### Commits

- chore: update yarn.lock [`a698de2`](https://github.com/nocobase/nocobase/commit/a698de26e0ab56c86ce0891b603aa47b500111c2)
- chore(versions): 😊 publish v1.0.0-alpha.15 [`4f3a3c0`](https://github.com/nocobase/nocobase/commit/4f3a3c0931d25fb5e4e4d0ee3d65564ac662a891)
- Update bug_report.md [`0626b83`](https://github.com/nocobase/nocobase/commit/0626b8301dfa7c874aa4e9514513be891c275e36)

## [v1.0.0-alpha.14](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) - 2024-05-16

### Merged

- fix: require resolve [`#4356`](https://github.com/nocobase/nocobase/pull/4356)
- fix: after setting title field the collection data should refresh [`#4358`](https://github.com/nocobase/nocobase/pull/4358)
- fix(plugin-workflow-request): fix value fields overflowing [`#4354`](https://github.com/nocobase/nocobase/pull/4354)
- chore(deps): bump tsx from 4.6.2 to 4.10.2 [`#4339`](https://github.com/nocobase/nocobase/pull/4339)
- chore(deps): bump @formily/path from 2.3.0 to 2.3.1 [`#4338`](https://github.com/nocobase/nocobase/pull/4338)
- fix: table column should support blank column occupancy [`#4350`](https://github.com/nocobase/nocobase/pull/4350)
- fix(plugin-workflow): fix bind hint based on event type [`#4349`](https://github.com/nocobase/nocobase/pull/4349)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.14 [`0399272`](https://github.com/nocobase/nocobase/commit/039927266461777149392f71f54859768fb40030)
- Revert "chore(deps): bump tsx from 4.6.2 to 4.10.2 (#4339)" [`5fa77df`](https://github.com/nocobase/nocobase/commit/5fa77df58af62fa41493e2aacdbb824fe97c4c99)
- chore: update changelog [`410af77`](https://github.com/nocobase/nocobase/commit/410af77f0ce9dbe22d05cdf90e8caf91c89cafb4)

## [v1.0.0-alpha.13](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.12...v1.0.0-alpha.13) - 2024-05-14

### Merged

- feat: record last seen at in supervisor [`#4345`](https://github.com/nocobase/nocobase/pull/4345)
- fix: demo bug [`#4348`](https://github.com/nocobase/nocobase/pull/4348)
- chore: snippet name replacement [`#4346`](https://github.com/nocobase/nocobase/pull/4346)
- chore(deps-dev): bump rc-tree-select from 5.5.5 to 5.20.0 [`#4340`](https://github.com/nocobase/nocobase/pull/4340)
- chore(deps): bump markdown-it and @types/markdown-it [`#4343`](https://github.com/nocobase/nocobase/pull/4343)
- refactor: imporve add License [`#4326`](https://github.com/nocobase/nocobase/pull/4326)
- fix(plugin-workflow-request): fix ignoreFail in sync mode [`#4334`](https://github.com/nocobase/nocobase/pull/4334)
- fix: block error can delete [`#4329`](https://github.com/nocobase/nocobase/pull/4329)
- fix: create kanban block report error [`#4332`](https://github.com/nocobase/nocobase/pull/4332)
- fix(logger): download path [`#4327`](https://github.com/nocobase/nocobase/pull/4327)
- fix(logger): list log files by application name [`#4325`](https://github.com/nocobase/nocobase/pull/4325)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.13 [`3e7d85b`](https://github.com/nocobase/nocobase/commit/3e7d85b8fac8989a959fe63b8a3c28e8a1a8ba49)
- fix: restart the application after updating the plugin [`91c24ef`](https://github.com/nocobase/nocobase/commit/91c24efd0ba6fdd5bc0fc55f7fc8a22411059820)
- chore(CI): should run jobs when yarn.lock is changed [`325a415`](https://github.com/nocobase/nocobase/commit/325a415a99ddff4e71ee35e14936144bc6749494)

## [v1.0.0-alpha.12](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) - 2024-05-13

### Merged

- fix: collection support title field setting [`#4322`](https://github.com/nocobase/nocobase/pull/4322)
- fix: create tree collection field [`#4321`](https://github.com/nocobase/nocobase/pull/4321)
- feat: strategy with resources list [`#4312`](https://github.com/nocobase/nocobase/pull/4312)
- chore: test e2e CI [`#4314`](https://github.com/nocobase/nocobase/pull/4314)
- test: e2e test [`#4316`](https://github.com/nocobase/nocobase/pull/4316)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.12 [`52a893f`](https://github.com/nocobase/nocobase/commit/52a893f98981aabe14f46b2ab05fe71873bd2a90)
- chore: update changelog [`e7ac08d`](https://github.com/nocobase/nocobase/commit/e7ac08da8d4ed1b2752aee7dd03575bcc6b6100a)
- chore(CI): skip comment in main branch [`819ac79`](https://github.com/nocobase/nocobase/commit/819ac79f1a7335bf37c9caba3e818b75e0bfbdb9)

## [v1.0.0-alpha.11](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) - 2024-05-11

### Merged

- fix(plugin-workflow-aggregate): fix association field select [`#4315`](https://github.com/nocobase/nocobase/pull/4315)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.11 [`fcd368c`](https://github.com/nocobase/nocobase/commit/fcd368cee36a25e150e5b79553dec14ee2db6cf1)
- chore: update changelog [`d86591b`](https://github.com/nocobase/nocobase/commit/d86591b2022d953aea3209b726622549139b1353)

## [v1.0.0-alpha.10](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) - 2024-05-11

### Merged

- perf(e2e): reduce e2e runtime [`#4280`](https://github.com/nocobase/nocobase/pull/4280)
- fix: linkage rule  fireImmediately should be true [`#4303`](https://github.com/nocobase/nocobase/pull/4303)
- refactor: export AuthenticatorsContextProvider and add client.d.ts [`#4311`](https://github.com/nocobase/nocobase/pull/4311)
- test: optimal calculationNode e2e [`#4310`](https://github.com/nocobase/nocobase/pull/4310)
- fix: support admin.xx static [`#4304`](https://github.com/nocobase/nocobase/pull/4304)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.10 [`814d5cb`](https://github.com/nocobase/nocobase/commit/814d5cb2d2b259bfaf0a9e24fe531513a954410f)
- chore: update changelog [`f2db121`](https://github.com/nocobase/nocobase/commit/f2db1218b02585da252831c8a572e2b4f2903f9e)
- Update README.md [`5fb0081`](https://github.com/nocobase/nocobase/commit/5fb0081236578f07c73bf921059b9a5f209c8a22)

## [v1.0.0-alpha.9](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) - 2024-05-09

### Merged

- chore: release ci [`#4306`](https://github.com/nocobase/nocobase/pull/4306)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.9 [`9ecdf9b`](https://github.com/nocobase/nocobase/commit/9ecdf9bc086a66b0418de25f9009e67b1f21f069)

## [v1.0.0-alpha.8](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) - 2024-05-09

### Merged

- chore: release ci [`#4305`](https://github.com/nocobase/nocobase/pull/4305)
- chore: release ci [`#4302`](https://github.com/nocobase/nocobase/pull/4302)
- chore: optimize timeout for e2e [`#4276`](https://github.com/nocobase/nocobase/pull/4276)
- feat(plugin-workflow-request): support "application/x-www-form-urlencoded" type [`#4296`](https://github.com/nocobase/nocobase/pull/4296)

### Commits

- chore: update changelog [`556dfcd`](https://github.com/nocobase/nocobase/commit/556dfcd0e342f390142257cfe80a9e7ce3cee0ad)
- chore(versions): 😊 publish v1.0.0-alpha.8 [`d57ebbd`](https://github.com/nocobase/nocobase/commit/d57ebbdb44cb7b93c8723838031ddb071f578dd1)
- chore: update release ci [`58c3c0f`](https://github.com/nocobase/nocobase/commit/58c3c0fc6a84521464f58a3a8fac13c2ceae40a0)

## [v1.0.0-alpha.7](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) - 2024-05-09

### Merged

- chore: release ci [`#4293`](https://github.com/nocobase/nocobase/pull/4293)
- fix(plugin-workflow-custom-action-trigger): fix locales [`#4298`](https://github.com/nocobase/nocobase/pull/4298)
- style: add child action style improve [`#4289`](https://github.com/nocobase/nocobase/pull/4289)
- fix: configure data scope in action permission reporting error [`#4301`](https://github.com/nocobase/nocobase/pull/4301)
- test conditionNode e2e [`#4295`](https://github.com/nocobase/nocobase/pull/4295)
- fix: bug [`#4300`](https://github.com/nocobase/nocobase/pull/4300)
- fix: association collection  field should not support sortable [`#4288`](https://github.com/nocobase/nocobase/pull/4288)
- Fix/doc multi lang change [`#4299`](https://github.com/nocobase/nocobase/pull/4299)
- feat(client): add hidden option to interface [`#4279`](https://github.com/nocobase/nocobase/pull/4279)
- feat: table column support fixed right or fixed left [`#4260`](https://github.com/nocobase/nocobase/pull/4260)
- fix: collection field support x-use-component-props [`#4264`](https://github.com/nocobase/nocobase/pull/4264)
- fix: update doc demos [`#4262`](https://github.com/nocobase/nocobase/pull/4262)
- refactor(plugin-workflow): migrate directly action trigger to custom action trigger [`#4253`](https://github.com/nocobase/nocobase/pull/4253)
- feat: support mobile iframe block and toolbar props [`#4292`](https://github.com/nocobase/nocobase/pull/4292)
- fix: missing toolbar props [`#4291`](https://github.com/nocobase/nocobase/pull/4291)
- fix: actionSchemaToolbar support x-toolbar-props [`#4286`](https://github.com/nocobase/nocobase/pull/4286)
- refactor: external data source view collection createMainOnly [`#4287`](https://github.com/nocobase/nocobase/pull/4287)
- feat: add Gantt and Kanban blocks in pop ups/drawers [`#4277`](https://github.com/nocobase/nocobase/pull/4277)
- fix: association select report Maximum call stack size exceeded in sub-table [`#4278`](https://github.com/nocobase/nocobase/pull/4278)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.7 [`24590cd`](https://github.com/nocobase/nocobase/commit/24590cdd74cf6f34dfecedcdda4b8e78dbdd1152)
- fix(server): parse plugin name [`61338ee`](https://github.com/nocobase/nocobase/commit/61338eedb78fbdf3457ffddd9666297e048acaf6)
- chore: update changelog [`8ae7d48`](https://github.com/nocobase/nocobase/commit/8ae7d481bfdcd5254327377aef477160bb5c31dd)

## [v1.0.0-alpha.6](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) - 2024-05-07

### Merged

- feat: detail block support linkage rule [`#4221`](https://github.com/nocobase/nocobase/pull/4221)
- fix: bulk delete collection field should not close modal [`#4263`](https://github.com/nocobase/nocobase/pull/4263)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.6 [`a2d8870`](https://github.com/nocobase/nocobase/commit/a2d8870fdfecdec6c835d1a0aa367dcdc52c0029)
- chore: add generate-npmignore.sh [`140a3a4`](https://github.com/nocobase/nocobase/commit/140a3a421ff5dd6a7a59638c01fafda6b92cae38)
- chore: update changelog [`080fc78`](https://github.com/nocobase/nocobase/commit/080fc78c1a744d47e010b3bbe5840446775800e4)

## [v1.0.0-alpha.5](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) - 2024-05-07

### Merged

- feat(database): append default sort options into find [`#4231`](https://github.com/nocobase/nocobase/pull/4231)
- fix: switch date field of the linkage rule from  expression to constant value display Invalid Date [`#4251`](https://github.com/nocobase/nocobase/pull/4251)
- fix: collection fields should refreshed after editing  sync from database [`#4224`](https://github.com/nocobase/nocobase/pull/4224)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.5 [`3c3e68a`](https://github.com/nocobase/nocobase/commit/3c3e68acdc2a7696d17637ca1d19705ba16a23f6)
- chore: update changelog [`a5a270d`](https://github.com/nocobase/nocobase/commit/a5a270d64190814373df10f55c3ae7457f6d62a5)

## [v1.0.0-alpha.4](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) - 2024-05-02

### Merged

- fix(plugin-workflow-request): fix response log [`#4249`](https://github.com/nocobase/nocobase/pull/4249)
- fix(plugin-workflow): fix e2e typo [`#4247`](https://github.com/nocobase/nocobase/pull/4247)
- fix(plugin-workflow): fix duplicated triggering schedule event in multiple apps [`#4201`](https://github.com/nocobase/nocobase/pull/4201)
- fix(client): fix error log in variable component [`#4248`](https://github.com/nocobase/nocobase/pull/4248)
- client components [`#4216`](https://github.com/nocobase/nocobase/pull/4216)
- fix(logger): gateway log cache issue && upgrade winston [`#4250`](https://github.com/nocobase/nocobase/pull/4250)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.4 [`7d24e11`](https://github.com/nocobase/nocobase/commit/7d24e11229ef1fd0c5ea797407125bdab4c4a032)
- chore: update changelog [`6fbe77d`](https://github.com/nocobase/nocobase/commit/6fbe77d10c758f47288c5321cbff34c1b51c2d10)

## [v1.0.0-alpha.3](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) - 2024-04-30

### Merged

- chore: add copyright information to the file header [`#4028`](https://github.com/nocobase/nocobase/pull/4028)
- fix: upgrade sub app [`#4246`](https://github.com/nocobase/nocobase/pull/4246)
- refactor: extract to SetTheCountOfColumnsDisplayedInARow [`#4211`](https://github.com/nocobase/nocobase/pull/4211)
- refactor: tree collection association support sub-table & sub-detail [`#4225`](https://github.com/nocobase/nocobase/pull/4225)
- chore: upgrade vitest [`#4232`](https://github.com/nocobase/nocobase/pull/4232)
- fix: restore backup before 1.0 [`#4228`](https://github.com/nocobase/nocobase/pull/4228)
- chore: error message on backup restore [`#4218`](https://github.com/nocobase/nocobase/pull/4218)
- fix: improve plugin static file proxy [`#4227`](https://github.com/nocobase/nocobase/pull/4227)
- fix: build order bug [`#4223`](https://github.com/nocobase/nocobase/pull/4223)
- fix: missing pageSize parameters when setting column field sorting [`#4219`](https://github.com/nocobase/nocobase/pull/4219)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.3 [`2ba022a`](https://github.com/nocobase/nocobase/commit/2ba022ac1f7cdd564852604e58dbf9ca1e3f8349)
- chore: update changelog [`f366c39`](https://github.com/nocobase/nocobase/commit/f366c39fda34c5717429a415d442d30967ead929)

## [v1.0.0-alpha.2](https://github.com/nocobase/nocobase/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) - 2024-04-29

### Merged

- fix: iframe bug [`#4217`](https://github.com/nocobase/nocobase/pull/4217)

### Commits

- chore(versions): 😊 publish v1.0.0-alpha.2 [`b7fb765`](https://github.com/nocobase/nocobase/commit/b7fb765fca2fe94919d5390c2254abc297ca7995)
- Update README.md [`edf4ece`](https://github.com/nocobase/nocobase/commit/edf4ece1efa5d3bc02f5b41fa11a5e2e20737bd5)
- fix(pm): parse name [`c5b803a`](https://github.com/nocobase/nocobase/commit/c5b803a75008eb1b7ea885d7f53d0800a443e41f)

## [v1.0.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.16...v1.0.0-alpha.1) - 2024-04-29

### Merged

- chore(versions): 😊 publish v1.0.0-alpha.1 [`#4186`](https://github.com/nocobase/nocobase/pull/4186)

### Commits

- chore: update changelog [`a29fcfd`](https://github.com/nocobase/nocobase/commit/a29fcfd028798b37b014d6bff24d7980e3e6228d)

## [v0.21.0-alpha.16](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.15...v0.21.0-alpha.16) - 2024-04-28

### Merged

- feat(plugin-workflow): refresh the list after sync [`#4177`](https://github.com/nocobase/nocobase/pull/4177)
- feat(plugin-workflow): show workflow key as tooltip on title [`#4178`](https://github.com/nocobase/nocobase/pull/4178)
- test(plugin-workflow): add test cases [`#4199`](https://github.com/nocobase/nocobase/pull/4199)
- chore: api cache control header [`#4203`](https://github.com/nocobase/nocobase/pull/4203)
- feat: load vditor dep from local [`#4190`](https://github.com/nocobase/nocobase/pull/4190)
- test: input  number separator test [`#4204`](https://github.com/nocobase/nocobase/pull/4204)
- fix: number field shuold support separator setting [`#4197`](https://github.com/nocobase/nocobase/pull/4197)
- fix(plugin-workflow): refine experience [`#4195`](https://github.com/nocobase/nocobase/pull/4195)
- chore: optimize warning wordings of import & export [`#4196`](https://github.com/nocobase/nocobase/pull/4196)
- refactor:  external data source collection manager [`#4193`](https://github.com/nocobase/nocobase/pull/4193)
- fix: env bug [`#4191`](https://github.com/nocobase/nocobase/pull/4191)
- fix: empty operator with association field [`#4189`](https://github.com/nocobase/nocobase/pull/4189)
- chore: add e2e [`#4184`](https://github.com/nocobase/nocobase/pull/4184)
- fix: vditor version [`#4183`](https://github.com/nocobase/nocobase/pull/4183)
- refactor: form data template locale improve [`#4188`](https://github.com/nocobase/nocobase/pull/4188)
- test: add automated testing [`#4098`](https://github.com/nocobase/nocobase/pull/4098)
- chore: data source logger instance [`#4181`](https://github.com/nocobase/nocobase/pull/4181)
- chore: get database instance in relation repository [`#4179`](https://github.com/nocobase/nocobase/pull/4179)
- chore: add e2e for variables [`#4152`](https://github.com/nocobase/nocobase/pull/4152)
- chore: define collection debug message [`#4176`](https://github.com/nocobase/nocobase/pull/4176)
- chore: unsupportedFields in view collection [`#4155`](https://github.com/nocobase/nocobase/pull/4155)
- feat: add plugin-field-markdown-vditor  [`#4065`](https://github.com/nocobase/nocobase/pull/4065)
- fix: bulk edit form acl action error [`#4166`](https://github.com/nocobase/nocobase/pull/4166)
- fix: auto create uuid foreign key in relation field [`#4160`](https://github.com/nocobase/nocobase/pull/4160)
- fix(plugin-fm): fix confusing size limit hint [`#4153`](https://github.com/nocobase/nocobase/pull/4153)
- fix(users): improve users:updateProfile [`#4162`](https://github.com/nocobase/nocobase/pull/4162)
- fix(client): get api url [`#4161`](https://github.com/nocobase/nocobase/pull/4161)
- feat: remove plugin-ui-routes-storage [`#4140`](https://github.com/nocobase/nocobase/pull/4140)
- fix: lock cytoscape version [`#4158`](https://github.com/nocobase/nocobase/pull/4158)
- refactor: collection template support presetFieldsDisabled [`#4159`](https://github.com/nocobase/nocobase/pull/4159)
- fix: grid schema [`#4157`](https://github.com/nocobase/nocobase/pull/4157)
- client unit test [`#4150`](https://github.com/nocobase/nocobase/pull/4150)
- fix: update belongs to many association that target key is not primary key [`#4146`](https://github.com/nocobase/nocobase/pull/4146)
- refactor: form data template locale improve [`#4148`](https://github.com/nocobase/nocobase/pull/4148)
- fix(database): column name in array field [`#4110`](https://github.com/nocobase/nocobase/pull/4110)
- test: refresh on action e2e test [`#4147`](https://github.com/nocobase/nocobase/pull/4147)
- fix(custom-request): support configuring content type [`#4144`](https://github.com/nocobase/nocobase/pull/4144)
- chore: deprecate the current record variable from the form [`#4063`](https://github.com/nocobase/nocobase/pull/4063)
- feat(Theme): add some tokens [`#4137`](https://github.com/nocobase/nocobase/pull/4137)
- fix(client): fix some warnings [`#4143`](https://github.com/nocobase/nocobase/pull/4143)
- style: tableActionColumn style improve [`#4138`](https://github.com/nocobase/nocobase/pull/4138)
- fix: actionBar style improve [`#4123`](https://github.com/nocobase/nocobase/pull/4123)
- chore: warning message if on delete conflict [`#4141`](https://github.com/nocobase/nocobase/pull/4141)
- fix(plugin-workflow-manual): allow pass node when no assignee [`#4139`](https://github.com/nocobase/nocobase/pull/4139)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.16 [`fdd3ca6`](https://github.com/nocobase/nocobase/commit/fdd3ca614e2b016744a47cfb5c6a9d59e996fd76)
- chore: make e2e more stable [`8524bea`](https://github.com/nocobase/nocobase/commit/8524beae6796333cd96f6d0536937ef869f66b2b)
- chore: make e2e more stable [`08f6872`](https://github.com/nocobase/nocobase/commit/08f68720bf2677604befd55f662f2a8c039057d4)

## [v0.21.0-alpha.15](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.14...v0.21.0-alpha.15) - 2024-04-23

### Merged

- chore: datasource manager api [`#4124`](https://github.com/nocobase/nocobase/pull/4124)
- fix(plugin-workflow-manual): fix assignees parsing bug [`#4125`](https://github.com/nocobase/nocobase/pull/4125)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.15 [`05504b5`](https://github.com/nocobase/nocobase/commit/05504b5678e3e442a104ca34430ae7c7242c57ef)
- chore: update changelog [`ac30ccc`](https://github.com/nocobase/nocobase/commit/ac30ccc63e94947267b1be51a1e7326e6d3faf6a)
- fix(ui-schema-storage): allow uiSchemas:getParentJsonSchema [`4b51a43`](https://github.com/nocobase/nocobase/commit/4b51a43786d694cf8da649f404428a847728895a)

## [v0.21.0-alpha.14](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.13...v0.21.0-alpha.14) - 2024-04-22

### Merged

- fix: load association field in collection [`#4122`](https://github.com/nocobase/nocobase/pull/4122)
- perf: remove all Skeleton animation [`#4113`](https://github.com/nocobase/nocobase/pull/4113)
- test: add e2e [`#4121`](https://github.com/nocobase/nocobase/pull/4121)
- chore(data-vi): adjust api [`#4116`](https://github.com/nocobase/nocobase/pull/4116)
- fix: scheduleEventTrigger [`#4114`](https://github.com/nocobase/nocobase/pull/4114)
- feat(plugin-workflow): add checker for intervally dispatching [`#4119`](https://github.com/nocobase/nocobase/pull/4119)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.14 [`7e4ad0d`](https://github.com/nocobase/nocobase/commit/7e4ad0daae8b69559f8ad6fe286c7603efbc4ccc)
- chore: update changelog [`e25d155`](https://github.com/nocobase/nocobase/commit/e25d15518e8f5ebce8705c531c198344669d94d4)
- chore: add deprecated comment for CompatibleSchemaInitializer [`451bcca`](https://github.com/nocobase/nocobase/commit/451bcca06f4c0b61630c7f4f6a5aba0194984560)

## [v0.21.0-alpha.13](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.12...v0.21.0-alpha.13) - 2024-04-21

### Merged

- feat: add filterOtherRecordsCollection for DataBlockInitializer [`#4117`](https://github.com/nocobase/nocobase/pull/4117)
- refactor: optimize CollectionField [`#4111`](https://github.com/nocobase/nocobase/pull/4111)
- fix: improve sort field migration [`#4112`](https://github.com/nocobase/nocobase/pull/4112)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.13 [`9b20b04`](https://github.com/nocobase/nocobase/commit/9b20b04e9811b347a974c647c0dc28e8caf1da5c)
- feat(database): improve text field [`c26e43a`](https://github.com/nocobase/nocobase/commit/c26e43a34f7e7d2aca620f2163a5b433711fa281)
- chore: update changelog [`52893e2`](https://github.com/nocobase/nocobase/commit/52893e213e3ca14760e8481a209293b9165bcfdc)

## [v0.21.0-alpha.12](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.11...v0.21.0-alpha.12) - 2024-04-19

### Merged

- fix: field component [`#4102`](https://github.com/nocobase/nocobase/pull/4102)
- fix: association select support add mode [`#4108`](https://github.com/nocobase/nocobase/pull/4108)
- fix: createdBy & updatedBy target option [`#4109`](https://github.com/nocobase/nocobase/pull/4109)
- fix(linkage-rule): linkage rule support empty condiction [`#4103`](https://github.com/nocobase/nocobase/pull/4103)
- fix: add SanitizedCollectionProvider [`#4100`](https://github.com/nocobase/nocobase/pull/4100)
- fix: tree collection target error [`#4105`](https://github.com/nocobase/nocobase/pull/4105)
- fix: add ClearCollectionFieldContext [`#4101`](https://github.com/nocobase/nocobase/pull/4101)
- feat: improve form block [`#4099`](https://github.com/nocobase/nocobase/pull/4099)
- chore: migrate sortable options to sort field [`#4011`](https://github.com/nocobase/nocobase/pull/4011)
- feat: support sort option in appends [`#4056`](https://github.com/nocobase/nocobase/pull/4056)
- feat(data-vi): allows pie chart to accept negative numbers, fix T-4075 [`#4094`](https://github.com/nocobase/nocobase/pull/4094)
- fix(data-vi): number becomes string after precision transformation [`#4092`](https://github.com/nocobase/nocobase/pull/4092)
- fix: encode url params [`#4055`](https://github.com/nocobase/nocobase/pull/4055)
- test(plugin-workflow): add test case for duplicated triggering schedule workflow [`#3817`](https://github.com/nocobase/nocobase/pull/3817)
- perf(LinkageRules): solve lagging problems [`#4090`](https://github.com/nocobase/nocobase/pull/4090)
- fix(subTable): should not display Allow add new data option [`#4086`](https://github.com/nocobase/nocobase/pull/4086)
- fix: missing fields [`#4083`](https://github.com/nocobase/nocobase/pull/4083)
- fix: table select pagination error [`#4078`](https://github.com/nocobase/nocobase/pull/4078)
- fix: reset page when setting block data scope [`#4081`](https://github.com/nocobase/nocobase/pull/4081)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.12 [`a8eb2b7`](https://github.com/nocobase/nocobase/commit/a8eb2b719c0de798d141ebc8db349e24ff0f89f0)
- chore: update changelog [`57242c1`](https://github.com/nocobase/nocobase/commit/57242c1ce608fbe0ae15611f3f791d06dbdcbc90)
- fix: delete sock files before nocobase start [`3445001`](https://github.com/nocobase/nocobase/commit/3445001540ec05b3cc2ffeb542debc2683582c37)

## [v0.21.0-alpha.11](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.10...v0.21.0-alpha.11) - 2024-04-17

### Merged

- fix: custom request role list [`#4074`](https://github.com/nocobase/nocobase/pull/4074)
- fix: parse iso week [`#4068`](https://github.com/nocobase/nocobase/pull/4068)
- fix(sourceId): avoid error [`#4077`](https://github.com/nocobase/nocobase/pull/4077)
- fix(sql-collection): can't select interface when setting fields [`#4079`](https://github.com/nocobase/nocobase/pull/4079)
- fix: load with source field [`#4075`](https://github.com/nocobase/nocobase/pull/4075)
- fix: deletion of operation linkage rules does not take effect in real time [`#4058`](https://github.com/nocobase/nocobase/pull/4058)
- fix(core): fix round bug in formula evaluator [`#4070`](https://github.com/nocobase/nocobase/pull/4070)
- test: add e2e for data loading mode [`#4069`](https://github.com/nocobase/nocobase/pull/4069)
- fix(filterForm): avoid duplicate names [`#4071`](https://github.com/nocobase/nocobase/pull/4071)
- chore: optimize block title [`#4040`](https://github.com/nocobase/nocobase/pull/4040)
- fix: sync default value in view [`#4067`](https://github.com/nocobase/nocobase/pull/4067)
- fix(defaultValue): fix the issue of default values disappearing after refreshing the page [`#4066`](https://github.com/nocobase/nocobase/pull/4066)
- refactor: gantt block [`#4059`](https://github.com/nocobase/nocobase/pull/4059)
- fix: sub-table big field should support variable default value [`#4062`](https://github.com/nocobase/nocobase/pull/4062)
- chore(Theme): set the default font size of the Compact theme to 16 [`#4064`](https://github.com/nocobase/nocobase/pull/4064)
- test: add e2e for actions [`#4053`](https://github.com/nocobase/nocobase/pull/4053)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.11 [`438a059`](https://github.com/nocobase/nocobase/commit/438a059c7b742cb9922b61f8ecdd7f6357a575fb)
- fix: getCurrentTimezone error [`fa8e890`](https://github.com/nocobase/nocobase/commit/fa8e89067940d0373bf34d4d3f833bd88ffa77f5)
- chore: update changelog [`68bc73b`](https://github.com/nocobase/nocobase/commit/68bc73b9877668f2da2c3669314233c3cb1e15ea)

## [v0.21.0-alpha.10](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.9...v0.21.0-alpha.10) - 2024-04-16

### Merged

- chore: adjust import & export warnings [`#4060`](https://github.com/nocobase/nocobase/pull/4060)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.10 [`d76d657`](https://github.com/nocobase/nocobase/commit/d76d65762214aa0854eef348300a0ff802eea940)
- chore: update changelog [`04f3daa`](https://github.com/nocobase/nocobase/commit/04f3daa5bac874d52d60b4e8864b8dc8c57d1470)

## [v0.21.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.8...v0.21.0-alpha.9) - 2024-04-16

### Merged

- fix(variable):  missing variables and invalid translations [`#4054`](https://github.com/nocobase/nocobase/pull/4054)
- test: add backend unit tests [`#4000`](https://github.com/nocobase/nocobase/pull/4000)
- fix: improve card item [`#4036`](https://github.com/nocobase/nocobase/pull/4036)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.9 [`64e12bb`](https://github.com/nocobase/nocobase/commit/64e12bb08bbca58490cdfe4c552b2423654803c0)
- chore: update changelog [`7d516bd`](https://github.com/nocobase/nocobase/commit/7d516bdc76b87853bb70ee11f76bed99f7a7e834)

## [v0.21.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.7...v0.21.0-alpha.8) - 2024-04-16

### Merged

- chore(acl): disable register association fields actions [`#4014`](https://github.com/nocobase/nocobase/pull/4014)
- fix(variable): fix parent record variable reporting errors in data scope [`#4039`](https://github.com/nocobase/nocobase/pull/4039)
- test(e2e): add assertions on field values [`#4034`](https://github.com/nocobase/nocobase/pull/4034)
- feat(Variable): add a new variable [`#4025`](https://github.com/nocobase/nocobase/pull/4025)
- feat: run e2e with pro plugins [`#3890`](https://github.com/nocobase/nocobase/pull/3890)
- fix: bug [`#4038`](https://github.com/nocobase/nocobase/pull/4038)
- fix: array operator with camel case field [`#4032`](https://github.com/nocobase/nocobase/pull/4032)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.8 [`8c779b4`](https://github.com/nocobase/nocobase/commit/8c779b4cf6f6d3da4699cddb0c5d76ca3cb05135)
- feat: add  to more blocks [`fe4be82`](https://github.com/nocobase/nocobase/commit/fe4be822b9c7ea081d33a83bce0ae3902acaa596)
- chore: update changelog [`db32005`](https://github.com/nocobase/nocobase/commit/db3200516dabe80175b0e6f1fa1659babdcf5a87)

## [v0.21.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.6...v0.21.0-alpha.7) - 2024-04-13

### Merged

- fix: scopeKeyOptions should be obtained in real-time [`#4029`](https://github.com/nocobase/nocobase/pull/4029)
- fix(addText): should use FormItemSchemaToolbar instead of BlockSchema… [`#3963`](https://github.com/nocobase/nocobase/pull/3963)
- feat: register once hook in datasource manager [`#4024`](https://github.com/nocobase/nocobase/pull/4024)
- fix: snippets [`#4030`](https://github.com/nocobase/nocobase/pull/4030)
- fix: vitest single bug [`#4031`](https://github.com/nocobase/nocobase/pull/4031)
- feat(data-vi): improved user experiences (refer to pr) [`#4013`](https://github.com/nocobase/nocobase/pull/4013)
- test: add frontend unit test [`#3991`](https://github.com/nocobase/nocobase/pull/3991)
- feat: support Others option in popup [`#4015`](https://github.com/nocobase/nocobase/pull/4015)
- fix(collection-manager): no refresh after override the field [`#4022`](https://github.com/nocobase/nocobase/pull/4022)
- chore: add export & import warnings [`#4027`](https://github.com/nocobase/nocobase/pull/4027)
- refactor: third party data source support sort field grouped sorting edit [`#4023`](https://github.com/nocobase/nocobase/pull/4023)
- fix(plugin-acl): pm.acl.roles snippet [`#4026`](https://github.com/nocobase/nocobase/pull/4026)
- test: association name block e2e test [`#4021`](https://github.com/nocobase/nocobase/pull/4021)
- fix: get api url [`#4020`](https://github.com/nocobase/nocobase/pull/4020)
- fix(Sub-details): the initializer button is not displayed when the field value is empty [`#4019`](https://github.com/nocobase/nocobase/pull/4019)
- fix: initializer use useAassociationName [`#4018`](https://github.com/nocobase/nocobase/pull/4018)
- fix(auth): cas login bug when use subdirectory deployment [`#4017`](https://github.com/nocobase/nocobase/pull/4017)
- fix(TreeTable): add child error [`#4008`](https://github.com/nocobase/nocobase/pull/4008)
- fix: remove active field should not clear value [`#4012`](https://github.com/nocobase/nocobase/pull/4012)
- fix(plugin-acl): datasource roles snippet [`#4016`](https://github.com/nocobase/nocobase/pull/4016)
- fix: after selecting all, bulk update prompts for unselected data [`#4010`](https://github.com/nocobase/nocobase/pull/4010)
- refactor: tree table is not enabled by default [`#4001`](https://github.com/nocobase/nocobase/pull/4001)
- feat(plugin-workflow-action-trigger): support association actions to trigger [`#4007`](https://github.com/nocobase/nocobase/pull/4007)
- Update application.ts [`#4006`](https://github.com/nocobase/nocobase/pull/4006)
- fix: tag filed setting [`#4009`](https://github.com/nocobase/nocobase/pull/4009)
- fix(users): remove phone validation due to incorrect check of foreign phone numebrs [`#4005`](https://github.com/nocobase/nocobase/pull/4005)
- fix: association block action permission verification failed [`#3994`](https://github.com/nocobase/nocobase/pull/3994)
- refactor: fields for table sorting cannot select sorting fields with scopekey [`#3984`](https://github.com/nocobase/nocobase/pull/3984)
- fix(Form): invalid parentRecord [`#3998`](https://github.com/nocobase/nocobase/pull/3998)
- fix(plugin-workflow): adjust locale [`#3993`](https://github.com/nocobase/nocobase/pull/3993)
- fix: sub -table support allowSelectExistingRecord setting [`#4004`](https://github.com/nocobase/nocobase/pull/4004)
- fix(auth): sign up page not found when entering with url directly [`#4002`](https://github.com/nocobase/nocobase/pull/4002)
- chore(database): set null value when field is unique and value is empty string [`#3997`](https://github.com/nocobase/nocobase/pull/3997)
- chore(gateway): report error with cause message [`#3999`](https://github.com/nocobase/nocobase/pull/3999)
- chore(error-handler): display message cause the error [`#3996`](https://github.com/nocobase/nocobase/pull/3996)
- fix: restore with table name in camel case [`#3995`](https://github.com/nocobase/nocobase/pull/3995)
- refactor(plugin-workflow): adjust comments [`#3990`](https://github.com/nocobase/nocobase/pull/3990)
- fix: gantt collapse & expand [`#3982`](https://github.com/nocobase/nocobase/pull/3982)
- fix(BulkForm): should be required when switching to 'Changed to' [`#3965`](https://github.com/nocobase/nocobase/pull/3965)
- fix: move action [`#3985`](https://github.com/nocobase/nocobase/pull/3985)
- refactor: sort field should not has defaultValue [`#3986`](https://github.com/nocobase/nocobase/pull/3986)
- chore: update class names of plugins [`#3981`](https://github.com/nocobase/nocobase/pull/3981)
- feat(plugin-workflow-sync): add sync when multi-app-share-collection enabled [`#3969`](https://github.com/nocobase/nocobase/pull/3969)
- fix(localization): incorrect locale when first entering [`#3968`](https://github.com/nocobase/nocobase/pull/3968)
- chore: adjust and add api comments [`#3951`](https://github.com/nocobase/nocobase/pull/3951)
- refactor: select options configuration [`#3964`](https://github.com/nocobase/nocobase/pull/3964)
- fix(GridCard): set the count of columns displayed in a row [`#3960`](https://github.com/nocobase/nocobase/pull/3960)
- refactor: only numerical formula fields support format [`#3962`](https://github.com/nocobase/nocobase/pull/3962)
- chore(plugin-workflow): add comments [`#3959`](https://github.com/nocobase/nocobase/pull/3959)
- chore: remove legacy formula plugins [`#3939`](https://github.com/nocobase/nocobase/pull/3939)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.7 [`d66c2ba`](https://github.com/nocobase/nocobase/commit/d66c2baa53a0670ff01dc7d8609f314518b46534)
- chore: update docs of Theme editor [`71366e3`](https://github.com/nocobase/nocobase/commit/71366e3dea46d6d2af92bde4eca4dedd72800fed)
- test: fix e2e [`3dcbdf3`](https://github.com/nocobase/nocobase/commit/3dcbdf35922ea770deb7227e4a1e8b06a3cb3296)

## [v0.21.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.5...v0.21.0-alpha.6) - 2024-04-07

### Merged

- fix(LinkageRules): should be effective immediately [`#3958`](https://github.com/nocobase/nocobase/pull/3958)
- fix(Picker): should display Allow add new data option [`#3957`](https://github.com/nocobase/nocobase/pull/3957)
- fix(connect-data-blocks): should immediately show in the drop-down menu [`#3953`](https://github.com/nocobase/nocobase/pull/3953)
- fix: left menu title modify [`#3956`](https://github.com/nocobase/nocobase/pull/3956)
- fix: template list provider bug [`#3950`](https://github.com/nocobase/nocobase/pull/3950)
- refactor: nanoid &uuid autoFill [`#3955`](https://github.com/nocobase/nocobase/pull/3955)
- feat: getParentJsonSchema in ui schema repository [`#3690`](https://github.com/nocobase/nocobase/pull/3690)
- fix: save uuid & nano id field value with sequelize validation [`#3952`](https://github.com/nocobase/nocobase/pull/3952)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.6 [`6017c01`](https://github.com/nocobase/nocobase/commit/6017c01f0218c33ef4cbbb3bddc3d8cd45fe4c62)
- chore: update changelog [`06a9d00`](https://github.com/nocobase/nocobase/commit/06a9d008e3fb96197eac1dae6c8f1b50d2736e35)
- chore: report error if collection not found [`0bb421a`](https://github.com/nocobase/nocobase/commit/0bb421ac4056fa2845b8df1e761108efe8c4ade9)

## [v0.21.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.4...v0.21.0-alpha.5) - 2024-04-07

### Merged

- fix: throughCollection support fuzzy search [`#3949`](https://github.com/nocobase/nocobase/pull/3949)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.5 [`b63a685`](https://github.com/nocobase/nocobase/commit/b63a685f84765671154f84e9dca65dc729992a09)
- chore: update changelog [`47dffe5`](https://github.com/nocobase/nocobase/commit/47dffe55b54e0c16b0cbc30415c3438f5b9fc977)
- feat: update license format [`62fcc01`](https://github.com/nocobase/nocobase/commit/62fcc01eb38607ee1cdbff446bc0e7376c4476c3)

## [v0.21.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.3...v0.21.0-alpha.4) - 2024-04-07

### Merged

- fix: getSourceKeyByAssocation [`#3947`](https://github.com/nocobase/nocobase/pull/3947)
- fix(RichText): unify style [`#3946`](https://github.com/nocobase/nocobase/pull/3946)
- fix(connectDataBlocks): should add FilterBlockProvider to Grid [`#3944`](https://github.com/nocobase/nocobase/pull/3944)
- chore: add appVersion to Schema [`#3936`](https://github.com/nocobase/nocobase/pull/3936)
- fix: collectionFieldInterfaceSelect [`#3945`](https://github.com/nocobase/nocobase/pull/3945)
- fix: fix sourceId of templates [`#3941`](https://github.com/nocobase/nocobase/pull/3941)
- fix(collection manager): collection manager primarykey & nanoid & uuid suport index setting [`#3943`](https://github.com/nocobase/nocobase/pull/3943)
- fix(plugin-formula-field): fix component context [`#3937`](https://github.com/nocobase/nocobase/pull/3937)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.4 [`3171339`](https://github.com/nocobase/nocobase/commit/31713390b57543d0825aa1bb81a8d191fa39f7f5)
- chore: update changelog [`4132100`](https://github.com/nocobase/nocobase/commit/41321004cab7c42f6c1b4454596507ce50ea061e)

## [v0.21.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.2...v0.21.0-alpha.3) - 2024-04-06

### Merged

- fix: nanoid availableTypes [`#3942`](https://github.com/nocobase/nocobase/pull/3942)
- fix: automatically generate default values [`#3940`](https://github.com/nocobase/nocobase/pull/3940)
- fix: formula field caluation error [`#3938`](https://github.com/nocobase/nocobase/pull/3938)
- fix: formula field support format [`#3928`](https://github.com/nocobase/nocobase/pull/3928)
- refactor: unify tab initailizer naming [`#3932`](https://github.com/nocobase/nocobase/pull/3932)
- fix: add zIndex to Lightbox overlay style [`#3934`](https://github.com/nocobase/nocobase/pull/3934)
- fix(Table): fix the problem that the content of the association field is not displayed [`#3930`](https://github.com/nocobase/nocobase/pull/3930)
- fix(evaluators): fix array flatten [`#3931`](https://github.com/nocobase/nocobase/pull/3931)
- refactor: main data source view collection support filterTargetKey  [`#3818`](https://github.com/nocobase/nocobase/pull/3818)
- fix: formula field calculation error [`#3929`](https://github.com/nocobase/nocobase/pull/3929)
- fix: load view collection belongs to association with source options [`#3912`](https://github.com/nocobase/nocobase/pull/3912)
- fix: edit form unchanged should not appear unSaveed warning when cloas modal [`#3920`](https://github.com/nocobase/nocobase/pull/3920)
- fix(Collapse): fix error for chinaRegions [`#3925`](https://github.com/nocobase/nocobase/pull/3925)
- fix: number display format [`#3924`](https://github.com/nocobase/nocobase/pull/3924)
- fix(defaultValue): should immediate effect when set default value [`#3923`](https://github.com/nocobase/nocobase/pull/3923)
- feat: action support refreshDataBlockRequest configuration [`#3882`](https://github.com/nocobase/nocobase/pull/3882)
- refactor: formBlockProvider & detailBlockProvider [`#3898`](https://github.com/nocobase/nocobase/pull/3898)
- feat(data-vi): allows to add charts for mobile client [`#3922`](https://github.com/nocobase/nocobase/pull/3922)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.3 [`d2b8086`](https://github.com/nocobase/nocobase/commit/d2b808671bf36cc345ef80a95a86e42e16a19836)
- chore: update changelog [`231f4c7`](https://github.com/nocobase/nocobase/commit/231f4c7cd4f6f9375f440d9f146a0f155aec4b13)

## [v0.21.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.21.0-alpha.1...v0.21.0-alpha.2) - 2024-04-03

### Merged

- chore: add API comments [`#3919`](https://github.com/nocobase/nocobase/pull/3919)
- fix: fix Pagination [`#3921`](https://github.com/nocobase/nocobase/pull/3921)
- test(plugin-error-handler): middleware [`#3909`](https://github.com/nocobase/nocobase/pull/3909)
- fix: update plugin [`#3895`](https://github.com/nocobase/nocobase/pull/3895)
- fix: gantt block pagination [`#3918`](https://github.com/nocobase/nocobase/pull/3918)
- fix: source id null [`#3917`](https://github.com/nocobase/nocobase/pull/3917)
- fix(Table): fix Pagination [`#3916`](https://github.com/nocobase/nocobase/pull/3916)
- fix: get the correct sourceId [`#3897`](https://github.com/nocobase/nocobase/pull/3897)
- fix(DataScope): fix no immediate effect issue after saving [`#3910`](https://github.com/nocobase/nocobase/pull/3910)
- fix: select field options initialValue [`#3911`](https://github.com/nocobase/nocobase/pull/3911)
- fix: external link click [`#3908`](https://github.com/nocobase/nocobase/pull/3908)
- fix(inputNumber): loss of accuracy in inputNumber [`#3902`](https://github.com/nocobase/nocobase/pull/3902)
- feat(plugin-workflow-action-trigger): add global action events [`#3883`](https://github.com/nocobase/nocobase/pull/3883)
- docs: add api comment [`#3868`](https://github.com/nocobase/nocobase/pull/3868)
- fix: vitest config bug [`#3907`](https://github.com/nocobase/nocobase/pull/3907)
- fix: table fixed bug [`#3901`](https://github.com/nocobase/nocobase/pull/3901)
- fix: list data undefined error [`#3905`](https://github.com/nocobase/nocobase/pull/3905)
- fix: lazy render bug [`#3886`](https://github.com/nocobase/nocobase/pull/3886)
- fix: sort params missing [`#3906`](https://github.com/nocobase/nocobase/pull/3906)
- refactor: change useProps to x-use-component-props [`#3853`](https://github.com/nocobase/nocobase/pull/3853)
- fix(withDynamicSchemaProps): change deep merge to shallow merge [`#3899`](https://github.com/nocobase/nocobase/pull/3899)
- fix: history block add print button, click print button to report error [`#3900`](https://github.com/nocobase/nocobase/pull/3900)
- fix: tar bug [`#3891`](https://github.com/nocobase/nocobase/pull/3891)
- chore: return bigInt as string type [`#3887`](https://github.com/nocobase/nocobase/pull/3887)
- feat(data-vi): data scope for chart filter fields [`#3894`](https://github.com/nocobase/nocobase/pull/3894)
- feat: adjust menu of add new [`#3884`](https://github.com/nocobase/nocobase/pull/3884)
- fix(plugin-custom-request): fix edit button dialog [`#3893`](https://github.com/nocobase/nocobase/pull/3893)
- fix: fieldNames missing when setting data scope [`#3892`](https://github.com/nocobase/nocobase/pull/3892)
- fix: deps check error when dev add production plugin [`#3848`](https://github.com/nocobase/nocobase/pull/3848)
- fix: workflow tabs not exists [`#3889`](https://github.com/nocobase/nocobase/pull/3889)
- fix: association field support data scope linkage [`#3888`](https://github.com/nocobase/nocobase/pull/3888)
- fix: templateBlockProvider support association field append [`#3866`](https://github.com/nocobase/nocobase/pull/3866)
- chore: main datasource api [`#3880`](https://github.com/nocobase/nocobase/pull/3880)
- feat: run vitest with coverage [`#3802`](https://github.com/nocobase/nocobase/pull/3802)
- fix: avoid duplicate menu keys [`#3885`](https://github.com/nocobase/nocobase/pull/3885)
- fix(data-vi): dual axes chart displays abnormally [`#3881`](https://github.com/nocobase/nocobase/pull/3881)
- fix: reject update when filter is empty object [`#3777`](https://github.com/nocobase/nocobase/pull/3777)
- chore: update field with primary key attribute [`#3852`](https://github.com/nocobase/nocobase/pull/3852)
- refactor: uuid & nanoid support default value configuration [`#3830`](https://github.com/nocobase/nocobase/pull/3830)
- feat: table performance [`#3791`](https://github.com/nocobase/nocobase/pull/3791)
- fix: setFormValueChanged undefined [`#3879`](https://github.com/nocobase/nocobase/pull/3879)
- fix(client): fix diabled in filter dynamic component [`#3874`](https://github.com/nocobase/nocobase/pull/3874)
- fix(plugin-workflow-parallel): fix locale [`#3876`](https://github.com/nocobase/nocobase/pull/3876)
- fix(formula-field): formula field set form value change [`#3873`](https://github.com/nocobase/nocobase/pull/3873)
- fix: formBlockProvider block display [`#3877`](https://github.com/nocobase/nocobase/pull/3877)
- refactor(plugin-workflow): change  to [`#3871`](https://github.com/nocobase/nocobase/pull/3871)
- fix: kanban card modal display abnormal [`#3863`](https://github.com/nocobase/nocobase/pull/3863)
- fix: filterTargetKey only support view collection [`#3872`](https://github.com/nocobase/nocobase/pull/3872)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.2 [`d173aef`](https://github.com/nocobase/nocobase/commit/d173aef69b7182b33e0d05621bf8fc32f95b29a4)
- feat: update agreements [`e2763b3`](https://github.com/nocobase/nocobase/commit/e2763b332286affb7cfd9c6a9fb90d656226e3fb)
- chore: update vitest configuration [`85f33ce`](https://github.com/nocobase/nocobase/commit/85f33cedbeedd21a5086d7940768b093f9dab4e8)

## [v0.21.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.17...v0.21.0-alpha.1) - 2024-03-29

### Merged

- fix: association parent request [`#3865`](https://github.com/nocobase/nocobase/pull/3865)
- test: add unit test for parseHTML [`#3870`](https://github.com/nocobase/nocobase/pull/3870)
- fix(data-vi): bug when filtering chart with assocations [`#3867`](https://github.com/nocobase/nocobase/pull/3867)
- fix: table settings get collectionField [`#3837`](https://github.com/nocobase/nocobase/pull/3837)
- refactor(plugin-workflow): add transaction check from data source [`#3857`](https://github.com/nocobase/nocobase/pull/3857)
- fix(data-vi): charts size bug when changing chart type [`#3859`](https://github.com/nocobase/nocobase/pull/3859)
- fix(server): commands failed to load properly on Windows [`#3858`](https://github.com/nocobase/nocobase/pull/3858)
- fix(LinkageRules): should work properly after the block is saved as a template [`#3855`](https://github.com/nocobase/nocobase/pull/3855)
- test: main data source e2e test [`#3816`](https://github.com/nocobase/nocobase/pull/3816)
- fix: delete field style improve [`#3820`](https://github.com/nocobase/nocobase/pull/3820)
- chore: remove add-attach option from bulk update action [`#3854`](https://github.com/nocobase/nocobase/pull/3854)
- refactor: default role & default field storage [`#3844`](https://github.com/nocobase/nocobase/pull/3844)
- refactor: linkage rule fireImmediately [`#3847`](https://github.com/nocobase/nocobase/pull/3847)
- fix: reporting error when clicking on the print button for the detail block [`#3845`](https://github.com/nocobase/nocobase/pull/3845)
- fix(data-vi): canvas height keeps increasing when filtering/reseting [`#3849`](https://github.com/nocobase/nocobase/pull/3849)
-  create nocobase app  unit test  [`#3833`](https://github.com/nocobase/nocobase/pull/3833)
- refactor(DataBlock): details block [`#3776`](https://github.com/nocobase/nocobase/pull/3776)
- fix: client internal method (T-3711 and T-3712 and T-3713) [`#3839`](https://github.com/nocobase/nocobase/pull/3839)
- refactor(DataBlock): grid card block [`#3781`](https://github.com/nocobase/nocobase/pull/3781)
- refactor(DataBlock): filter form [`#3785`](https://github.com/nocobase/nocobase/pull/3785)
- fix: improve app manager [`#3841`](https://github.com/nocobase/nocobase/pull/3841)
- refactor(DataBlock): kanban and gantt and map and calendar [`#3792`](https://github.com/nocobase/nocobase/pull/3792)
- refactor(DataBlock): filter collapse block [`#3786`](https://github.com/nocobase/nocobase/pull/3786)
- refactor(DataBlock): table selector [`#3784`](https://github.com/nocobase/nocobase/pull/3784)
- refactor(DataBlock): list block [`#3779`](https://github.com/nocobase/nocobase/pull/3779)
- refactor(DataBlock): form block [`#3771`](https://github.com/nocobase/nocobase/pull/3771)
- fix(client): disable the default onSubmit event of the form [`#3834`](https://github.com/nocobase/nocobase/pull/3834)
- fix(data-vi): charts flickers [`#3836`](https://github.com/nocobase/nocobase/pull/3836)
- fix: acl e2e failed [`#3835`](https://github.com/nocobase/nocobase/pull/3835)
- chore: menu permissions & plugins setting permissions [`#3822`](https://github.com/nocobase/nocobase/pull/3822)
- fix: e2e-failed [`#3828`](https://github.com/nocobase/nocobase/pull/3828)
- fix: missing button icon [`#3832`](https://github.com/nocobase/nocobase/pull/3832)
- refactor: action icon [`#3831`](https://github.com/nocobase/nocobase/pull/3831)
- Optimize building tools [`#3824`](https://github.com/nocobase/nocobase/pull/3824)
- optimize ci [`#3825`](https://github.com/nocobase/nocobase/pull/3825)

### Commits

- chore(versions): 😊 publish v0.21.0-alpha.1 [`6e20ab1`](https://github.com/nocobase/nocobase/commit/6e20ab1a77303cf27debc2b851ab44bc90f107a6)
- feat: update docker config [`f2d4188`](https://github.com/nocobase/nocobase/commit/f2d4188ccf5137bf75700832052dac8292e1da12)
- chore: update changelog [`dd0538a`](https://github.com/nocobase/nocobase/commit/dd0538ae048353266f99f52fbd9f6a9de420c572)

## [v0.20.0-alpha.17](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.16...v0.20.0-alpha.17) - 2024-03-26

### Merged

- feat:  read pretty input number field support display format config [`#3815`](https://github.com/nocobase/nocobase/pull/3815)
- fix(Table): fix invalid pagination [`#3821`](https://github.com/nocobase/nocobase/pull/3821)
- chore: add tsdoc [`#3788`](https://github.com/nocobase/nocobase/pull/3788)
- chore(test): fix agent type [`#3819`](https://github.com/nocobase/nocobase/pull/3819)
- fix: embed plugin need hooks and e2e change [`#3727`](https://github.com/nocobase/nocobase/pull/3727)
- fix(associationBlock): fix association blocks for parent collection f… [`#3813`](https://github.com/nocobase/nocobase/pull/3813)
- fix(plugin-workflow-manual): fix schema migration [`#3814`](https://github.com/nocobase/nocobase/pull/3814)
- refactor(DataBlock): table block [`#3748`](https://github.com/nocobase/nocobase/pull/3748)
- fix(Details): block template [`#3807`](https://github.com/nocobase/nocobase/pull/3807)
- chore: cascade can replace set null action [`#3812`](https://github.com/nocobase/nocobase/pull/3812)
- feat(data-vi): support multiple data sources [`#3743`](https://github.com/nocobase/nocobase/pull/3743)
- feat(plugin-workflow): support multiple data source in workflow [`#3739`](https://github.com/nocobase/nocobase/pull/3739)
- chore: add options for matching and ignoring test files in e2e and p-test commands [`#3811`](https://github.com/nocobase/nocobase/pull/3811)
- chore: file collection template preset fields should be disabled [`#3810`](https://github.com/nocobase/nocobase/pull/3810)
- fix(plugin-workflow): remove string template in condition calculation [`#3688`](https://github.com/nocobase/nocobase/pull/3688)
- fix: refresh collection name when update [`#3797`](https://github.com/nocobase/nocobase/pull/3797)
- fix: reload when data source click refresh [`#3804`](https://github.com/nocobase/nocobase/pull/3804)
- fix: plugin manager keywords [`#3809`](https://github.com/nocobase/nocobase/pull/3809)
- fix: expand action and add new action should support drag & sort [`#3808`](https://github.com/nocobase/nocobase/pull/3808)
- fix: create attachments middleware [`#3794`](https://github.com/nocobase/nocobase/pull/3794)
- fix: useExpressionScope [`#3805`](https://github.com/nocobase/nocobase/pull/3805)
- chore: set default association reference on delete action to no action [`#3722`](https://github.com/nocobase/nocobase/pull/3722)
- fix: field permission all fields should be displayed [`#3799`](https://github.com/nocobase/nocobase/pull/3799)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.17 [`3398222`](https://github.com/nocobase/nocobase/commit/339822241f2f641656f64107318b793d63d0b2c9)
- fix: description [`0dc0d32`](https://github.com/nocobase/nocobase/commit/0dc0d329f80c268672bd80fc6cb0190c3cef964d)
- chore: update changelog [`35a6514`](https://github.com/nocobase/nocobase/commit/35a6514993bede12b952ce13641f7258fe6c76d2)

## [v0.20.0-alpha.16](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.15...v0.20.0-alpha.16) - 2024-03-23

### Merged

- refactor: view collection support filterTargetKey config [`#3767`](https://github.com/nocobase/nocobase/pull/3767)
- fix: hide child when useVisible() is false [`#3803`](https://github.com/nocobase/nocobase/pull/3803)
- fix(client): fix action designer error occured in custom form [`#3801`](https://github.com/nocobase/nocobase/pull/3801)
- fix: through collection support search [`#3800`](https://github.com/nocobase/nocobase/pull/3800)
- fix(subTable): fix sorting rule setting [`#3795`](https://github.com/nocobase/nocobase/pull/3795)
- fix: load data source when data source load failed [`#3793`](https://github.com/nocobase/nocobase/pull/3793)
- fix(acl): role menu loading status [`#3787`](https://github.com/nocobase/nocobase/pull/3787)
- fix(acl): bug when adding users to roles [`#3783`](https://github.com/nocobase/nocobase/pull/3783)
- fix: filter does not allow passing empty objects [`#3780`](https://github.com/nocobase/nocobase/pull/3780)
- fix(acl): role menu list only displays one page [`#3775`](https://github.com/nocobase/nocobase/pull/3775)
- feat(plugin-user): add model method desensitize() to filter hidden field [`#3768`](https://github.com/nocobase/nocobase/pull/3768)
- fix(plugin-file-manager): fix storage locale on file template table header [`#3769`](https://github.com/nocobase/nocobase/pull/3769)
- fix: first character entered in foreign key input is not displayed [`#3770`](https://github.com/nocobase/nocobase/pull/3770)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.16 [`71ec7ec`](https://github.com/nocobase/nocobase/commit/71ec7ece6a65fa00acd590ebb4a6de828fe01655)
- chore: update changelog [`170d601`](https://github.com/nocobase/nocobase/commit/170d60158666efd1c75f7d273ddcf529d5ed3c88)
- fix: manual e2e [`556152d`](https://github.com/nocobase/nocobase/commit/556152d7c22ce0e871d3ac244539db84f52c2fe7)

## [v0.20.0-alpha.15](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.14...v0.20.0-alpha.15) - 2024-03-20

### Merged

- fix(auth): sso auth bug when deploying with subpath [`#3764`](https://github.com/nocobase/nocobase/pull/3764)
- chore: load roles after start [`#3763`](https://github.com/nocobase/nocobase/pull/3763)
- fix: uuid & nanoid should be disabled when editing [`#3762`](https://github.com/nocobase/nocobase/pull/3762)
- fix(logger): output error cause info [`#3760`](https://github.com/nocobase/nocobase/pull/3760)
- fix: uuid field [`#3736`](https://github.com/nocobase/nocobase/pull/3736)
- feat: disassociate action [`#3759`](https://github.com/nocobase/nocobase/pull/3759)
- chore: merge sub app database options [`#3640`](https://github.com/nocobase/nocobase/pull/3640)
- fix(acl): bug of user filtering when adding them to roles [`#3754`](https://github.com/nocobase/nocobase/pull/3754)
- fix: app stopped status [`#3723`](https://github.com/nocobase/nocobase/pull/3723)
- fix: fix the disappearing collections when searching [`#3750`](https://github.com/nocobase/nocobase/pull/3750)
- fix: configure openSize for table action is only immediately  valid for one row [`#3752`](https://github.com/nocobase/nocobase/pull/3752)

### Commits

- test: add e2e for Disassociate [`8e322ae`](https://github.com/nocobase/nocobase/commit/8e322ae1517e0cea5eac289bb5641b85d4997002)
- chore(versions): 😊 publish v0.20.0-alpha.15 [`bef9c8a`](https://github.com/nocobase/nocobase/commit/bef9c8ab7b54b0400dfd25c9ec85a141448125a2)
- chore: update yarn.lock [`3da340c`](https://github.com/nocobase/nocobase/commit/3da340c88d3a689e22e20dae798a1b51ed0405f7)

## [v0.20.0-alpha.14](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.13...v0.20.0-alpha.14) - 2024-03-18

### Merged

- refactor: url field support text type as availableTypes [`#3751`](https://github.com/nocobase/nocobase/pull/3751)
- chore: system logger with error stack [`#3747`](https://github.com/nocobase/nocobase/pull/3747)
- chore: adapt to plugin-custom-brand [`#3740`](https://github.com/nocobase/nocobase/pull/3740)
- fix(data-vi): tooltip bug of pie chart [`#3745`](https://github.com/nocobase/nocobase/pull/3745)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.14 [`c75d38b`](https://github.com/nocobase/nocobase/commit/c75d38bb05b8d1924d35c1ad1b175f7801d9c3b5)
- fix(field-interface): nested filterable [`3b61968`](https://github.com/nocobase/nocobase/commit/3b619682ee91426a1f091d2043a3aa876446bacc)
- chore: update changelog [`84f0808`](https://github.com/nocobase/nocobase/commit/84f080846ce459e5ba1bb8fa4074057beb40fb07)

## [v0.20.0-alpha.13](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.12...v0.20.0-alpha.13) - 2024-03-17

### Merged

- fix: collections undefined inuseCollectionState [`#3741`](https://github.com/nocobase/nocobase/pull/3741)
- test(acl):column action acl e2e  [`#3738`](https://github.com/nocobase/nocobase/pull/3738)
- refactor: colDivider style improve for draging overing [`#3709`](https://github.com/nocobase/nocobase/pull/3709)
- fix(data-vi): association fields transform bug [`#3737`](https://github.com/nocobase/nocobase/pull/3737)
- fix(acl): invalid action permission judgment [`#3735`](https://github.com/nocobase/nocobase/pull/3735)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.13 [`db9ff33`](https://github.com/nocobase/nocobase/commit/db9ff337e5e69a5462be8474caea1eaf59ff9342)
- fix: console command [`820352f`](https://github.com/nocobase/nocobase/commit/820352f280abd61ae43c5f29b37db889388ba044)
- chore: update changelog [`6f74230`](https://github.com/nocobase/nocobase/commit/6f7423037a5c7ccb5d442549a22b81453430d971)

## [v0.20.0-alpha.12](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.11...v0.20.0-alpha.12) - 2024-03-16

### Merged

- fix: compatibility of @ant-design/plots 2.x [`#3734`](https://github.com/nocobase/nocobase/pull/3734)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.12 [`c1be864`](https://github.com/nocobase/nocobase/commit/c1be86412440c617771d079ded95f64aca3fa155)
- fix: yarn dev error [`c191f14`](https://github.com/nocobase/nocobase/commit/c191f149f96def2672fc50d4d042ca976c863ebc)
- chore: update changelog [`8278262`](https://github.com/nocobase/nocobase/commit/8278262728387fbd3963a0286ed09b2219eb7739)

## [v0.20.0-alpha.11](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.10...v0.20.0-alpha.11) - 2024-03-16

### Merged

- feat: supports subdirectory deployment [`#3731`](https://github.com/nocobase/nocobase/pull/3731)
- fix(variables): fix varaibles for table selector [`#3725`](https://github.com/nocobase/nocobase/pull/3725)
- fixing timezone header when it is negative value [`#3732`](https://github.com/nocobase/nocobase/pull/3732)
- fix(data-source): foreignkey [`#3707`](https://github.com/nocobase/nocobase/pull/3707)
- feat: add data source filter [`#3724`](https://github.com/nocobase/nocobase/pull/3724)
- fix(Table): fix disappearing content after selecting a row [`#3726`](https://github.com/nocobase/nocobase/pull/3726)
- refactor: view collection set name as default title when title is missing [`#3719`](https://github.com/nocobase/nocobase/pull/3719)
- refactor: add blocks in a unified way [`#3668`](https://github.com/nocobase/nocobase/pull/3668)
- feat: support to set data loading mode [`#3712`](https://github.com/nocobase/nocobase/pull/3712)
- fix: block template [`#3714`](https://github.com/nocobase/nocobase/pull/3714)
- refactor(SchemaInitializers): unify naming style [`#3604`](https://github.com/nocobase/nocobase/pull/3604)
- fix: remove env in colletion delete button [`#3682`](https://github.com/nocobase/nocobase/pull/3682)
- fix(data-vi): update antv version [`#3710`](https://github.com/nocobase/nocobase/pull/3710)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.11 [`15ef818`](https://github.com/nocobase/nocobase/commit/15ef81854e4f900ed53e5229d66d1c016d71b8e7)
- chore: update registry in yarn.lock [`e877e3b`](https://github.com/nocobase/nocobase/commit/e877e3b5d9c1543c74a55b41eb57f69f15ff9847)
- chore: update changelog [`42448ec`](https://github.com/nocobase/nocobase/commit/42448ecddb1afe455cced9c4a8b6ca78586a060f)

## [v0.20.0-alpha.10](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.9...v0.20.0-alpha.10) - 2024-03-13

### Merged

- fix(client): size undefined in nanoid [`#3708`](https://github.com/nocobase/nocobase/pull/3708)
- refactor(radio): radio support multiple field types [`#3706`](https://github.com/nocobase/nocobase/pull/3706)
- fix: get async json schema [`#3705`](https://github.com/nocobase/nocobase/pull/3705)
- fix: select fieldnames [`#3704`](https://github.com/nocobase/nocobase/pull/3704)
- fix: field configuration of Kanban interacts with other block [`#3689`](https://github.com/nocobase/nocobase/pull/3689)
- fix: radio [`#3701`](https://github.com/nocobase/nocobase/pull/3701)
- feat: add uuid & nanoid & unitTimestamp interface [`#3684`](https://github.com/nocobase/nocobase/pull/3684)
- fix(plugin-workflow): fix duplicated triggering schedule event [`#3692`](https://github.com/nocobase/nocobase/pull/3692)
- refactor(client): add component to support data source select [`#3691`](https://github.com/nocobase/nocobase/pull/3691)
- fix(Form): should be created instead of updated when clicking submit [`#3687`](https://github.com/nocobase/nocobase/pull/3687)
- fix: incorrect pagination query parameters when batch deleting last page [`#3670`](https://github.com/nocobase/nocobase/pull/3670)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.10 [`40a2294`](https://github.com/nocobase/nocobase/commit/40a22943b91455734a255b6598178391d7887999)
- chore: update changelog [`a8e37f6`](https://github.com/nocobase/nocobase/commit/a8e37f6224a5a03f90164a2848ad2e9a250bebae)
- fix: add external deps [`24b52c9`](https://github.com/nocobase/nocobase/commit/24b52c98d18f11083e97f584b8e23749846052f0)

## [v0.20.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.8...v0.20.0-alpha.9) - 2024-03-12

### Merged

- refactor: add child in inheritance of tree collection [`#3676`](https://github.com/nocobase/nocobase/pull/3676)
- fix: data source add field refresh(T-3253) [`#3645`](https://github.com/nocobase/nocobase/pull/3645)
- chore: escape underscore char in include query [`#3681`](https://github.com/nocobase/nocobase/pull/3681)
- fix: upgrade app after restore [`#3680`](https://github.com/nocobase/nocobase/pull/3680)
- fix: view collection association field foreignkey should be select [`#3671`](https://github.com/nocobase/nocobase/pull/3671)
- fix: acl should return true when resource allowed [`#3675`](https://github.com/nocobase/nocobase/pull/3675)
- fix: init scope value when all data is null value [`#3674`](https://github.com/nocobase/nocobase/pull/3674)
- fix: inheritance cache bug [`#3669`](https://github.com/nocobase/nocobase/pull/3669)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.9 [`2e7da6e`](https://github.com/nocobase/nocobase/commit/2e7da6e29bc75def06f59d8d3bb991e7e238c64b)
- fix: pagination error in roles collections resourcer [`023096b`](https://github.com/nocobase/nocobase/commit/023096b1a9ea6ccae364c81ba93ca32b077ccecc)
- chore: update changelog [`56fd24e`](https://github.com/nocobase/nocobase/commit/56fd24ef4b30717e12b2c0574d4df92210bac81c)

## [v0.20.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.7...v0.20.0-alpha.8) - 2024-03-11

### Merged

- chore: move collection manager snippets into data source [`#3666`](https://github.com/nocobase/nocobase/pull/3666)
- fix(Form): retain field's default value after submitting the form [`#3665`](https://github.com/nocobase/nocobase/pull/3665)
- chore: test [`#3664`](https://github.com/nocobase/nocobase/pull/3664)
- fix(auth): cas service validate issue [`#3661`](https://github.com/nocobase/nocobase/pull/3661)
- fix: infer postgres field [`#3663`](https://github.com/nocobase/nocobase/pull/3663)
- fix(plugin-workflow-action-trigger): fix appends loading [`#3659`](https://github.com/nocobase/nocobase/pull/3659)
- fix(plugin-workflow): fix migration [`#3654`](https://github.com/nocobase/nocobase/pull/3654)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.8 [`6fd06a2`](https://github.com/nocobase/nocobase/commit/6fd06a28c838808623026d97a944db113f041a96)
- chore: update yarn.lock [`eae5a87`](https://github.com/nocobase/nocobase/commit/eae5a87ebd4ba5b58d2fa64aeaf316dacc37ed89)
- chore: update changelog [`02dcb75`](https://github.com/nocobase/nocobase/commit/02dcb752cb5c5763da0db297eaec69b3fc879ce4)

## [v0.20.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.6...v0.20.0-alpha.7) - 2024-03-08

### Merged

- fix: view collection interface missing [`#3658`](https://github.com/nocobase/nocobase/pull/3658)
- fix: getCollection bug [`#3656`](https://github.com/nocobase/nocobase/pull/3656)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.7 [`63d1a8d`](https://github.com/nocobase/nocobase/commit/63d1a8d90ca30056f7dd48bc012c30590b727cb8)
- chore: update changelog [`12ba7cd`](https://github.com/nocobase/nocobase/commit/12ba7cd9d0c48dc7b7048ebb73bb93be79e41ac8)
- chore(ci): change branch of pro image [`8dbae24`](https://github.com/nocobase/nocobase/commit/8dbae24489a8f2dcb3fd055a89225454394501e7)

## [v0.20.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.5...v0.20.0-alpha.6) - 2024-03-08

### Merged

- fix: parse association field in acl [`#3655`](https://github.com/nocobase/nocobase/pull/3655)
- chore: update menu name of plugin-localization [`#3653`](https://github.com/nocobase/nocobase/pull/3653)
- chore(pm): set plugin-sms-auth as local plugin, close T-3323 [`#3652`](https://github.com/nocobase/nocobase/pull/3652)
- fix(cascadeSelect): cassadeSelect does not dislay data in edit form [`#3649`](https://github.com/nocobase/nocobase/pull/3649)
- fix(db): through scope in eager loading & fix(acl): filter reset issue [`#3636`](https://github.com/nocobase/nocobase/pull/3636)
- fix: dateTime format configured in table is invalid [`#3630`](https://github.com/nocobase/nocobase/pull/3630)
- fix: data source permission role update [`#3643`](https://github.com/nocobase/nocobase/pull/3643)
- style: flexWrap in actionBar [`#3635`](https://github.com/nocobase/nocobase/pull/3635)
- fix: add displayName [`#3628`](https://github.com/nocobase/nocobase/pull/3628)
- fix(customRequestAction): should not support setting icons and colours [`#3632`](https://github.com/nocobase/nocobase/pull/3632)
- fix(workflow-action-trigger): change plugin name [`#3631`](https://github.com/nocobase/nocobase/pull/3631)
- fix: graph collection postions data missing [`#3627`](https://github.com/nocobase/nocobase/pull/3627)
- fix(ActionLink): fix hover style [`#3629`](https://github.com/nocobase/nocobase/pull/3629)
- feat(plugin-workflow-form-trigger): add trigger button to all single record action bar [`#3563`](https://github.com/nocobase/nocobase/pull/3563)
- fix: sidebar menu text overflow [`#3626`](https://github.com/nocobase/nocobase/pull/3626)
- fix(acl-plugin-setting):  pluginPermissions for snippets check [`#3622`](https://github.com/nocobase/nocobase/pull/3622)
- fix(subTable): fix changing title field invalid [`#3625`](https://github.com/nocobase/nocobase/pull/3625)
- fix: fix hover style for sub table [`#3623`](https://github.com/nocobase/nocobase/pull/3623)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.6 [`8b4821e`](https://github.com/nocobase/nocobase/commit/8b4821e2df39958f7befa9aa0abd203cd162bace)
- chore: update yarn.lock [`1088756`](https://github.com/nocobase/nocobase/commit/108875600c4baf9824246c43bcbdd858876e5fd1)
- chore: update changelog [`f9a10de`](https://github.com/nocobase/nocobase/commit/f9a10de9811b7a35b13f67d9007051487321e993)

## [v0.20.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.4...v0.20.0-alpha.5) - 2024-03-06

### Merged

- fix(save-record): differentiate between creation and updating based on record.isNew [`#3620`](https://github.com/nocobase/nocobase/pull/3620)
- fix(plugin-workflow): fix schedule repeat logic [`#3612`](https://github.com/nocobase/nocobase/pull/3612)
- refactor: useFormItemInitializerFields [`#3621`](https://github.com/nocobase/nocobase/pull/3621)
- fix: collection without filterTargetKey should not be  able to add block [`#3614`](https://github.com/nocobase/nocobase/pull/3614)
- fix(kanban): fix block [`#3619`](https://github.com/nocobase/nocobase/pull/3619)
- fix: should display settings after field deleted [`#3606`](https://github.com/nocobase/nocobase/pull/3606)
- fix: role name  is error in role configure [`#3618`](https://github.com/nocobase/nocobase/pull/3618)
- fix: bulkEditFormItemSettings collection undefined [`#3616`](https://github.com/nocobase/nocobase/pull/3616)
- fix: calender failed to change view for week [`#3602`](https://github.com/nocobase/nocobase/pull/3602)
- fix(Table): fix Fixed Block bug [`#3601`](https://github.com/nocobase/nocobase/pull/3601)
- chore: remove data source [`#3610`](https://github.com/nocobase/nocobase/pull/3610)
- test: acl test [`#3609`](https://github.com/nocobase/nocobase/pull/3609)
- fix: not exists data sourec [`#3608`](https://github.com/nocobase/nocobase/pull/3608)
- fix: data-block parent request with data-source [`#3605`](https://github.com/nocobase/nocobase/pull/3605)
- fix: remove temp doc [`#3603`](https://github.com/nocobase/nocobase/pull/3603)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.5 [`0fc382d`](https://github.com/nocobase/nocobase/commit/0fc382d298aac59908186dca692dbf75660005e7)
- fix(select): fieldNames are missing the value parameter [`e82179f`](https://github.com/nocobase/nocobase/commit/e82179ff61aab97e3c5ec47e06af861e45e7a390)
- chore(ci): build pro image [`4716c13`](https://github.com/nocobase/nocobase/commit/4716c13d81c216eddf23def86c4bafc22c7d14f7)

## [v0.20.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.3...v0.20.0-alpha.4) - 2024-03-05

### Commits

- fix: update plugin package.json [`e377f3a`](https://github.com/nocobase/nocobase/commit/e377f3a57cba24c3c91d9960fa9b9baea276cd33)
- chore(versions): 😊 publish v0.20.0-alpha.4 [`e7cc6cc`](https://github.com/nocobase/nocobase/commit/e7cc6cca545e3162fb84f238e7df081f08843890)
- chore(data-source-manager): improve translation [`9bd0f4f`](https://github.com/nocobase/nocobase/commit/9bd0f4faff70e46a7f3e242b79e486cb2209f8ee)

## [v0.20.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.2...v0.20.0-alpha.3) - 2024-03-04

### Merged

- fix: create-nocobase-app + yarn dev error [`#3599`](https://github.com/nocobase/nocobase/pull/3599)
- fix: chinaRegions association fieldName [`#3600`](https://github.com/nocobase/nocobase/pull/3600)
- fix: field hidden with linkage rule should clear value [`#3576`](https://github.com/nocobase/nocobase/pull/3576)
- fix(client): fix mistaken changed api [`#3598`](https://github.com/nocobase/nocobase/pull/3598)
- style(TableColumn): fix style of mouse hover [`#3597`](https://github.com/nocobase/nocobase/pull/3597)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.3 [`ff9acd6`](https://github.com/nocobase/nocobase/commit/ff9acd6d699a10470a83be53735e90e277f20620)
- chore: update changelog [`a70e87f`](https://github.com/nocobase/nocobase/commit/a70e87f0d514b26e26fe51308e0eadbb95d86fe7)
- fix: remove backup file [`56d4d24`](https://github.com/nocobase/nocobase/commit/56d4d240a1d63a1222bf14a04674f0e4c5f6e50c)

## [v0.20.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.20.0-alpha.1...v0.20.0-alpha.2) - 2024-03-03

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.2 [`32b15cb`](https://github.com/nocobase/nocobase/commit/32b15cb1089b95d4f2f5088a0ac81ed72d925b99)
- chore: update changelog [`eda9a37`](https://github.com/nocobase/nocobase/commit/eda9a37e997c08744e9f648466412b620ccc98cd)
- fix: import [`e5a380f`](https://github.com/nocobase/nocobase/commit/e5a380ff394b6f1c2b8b77ad7505e78321c3f471)

## [v0.20.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.10...v0.20.0-alpha.1) - 2024-03-03

### Merged

- feat: support for multiple data sources [`#3418`](https://github.com/nocobase/nocobase/pull/3418)

### Commits

- chore(versions): 😊 publish v0.20.0-alpha.1 [`29e10f3`](https://github.com/nocobase/nocobase/commit/29e10f365fc51e2f9838320cbc1d672dd390a1ef)

## [v0.19.0-alpha.10](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.9...v0.19.0-alpha.10) - 2024-03-13

### Merged

- fix: get async json schema [`#3705`](https://github.com/nocobase/nocobase/pull/3705)
- fix(plugin-workflow): fix off static schedule trigger [`#3595`](https://github.com/nocobase/nocobase/pull/3595)
- fix(plugin-workflow): fix interval number greater then 32-bits integer [`#3592`](https://github.com/nocobase/nocobase/pull/3592)
- fix: plugin settings auth bug [`#3585`](https://github.com/nocobase/nocobase/pull/3585)
- fix: formula field should trriger onchange when value change [`#3573`](https://github.com/nocobase/nocobase/pull/3573)
- fix(LinkageRules): fix linkage rules with nested conditions [`#3578`](https://github.com/nocobase/nocobase/pull/3578)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.10 [`7a74b10`](https://github.com/nocobase/nocobase/commit/7a74b101f42acdb3d0833214e70cea132b1156e2)
- chore: update changelog [`866eccc`](https://github.com/nocobase/nocobase/commit/866eccc60770fa2d2b42138e7083d78730d82de8)

## [v0.19.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.8...v0.19.0-alpha.9) - 2024-02-28

### Merged

- fix: upload action [`#3577`](https://github.com/nocobase/nocobase/pull/3577)
- fix: dataSource in select readPretty is missing [`#3574`](https://github.com/nocobase/nocobase/pull/3574)
- fix:  actions schema key should be uid [`#3570`](https://github.com/nocobase/nocobase/pull/3570)
- fix: datatime format support preview [`#3572`](https://github.com/nocobase/nocobase/pull/3572)
- refactor(plugin-workflow): refactor schedule trigger implementation [`#3562`](https://github.com/nocobase/nocobase/pull/3562)
- refactor: the default openSize of dialog should be middle [`#3569`](https://github.com/nocobase/nocobase/pull/3569)
- style: plugin manager style improve [`#3568`](https://github.com/nocobase/nocobase/pull/3568)
- feat(Help): switch to the Chinese page when using Chinese [`#3567`](https://github.com/nocobase/nocobase/pull/3567)
- refactor: fixedBlockDesignerItem [`#3550`](https://github.com/nocobase/nocobase/pull/3550)
- fix: lazy loading belongs to association [`#3559`](https://github.com/nocobase/nocobase/pull/3559)
- style: set size of icon button [`#3560`](https://github.com/nocobase/nocobase/pull/3560)
- chore: fix e2e [`#3557`](https://github.com/nocobase/nocobase/pull/3557)
- feat: adjust of menu in upper right corner of page [`#3548`](https://github.com/nocobase/nocobase/pull/3548)
- chore: optimize plugin description [`#3552`](https://github.com/nocobase/nocobase/pull/3552)
- chore: update plugin descriptions [`#3556`](https://github.com/nocobase/nocobase/pull/3556)
- docs(plugin-workflow): adjust plugin description [`#3553`](https://github.com/nocobase/nocobase/pull/3553)
- docs(plugin-snapshot-field): adjust description [`#3551`](https://github.com/nocobase/nocobase/pull/3551)
- feat(core): add string template engine to evaluators [`#3546`](https://github.com/nocobase/nocobase/pull/3546)
- docs(plugin-workflow-loop): fix description [`#3549`](https://github.com/nocobase/nocobase/pull/3549)
- chore: update plugin names and descriptions [`#3547`](https://github.com/nocobase/nocobase/pull/3547)
- refactor: formula field should not trigger form value change [`#3518`](https://github.com/nocobase/nocobase/pull/3518)
- chore: limit restore dialect [`#3534`](https://github.com/nocobase/nocobase/pull/3534)
- fix(client): fix filter default value [`#3544`](https://github.com/nocobase/nocobase/pull/3544)
- refactor: iframe block support in RecordFormBlockInitializers [`#3541`](https://github.com/nocobase/nocobase/pull/3541)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.9 [`9520b24`](https://github.com/nocobase/nocobase/commit/9520b2431e370eaa0ef41f3f416d3a7bf5a2e047)
- chore: update changelog [`90cdef8`](https://github.com/nocobase/nocobase/commit/90cdef866266efde7807e1affb18726beddab0bd)
- test: fix e2e [`3a0f942`](https://github.com/nocobase/nocobase/commit/3a0f942270d320afccc756d126c66111cba02778)

## [v0.19.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.7...v0.19.0-alpha.8) - 2024-02-21

### Merged

- fix(LinkageRules): fix appends [`#3537`](https://github.com/nocobase/nocobase/pull/3537)
- fix(LinkageRules): avoid to change observable object [`#3538`](https://github.com/nocobase/nocobase/pull/3538)
- fix: clicking on field assignment does not display field configuration for the first time [`#3484`](https://github.com/nocobase/nocobase/pull/3484)
- refactor: display title [`#3535`](https://github.com/nocobase/nocobase/pull/3535)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.8 [`a736847`](https://github.com/nocobase/nocobase/commit/a736847a0fc4dc510b34668f0051e1e3997d59c6)
- chore: update changelog [`5e2b0c3`](https://github.com/nocobase/nocobase/commit/5e2b0c3a8de8126b54332f210cee30a0f4eb9ddf)

## [v0.19.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.6...v0.19.0-alpha.7) - 2024-02-20

### Merged

- chore: update Dockerfile [`#3503`](https://github.com/nocobase/nocobase/pull/3503)
- chore: optimize environmental variables [`#3528`](https://github.com/nocobase/nocobase/pull/3528)
- fix(bi): parse issue of date variables [`#3520`](https://github.com/nocobase/nocobase/pull/3520)
- refactor(Linkage): optimize the parsing of expression variables [`#3519`](https://github.com/nocobase/nocobase/pull/3519)
- fix(core): refactor evaluate to support dash in key path [`#3517`](https://github.com/nocobase/nocobase/pull/3517)
- chore: field type map [`#3516`](https://github.com/nocobase/nocobase/pull/3516)
- fix: detail block should not support pageSizeChanger [`#3515`](https://github.com/nocobase/nocobase/pull/3515)
- fix: fields locales [`#3511`](https://github.com/nocobase/nocobase/pull/3511)
- fix(subTable): should clear form value after submit [`#3508`](https://github.com/nocobase/nocobase/pull/3508)
- style(PinnedPluginList): fix hover background color [`#3501`](https://github.com/nocobase/nocobase/pull/3501)
- docs(plugin-workflow): fix keyword [`#3498`](https://github.com/nocobase/nocobase/pull/3498)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.7 [`8cb1942`](https://github.com/nocobase/nocobase/commit/8cb19429268de80335e6aa9206fc504f1bb0bff1)
- chore(ci): using concurrency [`e93563c`](https://github.com/nocobase/nocobase/commit/e93563cfb70e3aaed7c54993d87ab50ece2855d2)
- chore: update changelog [`86ff9dd`](https://github.com/nocobase/nocobase/commit/86ff9dde40cc68e6cbdefbb854b17e5b06c99072)

## [v0.19.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.5...v0.19.0-alpha.6) - 2024-02-07

### Merged

- fix: plugin load collections [`#3499`](https://github.com/nocobase/nocobase/pull/3499)
- fix: sub-table should not support action column [`#3497`](https://github.com/nocobase/nocobase/pull/3497)
- fix: password cannot be empty [`#3491`](https://github.com/nocobase/nocobase/pull/3491)
- refactor: plugin manager keywords [`#3490`](https://github.com/nocobase/nocobase/pull/3490)
- fix(plugin-workflow-form-trigger): fix locale [`#3488`](https://github.com/nocobase/nocobase/pull/3488)
- fix: fix T-3012 [`#3489`](https://github.com/nocobase/nocobase/pull/3489)
- fix(plugin-workflow): fix revision with new properties [`#3487`](https://github.com/nocobase/nocobase/pull/3487)
- style(lang): add zh-tw [`#3446`](https://github.com/nocobase/nocobase/pull/3446)
- fix: layout of plugin settings icons [`#3478`](https://github.com/nocobase/nocobase/pull/3478)
- fix(server): fix messages in data-wrapping [`#3485`](https://github.com/nocobase/nocobase/pull/3485)
- style: fix color of more button and scrollbar style [`#3486`](https://github.com/nocobase/nocobase/pull/3486)
- fix(plugin-workflow): fix processor options to pass any context [`#3483`](https://github.com/nocobase/nocobase/pull/3483)
- refactor(plugin-workflow): optimize hint on binding workflow [`#3480`](https://github.com/nocobase/nocobase/pull/3480)
- refactor: plugin manager optimize & support keywords [`#3467`](https://github.com/nocobase/nocobase/pull/3467)
- refactor(plugin-workflow): support any context in processor as options [`#3473`](https://github.com/nocobase/nocobase/pull/3473)
- test: parallel branch node e2e [`#3471`](https://github.com/nocobase/nocobase/pull/3471)
- fix(defaultValue): should not use defaultValue in filter blocks [`#3472`](https://github.com/nocobase/nocobase/pull/3472)
- fix: attachment field set as single and doesn't display re-uploaded attachments after deleted [`#3469`](https://github.com/nocobase/nocobase/pull/3469)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.6 [`d8bbdc9`](https://github.com/nocobase/nocobase/commit/d8bbdc96482899bc6d9f3993c9ef8cb2c38c7a52)
- feat: update package.json [`c0988d9`](https://github.com/nocobase/nocobase/commit/c0988d9fc68b3728e4d5ec4450bf88e1797eb51a)
- chore: update changelog [`5fa4305`](https://github.com/nocobase/nocobase/commit/5fa430585c8139d252b82f9e9aefcd12fffabb87)

## [v0.19.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.4...v0.19.0-alpha.5) - 2024-01-30

### Merged

- refactor: remove SharedFilterProvider [`#3424`](https://github.com/nocobase/nocobase/pull/3424)
- fix(client): fix variable textarea ime state under edge [`#3458`](https://github.com/nocobase/nocobase/pull/3458)
- fix(CascadeSelect): should change value when deleting value [`#3440`](https://github.com/nocobase/nocobase/pull/3440)
- fix: filter form block failed to connect templat block [`#3457`](https://github.com/nocobase/nocobase/pull/3457)
- refactor: bulk edit action set changeTo as default value [`#3455`](https://github.com/nocobase/nocobase/pull/3455)
- fix: load sql collection with source field [`#3456`](https://github.com/nocobase/nocobase/pull/3456)
- test: Workflow manual node e2e [`#3451`](https://github.com/nocobase/nocobase/pull/3451)
- fix(plugin-workflow): fix end logic when success [`#3453`](https://github.com/nocobase/nocobase/pull/3453)
- style: fix side menu text overflow style [`#3450`](https://github.com/nocobase/nocobase/pull/3450)
- feat: support to add filter blocks for relationship blocks [`#3436`](https://github.com/nocobase/nocobase/pull/3436)
- fix(plugin-workflow): fix collection cycling triggering [`#3448`](https://github.com/nocobase/nocobase/pull/3448)
- fix: pro ci [`#3447`](https://github.com/nocobase/nocobase/pull/3447)
- fix(plugin-workflow): fix sql transaction and locale [`#3444`](https://github.com/nocobase/nocobase/pull/3444)

### Commits

- chore: update changelog [`538033a`](https://github.com/nocobase/nocobase/commit/538033a4340b65ee5b142d22ab5bee630c5b0505)
- feat: update changelog [`0558169`](https://github.com/nocobase/nocobase/commit/05581694c7672601c94e54a06c807d5611dd5a31)
- chore(versions): 😊 publish v0.19.0-alpha.5 [`8765208`](https://github.com/nocobase/nocobase/commit/87652080166248708f918401a92a4afec8e42bc9)

## [v0.19.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.3...v0.19.0-alpha.4) - 2024-01-26

### Merged

- fix(client): fix cron locale when DOM and DOW both present [`#3442`](https://github.com/nocobase/nocobase/pull/3442)
- fix(plugin-workflow): fix sync collection trigger transaction [`#3437`](https://github.com/nocobase/nocobase/pull/3437)
- fix: skip migration if exists [`#3439`](https://github.com/nocobase/nocobase/pull/3439)
- feat(core): add message handling on success [`#3435`](https://github.com/nocobase/nocobase/pull/3435)
- refactor(plugin-workflow): add sync option for trigger [`#3383`](https://github.com/nocobase/nocobase/pull/3383)
- feat: add Korean translation [`#3428`](https://github.com/nocobase/nocobase/pull/3428)
- fix: should load association data of sub details [`#3432`](https://github.com/nocobase/nocobase/pull/3432)
- feat(plugin-workflow): add cancel action for execution [`#3425`](https://github.com/nocobase/nocobase/pull/3425)
- fix: change exit description [`#3430`](https://github.com/nocobase/nocobase/pull/3430)
- fix: remove tree-kill package to core/cli [`#3429`](https://github.com/nocobase/nocobase/pull/3429)
- fix: e2e test did not exit successfully [`#3427`](https://github.com/nocobase/nocobase/pull/3427)
- refactor: configuration mode, buttons without permission should be displayed, but cannot be clicked [`#3421`](https://github.com/nocobase/nocobase/pull/3421)
- refactor: permission sholud passed without setting x-acl action [`#3410`](https://github.com/nocobase/nocobase/pull/3410)
- test: mysql version bug [`#3412`](https://github.com/nocobase/nocobase/pull/3412)
- fix: attachment deletion and re upload do not display [`#3405`](https://github.com/nocobase/nocobase/pull/3405)
- refactor: parent inherited collection support enable child collection in add new action [`#3398`](https://github.com/nocobase/nocobase/pull/3398)
- feat: improve plugin manager process [`#3386`](https://github.com/nocobase/nocobase/pull/3386)
- Fix/plugin workflow migration [`#3404`](https://github.com/nocobase/nocobase/pull/3404)
- fix: varibales as  & &Iteration is not correct in record picker [`#3399`](https://github.com/nocobase/nocobase/pull/3399)
- fix(plugin-workflow-manual): fix value block in todo block [`#3400`](https://github.com/nocobase/nocobase/pull/3400)
- fix: assciation field in sub-table should support enable link when readOnly or readPrety [`#3390`](https://github.com/nocobase/nocobase/pull/3390)
- refactor: local translate [`#3396`](https://github.com/nocobase/nocobase/pull/3396)
- fix: fix T-2916 [`#3393`](https://github.com/nocobase/nocobase/pull/3393)
- refactor(sub-table): sub-table support selection of existing records [`#3311`](https://github.com/nocobase/nocobase/pull/3311)
- fix(auth): redirect URL after signing in by SSO sucessfully [`#3387`](https://github.com/nocobase/nocobase/pull/3387)
- fix(custom-request): permission issues [`#3306`](https://github.com/nocobase/nocobase/pull/3306)
- feat: supports the WS_PATH environment variable [`#3384`](https://github.com/nocobase/nocobase/pull/3384)
- fix:  table column sort params should support cancel sort [`#3372`](https://github.com/nocobase/nocobase/pull/3372)
- fix: fix T-2909 [`#3373`](https://github.com/nocobase/nocobase/pull/3373)
- fix: graph collection auto layout reporting error [`#3370`](https://github.com/nocobase/nocobase/pull/3370)
- test: collection selector test [`#3371`](https://github.com/nocobase/nocobase/pull/3371)
- fix(TableSelectorProvider): parse filter param [`#3366`](https://github.com/nocobase/nocobase/pull/3366)
- Revert "test: collection selector test" [`#3369`](https://github.com/nocobase/nocobase/pull/3369)
- test: collection selector test [`#3368`](https://github.com/nocobase/nocobase/pull/3368)
- refactor: local impeove [`#3367`](https://github.com/nocobase/nocobase/pull/3367)
- feat(oidc): add advanced options [`#3364`](https://github.com/nocobase/nocobase/pull/3364)
- fix: useDesigner Designer should has default toolbar [`#3365`](https://github.com/nocobase/nocobase/pull/3365)
- fix: linkage rules support multi-level association value calculation and assignment [`#3359`](https://github.com/nocobase/nocobase/pull/3359)
- fix: linkage rule only support action with context record [`#3355`](https://github.com/nocobase/nocobase/pull/3355)
- fix(header): avoid affecting the colours of other menus [`#3357`](https://github.com/nocobase/nocobase/pull/3357)
- fix: compute node random data even error [`#3346`](https://github.com/nocobase/nocobase/pull/3346)
- fix(theme): fix color of header menu [`#3354`](https://github.com/nocobase/nocobase/pull/3354)
- fix: dump with sql collection [`#3350`](https://github.com/nocobase/nocobase/pull/3350)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.4 [`65020f6`](https://github.com/nocobase/nocobase/commit/65020f69d473a1932e0310986872d9aa23591f46)
- test(e2e): increase the number of retries for error-prone tests [`f466e6e`](https://github.com/nocobase/nocobase/commit/f466e6ec954cf1a6849b546599c42968bbf9d5a3)
- Revert "fix(theme): fix color of header menu (#3354)" [`3a06893`](https://github.com/nocobase/nocobase/commit/3a0689346350b94a5804d09edd9d5b703c162a02)

## [v0.19.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.2...v0.19.0-alpha.3) - 2024-01-09

### Merged

- fix: e2e ci [`#3349`](https://github.com/nocobase/nocobase/pull/3349)
- fix: collection field update reporting error [`#3352`](https://github.com/nocobase/nocobase/pull/3352)
- fix: build clean [`#3351`](https://github.com/nocobase/nocobase/pull/3351)
- fix: filter form drop-down selection to add data range [`#3321`](https://github.com/nocobase/nocobase/pull/3321)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.3 [`38c1981`](https://github.com/nocobase/nocobase/commit/38c19818d361a5a17386b7a66d6aab73baf731b7)
- chore: update changelog [`c1149d7`](https://github.com/nocobase/nocobase/commit/c1149d75f149f6caffe122527b5344a43391afc3)
- fix(client): hide gmt property [`f2de05b`](https://github.com/nocobase/nocobase/commit/f2de05bea022e8478f93b7ac211404135ebffb52)

## [v0.19.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.19.0-alpha.1...v0.19.0-alpha.2) - 2024-01-09

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.2 [`2070f20`](https://github.com/nocobase/nocobase/commit/2070f2046dde40d0a6ae29316515754cf1222fc9)
- chore: update changelog [`1802ca6`](https://github.com/nocobase/nocobase/commit/1802ca648cf8b792a9235d2280969ef9ca6ca940)
- fix: error creating sock file on windows [`6567013`](https://github.com/nocobase/nocobase/commit/6567013440ab0ecad5b253b26448e1f9201bd9d5)

## [v0.19.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.9...v0.19.0-alpha.1) - 2024-01-08

### Merged

- refactor: optimize the command line [`#3339`](https://github.com/nocobase/nocobase/pull/3339)
- feat: application backup and restore  [`#3268`](https://github.com/nocobase/nocobase/pull/3268)
- fix: workflow e2e concurrency errors [`#3345`](https://github.com/nocobase/nocobase/pull/3345)
- test: workflow aggregate node e2e [`#3342`](https://github.com/nocobase/nocobase/pull/3342)
- test: workflow sql node e2e [`#3341`](https://github.com/nocobase/nocobase/pull/3341)
- fix(z-index): avoid obscuring the pop-up and upgrade antd to v5.12.8 [`#3337`](https://github.com/nocobase/nocobase/pull/3337)
- refactor(plugin-workflow): add trigger title for workflow which is different with title [`#3333`](https://github.com/nocobase/nocobase/pull/3333)
- fix(database): cannot find module 'node-fetch' [`#3335`](https://github.com/nocobase/nocobase/pull/3335)
- chore(e2e): make parallelism mode more stable [`#3294`](https://github.com/nocobase/nocobase/pull/3294)
- fix(plugin-workflow-manual): adjust locale and column [`#3331`](https://github.com/nocobase/nocobase/pull/3331)
- feat: add onChange props to SchemaComponent [`#3292`](https://github.com/nocobase/nocobase/pull/3292)
- fix: fix T-2879 [`#3330`](https://github.com/nocobase/nocobase/pull/3330)
- refactor: gantt tooltip hover [`#3328`](https://github.com/nocobase/nocobase/pull/3328)
- refactor: view collection should omit rawTitle when sync form database [`#3327`](https://github.com/nocobase/nocobase/pull/3327)
- fix: view collection should omit rawTitle when sync form database [`#3326`](https://github.com/nocobase/nocobase/pull/3326)
- refactor(client): pass props to antd list [`#3319`](https://github.com/nocobase/nocobase/pull/3319)
- perf(bi): optimize performance of chart filter block  [`#3316`](https://github.com/nocobase/nocobase/pull/3316)
- fix: attachment reporting  error while opening preview modal in table [`#3318`](https://github.com/nocobase/nocobase/pull/3318)
- refactor(client): adjust list item style and fix warning [`#3315`](https://github.com/nocobase/nocobase/pull/3315)
- fix: z-index of antd [`#3313`](https://github.com/nocobase/nocobase/pull/3313)
- fix: in the dev environment, all plugins are loaded locally [`#3309`](https://github.com/nocobase/nocobase/pull/3309)
- fix(plugin-workflow): adjust locale [`#3308`](https://github.com/nocobase/nocobase/pull/3308)

### Commits

- chore(versions): 😊 publish v0.19.0-alpha.1 [`c39d339`](https://github.com/nocobase/nocobase/commit/c39d3398ae637a1052f7c8d2d1aff7e6168bebf2)
- fix: e2e with build [`fd4809d`](https://github.com/nocobase/nocobase/commit/fd4809d8ad4d09075864ed0fd0e6d15f687ca52b)
- chore: update changelog [`d84d109`](https://github.com/nocobase/nocobase/commit/d84d10996cad67ca506a29b0887de84d2a97aeb8)

## [v0.18.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.8...v0.18.0-alpha.9) - 2024-01-03

### Merged

- chore(plugin-workflow): add metric example [`#3305`](https://github.com/nocobase/nocobase/pull/3305)
- chore(vscode): add inspect argument for attaching to debug port [`#3307`](https://github.com/nocobase/nocobase/pull/3307)
- fix(client): detail block should support save as block template [`#3303`](https://github.com/nocobase/nocobase/pull/3303)
- feat(plugin-workflow-request): allow to use variable in url [`#3304`](https://github.com/nocobase/nocobase/pull/3304)
- fix: dateformat setting should support  sub-table/table block [`#3297`](https://github.com/nocobase/nocobase/pull/3297)
- fix: record picker should support popupsize setting [`#3299`](https://github.com/nocobase/nocobase/pull/3299)
- feat: telemetry [`#3279`](https://github.com/nocobase/nocobase/pull/3279)
- chore(logger): append url to request log message [`#3296`](https://github.com/nocobase/nocobase/pull/3296)
- fix(defaultValue): fix unparsed default value in edit form's subtable [`#3289`](https://github.com/nocobase/nocobase/pull/3289)
- fix: previewFields [`#3293`](https://github.com/nocobase/nocobase/pull/3293)
- chore(logger): improve format [`#3290`](https://github.com/nocobase/nocobase/pull/3290)
- fix: view collection should set title value when sync form database [`#3287`](https://github.com/nocobase/nocobase/pull/3287)
- fix: remove require cache [`#3288`](https://github.com/nocobase/nocobase/pull/3288)

### Commits

- chore(versions): 😊 publish v0.18.0-alpha.9 [`004998a`](https://github.com/nocobase/nocobase/commit/004998a80af105af8669e17e189aa1f67d688200)
- chore: update changelog [`32dd641`](https://github.com/nocobase/nocobase/commit/32dd64190b15dc6453628769b877c9f9683d3e35)
- fix(ui-schema-storage): duplicate of empty schema [`5de28cd`](https://github.com/nocobase/nocobase/commit/5de28cd4c4525a72f8e78ce5696b39a3a9a0c65e)

## [v0.18.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.4...v0.18.0-alpha.8) - 2023-12-29

### Commits

- chore(versions): 😊 publish v0.18.0-alpha.8 [`8bac8da`](https://github.com/nocobase/nocobase/commit/8bac8dac71feb545132917abaf7d0c014a9d9722)

## [v0.18.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.3...v0.18.0-alpha.4) - 2023-12-29

### Merged

- refactor: record picker submit button display by association type [`#3283`](https://github.com/nocobase/nocobase/pull/3283)
- fix: use appends param to load association data [`#3282`](https://github.com/nocobase/nocobase/pull/3282)

### Commits

- fix: add LICENSE [`6816ade`](https://github.com/nocobase/nocobase/commit/6816aded874e1a6ecefb2fee7d724f79ffa3536c)
- chore(versions): 😊 publish v0.18.0-alpha.4 [`0882c0c`](https://github.com/nocobase/nocobase/commit/0882c0c4185373027b37987cbd16550f3f228f2e)
- chore: update changelog [`0c12fbc`](https://github.com/nocobase/nocobase/commit/0c12fbce29b2af0ba849db8cd4601728cc36c0be)

## [v0.18.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.2...v0.18.0-alpha.3) - 2023-12-29

### Merged

- refactor(plugin-workflow): adjust some api and packages [`#3281`](https://github.com/nocobase/nocobase/pull/3281)
- test(e2e):  acl e2e test [`#3249`](https://github.com/nocobase/nocobase/pull/3249)
- test(e2e): add tests for collection manager [`#3253`](https://github.com/nocobase/nocobase/pull/3253)
- test: workflow e2e [`#3261`](https://github.com/nocobase/nocobase/pull/3261)
- fix: associaion block failed to create in internalViewer [`#3274`](https://github.com/nocobase/nocobase/pull/3274)
- fix: z-index should be the same value [`#3278`](https://github.com/nocobase/nocobase/pull/3278)
- style: collection manger fields style improve [`#3276`](https://github.com/nocobase/nocobase/pull/3276)
- fix: require module [`#3277`](https://github.com/nocobase/nocobase/pull/3277)
- chore: optimize jsdom and vitest configuration [`#3269`](https://github.com/nocobase/nocobase/pull/3269)
- refactor(logger): improve logger format [`#2664`](https://github.com/nocobase/nocobase/pull/2664)
- refactor(plugin-workflow): refactor apis [`#3267`](https://github.com/nocobase/nocobase/pull/3267)
- fix: record picker display incorrect data when field has default value in collection [`#3266`](https://github.com/nocobase/nocobase/pull/3266)
- fix: useParseDefaultValue [`#3264`](https://github.com/nocobase/nocobase/pull/3264)
- refactor: local improve [`#3265`](https://github.com/nocobase/nocobase/pull/3265)
- fix(plugin-workflow): defend unimplemented trigger type [`#3263`](https://github.com/nocobase/nocobase/pull/3263)

### Commits

- chore(versions): 😊 publish v0.18.0-alpha.3 [`501e3f1`](https://github.com/nocobase/nocobase/commit/501e3f1db23fccca5181ec59c932429ccf86c691)
- chore: update changelog [`28759aa`](https://github.com/nocobase/nocobase/commit/28759aac074cbced9b9f56c520ab67f7f6c1da9c)
- feat: add plugin.t() method [`95a5cab`](https://github.com/nocobase/nocobase/commit/95a5cab44ce74c2ca1aaade3cbfc218272adbe1e)

## [v0.18.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.18.0-alpha.1...v0.18.0-alpha.2) - 2023-12-25

### Merged

- fix(database): belongs to association only in eager loading tree [`#3259`](https://github.com/nocobase/nocobase/pull/3259)
- fix(plugin-workflow): queueing execution of disabled workflow block dispatching [`#3256`](https://github.com/nocobase/nocobase/pull/3256)
- fix: tsx cli [`#3254`](https://github.com/nocobase/nocobase/pull/3254)
- feat(plugin-workflow): add space control to RadioWithTooltip [`#3252`](https://github.com/nocobase/nocobase/pull/3252)
- feat(plugin-calendar): add calendar plugin [`#3109`](https://github.com/nocobase/nocobase/pull/3109)
- fix(plugin-workflow-dynamic-calculation): fix missed component [`#3247`](https://github.com/nocobase/nocobase/pull/3247)
- refactor(client): allow fixed layout table and action link class [`#3246`](https://github.com/nocobase/nocobase/pull/3246)
- feat: the $anyof and $noneOf operators should support non-array values [`#3244`](https://github.com/nocobase/nocobase/pull/3244)

### Commits

- chore(versions): 😊 publish v0.18.0-alpha.2 [`e8f481a`](https://github.com/nocobase/nocobase/commit/e8f481ae6803f62e777bb82c7d533e3ff0eadc7b)
- chore: update changelog [`c492977`](https://github.com/nocobase/nocobase/commit/c492977233d4e90ae9ffc00bfcb3be436fe55562)
- fix: incorrect tsx version on windows [`e4c9765`](https://github.com/nocobase/nocobase/commit/e4c97651bf873890e8a44480a65d26f9fa8735f6)

## [v0.18.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.7...v0.18.0-alpha.1) - 2023-12-21

### Merged

- refactor: establish a sound testing system [`#3179`](https://github.com/nocobase/nocobase/pull/3179)
- refactor(auth): move auth client from core to the plugin & refactor auth client api [`#3215`](https://github.com/nocobase/nocobase/pull/3215)
- fix(drawer): fix z-index [`#3242`](https://github.com/nocobase/nocobase/pull/3242)
- fix: failed to duplicate value in sub-table when setting data scope in association select [`#3239`](https://github.com/nocobase/nocobase/pull/3239)
- refactor(plugin-audit-log): remove useless function wrap [`#3237`](https://github.com/nocobase/nocobase/pull/3237)
- perf: remove lazy load association fields [`#3222`](https://github.com/nocobase/nocobase/pull/3222)
- feat(acl): supports 'current role' variable and collections filtering [`#3181`](https://github.com/nocobase/nocobase/pull/3181)
- refactor(plugin-workflow): add logs and try/catch for preparing [`#3236`](https://github.com/nocobase/nocobase/pull/3236)
- chore: remove field from db [`#3233`](https://github.com/nocobase/nocobase/pull/3233)
- fix(kanban）: kanban data on a page should be isolated [`#3232`](https://github.com/nocobase/nocobase/pull/3232)
- fix(filter): fix $in operatror [`#3235`](https://github.com/nocobase/nocobase/pull/3235)
- fix(localization): compatibility with plugin package names as namespaces [`#3234`](https://github.com/nocobase/nocobase/pull/3234)
- fix: customize add record cusomeizeCreateFormBlockInitializers [`#3230`](https://github.com/nocobase/nocobase/pull/3230)
- fix: update assocations in belongs to many repository [`#3229`](https://github.com/nocobase/nocobase/pull/3229)
- fix: fix switch role and input style [`#3226`](https://github.com/nocobase/nocobase/pull/3226)
- fix: tsx must be loaded with --import instead of --loader [`#3225`](https://github.com/nocobase/nocobase/pull/3225)
- feat: add a secondary confirmation function to the direct execution o… [`#3161`](https://github.com/nocobase/nocobase/pull/3161)
- fix(graph-collection-manager): application context missing [`#3224`](https://github.com/nocobase/nocobase/pull/3224)
- fix(variable): local variables should not affect global variables [`#3214`](https://github.com/nocobase/nocobase/pull/3214)
- chore: upgrade antd to v5.12.2 [`#3185`](https://github.com/nocobase/nocobase/pull/3185)
- feat(mobile-client): update the text of the preview button [`#3189`](https://github.com/nocobase/nocobase/pull/3189)
- feat(ui-schema): nocobase-admin-menu & nocobase-mobile-container [`#3213`](https://github.com/nocobase/nocobase/pull/3213)
- feat: kanban& gantt&bulk edit& bulk update& duplicate& print action  pluggable [`#3019`](https://github.com/nocobase/nocobase/pull/3019)
- fix(core):  cannot add a record block in new tab in Drawer [`#3196`](https://github.com/nocobase/nocobase/pull/3196)
- fix(acl): optimize error handling when logged user has no roles [`#3190`](https://github.com/nocobase/nocobase/pull/3190)

### Commits

- chore(versions): 😊 publish v0.18.0-alpha.1 [`95e6a32`](https://github.com/nocobase/nocobase/commit/95e6a3264762944038e0c53674404a9756d5b926)
- fix(e2e): change the value of adminSchemaUid [`1eee7f5`](https://github.com/nocobase/nocobase/commit/1eee7f5f4ea1865af876ffc7e785ba3caf0b9027)
- chore: update changelog [`7d2fe69`](https://github.com/nocobase/nocobase/commit/7d2fe699443cda69bb6691eacf2e1610dd1fce90)

## [v0.17.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.6...v0.17.0-alpha.7) - 2023-12-15

### Merged

- fix: update dependent version of cache-manager [`#3195`](https://github.com/nocobase/nocobase/pull/3195)
- fix: fix T-2749 [`#3194`](https://github.com/nocobase/nocobase/pull/3194)
- feat(plugin-workflow-form): add role name to form trigger context [`#3182`](https://github.com/nocobase/nocobase/pull/3182)
- feat: manual-release [`#3184`](https://github.com/nocobase/nocobase/pull/3184)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.7 [`d6dbc97`](https://github.com/nocobase/nocobase/commit/d6dbc970a5b74cde236d860286d387aa4373662c)
- chore: update changelog [`22ea9d9`](https://github.com/nocobase/nocobase/commit/22ea9d95500023a4e1993839221d95ab036b7618)
- chore(database): update event listener scope in collection [`f6fdec1`](https://github.com/nocobase/nocobase/commit/f6fdec1226c60754251179cf0393401db6964b62)

## [v0.17.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.5...v0.17.0-alpha.6) - 2023-12-13

### Merged

- fix: create-app dev plugin load [`#3183`](https://github.com/nocobase/nocobase/pull/3183)
- fix: update yarn.lock [`#3180`](https://github.com/nocobase/nocobase/pull/3180)
- test(e2e): add tests for client [`#3144`](https://github.com/nocobase/nocobase/pull/3144)
- fix(plugin-workflow-manual): fix schema config component [`#3172`](https://github.com/nocobase/nocobase/pull/3172)
- fix: use node:18-bullseye [`#3178`](https://github.com/nocobase/nocobase/pull/3178)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.6 [`a702762`](https://github.com/nocobase/nocobase/commit/a702762ccabeeb1253d54cbce32dc55b4218ccf8)
- chore: update changelog [`e9e2e73`](https://github.com/nocobase/nocobase/commit/e9e2e73efe0c2dbd17a7f0764393e1d15774e0c2)

## [v0.17.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.4...v0.17.0-alpha.5) - 2023-12-12

### Merged

- perf(server): optimize performance of APIs [`#3079`](https://github.com/nocobase/nocobase/pull/3079)
- chore: query interface [`#3177`](https://github.com/nocobase/nocobase/pull/3177)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.5 [`3530135`](https://github.com/nocobase/nocobase/commit/35301358de824690ef4ede2a38a02e618b4c8bce)
- chore: update changelog [`7b74e99`](https://github.com/nocobase/nocobase/commit/7b74e999c9f13ed374f27cc3ce577b1e08471a77)
- chore: field type map [`2c37910`](https://github.com/nocobase/nocobase/commit/2c379108948b0129db393791ef5dfab115b20b13)

## [v0.17.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.3...v0.17.0-alpha.4) - 2023-12-12

### Merged

- fix(theme-editor): "No permission" error when updating default theme of system [`#3171`](https://github.com/nocobase/nocobase/pull/3171)
- fix: dev load remote plugin [`#3175`](https://github.com/nocobase/nocobase/pull/3175)
- fix: sub-form(popover)in sub-table value mutual influence [`#3164`](https://github.com/nocobase/nocobase/pull/3164)
- fix(plugin-workflow-manual): fix initializer [`#3170`](https://github.com/nocobase/nocobase/pull/3170)
- feat(variable): add current role [`#3167`](https://github.com/nocobase/nocobase/pull/3167)
- fix: plugin version not updated after upgrade [`#3166`](https://github.com/nocobase/nocobase/pull/3166)
- fix: sub menu hide [`#3168`](https://github.com/nocobase/nocobase/pull/3168)
- fix(bi): import bug [`#3165`](https://github.com/nocobase/nocobase/pull/3165)
- refactor(plugin-workflow): split workflow features into plugins [`#3115`](https://github.com/nocobase/nocobase/pull/3115)
- fix(bi): localization [`#3159`](https://github.com/nocobase/nocobase/pull/3159)
- fix: fix default value is not working in sutable [`#3155`](https://github.com/nocobase/nocobase/pull/3155)
- fix(plugin-workflow): fix destroy node locale [`#3150`](https://github.com/nocobase/nocobase/pull/3150)
- fix(lm): texts update hook after collection update [`#3151`](https://github.com/nocobase/nocobase/pull/3151)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.4 [`cf9ccfe`](https://github.com/nocobase/nocobase/commit/cf9ccfe4f9a5152590965efba0b663edc803229a)
- chore: update changelog [`32b9541`](https://github.com/nocobase/nocobase/commit/32b95414beab5150672ebba4e9f238c2a35b1158)
- fix(mock-collections): mock unique [`efb6580`](https://github.com/nocobase/nocobase/commit/efb6580eaf08d009b9822f470c403cca313f8259)

## [v0.17.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.2...v0.17.0-alpha.3) - 2023-12-06

### Merged

- fix: delete root docs [`#3145`](https://github.com/nocobase/nocobase/pull/3145)
- fix(lm): wrong version of migration [`#3148`](https://github.com/nocobase/nocobase/pull/3148)
- fix(lm): reserve i18n namespaces for plugins to avoid conflicts [`#3121`](https://github.com/nocobase/nocobase/pull/3121)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.3 [`eef101c`](https://github.com/nocobase/nocobase/commit/eef101c1778c540c43ef8a13b2c35b844e8cd49e)
- chore: update changelog [`b44a985`](https://github.com/nocobase/nocobase/commit/b44a9851a1456e8daa43205eaaa08676c702f00f)

## [v0.17.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.17.0-alpha.1...v0.17.0-alpha.2) - 2023-12-06

### Merged

- fix: default action schema settings [`#3146`](https://github.com/nocobase/nocobase/pull/3146)
- feat(bi): filter block for charts [`#2851`](https://github.com/nocobase/nocobase/pull/2851)
- fix: validate uid rule [`#3140`](https://github.com/nocobase/nocobase/pull/3140)
- refactor: collection template support forbidDeletion setting [`#3139`](https://github.com/nocobase/nocobase/pull/3139)
- fix: menu height bug [`#3137`](https://github.com/nocobase/nocobase/pull/3137)
- fix: menu height 50vh [`#3135`](https://github.com/nocobase/nocobase/pull/3135)
- refactor: uid validate rule [`#3134`](https://github.com/nocobase/nocobase/pull/3134)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.2 [`36fd488`](https://github.com/nocobase/nocobase/commit/36fd4881b26b99fe33b5bacdf7b502aa62d2ffb5)
- fix: load field when source collection not found [`95bec22`](https://github.com/nocobase/nocobase/commit/95bec2278ff2f53dfb1307e47bc8aca90d5a606a)
- chore: update changelog [`34e026c`](https://github.com/nocobase/nocobase/commit/34e026cec5742c1a1347f2969a03446fa98c44c3)

## [v0.17.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.16.0-alpha.6...v0.17.0-alpha.1) - 2023-12-04

### Merged

- refactor: new schema initializer and schema settings [`#2802`](https://github.com/nocobase/nocobase/pull/2802)

### Commits

- chore(versions): 😊 publish v0.17.0-alpha.1 [`1757a96`](https://github.com/nocobase/nocobase/commit/1757a96b51c7bb17f607b61467ab867e5add6567)
- chore: update changelog [`69abfc9`](https://github.com/nocobase/nocobase/commit/69abfc98327b36bbc6b7e225294835bb457518d6)

## [v0.16.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.16.0-alpha.5...v0.16.0-alpha.6) - 2023-12-04

### Merged

- fix: association field should support json field as title field [`#3129`](https://github.com/nocobase/nocobase/pull/3129)
- fix(client): allow match query case insensitive [`#3127`](https://github.com/nocobase/nocobase/pull/3127)
- fix(plugin-workflow): fix condition branch node finding logic (fix #3082) [`#3128`](https://github.com/nocobase/nocobase/pull/3128)
- refactor: url& sequence support availableType as string [`#3126`](https://github.com/nocobase/nocobase/pull/3126)
- refactor: view collection support json field [`#3125`](https://github.com/nocobase/nocobase/pull/3125)
- chore(users): remove deprecated code [`#3122`](https://github.com/nocobase/nocobase/pull/3122)
- refactor: collection template support configureActions [`#3123`](https://github.com/nocobase/nocobase/pull/3123)
- fix: onTemplateSuccess  undefined [`#3119`](https://github.com/nocobase/nocobase/pull/3119)

### Fixed

- fix(plugin-workflow): fix condition branch node finding logic (fix #3082) (#3128) [`#3082`](https://github.com/nocobase/nocobase/issues/3082)

### Commits

- chore(versions): 😊 publish v0.16.0-alpha.6 [`9d64430`](https://github.com/nocobase/nocobase/commit/9d644304c10be0f8404f2f3370a43d2dc00e8aed)
- chore: update changelog [`06ba3bf`](https://github.com/nocobase/nocobase/commit/06ba3bffcbdf1fd44f5b7b17fb83314a91d96a40)
- feat: improve mock records [`bfeaf45`](https://github.com/nocobase/nocobase/commit/bfeaf456b9d821f2fdb54ecd797da8d476d5f87a)

## [v0.16.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.16.0-alpha.4...v0.16.0-alpha.5) - 2023-11-30

### Merged

- fix(pm): create plugin bug [`#3117`](https://github.com/nocobase/nocobase/pull/3117)
- fix: fields options undefined [`#3116`](https://github.com/nocobase/nocobase/pull/3116)
- refactor: map field support connect as remote table field [`#3114`](https://github.com/nocobase/nocobase/pull/3114)
- fix(linkageRules): fix autorun [`#3105`](https://github.com/nocobase/nocobase/pull/3105)
- chore: sync collection after set collection fields [`#3112`](https://github.com/nocobase/nocobase/pull/3112)
- fix(client): adjust error message [`#3108`](https://github.com/nocobase/nocobase/pull/3108)
- fix(plugin-workflow): fix form event parse variables [`#3106`](https://github.com/nocobase/nocobase/pull/3106)
- chore: view primary key [`#3107`](https://github.com/nocobase/nocobase/pull/3107)
- fix: query view collection with primaryKey [`#3104`](https://github.com/nocobase/nocobase/pull/3104)
- fix: association data params missing appends [`#3103`](https://github.com/nocobase/nocobase/pull/3103)
- fix(plugin-api-doc): non-main application crashes [`#3100`](https://github.com/nocobase/nocobase/pull/3100)
- fix(linkageRules): avoid infinite loop [`#3095`](https://github.com/nocobase/nocobase/pull/3095)
- fix(bi): fix T-2643 [`#3101`](https://github.com/nocobase/nocobase/pull/3101)
- chore: cache effective snippets results in acl role [`#3102`](https://github.com/nocobase/nocobase/pull/3102)
- feat(database): support find with filter and where [`#3097`](https://github.com/nocobase/nocobase/pull/3097)
- fix(plugin-workflow): fix schedule trigger [`#3096`](https://github.com/nocobase/nocobase/pull/3096)
- fix: test db creator types [`#3094`](https://github.com/nocobase/nocobase/pull/3094)
- test: load through collection with primaryKeys [`#3093`](https://github.com/nocobase/nocobase/pull/3093)

### Commits

- chore(versions): 😊 publish v0.16.0-alpha.5 [`8977420`](https://github.com/nocobase/nocobase/commit/8977420eecb3f17140f7d55a73d8aebbb5aed7a4)
- chore: update changelog [`f4df696`](https://github.com/nocobase/nocobase/commit/f4df696bfa9fe4fb49509273058afe094b90ccee)
- fix(cli): unsafe shell command constructed from library input [`5ebd5d5`](https://github.com/nocobase/nocobase/commit/5ebd5d5c625742d65ad8c113336dfca4c14eb1f5)

## [v0.16.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.16.0-alpha.3...v0.16.0-alpha.4) - 2023-11-24

### Merged

- refactor: avoid errors [`#3091`](https://github.com/nocobase/nocobase/pull/3091)
- fix: avoid infinite loop [`#3089`](https://github.com/nocobase/nocobase/pull/3089)
- refactor: import interface  getOptions [`#3088`](https://github.com/nocobase/nocobase/pull/3088)
- fix: sql collection creation issue [`#3087`](https://github.com/nocobase/nocobase/pull/3087)
- refactor(plugin-workflow): show header of manual drawer [`#3085`](https://github.com/nocobase/nocobase/pull/3085)
- fix: should load association data in subform [`#3083`](https://github.com/nocobase/nocobase/pull/3083)
- fix: view collection json field rendering error [`#3077`](https://github.com/nocobase/nocobase/pull/3077)
- fix: m2o association field should support pattern configure [`#3074`](https://github.com/nocobase/nocobase/pull/3074)
- fix: subform disappears [`#3073`](https://github.com/nocobase/nocobase/pull/3073)
- fix(plugin-mobile-client): page content disappears when tab is disabled [`#3059`](https://github.com/nocobase/nocobase/pull/3059)
- fix(client): fix variable input style when disabled [`#3071`](https://github.com/nocobase/nocobase/pull/3071)
- fix: update inherited collection performance issue [`#3070`](https://github.com/nocobase/nocobase/pull/3070)
- fix(linkage): avoid infinite loop [`#3069`](https://github.com/nocobase/nocobase/pull/3069)
- fix: add i18n resources after server app load [`#3068`](https://github.com/nocobase/nocobase/pull/3068)
- fix: linkage rule in action set both disable and enable [`#3065`](https://github.com/nocobase/nocobase/pull/3065)

### Commits

- chore(versions): 😊 publish v0.16.0-alpha.4 [`ffb300d`](https://github.com/nocobase/nocobase/commit/ffb300d357b2a8d1e63fcab1ba44cbf9a205999f)
- chore: update changelog [`3a0a0d1`](https://github.com/nocobase/nocobase/commit/3a0a0d13e9d079b9755a93151dd019978382562e)
- fix: dev plugins path [`992f2d4`](https://github.com/nocobase/nocobase/commit/992f2d442de0f04d0c87bb2b07fb46d704df10a7)

## [v0.16.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.16.0-alpha.1...v0.16.0-alpha.3) - 2023-11-20

### Merged

- feat: node &gt;= 18 [`#3066`](https://github.com/nocobase/nocobase/pull/3066)

### Commits

- chore(versions): 😊 publish v0.16.0-alpha.3 [`cba9679`](https://github.com/nocobase/nocobase/commit/cba967933e4b7ccf91b306230e6ea5be5a3e1c7b)
- chore: update changelog [`408ee49`](https://github.com/nocobase/nocobase/commit/408ee49a58f6cbc4a2c0c1719f73a5517ac8906c)

## [v0.16.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.15.0-alpha.4...v0.16.0-alpha.1) - 2023-11-20

### Merged

- refactor(cache): improve cache [`#3004`](https://github.com/nocobase/nocobase/pull/3004)
- fix: local storage base url [`#3063`](https://github.com/nocobase/nocobase/pull/3063)
- feat: show table definition [`#3061`](https://github.com/nocobase/nocobase/pull/3061)
- feat: mariadb support [`#3052`](https://github.com/nocobase/nocobase/pull/3052)
- fix(plugin-workflow): client minor fixes [`#3062`](https://github.com/nocobase/nocobase/pull/3062)
- chore: view inference [`#3060`](https://github.com/nocobase/nocobase/pull/3060)
- fix: sort by association collection [`#3058`](https://github.com/nocobase/nocobase/pull/3058)

### Commits

- chore(versions): 😊 publish v0.16.0-alpha.1 [`91053b3`](https://github.com/nocobase/nocobase/commit/91053b31efc1038b710deebc874dab4ac5d797f3)
- chore: update changelog [`635dcfd`](https://github.com/nocobase/nocobase/commit/635dcfdbd5873479d1e191faacf956c5f9f25411)

## [v0.15.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.15.0-alpha.3...v0.15.0-alpha.4) - 2023-11-18

### Merged

- fix(calendar): cannot switch week in week mode [`#3057`](https://github.com/nocobase/nocobase/pull/3057)
- feat(e2e): add mockCollections [`#3054`](https://github.com/nocobase/nocobase/pull/3054)
- fix: association table block overwirtten by default values in popver action [`#3056`](https://github.com/nocobase/nocobase/pull/3056)
- feat: register collection sync logic [`#3055`](https://github.com/nocobase/nocobase/pull/3055)
- fix: tableoid should pointed to target collection in assciation field data scope config [`#3053`](https://github.com/nocobase/nocobase/pull/3053)

### Commits

- chore(versions): 😊 publish v0.15.0-alpha.4 [`ef1b9db`](https://github.com/nocobase/nocobase/commit/ef1b9db2a991eef61e03407439e52458ec2d1b3d)
- chore: update changelog [`54caf05`](https://github.com/nocobase/nocobase/commit/54caf05ba48bbb1acf8fe5c56ba2a8614d714faa)
- fix: import @nocobase/utils/client [`4a26b9b`](https://github.com/nocobase/nocobase/commit/4a26b9b20853961fc9ec7035dbab5e61f5ca60fa)

## [v0.15.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.15.0-alpha.2...v0.15.0-alpha.3) - 2023-11-16

### Merged

- feat: e2e commands [`#3042`](https://github.com/nocobase/nocobase/pull/3042)
- Revert "chore: hide linkage rule option in some buttons (#3046)" [`#3051`](https://github.com/nocobase/nocobase/pull/3051)
- chore: hide linkage rule option in some buttons [`#3046`](https://github.com/nocobase/nocobase/pull/3046)
- feat: collection factory [`#3047`](https://github.com/nocobase/nocobase/pull/3047)
- fix: association block  filter params [`#3039`](https://github.com/nocobase/nocobase/pull/3039)
- fix(plugin-fm): fix error log [`#3038`](https://github.com/nocobase/nocobase/pull/3038)
- refactor: findSchema should omit AssociationField.Viewer [`#3037`](https://github.com/nocobase/nocobase/pull/3037)
- fix: fix display association fields with subform [`#3036`](https://github.com/nocobase/nocobase/pull/3036)
- test: optimize command [`#3030`](https://github.com/nocobase/nocobase/pull/3030)
- fix: attachment field in m2m association field report error whwen setting required [`#3031`](https://github.com/nocobase/nocobase/pull/3031)

### Commits

- chore(versions): 😊 publish v0.15.0-alpha.3 [`60112aa`](https://github.com/nocobase/nocobase/commit/60112aae62801a98969ebafe6af082f005555328)
- chore: update changelog [`13be8d0`](https://github.com/nocobase/nocobase/commit/13be8d012f69367f141dfa0bf6193c7f909aa2cd)

## [v0.15.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.15.0-alpha.1...v0.15.0-alpha.2) - 2023-11-13

### Merged

- fix: antd table ref bug [`#3029`](https://github.com/nocobase/nocobase/pull/3029)
- fix: improve plugin settings code [`#3028`](https://github.com/nocobase/nocobase/pull/3028)
- fix: plugin settings manager Component optional & delete isBookmark [`#3027`](https://github.com/nocobase/nocobase/pull/3027)
- fix(plugin-workflow): fix workflow title in binding workflow configuration not showing [`#3026`](https://github.com/nocobase/nocobase/pull/3026)

### Commits

- chore(versions): 😊 publish v0.15.0-alpha.2 [`b597aec`](https://github.com/nocobase/nocobase/commit/b597aec1dc15d6c7709e2621961f7c2e793d5a61)
- chore: update changelog [`9dae34a`](https://github.com/nocobase/nocobase/commit/9dae34a613b5da2e138873d398f9727ae28ff705)

## [v0.15.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.8...v0.15.0-alpha.1) - 2023-11-13

### Merged

- refactor: plugin settings manager [`#2712`](https://github.com/nocobase/nocobase/pull/2712)
- fix: fix regular of variable [`#3024`](https://github.com/nocobase/nocobase/pull/3024)
- fix: should load association data in subform [`#3020`](https://github.com/nocobase/nocobase/pull/3020)
- fix: association field in reference block   failed to append [`#2998`](https://github.com/nocobase/nocobase/pull/2998)
- fix: relational data should be loaded correctly on first render [`#3016`](https://github.com/nocobase/nocobase/pull/3016)
- feat: plugin-mock-collections [`#2988`](https://github.com/nocobase/nocobase/pull/2988)
- Update pull_request_template.md [`#3013`](https://github.com/nocobase/nocobase/pull/3013)
- fix: should lazy load association data in subform [`#3012`](https://github.com/nocobase/nocobase/pull/3012)
- fix(import): remove commas from numbers [`#3011`](https://github.com/nocobase/nocobase/pull/3011)
- fix(static-server): directoryListing: false [`#3010`](https://github.com/nocobase/nocobase/pull/3010)
- fix(theme): text color of page header right side [`#3008`](https://github.com/nocobase/nocobase/pull/3008)
- fix: menu failed to design while menu title is empty string [`#2999`](https://github.com/nocobase/nocobase/pull/2999)
- fix(plugin-workflow): add missed component [`#3007`](https://github.com/nocobase/nocobase/pull/3007)
- fix: detail block has no data [`#3003`](https://github.com/nocobase/nocobase/pull/3003)
- refactor(plugin-workflow): allow to use function for values when creating node [`#3002`](https://github.com/nocobase/nocobase/pull/3002)
- fix(plugin-workflow): fix configuration drawer close logic [`#3001`](https://github.com/nocobase/nocobase/pull/3001)
- chore: add aria label for workflow table [`#2995`](https://github.com/nocobase/nocobase/pull/2995)
- fix: select item can not be selected in connecting data blocks [`#2993`](https://github.com/nocobase/nocobase/pull/2993)
- chore: optimize error message [`#2992`](https://github.com/nocobase/nocobase/pull/2992)
- refactor(plugin-workflow): change  to function [`#2991`](https://github.com/nocobase/nocobase/pull/2991)
- fix(plugin-workflow): fix loop scope variable [`#2989`](https://github.com/nocobase/nocobase/pull/2989)
- chore: optimize error message [`#2985`](https://github.com/nocobase/nocobase/pull/2985)
- fix(formula-field): formula field failed to real-time evaluating and support sub-form [`#2983`](https://github.com/nocobase/nocobase/pull/2983)
- fix:  association select should not clearing after config data scope [`#2984`](https://github.com/nocobase/nocobase/pull/2984)
- fix(plugin-workflow): fix node form values when closed [`#2978`](https://github.com/nocobase/nocobase/pull/2978)
- fix: button of details is not refresh when updating record [`#2977`](https://github.com/nocobase/nocobase/pull/2977)
- fix: docs ci [`#2976`](https://github.com/nocobase/nocobase/pull/2976)
- fix: avoid infinite loop [`#2974`](https://github.com/nocobase/nocobase/pull/2974)
- feat: drop table with cascade option [`#2973`](https://github.com/nocobase/nocobase/pull/2973)
- fix: client docs [`#2965`](https://github.com/nocobase/nocobase/pull/2965)
- fix(variable): compat $date [`#2971`](https://github.com/nocobase/nocobase/pull/2971)
- fix: add child action should omit children data [`#2969`](https://github.com/nocobase/nocobase/pull/2969)
- chore: destory collection in share collection plugin [`#2968`](https://github.com/nocobase/nocobase/pull/2968)
- fix: application bug [`#2958`](https://github.com/nocobase/nocobase/pull/2958)
- perf: avoid page lag or stuttering [`#2964`](https://github.com/nocobase/nocobase/pull/2964)
- fix: percent field component should support decimal point [`#2966`](https://github.com/nocobase/nocobase/pull/2966)
- refactor: remove useless code [`#2961`](https://github.com/nocobase/nocobase/pull/2961)
- test: client ui test [`#2736`](https://github.com/nocobase/nocobase/pull/2736)
- fix: import action should not visible when view collection not editable [`#2957`](https://github.com/nocobase/nocobase/pull/2957)
- refactor(plugin-workflow): add exports for client [`#2960`](https://github.com/nocobase/nocobase/pull/2960)
- fix(plugin-workflow): fix canvas style [`#2959`](https://github.com/nocobase/nocobase/pull/2959)
- fix(plugin-workflow): fix variables and form changed [`#2955`](https://github.com/nocobase/nocobase/pull/2955)
- test(custom-request): update test case, avoid failed [`#2954`](https://github.com/nocobase/nocobase/pull/2954)
- fix: create collection report error [`#2953`](https://github.com/nocobase/nocobase/pull/2953)
- fix: target collection pointed to by tableoid is incorrect [`#2952`](https://github.com/nocobase/nocobase/pull/2952)
- feat(plugin-workflow): add zoomer for workflow canvas [`#2951`](https://github.com/nocobase/nocobase/pull/2951)
- feat(map-plugin): supports connecting each point into a line [`#2216`](https://github.com/nocobase/nocobase/pull/2216)
- fix(calendar): render data of next month is incorrect [`#2942`](https://github.com/nocobase/nocobase/pull/2942)
- fix(custom-request): parsed not working when the value of the variable is of type o2m. [`#2926`](https://github.com/nocobase/nocobase/pull/2926)
- fix: improve local storage options [`#2943`](https://github.com/nocobase/nocobase/pull/2943)

### Commits

- chore(versions): 😊 publish v0.15.0-alpha.1 [`29457cb`](https://github.com/nocobase/nocobase/commit/29457cb2bc4e795ec21fa25566fda37b7e36cd9a)
- chore: update changelog [`3b2ad2f`](https://github.com/nocobase/nocobase/commit/3b2ad2fa9fd2d07c029a008076012498e1a4d6db)
- fix: env APPEND_PRESET_LOCAL_PLUGINS [`5c93750`](https://github.com/nocobase/nocobase/commit/5c937500b7ca62ec4c096c5a697f703d9d419097)

## [v0.14.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.7...v0.14.0-alpha.8) - 2023-11-01

### Merged

- fix(e2e): APP_BASE_URL [`#2938`](https://github.com/nocobase/nocobase/pull/2938)
- refactor(variable): rename [`#2937`](https://github.com/nocobase/nocobase/pull/2937)
- fix(plugin-workflow): ajdust style [`#2934`](https://github.com/nocobase/nocobase/pull/2934)
- fix: theme migration error [`#2929`](https://github.com/nocobase/nocobase/pull/2929)
- refactor(plugin-workflow): add end property to branch [`#2928`](https://github.com/nocobase/nocobase/pull/2928)
- fix(plugin-workflow): fix migration [`#2927`](https://github.com/nocobase/nocobase/pull/2927)
- fix: app quickstart [`#2921`](https://github.com/nocobase/nocobase/pull/2921)
- chore(theme-editor): add migration [`#2367`](https://github.com/nocobase/nocobase/pull/2367)
- feat(e2e): add test.pgOnly [`#2923`](https://github.com/nocobase/nocobase/pull/2923)
- chore: optimize locators [`#2833`](https://github.com/nocobase/nocobase/pull/2833)
- chore(e2e): based postgres in CI to run e2e [`#2924`](https://github.com/nocobase/nocobase/pull/2924)
- refactor(plugin-workflow): adjust branch styles [`#2922`](https://github.com/nocobase/nocobase/pull/2922)
- feat: framework benchmark [`#2915`](https://github.com/nocobase/nocobase/pull/2915)
- refactor: reset form values after create action [`#2905`](https://github.com/nocobase/nocobase/pull/2905)
- chore: upgrade @formily/antd-v5 [`#2920`](https://github.com/nocobase/nocobase/pull/2920)
- fix(core): print not work when has sub-form or sub-details [`#2852`](https://github.com/nocobase/nocobase/pull/2852)
- fix: association block was not associated after adding data [`#2907`](https://github.com/nocobase/nocobase/pull/2907)
- feat: plugin-disable-pm-add-online [`#2918`](https://github.com/nocobase/nocobase/pull/2918)
- fix: error when post create action with emtpy value [`#2916`](https://github.com/nocobase/nocobase/pull/2916)
- fix: removed plugins, no longer added when upgrading [`#2917`](https://github.com/nocobase/nocobase/pull/2917)
- refactor(plugin-workflow): change to use node key for variables [`#2909`](https://github.com/nocobase/nocobase/pull/2909)
- fix: disappearing of fixed-block option [`#2914`](https://github.com/nocobase/nocobase/pull/2914)
- fix: linkage rules cause abnormal field display [`#2913`](https://github.com/nocobase/nocobase/pull/2913)
- fix: useRecord [`#2911`](https://github.com/nocobase/nocobase/pull/2911)
- fix: useValuesFromRecord with cloneDeep [`#2902`](https://github.com/nocobase/nocobase/pull/2902)
- fix: app fix at initialized state [`#2908`](https://github.com/nocobase/nocobase/pull/2908)
- fix: cascadeSelect title label display error [`#2904`](https://github.com/nocobase/nocobase/pull/2904)
- fix: foreignKey undefined in association field [`#2903`](https://github.com/nocobase/nocobase/pull/2903)
- fix: linkage rule memory overflow [`#2899`](https://github.com/nocobase/nocobase/pull/2899)
- fix: remove search by packageName [`#2901`](https://github.com/nocobase/nocobase/pull/2901)
- refactor(plugin-workflow): add isAvailable check for adding node [`#2898`](https://github.com/nocobase/nocobase/pull/2898)
- fix: fileManager selector should be radio when not allow multiple [`#2884`](https://github.com/nocobase/nocobase/pull/2884)
- fix(plugin-workflow): fix schedule workflow under normal multi-apps [`#2896`](https://github.com/nocobase/nocobase/pull/2896)
- chore: expose auth manager option in application [`#2894`](https://github.com/nocobase/nocobase/pull/2894)
- fix(plugin-workflow): fix cycling association stackoverflow [`#2892`](https://github.com/nocobase/nocobase/pull/2892)
- chore: create sub app db with context [`#2891`](https://github.com/nocobase/nocobase/pull/2891)
- refactor(plugin-workflow): add property to determine workflow type triggerable on ui [`#2890`](https://github.com/nocobase/nocobase/pull/2890)
- fix(variable): compat old variable names [`#2889`](https://github.com/nocobase/nocobase/pull/2889)
- fix: disappearing of sub-form data [`#2888`](https://github.com/nocobase/nocobase/pull/2888)
- fix(variable): fix currentObject [`#2887`](https://github.com/nocobase/nocobase/pull/2887)
- refactor: assocation select file clear linkage [`#2885`](https://github.com/nocobase/nocobase/pull/2885)
- fix(plugin-custom-request): improve x button style and afterSuccess not work when manualClose is enable [`#2882`](https://github.com/nocobase/nocobase/pull/2882)
- fix(variable): make all fields of currentForm and currentObject variable optional [`#2878`](https://github.com/nocobase/nocobase/pull/2878)
- fix(plugin-workflow): fix lang [`#2881`](https://github.com/nocobase/nocobase/pull/2881)
- fix: non UI configured states should only display corresponding inhreited collection block [`#2879`](https://github.com/nocobase/nocobase/pull/2879)
- fix: assocition select rendering error in create mode [`#2880`](https://github.com/nocobase/nocobase/pull/2880)
- fix: action linkage not work in detail block [`#2875`](https://github.com/nocobase/nocobase/pull/2875)
- fix: record picker did not refresh list after adding data [`#2877`](https://github.com/nocobase/nocobase/pull/2877)
- fix: select field incorrect rendering in association field block [`#2876`](https://github.com/nocobase/nocobase/pull/2876)
- feat(variable): add current parent record [`#2857`](https://github.com/nocobase/nocobase/pull/2857)
- fix(plugin-custom-request): variables not work in form block [`#2873`](https://github.com/nocobase/nocobase/pull/2873)
- fix: remote plugin name [`#2872`](https://github.com/nocobase/nocobase/pull/2872)
- feat(database): sync false option [`#2864`](https://github.com/nocobase/nocobase/pull/2864)
- fix(client): fix varaible textarea setRange bug [`#2862`](https://github.com/nocobase/nocobase/pull/2862)
- fix: after successful submission failed to config redirectTo [`#2867`](https://github.com/nocobase/nocobase/pull/2867)
- fix: m2o association field should not allow sub-table as field component [`#2865`](https://github.com/nocobase/nocobase/pull/2865)
- fix(plugin-sequence): avoid invalid value from `ArrayTable.useRecord()` [`#2859`](https://github.com/nocobase/nocobase/pull/2859)
- fix: field in detail block should not allow config default value [`#2858`](https://github.com/nocobase/nocobase/pull/2858)
- chore: ci yarn cache [`#2853`](https://github.com/nocobase/nocobase/pull/2853)
- feat(ci): run backend tests concurrently [`#2815`](https://github.com/nocobase/nocobase/pull/2815)
- feat(custom-request): improve x button of variable [`#2829`](https://github.com/nocobase/nocobase/pull/2829)
- docs(plugin-api-keys): add warning for API_KEY env [`#2847`](https://github.com/nocobase/nocobase/pull/2847)
- refactor(client): add exports [`#2846`](https://github.com/nocobase/nocobase/pull/2846)
- fix(variable): should have currentObject in sub-blocks [`#2823`](https://github.com/nocobase/nocobase/pull/2823)
- fix: revert linkage rules [`#2821`](https://github.com/nocobase/nocobase/pull/2821)
- fix: should not display currentRecord in creation form block [`#2814`](https://github.com/nocobase/nocobase/pull/2814)
- fix(plugin-workflow): fix lang [`#2844`](https://github.com/nocobase/nocobase/pull/2844)
- fix: codesanbox bug [`#2842`](https://github.com/nocobase/nocobase/pull/2842)
- revert:association field log [`#2840`](https://github.com/nocobase/nocobase/pull/2840)
- fix: association field in assign field should set title field as collection field config [`#2839`](https://github.com/nocobase/nocobase/pull/2839)
- fix: version source [`#2836`](https://github.com/nocobase/nocobase/pull/2836)
- fix(plugin-workflow): fix action order in workflow list [`#2835`](https://github.com/nocobase/nocobase/pull/2835)
- fix(file-manager): improve initialization logic [`#2834`](https://github.com/nocobase/nocobase/pull/2834)
- feat: support filter blocks in select record drawer [`#2828`](https://github.com/nocobase/nocobase/pull/2828)
- fix: remote plugin [`#2831`](https://github.com/nocobase/nocobase/pull/2831)
- fix: fix auto-close dialog [`#2825`](https://github.com/nocobase/nocobase/pull/2825)
- feat(auth): add global auth token provider [`#2824`](https://github.com/nocobase/nocobase/pull/2824)
- feat(file-manager): support configuring thumbnail rules [`#2810`](https://github.com/nocobase/nocobase/pull/2810)
- feat(client): add disabled for initializer switch and undeletable for action settings [`#2820`](https://github.com/nocobase/nocobase/pull/2820)
- refactor(plugin-workflow): adjust ui and client api [`#2817`](https://github.com/nocobase/nocobase/pull/2817)
- fix(client): fix action component warning [`#2818`](https://github.com/nocobase/nocobase/pull/2818)
- fix: multiple select should assigned null after clear value [`#2822`](https://github.com/nocobase/nocobase/pull/2822)
- feat(plugin-custom-request): support better custom-request [`#2536`](https://github.com/nocobase/nocobase/pull/2536)
- fix: cascadeselect report error in m2m association field [`#2819`](https://github.com/nocobase/nocobase/pull/2819)
- fix(plugin-workflow): ignore queuing executions which workflow has been deleted [`#2808`](https://github.com/nocobase/nocobase/pull/2808)
- fix: assign field modal cantnot open [`#2807`](https://github.com/nocobase/nocobase/pull/2807)
- fix(auth): SSO issues [`#2733`](https://github.com/nocobase/nocobase/pull/2733)
- fix: data scope report error with invalid variables [`#2811`](https://github.com/nocobase/nocobase/pull/2811)
- style: import action modal formlayout [`#2809`](https://github.com/nocobase/nocobase/pull/2809)
- fix: option should clear when data scope change [`#2800`](https://github.com/nocobase/nocobase/pull/2800)
- test: confirm the feasibility of e2e test cases [`#2799`](https://github.com/nocobase/nocobase/pull/2799)
- fix: the input box displayed should correspond to the field type [`#2805`](https://github.com/nocobase/nocobase/pull/2805)
- fix(bi): query with `limit` [`#2803`](https://github.com/nocobase/nocobase/pull/2803)
- fix: record picker cannot select data when editing [`#2798`](https://github.com/nocobase/nocobase/pull/2798)
- feat: add measure execution function [`#2801`](https://github.com/nocobase/nocobase/pull/2801)
- chore(bi): complete chart api [`#2771`](https://github.com/nocobase/nocobase/pull/2771)
- fix: fix the wrong way to determine form type [`#2787`](https://github.com/nocobase/nocobase/pull/2787)
- fix: bug [`#2797`](https://github.com/nocobase/nocobase/pull/2797)
- fix: should not show loading when children is enpty in menu [`#2796`](https://github.com/nocobase/nocobase/pull/2796)
- fix: should save operators [`#2794`](https://github.com/nocobase/nocobase/pull/2794)
- fix(client): fix undefined field method on button [`#2795`](https://github.com/nocobase/nocobase/pull/2795)
- fix: data scope linkage in association field [`#2786`](https://github.com/nocobase/nocobase/pull/2786)
- chore(e2e): delete collectionName key [`#2783`](https://github.com/nocobase/nocobase/pull/2783)
- fix(client): fix rendering cause range bug [`#2785`](https://github.com/nocobase/nocobase/pull/2785)
- chore(collection-manager): Throw an error when the value of foreignKey is the same as otherKey [`#2780`](https://github.com/nocobase/nocobase/pull/2780)
- fix: percent value invalid [`#2782`](https://github.com/nocobase/nocobase/pull/2782)
- fix: percent value should divide by 100 [`#2781`](https://github.com/nocobase/nocobase/pull/2781)
- Revert "fix(client): fix rerendering cause range bug (#2770)" [`#2779`](https://github.com/nocobase/nocobase/pull/2779)
- refactor(e2e):  support batch creation of collections [`#2778`](https://github.com/nocobase/nocobase/pull/2778)
- fix: field history with reverse field [`#2776`](https://github.com/nocobase/nocobase/pull/2776)
- fix: should allow to set default value in relationship form block [`#2777`](https://github.com/nocobase/nocobase/pull/2777)
- fix(plugin-workflow): fix toJSON type check [`#2772`](https://github.com/nocobase/nocobase/pull/2772)
- fix: create collections with multiple records [`#2753`](https://github.com/nocobase/nocobase/pull/2753)
- fix(client): fix rerendering cause range bug [`#2770`](https://github.com/nocobase/nocobase/pull/2770)
- fix(default): should allow to set default value in relationship form block [`#2774`](https://github.com/nocobase/nocobase/pull/2774)
- fix(percent): percent failed to input 0 [`#2769`](https://github.com/nocobase/nocobase/pull/2769)
- refactor(duplicate action):duplicate fields error when change duplicate mode & support unselect all  [`#2768`](https://github.com/nocobase/nocobase/pull/2768)
- feat(gateway): extend app selector as middleware [`#2761`](https://github.com/nocobase/nocobase/pull/2761)
- fix(expression): should reset lastIndex of regular [`#2767`](https://github.com/nocobase/nocobase/pull/2767)
- refactor(plugin-workflow): add new status for 'retry needed' scenarios [`#2765`](https://github.com/nocobase/nocobase/pull/2765)
- fix(variable): should not return undefined when parsing 0 [`#2766`](https://github.com/nocobase/nocobase/pull/2766)
- fix(variable): should not disable options in expression [`#2764`](https://github.com/nocobase/nocobase/pull/2764)
- fix(subtable): should not have a value by default and fix key of table [`#2763`](https://github.com/nocobase/nocobase/pull/2763)
- style: fix PageHeader [`#2760`](https://github.com/nocobase/nocobase/pull/2760)
- fix(graph-collection-manager):graph collection cannot open edit modal [`#2759`](https://github.com/nocobase/nocobase/pull/2759)
- test(e2e): add a test for check table row [`#2757`](https://github.com/nocobase/nocobase/pull/2757)
- style: list block style improve [`#2755`](https://github.com/nocobase/nocobase/pull/2755)

### Commits

- Delete docs/tr-TR directory [`3fe6265`](https://github.com/nocobase/nocobase/commit/3fe6265269c7640a726d337c33adbfc75279022e)
- test: 确认e2e测试用例可行性 [`ef1b07e`](https://github.com/nocobase/nocobase/commit/ef1b07e6a300ece0a1b1edfce14a5d59f9875e4c)
- Revert "fix(default): should allow to set default value in relationship form block (#2774)" [`88807b3`](https://github.com/nocobase/nocobase/commit/88807b3cdf384ec2e99bffcfb7d69adcb77ff84d)

## [v0.14.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.6...v0.14.0-alpha.7) - 2023-10-07

### Merged

- feat(variable): lazy load association fields [`#2382`](https://github.com/nocobase/nocobase/pull/2382)
- chore(e2e): make stability [`#2751`](https://github.com/nocobase/nocobase/pull/2751)
- fix(plugin-workflow): fix context data of form trigger [`#2749`](https://github.com/nocobase/nocobase/pull/2749)
- refactor(auth): OIDC, SAML auth switch popup to redirectction [`#2737`](https://github.com/nocobase/nocobase/pull/2737)
- chore(database): clean invalid associations in collection model when set field failed [`#2720`](https://github.com/nocobase/nocobase/pull/2720)
- feat: support e2e [`#2624`](https://github.com/nocobase/nocobase/pull/2624)
- feat(application): cron job in application [`#2730`](https://github.com/nocobase/nocobase/pull/2730)
- refactor(bi): improve chart frontend api [`#2721`](https://github.com/nocobase/nocobase/pull/2721)
- chore(multi-app-manager): add sub app upgrade handler [`#2728`](https://github.com/nocobase/nocobase/pull/2728)
- fix(association-field): sub-table cannot move [`#2727`](https://github.com/nocobase/nocobase/pull/2727)
- fix(plugin-workflow): fix assignees and aggregate variable [`#2725`](https://github.com/nocobase/nocobase/pull/2725)
- refactor: file association field should default to using preview field as title field [`#2718`](https://github.com/nocobase/nocobase/pull/2718)
- refactor: view collection support jsonb [`#2719`](https://github.com/nocobase/nocobase/pull/2719)
- perf: improve the UX of SchemaInitializer [`#2666`](https://github.com/nocobase/nocobase/pull/2666)
- fix: fileManager did not close drawer after selecting files [`#2716`](https://github.com/nocobase/nocobase/pull/2716)
- fix: association block should not close drawer after deleting data [`#2717`](https://github.com/nocobase/nocobase/pull/2717)
- fix: action linkage rule not effect in tree collection [`#2713`](https://github.com/nocobase/nocobase/pull/2713)
- fix: useAssociationNames [`#2714`](https://github.com/nocobase/nocobase/pull/2714)
- refactor: attachment field support size config [`#2552`](https://github.com/nocobase/nocobase/pull/2552)
- feat: association support select cascade for tree collection field [`#2514`](https://github.com/nocobase/nocobase/pull/2514)
- feat(database): append tree parent recursively [`#2573`](https://github.com/nocobase/nocobase/pull/2573)
- feat: support load belongs to association with collection that without primary key [`#2529`](https://github.com/nocobase/nocobase/pull/2529)
- fix(gateway): should not refresh when application start from error recover [`#2711`](https://github.com/nocobase/nocobase/pull/2711)
- feat(db): add sql collection [`#2419`](https://github.com/nocobase/nocobase/pull/2419)
- fix: inherited collection failed to select [`#2710`](https://github.com/nocobase/nocobase/pull/2710)
- fix: form-data-template failed to clear option [`#2709`](https://github.com/nocobase/nocobase/pull/2709)
- fix: tableoid options value of association field in filter is incorrect [`#2705`](https://github.com/nocobase/nocobase/pull/2705)
- fix:  saving method of association field creation button is not effect [`#2706`](https://github.com/nocobase/nocobase/pull/2706)
- fix: gen tsconfig.paths.json  bug [`#2708`](https://github.com/nocobase/nocobase/pull/2708)
- fix(plugin-workflow): fix exporting types [`#2707`](https://github.com/nocobase/nocobase/pull/2707)
- fix(plugin-workflow): fix parallel bug in loop [`#2703`](https://github.com/nocobase/nocobase/pull/2703)

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.7 [`384cc1c`](https://github.com/nocobase/nocobase/commit/384cc1c56c4e78be6ba158b9c141c66c4149e9cd)
- Revert "refactor(auth): OIDC, SAML auth switch popup to redirectction (#2737)" [`301a85d`](https://github.com/nocobase/nocobase/commit/301a85d7671d42670ceba40d97de21283f9eb617)
- feat: update docs [`dd53633`](https://github.com/nocobase/nocobase/commit/dd536331a9853a509a51adcc41c7cfbfe68efcbd)

## [v0.14.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.4...v0.14.0-alpha.6) - 2023-09-22

### Merged

- refactor(plugin-workflow): add client exports [`#2702`](https://github.com/nocobase/nocobase/pull/2702)
- refactor: view collection support add m2o association field [`#2422`](https://github.com/nocobase/nocobase/pull/2422)
- fix: fix operator called  of date field [`#2701`](https://github.com/nocobase/nocobase/pull/2701)
- fix: deep level association field adding error [`#2700`](https://github.com/nocobase/nocobase/pull/2700)
- fix(cli): fix template file mode [`#2697`](https://github.com/nocobase/nocobase/pull/2697)

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.5 [`3b0b648`](https://github.com/nocobase/nocobase/commit/3b0b6483c221ebec4c7c1992c8002f0e004ae738)
- chore(versions): 😊 publish v0.14.0-alpha.6 [`8eb6344`](https://github.com/nocobase/nocobase/commit/8eb634459d1f0fd2e1d41f453912b1c62a236de3)
- chore(versions): 😊 publish v0.14.0-alpha.5 [`bffa53a`](https://github.com/nocobase/nocobase/commit/bffa53a04e032ade25d794761a6cb8e3ff95f451)

## [v0.14.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.3...v0.14.0-alpha.4) - 2023-09-21

### Merged

- fix: collection schema not exists [`#2669`](https://github.com/nocobase/nocobase/pull/2669)
- fix: core doc filter params [`#2695`](https://github.com/nocobase/nocobase/pull/2695)
- feat: add testid [`#2434`](https://github.com/nocobase/nocobase/pull/2434)
- feat(database): support read ssl file in database config [`#2689`](https://github.com/nocobase/nocobase/pull/2689)
- test: should correctly parse the command options [`#2688`](https://github.com/nocobase/nocobase/pull/2688)
- fix: build bug [`#2685`](https://github.com/nocobase/nocobase/pull/2685)
- feat(database): perform data validation before the update/create operation [`#2681`](https://github.com/nocobase/nocobase/pull/2681)
- fix: build bug [`#2683`](https://github.com/nocobase/nocobase/pull/2683)
- refactor: association block acl improve [`#2682`](https://github.com/nocobase/nocobase/pull/2682)
- refactor: acl collection field provider [`#2679`](https://github.com/nocobase/nocobase/pull/2679)
- chore: test [`#2677`](https://github.com/nocobase/nocobase/pull/2677)
- style:form-item style improve [`#2678`](https://github.com/nocobase/nocobase/pull/2678)
- fix(acl): association field acl check error [`#2675`](https://github.com/nocobase/nocobase/pull/2675)
- chore(command): set command handle by ipc server or not [`#2660`](https://github.com/nocobase/nocobase/pull/2660)
- fix(auth): user role not found [`#2674`](https://github.com/nocobase/nocobase/pull/2674)
- fix: file association field cannot set file manager as field component [`#2672`](https://github.com/nocobase/nocobase/pull/2672)
- feat(database): database connecting backoff [`#2668`](https://github.com/nocobase/nocobase/pull/2668)
- refactor(plugin-workflow): adjust code [`#2663`](https://github.com/nocobase/nocobase/pull/2663)
- fix(auth): change password issue of basic auth [`#2662`](https://github.com/nocobase/nocobase/pull/2662)
- fix: interface  group undefined [`#2656`](https://github.com/nocobase/nocobase/pull/2656)
- refactor: view collection float type field supports number and percent [`#2653`](https://github.com/nocobase/nocobase/pull/2653)
- fix: template tsconfig paths [`#2652`](https://github.com/nocobase/nocobase/pull/2652)
- fix: improve build [`#2643`](https://github.com/nocobase/nocobase/pull/2643)
- fix(share-collection): sync plugins when install sub app [`#2650`](https://github.com/nocobase/nocobase/pull/2650)
- fix: fix quarter variables [`#2648`](https://github.com/nocobase/nocobase/pull/2648)
- fix: filterable undefined [`#2646`](https://github.com/nocobase/nocobase/pull/2646)
- fix(cli): reset command options [`#2645`](https://github.com/nocobase/nocobase/pull/2645)

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.4 [`d20398f`](https://github.com/nocobase/nocobase/commit/d20398f73f80ffdc77a72ab53beb1cf1f247bc84)
- feat: update readme.md [`a484e89`](https://github.com/nocobase/nocobase/commit/a484e891aa55e0860e7221ce775f8d2c95a4e31d)
- fix: db.sync [`282645e`](https://github.com/nocobase/nocobase/commit/282645ed8b215713ca19a9f845d7b702e7434a96)

## [v0.14.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.2...v0.14.0-alpha.3) - 2023-09-13

### Merged

- fix: plugin symbol link with `dir` type [`#2640`](https://github.com/nocobase/nocobase/pull/2640)
- style: collection category style improve [`#2638`](https://github.com/nocobase/nocobase/pull/2638)
- style: collection category style improve [`#2637`](https://github.com/nocobase/nocobase/pull/2637)
- chore: should update belongs to many through table when it is a view [`#2635`](https://github.com/nocobase/nocobase/pull/2635)

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.3 [`6058850`](https://github.com/nocobase/nocobase/commit/6058850db1d177bcacfebabdf0566e506021be53)
- feat: update docs [`3e87ad9`](https://github.com/nocobase/nocobase/commit/3e87ad9083d68883cc7472c60d8c944ba178c602)
- fix: remove PluginManager.getPackageName [`de8fc80`](https://github.com/nocobase/nocobase/commit/de8fc8079a2d6eaa045a22328edb3acba374a164)

## [v0.14.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.14.0-alpha.1...v0.14.0-alpha.2) - 2023-09-13

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.2 [`3670d67`](https://github.com/nocobase/nocobase/commit/3670d670ac7f113e68345ac2a83ed6231aebda69)
- chore: update changelog [`4271713`](https://github.com/nocobase/nocobase/commit/427171342f579e4352f026454ef679e9222dd3ee)
- fix: migration error [`1798170`](https://github.com/nocobase/nocobase/commit/1798170a9cee161a6d3b5270039fb4c325a2e0da)

## [v0.14.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.10...v0.14.0-alpha.1) - 2023-09-12

### Merged

- feat: new plugin manager, supports adding plugins through UI [`#2430`](https://github.com/nocobase/nocobase/pull/2430)
- fix(mobile-client-plugin): avoid primary field error [`#2625`](https://github.com/nocobase/nocobase/pull/2625)
- fix(plugin-workflow): fix scope variable in loop [`#2633`](https://github.com/nocobase/nocobase/pull/2633)
- fix: create action reported error when config save mode filterKeys [`#2631`](https://github.com/nocobase/nocobase/pull/2631)
- fix(gateway): throw error when run from cli [`#2627`](https://github.com/nocobase/nocobase/pull/2627)
- feat(plugin-workflow): support variable in midway path [`#2598`](https://github.com/nocobase/nocobase/pull/2598)
- feat(database): support ssl config of database [`#2620`](https://github.com/nocobase/nocobase/pull/2620)

### Commits

- chore(versions): 😊 publish v0.14.0-alpha.1 [`117d4b8`](https://github.com/nocobase/nocobase/commit/117d4b81865f8939c4ff46d3d789ad8369a90ced)
- fix: error: SQLITE_ERROR: no such table: authenticators [`adf11bf`](https://github.com/nocobase/nocobase/commit/adf11bf6243632ac9a9ff9919a0d8b7bb66d1530)
- fix: original error: SQLITE_ERROR: no such column: options [`6cc88df`](https://github.com/nocobase/nocobase/commit/6cc88dfa2bf0d8aeed49d20094167db4a1f4c8c0)

## [v0.13.0-alpha.10](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.9...v0.13.0-alpha.10) - 2023-09-10

### Merged

- chore: remove username interface [`#2621`](https://github.com/nocobase/nocobase/pull/2621)
- refactor: useFieldModeOptions [`#2612`](https://github.com/nocobase/nocobase/pull/2612)
- feat(bi): allow to use variables in query filter [`#2609`](https://github.com/nocobase/nocobase/pull/2609)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.10 [`fec17d5`](https://github.com/nocobase/nocobase/commit/fec17d5661e864392ef44defd1d8100da867a1b0)
- chore: add NOCOBASE_SYSTEM_SETTINGS to localStorage [`893b2d7`](https://github.com/nocobase/nocobase/commit/893b2d71bc66fb2285cfb13af07f98f5dba51638)

## [v0.13.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.8...v0.13.0-alpha.9) - 2023-09-07

### Merged

- fix: core/client package.json module error [`#2610`](https://github.com/nocobase/nocobase/pull/2610)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.9 [`b655517`](https://github.com/nocobase/nocobase/commit/b655517a74bb5818693b7dd62074c93ecc2cdd08)

## [v0.13.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.7...v0.13.0-alpha.8) - 2023-09-07

### Merged

- chore(antd): reduce animation duration [`#2602`](https://github.com/nocobase/nocobase/pull/2602)
- fix: window reload after pm load failed [`#2605`](https://github.com/nocobase/nocobase/pull/2605)
- fix: sync roles collection in share plugin [`#2601`](https://github.com/nocobase/nocobase/pull/2601)
- fix: fix collapsed panels not working when clicked [`#2600`](https://github.com/nocobase/nocobase/pull/2600)
- feat(graph-collection-manager): display collections on demand [`#2583`](https://github.com/nocobase/nocobase/pull/2583)
- fix(acl): parse acl params of association collection [`#2594`](https://github.com/nocobase/nocobase/pull/2594)
- fix: issue of plugin snippet [`#2593`](https://github.com/nocobase/nocobase/pull/2593)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.8 [`17d4476`](https://github.com/nocobase/nocobase/commit/17d4476c1074079db1e9874127e62b3599c7ea8c)
- chore: upgrade vitest to v0.34.3 [`4ead715`](https://github.com/nocobase/nocobase/commit/4ead7150f051786d5b7ede121981d47fbbf48199)

## [v0.13.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.6...v0.13.0-alpha.7) - 2023-09-05

### Merged

- chore: incr bodyParser body limit [`#2591`](https://github.com/nocobase/nocobase/pull/2591)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.7 [`97b4570`](https://github.com/nocobase/nocobase/commit/97b4570bd22d9e485ad7b2d3124b0d59725beabf)

## [v0.13.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.5...v0.13.0-alpha.6) - 2023-09-04

### Merged

- fix: resource undefind [`#2589`](https://github.com/nocobase/nocobase/pull/2589)
- fix(RangePicker): fix shortcut invalid [`#2586`](https://github.com/nocobase/nocobase/pull/2586)
- fix(auth): add authenticator uid limitation [`#2587`](https://github.com/nocobase/nocobase/pull/2587)

### Commits

- fix: yarn install on windows [`eb255df`](https://github.com/nocobase/nocobase/commit/eb255df35e215b4d5e945b9ee363ed61862b49cf)
- chore(versions): 😊 publish v0.13.0-alpha.6 [`e5f5358`](https://github.com/nocobase/nocobase/commit/e5f5358be07b642c2614f71a45b85cc3f04e5b30)
- chore: optimize versions of deps [`88b2eb8`](https://github.com/nocobase/nocobase/commit/88b2eb8a5d4300147261446116c869c2b96a03f3)

## [v0.13.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.4...v0.13.0-alpha.5) - 2023-09-03

### Merged

- refactor: build tools [`#2374`](https://github.com/nocobase/nocobase/pull/2374)
- feat(plugin-cas): support cas authenticator [`#2580`](https://github.com/nocobase/nocobase/pull/2580)
- fix: association block report error for toOne association field [`#2582`](https://github.com/nocobase/nocobase/pull/2582)
- feat(gateway): response cli result when run nocobase command [`#2563`](https://github.com/nocobase/nocobase/pull/2563)
- fix(collection-manager): redundant fields after set collection fields [`#2575`](https://github.com/nocobase/nocobase/pull/2575)
- refactor: restrict the use of tree table in data selectors [`#2581`](https://github.com/nocobase/nocobase/pull/2581)
- fix(plugin-fm): add migration to fix attachment ui schema [`#2579`](https://github.com/nocobase/nocobase/pull/2579)
- fix(plugin-fm): fix attachment field param typo [`#2577`](https://github.com/nocobase/nocobase/pull/2577)
- fix(FilterDynamicComponent): avoid crashing [`#2566`](https://github.com/nocobase/nocobase/pull/2566)
- feat(api-keys): add tooltip for roles [`#2567`](https://github.com/nocobase/nocobase/pull/2567)
- fix: number field reported error when clear data [`#2561`](https://github.com/nocobase/nocobase/pull/2561)
- docs(plugin-workflow): fix swagger docs [`#2565`](https://github.com/nocobase/nocobase/pull/2565)
- fix(acl): grant action with table without createdAt field [`#2562`](https://github.com/nocobase/nocobase/pull/2562)
- refactor(collection-manager): collection &&fields support description  config [`#2554`](https://github.com/nocobase/nocobase/pull/2554)
- chore: set audit-logs as local plugin [`#2564`](https://github.com/nocobase/nocobase/pull/2564)
- style: sub-table add button style improve [`#2508`](https://github.com/nocobase/nocobase/pull/2508)
- refactor: associatiion fields in  table should not have data scope settings [`#2509`](https://github.com/nocobase/nocobase/pull/2509)
- feat(plugin-workflow): add filter button for workflows list [`#2555`](https://github.com/nocobase/nocobase/pull/2555)
- fix(plugin-workflow): fix destroy node bug [`#2553`](https://github.com/nocobase/nocobase/pull/2553)
- fix: properties initialized in plugin.load are still empty in plugin.install [`#2544`](https://github.com/nocobase/nocobase/pull/2544)
- fix: plugin list not updated after upgrade [`#2545`](https://github.com/nocobase/nocobase/pull/2545)
- fix(theme-editor): fix enable invalid [`#2539`](https://github.com/nocobase/nocobase/pull/2539)

### Commits

- chore(api-doc): collection manager db views api doc [`9288cb9`](https://github.com/nocobase/nocobase/commit/9288cb9338a11344586ac6374846dfc2708296d2)
- Revert "fix(RangePicker): fix shortcut invalid (#2489)" [`8e42da2`](https://github.com/nocobase/nocobase/commit/8e42da2b01ed5f8f773d11f76f358363886f1f39)
- chore(versions): 😊 publish v0.13.0-alpha.5 [`af34fe1`](https://github.com/nocobase/nocobase/commit/af34fe10ab1c00e271c6a387543639baf4aaedfb)

## [v0.13.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.3...v0.13.0-alpha.4) - 2023-08-27

### Merged

- fix(RangePicker): fix shortcut invalid [`#2489`](https://github.com/nocobase/nocobase/pull/2489)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.4 [`0fd38a5`](https://github.com/nocobase/nocobase/commit/0fd38a5c56520063956b85facb30f5112699999c)
- fix: insert a record after pm.add [`f5a4413`](https://github.com/nocobase/nocobase/commit/f5a4413a9a4f14479e1bc9b98660c867f46f3a31)

## [v0.13.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.2...v0.13.0-alpha.3) - 2023-08-26

### Merged

- fix(themeEditor): should allow all roles to use [`#2538`](https://github.com/nocobase/nocobase/pull/2538)
- fix(plugin-cm): fix life cycle [`#2535`](https://github.com/nocobase/nocobase/pull/2535)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.3 [`5278017`](https://github.com/nocobase/nocobase/commit/5278017fffcf437258a4d5e0d8f30bea6a42f672)
- fix: swagger filter params [`3d9a6ef`](https://github.com/nocobase/nocobase/commit/3d9a6ef76f748012e765fc7737d60510f12a6d92)
- fix: xpipe.eq [`9364a44`](https://github.com/nocobase/nocobase/commit/9364a44681ed37eb48e16d42a25406a4350c0367)

## [v0.13.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.13.0-alpha.1...v0.13.0-alpha.2) - 2023-08-24

### Merged

- refactor(plugin-workflow): hide unused form in manual ui after done [`#2526`](https://github.com/nocobase/nocobase/pull/2526)
- style(plugin-workflow): adjust terminal style on workflow canvas [`#2524`](https://github.com/nocobase/nocobase/pull/2524)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.2 [`f4a1953`](https://github.com/nocobase/nocobase/commit/f4a1953980cb21d786fa9d140ec91bbb0ff1d412)
- chore: update changelog [`a638442`](https://github.com/nocobase/nocobase/commit/a6384421b624c52a2af085abfa5767a3775024f2)
- fix(plugin-client): extract locale files of antd [`cf77ca1`](https://github.com/nocobase/nocobase/commit/cf77ca17929ad64cd920d2adf1611a29b5ad8a0d)

## [v0.13.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.12.0-alpha.5...v0.13.0-alpha.1) - 2023-08-24

### Merged

- feat: application supervisor [`#2353`](https://github.com/nocobase/nocobase/pull/2353)
- fix: sort field init [`#2520`](https://github.com/nocobase/nocobase/pull/2520)
- feat: api documentation plugin [`#2255`](https://github.com/nocobase/nocobase/pull/2255)
- fix(plugin-workflow): fix duplicated downstream executions after condition [`#2517`](https://github.com/nocobase/nocobase/pull/2517)
- fix: basic-auth compitibility issue [`#2515`](https://github.com/nocobase/nocobase/pull/2515)
- fix(plugin-workflow): fix status button styles [`#2516`](https://github.com/nocobase/nocobase/pull/2516)
- fix(plugin-fm): fix error when add attachment field to manual form assigned values [`#2503`](https://github.com/nocobase/nocobase/pull/2503)
- fix(plugin-workflow): fix loop scope variable parsing [`#2502`](https://github.com/nocobase/nocobase/pull/2502)
- feat(database): support field get in view preview [`#2482`](https://github.com/nocobase/nocobase/pull/2482)
- refactor: m2m data filtering through collection data [`#2497`](https://github.com/nocobase/nocobase/pull/2497)
- refactor(graph-collection-manager): update antv-x6  to 2.x [`#2466`](https://github.com/nocobase/nocobase/pull/2466)
- fix: view collection  reported error when editing [`#2493`](https://github.com/nocobase/nocobase/pull/2493)
- fix: dev load plugin [`#2455`](https://github.com/nocobase/nocobase/pull/2455)
- fix(plugin-workflow): fix variable type check [`#2492`](https://github.com/nocobase/nocobase/pull/2492)
- chore: remove Default value option for sequence field [`#2488`](https://github.com/nocobase/nocobase/pull/2488)
- fix: tagcolor value error [`#2487`](https://github.com/nocobase/nocobase/pull/2487)
- feat(auth): support signing in with username [`#2376`](https://github.com/nocobase/nocobase/pull/2376)
- fix: view collection source field [`#2483`](https://github.com/nocobase/nocobase/pull/2483)

### Commits

- chore(versions): 😊 publish v0.13.0-alpha.1 [`6debb8d`](https://github.com/nocobase/nocobase/commit/6debb8d00b62e9df228e0e2a6e9df70d8ba587c8)
- chore: update changelog [`b91a923`](https://github.com/nocobase/nocobase/commit/b91a923fe001552a0dd0323d3fed02c1f489f0e5)
- fix: swagger block event loop [`b063000`](https://github.com/nocobase/nocobase/commit/b0630005d923b495708547e913c90d4e8aa5bb59)

## [v0.12.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.12.0-alpha.4...v0.12.0-alpha.5) - 2023-08-18

### Merged

- fix(sdk): window is not defined in nuxt (#2479) [`#2481`](https://github.com/nocobase/nocobase/pull/2481)
- fix: source collections not updated during synchronization in view collection [`#2480`](https://github.com/nocobase/nocobase/pull/2480)
- feat(plugin-workflow): add user variable to form trigger context [`#2477`](https://github.com/nocobase/nocobase/pull/2477)
- fix: large field in the subtable do not display value [`#2475`](https://github.com/nocobase/nocobase/pull/2475)
- fix:  error in tree table dragging and sorting [`#2476`](https://github.com/nocobase/nocobase/pull/2476)
- fix:  prompt on the last row of the subtable row is obscured [`#2467`](https://github.com/nocobase/nocobase/pull/2467)
- fix(plugin-workflow): fix form trigger data bug [`#2472`](https://github.com/nocobase/nocobase/pull/2472)
- fix: hook error in `isTitleField` [`#2471`](https://github.com/nocobase/nocobase/pull/2471)
- fix(plugin-workflow): fix create/edit workflow form [`#2470`](https://github.com/nocobase/nocobase/pull/2470)
- fix(plugin-workflow): fix fields filter in value assignment nodes [`#2469`](https://github.com/nocobase/nocobase/pull/2469)
- refactor: view synchronization field, source field support selected to inherited collection field [`#2456`](https://github.com/nocobase/nocobase/pull/2456)
- fix(plugin-workflow): fix schedule config component witdh [`#2461`](https://github.com/nocobase/nocobase/pull/2461)
- refactor: sub-table/sub-form support formula field [`#2449`](https://github.com/nocobase/nocobase/pull/2449)
- refactor: remoteSelect fieldName value [`#2457`](https://github.com/nocobase/nocobase/pull/2457)
- chore(database): view with hashed id field [`#2458`](https://github.com/nocobase/nocobase/pull/2458)

### Commits

- chore(versions): 😊 publish v0.12.0-alpha.5 [`d878749`](https://github.com/nocobase/nocobase/commit/d8787493db64624a5efdfc7132605aae7aa9610f)
- chore(eslint): ignore docker [`1977e00`](https://github.com/nocobase/nocobase/commit/1977e00414ee590d0d8783f2b6491d45afdbd545)

## [v0.12.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.12.0-alpha.3...v0.12.0-alpha.4) - 2023-08-15

### Merged

- feat(plugin-workflow): add sort and pagination to query node params [`#2453`](https://github.com/nocobase/nocobase/pull/2453)
- style: ellipsisWithTooltip style improve [`#2451`](https://github.com/nocobase/nocobase/pull/2451)
- refactor: add new action init icon [`#2454`](https://github.com/nocobase/nocobase/pull/2454)
- fix(plugin-map): should filter empty data, Close T-1380 [`#2447`](https://github.com/nocobase/nocobase/pull/2447)
- fix: should show/hide schema when enabled/disabled TabBar, Tabs, Header [`#2428`](https://github.com/nocobase/nocobase/pull/2428)
- fix(client): fix select button height in variable textarea [`#2450`](https://github.com/nocobase/nocobase/pull/2450)
- refactor: default value for field configuration in sub-table [`#2425`](https://github.com/nocobase/nocobase/pull/2425)
- fix(plugin-workflow): fix assign attachment value in nodes [`#2448`](https://github.com/nocobase/nocobase/pull/2448)
- fix(findSchema): table operation action  and detail operation action  interact with each other [`#2446`](https://github.com/nocobase/nocobase/pull/2446)
- refactor: recordPicker =&gt; associationField [`#2444`](https://github.com/nocobase/nocobase/pull/2444)
- style: schemaSetting dropdown style improve [`#2432`](https://github.com/nocobase/nocobase/pull/2432)
- refactor: buffer form attachment file name [`#2429`](https://github.com/nocobase/nocobase/pull/2429)
- fix(plugin-workflow): fix aggregate node association select [`#2438`](https://github.com/nocobase/nocobase/pull/2438)
- fix(plugin-workflow): add enablement editing back to workflow form [`#2431`](https://github.com/nocobase/nocobase/pull/2431)
- fix(plugin-workflow): fix locale [`#2427`](https://github.com/nocobase/nocobase/pull/2427)
- feat(map-plugin): map block support select map field of association tables [`#2214`](https://github.com/nocobase/nocobase/pull/2214)
- feat(plugin-workflow): allow to configure auto delete execution in history [`#2423`](https://github.com/nocobase/nocobase/pull/2423)
- refactor(schema-template): Inherit collection using blockTemplate [`#2418`](https://github.com/nocobase/nocobase/pull/2418)
- fix(mobile-client): style broken and display correct mobile url in sub app [`#2414`](https://github.com/nocobase/nocobase/pull/2414)
- fix(plugin-workflow): adjust styles [`#2417`](https://github.com/nocobase/nocobase/pull/2417)
- feat(plugin-workflow): add form trigger type [`#2347`](https://github.com/nocobase/nocobase/pull/2347)
- fix(data-template): titleField undefined [`#2398`](https://github.com/nocobase/nocobase/pull/2398)
- refactor: map clear modal getContainer [`#2410`](https://github.com/nocobase/nocobase/pull/2410)
- fix: useSyncFromForm support multi-level relationships [`#2413`](https://github.com/nocobase/nocobase/pull/2413)
- refactor: restrict the fields within the configured data scope in sub table [`#2394`](https://github.com/nocobase/nocobase/pull/2394)
- feat(plugin-workflow): add execution dropdown for quick navigating [`#2404`](https://github.com/nocobase/nocobase/pull/2404)
- refactor(plugin-workflow): change reload api to sync, and fix duplicated listening [`#2403`](https://github.com/nocobase/nocobase/pull/2403)
- feat(plugin-workflow): add clear button for clearing executions [`#2401`](https://github.com/nocobase/nocobase/pull/2401)
- feat(plugin-workflow): add modal to edit title when duplicating workflow [`#2399`](https://github.com/nocobase/nocobase/pull/2399)
- refactor: should not trigger event of row when clicking in drawer [`#2400`](https://github.com/nocobase/nocobase/pull/2400)
- fix(database): update belongs to many relation with target collection [`#2393`](https://github.com/nocobase/nocobase/pull/2393)
- refractor(remote-select):  association field data scope merge with  original filter conditions [`#2118`](https://github.com/nocobase/nocobase/pull/2118)
- fix(plugin-workflow): fix manual assignee select variable type filter [`#2396`](https://github.com/nocobase/nocobase/pull/2396)
- fix: params undefined [`#2397`](https://github.com/nocobase/nocobase/pull/2397)
- feat(plugin-workflow): add reload for multi-app [`#2391`](https://github.com/nocobase/nocobase/pull/2391)
- refactor:the default value of the built-in field should not be required [`#2115`](https://github.com/nocobase/nocobase/pull/2115)
- feat(bi): make more config visualizable [`#2386`](https://github.com/nocobase/nocobase/pull/2386)
- refactor: table select record restricted the usage association field [`#2338`](https://github.com/nocobase/nocobase/pull/2338)
- fix: useVariablesCtx [`#2390`](https://github.com/nocobase/nocobase/pull/2390)
- fix: customized create  action  supports tree data for table selection data [`#2328`](https://github.com/nocobase/nocobase/pull/2328)
- fix: no field configuration items for association field details in the sub table [`#2384`](https://github.com/nocobase/nocobase/pull/2384)
- fix: resource undefined [`#2372`](https://github.com/nocobase/nocobase/pull/2372)
- refactor: remoteSelect support non object value [`#2375`](https://github.com/nocobase/nocobase/pull/2375)
- fix: linkagerule copy data mutual influence [`#2333`](https://github.com/nocobase/nocobase/pull/2333)
- refactor: association field support sorting rules in sub-table [`#2326`](https://github.com/nocobase/nocobase/pull/2326)
- feat(association-field): association field support sub-form(popover) [`#2373`](https://github.com/nocobase/nocobase/pull/2373)
- fix(markdowm): markdown style hook error reporting [`#2380`](https://github.com/nocobase/nocobase/pull/2380)
- fix: currentObject can not loadData [`#2385`](https://github.com/nocobase/nocobase/pull/2385)
- chore: change debug server to yarn dev [`#2383`](https://github.com/nocobase/nocobase/pull/2383)
- feat: association blocks support `GridCard` and `List` blocks [`#2356`](https://github.com/nocobase/nocobase/pull/2356)
- fix(plugin-mobile): the layout is incorrect [`#2360`](https://github.com/nocobase/nocobase/pull/2360)

### Commits

- chore(versions): 😊 publish v0.12.0-alpha.4 [`df85fb4`](https://github.com/nocobase/nocobase/commit/df85fb430a67c9f75e3cad5844e0a7d8c63064e3)
- fix: improve translation [`15504c2`](https://github.com/nocobase/nocobase/commit/15504c2813a896cdc1b53cc85d7ec4d3a093c0e5)
- chore: dockerignore [`b34b731`](https://github.com/nocobase/nocobase/commit/b34b7319e999655454a5d298ef808d6bbc1ad04e)

## [v0.12.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.12.0-alpha.2...v0.12.0-alpha.3) - 2023-08-02

### Commits

- chore(versions): 😊 publish v0.12.0-alpha.3 [`9251fe0`](https://github.com/nocobase/nocobase/commit/9251fe015f8ac58d42168637c29e887f6ee95348)
- chore: update docker-entrypoint.sh [`c33c325`](https://github.com/nocobase/nocobase/commit/c33c32566c924ef75c4a9c0cb7e1a6afdd93bfb4)

## [v0.12.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.12.0-alpha.1...v0.12.0-alpha.2) - 2023-08-02

### Commits

- chore(versions): 😊 publish v0.12.0-alpha.2 [`6ae22ce`](https://github.com/nocobase/nocobase/commit/6ae22cea68da3bfe41cde33969f70384c737a55c)
- fix: chore: update changelog [`524571e`](https://github.com/nocobase/nocobase/commit/524571e0fe2a6efa47759a5c500576d7e32fe3f0)
- fix: update dockerfile [`f4d97a5`](https://github.com/nocobase/nocobase/commit/f4d97a50cbf436ca0d38ac2cba3f8134df606b72)

## [v0.12.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.11.1-alpha.5...v0.12.0-alpha.1) - 2023-08-02

### Merged

- refactor!: plugins build and plugins load [`#2253`](https://github.com/nocobase/nocobase/pull/2253)
- fix: modal will automatically close when configing fields to association field details in sub-table [`#2371`](https://github.com/nocobase/nocobase/pull/2371)
- fix(default-value): should not show 'N/A' when a normal value is selected. [`#2365`](https://github.com/nocobase/nocobase/pull/2365)
- fix(bi): issue of parsing label of region & file field [`#2366`](https://github.com/nocobase/nocobase/pull/2366)
- chore: upgrade antd to 5.7.3 [`#2359`](https://github.com/nocobase/nocobase/pull/2359)
- fix(bi): g2plot render wrong when fields contain `.` [`#2363`](https://github.com/nocobase/nocobase/pull/2363)
- fix: graph collection current appInfo error [`#2364`](https://github.com/nocobase/nocobase/pull/2364)
- refactor(association field): association field support tag field mode [`#2251`](https://github.com/nocobase/nocobase/pull/2251)
- refactor: form data templates and depulicate action support sync from form fields [`#2314`](https://github.com/nocobase/nocobase/pull/2314)
- chore: only dev env can throw errors [`#2355`](https://github.com/nocobase/nocobase/pull/2355)
- fix: inheritd association field failed to get detail data [`#2354`](https://github.com/nocobase/nocobase/pull/2354)
- refactor(plugin-workflow): adjust full-width to auto-width [`#2351`](https://github.com/nocobase/nocobase/pull/2351)
- Revert "feat(theme-editor): add migration (#2310)" [`#2352`](https://github.com/nocobase/nocobase/pull/2352)
- fix(locale): acl bug of localization management [`#2350`](https://github.com/nocobase/nocobase/pull/2350)
- feat(theme-editor): add migration [`#2310`](https://github.com/nocobase/nocobase/pull/2310)
- feat: support JSONB [`#2321`](https://github.com/nocobase/nocobase/pull/2321)
- fix(bi): parsing enum labels of field with alias [`#2349`](https://github.com/nocobase/nocobase/pull/2349)

### Commits

- chore(versions): 😊 publish v0.12.0-alpha.1 [`93f2bc2`](https://github.com/nocobase/nocobase/commit/93f2bc2e6782dec1388208e6fd40905faa82f82d)

## [v0.11.1-alpha.5](https://github.com/nocobase/nocobase/compare/v0.11.1-alpha.4...v0.11.1-alpha.5) - 2023-07-29

### Merged

- refactor(plugin-workflow): change strict equal and not equal to unstrict [`#2346`](https://github.com/nocobase/nocobase/pull/2346)

### Commits

- chore(versions): 😊 publish v0.11.1-alpha.5 [`40c4aab`](https://github.com/nocobase/nocobase/commit/40c4aab50799d78ac3d7820d8fa5a732aa6f4723)
- fix: update yarn.lock [`656287e`](https://github.com/nocobase/nocobase/commit/656287e57be749eb00ec01189573a2088ed417df)
- refactor: make testing more stable [`3c7b3f3`](https://github.com/nocobase/nocobase/commit/3c7b3f3caff5563d0f13b0076294a64e8e330f41)

## [v0.11.1-alpha.4](https://github.com/nocobase/nocobase/compare/v0.11.1-alpha.3...v0.11.1-alpha.4) - 2023-07-29

### Merged

- refactor(plugin-workflow): allow system values to be assigned in create and update node [`#2345`](https://github.com/nocobase/nocobase/pull/2345)
- chore(database): merge fields arguments by path [`#2331`](https://github.com/nocobase/nocobase/pull/2331)
- fix(theme-editor): avoid error [`#2340`](https://github.com/nocobase/nocobase/pull/2340)
- refactor: upgrade @testing-library/react to 14.x [`#2339`](https://github.com/nocobase/nocobase/pull/2339)
- test: view collection as through model [`#2336`](https://github.com/nocobase/nocobase/pull/2336)
- fix: sub-form record provider data failed to matching [`#2337`](https://github.com/nocobase/nocobase/pull/2337)
- fix(bi): issue of formatting relation field & reference link of line chart [`#2332`](https://github.com/nocobase/nocobase/pull/2332)
- chore: tsx [`#2329`](https://github.com/nocobase/nocobase/pull/2329)
- chore: upgrade jest [`#2323`](https://github.com/nocobase/nocobase/pull/2323)

### Commits

- chore(versions): 😊 publish v0.11.1-alpha.4 [`b93f28a`](https://github.com/nocobase/nocobase/commit/b93f28a952fef20e99570ca6f19b3bf8192db465)
- fix: yarn run test [`d956c90`](https://github.com/nocobase/nocobase/commit/d956c90e91e303ae02e54f71498b92481eab0399)
- chore: update changelog [`54f2405`](https://github.com/nocobase/nocobase/commit/54f240539c5cf82d31c689bf409bcb5656ded496)

## [v0.11.1-alpha.3](https://github.com/nocobase/nocobase/compare/v0.11.1-alpha.2...v0.11.1-alpha.3) - 2023-07-26

### Merged

- fix(plugin-workflow): fix expression field in sub-form [`#2324`](https://github.com/nocobase/nocobase/pull/2324)
- chore: improve FormProvider [`#2322`](https://github.com/nocobase/nocobase/pull/2322)
- fix: collectionField undefined [`#2320`](https://github.com/nocobase/nocobase/pull/2320)
- fix: should use `filter` instead of `where` [`#2318`](https://github.com/nocobase/nocobase/pull/2318)
- fix(bi): issue of dnd [`#2315`](https://github.com/nocobase/nocobase/pull/2315)
- feat(filter-block): support foreign key and inheritance [`#2302`](https://github.com/nocobase/nocobase/pull/2302)
- chore: merge docker build [`#2317`](https://github.com/nocobase/nocobase/pull/2317)
- feat(locale): allows to manage locale resources in core package [`#2293`](https://github.com/nocobase/nocobase/pull/2293)
- fix(plugin-workflow): fix styles [`#2316`](https://github.com/nocobase/nocobase/pull/2316)
- Feat/translation fr_FR [`#2275`](https://github.com/nocobase/nocobase/pull/2275)
- feat: customize action support create record for any collection [`#2264`](https://github.com/nocobase/nocobase/pull/2264)
- refactor: form data template  support data scope config [`#2229`](https://github.com/nocobase/nocobase/pull/2229)
- chore: auto fix eslint errors when pre-commit [`#2304`](https://github.com/nocobase/nocobase/pull/2304)
- refactor: sub-table acl ignore [`#2259`](https://github.com/nocobase/nocobase/pull/2259)
- refactor: date field UI supports configuration formatting [`#2241`](https://github.com/nocobase/nocobase/pull/2241)
- fix(plugin-workflow): fix schedule duplicated triggering in multi-apps [`#2313`](https://github.com/nocobase/nocobase/pull/2313)
- refactor: table column field provider optimize [`#2312`](https://github.com/nocobase/nocobase/pull/2312)
- fix: table column field undefined fix [`#2311`](https://github.com/nocobase/nocobase/pull/2311)
- fix: table column field failed to be actived [`#2309`](https://github.com/nocobase/nocobase/pull/2309)
- fix(default-value): fix tag in RemoteSelect [`#2306`](https://github.com/nocobase/nocobase/pull/2306)
- fix: modal  not displayed when clicking on the association field in the table [`#2292`](https://github.com/nocobase/nocobase/pull/2292)
- fix(database): skip reference delete on view collection [`#2303`](https://github.com/nocobase/nocobase/pull/2303)

### Commits

- chore(versions): 😊 publish v0.11.1-alpha.3 [`81819f0`](https://github.com/nocobase/nocobase/commit/81819f04e3bdd108a1a70038352545748552c2f9)
- chore: fix Warning if eslint [`986e241`](https://github.com/nocobase/nocobase/commit/986e2414d4b8eba2bd0cf3cf1932a74ff507271e)
- chore: fix prettier [`30b0d9b`](https://github.com/nocobase/nocobase/commit/30b0d9b3f303a43eeb340482a567a50145437f27)

## [v0.11.1-alpha.2](https://github.com/nocobase/nocobase/compare/v0.11.1-alpha.1...v0.11.1-alpha.2) - 2023-07-23

### Commits

- chore(versions): 😊 publish v0.11.1-alpha.2 [`c84476d`](https://github.com/nocobase/nocobase/commit/c84476d805bae897fea7a23cec38813dbe28cae0)
- chore(theme-editor): fix deps [`d0528cf`](https://github.com/nocobase/nocobase/commit/d0528cf1f273fd7e3efbe6eb58a247a20dbaffb1)
- chore(theme-editor): fix deps [`25decf0`](https://github.com/nocobase/nocobase/commit/25decf0aa9f6d37b972ba460a999558ecc25a819)

## [v0.11.1-alpha.1](https://github.com/nocobase/nocobase/compare/v0.11.0-alpha.1...v0.11.1-alpha.1) - 2023-07-22

### Merged

- fix(plugin-workflow): workflow collections should not appear in blocks [`#2290`](https://github.com/nocobase/nocobase/pull/2290)
- chore: remove belongsToMany through table as collection dependency [`#2289`](https://github.com/nocobase/nocobase/pull/2289)
- feat(database):  handle targetCollection option in repository find [`#2175`](https://github.com/nocobase/nocobase/pull/2175)
- feat: add built-in themes [`#2284`](https://github.com/nocobase/nocobase/pull/2284)
- docs: add doc for Theme Editor [`#2280`](https://github.com/nocobase/nocobase/pull/2280)
- fix: fix sorting of user menu [`#2288`](https://github.com/nocobase/nocobase/pull/2288)
- feat(theme-editor): support to config Header's color and Settings button's color [`#2263`](https://github.com/nocobase/nocobase/pull/2263)
- feat(plugin-workflow): add sql node [`#2276`](https://github.com/nocobase/nocobase/pull/2276)
- fix: the drop-down multiple selection fields are not displayed as title fields when inherited collection [`#2257`](https://github.com/nocobase/nocobase/pull/2257)
- fix(bi): orderBy bug under MySQL [`#2283`](https://github.com/nocobase/nocobase/pull/2283)
- test: make testing more stable [`#2277`](https://github.com/nocobase/nocobase/pull/2277)
- fix(bi): eliminate redundancy queries [`#2268`](https://github.com/nocobase/nocobase/pull/2268)
- fix(client): using component as action title [`#2274`](https://github.com/nocobase/nocobase/pull/2274)
- fix(middleware): revert now variable back [`#2267`](https://github.com/nocobase/nocobase/pull/2267)
- fix: linkage failed with current date variable [`#2272`](https://github.com/nocobase/nocobase/pull/2272)
- fix: fix style of page tab [`#2270`](https://github.com/nocobase/nocobase/pull/2270)
- fix: collection select no options [`#2271`](https://github.com/nocobase/nocobase/pull/2271)
- refactor: add locale plugin [`#2261`](https://github.com/nocobase/nocobase/pull/2261)
- feat(plugin-workflow): allow manual form button to be configured with preset values [`#2225`](https://github.com/nocobase/nocobase/pull/2225)
- feat(plugin-workflow): change to unlimited depth preloading associations in workflow [`#2142`](https://github.com/nocobase/nocobase/pull/2142)
- feat: localization management [`#2210`](https://github.com/nocobase/nocobase/pull/2210)
- refactor: linkage rules support datetime [`#2260`](https://github.com/nocobase/nocobase/pull/2260)
- fix:  view  inherited collection field reported error [`#2249`](https://github.com/nocobase/nocobase/pull/2249)
- fix: loading did not disappear after submission failure [`#2252`](https://github.com/nocobase/nocobase/pull/2252)
- feat: support custome themes [`#2228`](https://github.com/nocobase/nocobase/pull/2228)
- chore(plugin-workflow): fix breadcrumb warning [`#2256`](https://github.com/nocobase/nocobase/pull/2256)
- fix(plugin-workflow): fix request node error in loop [`#2254`](https://github.com/nocobase/nocobase/pull/2254)
- feat(database): view collection support for add new, update and delete actions [`#2119`](https://github.com/nocobase/nocobase/pull/2119)
- refactor(client): change isTitleField check to interface property titleUsable [`#2250`](https://github.com/nocobase/nocobase/pull/2250)
- fix: option field display value in workflow todo list [`#2246`](https://github.com/nocobase/nocobase/pull/2246)
- fix(plugin-workflow): fix dispatch bug [`#2247`](https://github.com/nocobase/nocobase/pull/2247)
- fix: avoid crashes when emptying DatePicker's value [`#2237`](https://github.com/nocobase/nocobase/pull/2237)
- fix: no template data requested during depulicating [`#2240`](https://github.com/nocobase/nocobase/pull/2240)
- fix(plugin-workflow): fix job button style [`#2243`](https://github.com/nocobase/nocobase/pull/2243)
- fix: avoid crashing when delete group menu [`#2239`](https://github.com/nocobase/nocobase/pull/2239)
- fix: should auto focus in drop-down menu [`#2234`](https://github.com/nocobase/nocobase/pull/2234)
- fix(plugin-fm): adjust upload file size to 1G which same as default on server side [`#2236`](https://github.com/nocobase/nocobase/pull/2236)
- fix: should only show one scroll bar in drop-down menu [`#2231`](https://github.com/nocobase/nocobase/pull/2231)
- fix: failed to correctly respond to optional fields in the child collection  in the parent  collection table [`#2207`](https://github.com/nocobase/nocobase/pull/2207)
- fix(core): fix batch update query logic [`#2230`](https://github.com/nocobase/nocobase/pull/2230)
- fix: should limit submenu height [`#2227`](https://github.com/nocobase/nocobase/pull/2227)
- fix(upload): fix style of attachement in Table [`#2213`](https://github.com/nocobase/nocobase/pull/2213)

### Fixed

- fix(plugin-fm): adjust upload file size to 1G which same as default on server side (#2236) [`#2215`](https://github.com/nocobase/nocobase/issues/2215)

### Commits

- chore(versions): 😊 publish v0.11.1-alpha.1 [`e979194`](https://github.com/nocobase/nocobase/commit/e979194cf29debcc10d2e6765c96083793186331)
- fix(theme-editor): remove db.sync [`fa2de8e`](https://github.com/nocobase/nocobase/commit/fa2de8e8060da00a85b381df0d7fbf9fca2793b3)
- fix(theme-editor): fix color of menu when it is selected [`8c90436`](https://github.com/nocobase/nocobase/commit/8c904363ad055d6aaacfe67d9f74a9467e7c90b5)

## [v0.11.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.10.1-alpha.1...v0.11.0-alpha.1) - 2023-07-08

### Merged

- refactor(client)!: upgrade antd to v5 [`#2078`](https://github.com/nocobase/nocobase/pull/2078)
- fix(plugin-workflow): fix loop variable [`#2211`](https://github.com/nocobase/nocobase/pull/2211)
- fix(db): fix .now variable [`#2209`](https://github.com/nocobase/nocobase/pull/2209)
- chore(plugin-workflow): adjust types [`#2206`](https://github.com/nocobase/nocobase/pull/2206)
- **Breaking change:** refactor(client)!: application, router and plugin [`#2068`](https://github.com/nocobase/nocobase/pull/2068)
- fix(plugin-workflow): try to avoid occasionally duplicated executions [`#2196`](https://github.com/nocobase/nocobase/pull/2196)
- fix: association field display has been delete in sub-form [`#2205`](https://github.com/nocobase/nocobase/pull/2205)
- refactor(client): abstract RawTextArea for variable input [`#2204`](https://github.com/nocobase/nocobase/pull/2204)
- fix: error reported when open data scope [`#2202`](https://github.com/nocobase/nocobase/pull/2202)
- fix: current object variavle can not be selected [`#2201`](https://github.com/nocobase/nocobase/pull/2201)

### Commits

- chore(versions): 😊 publish v0.11.0-alpha.1 [`c0a5952`](https://github.com/nocobase/nocobase/commit/c0a59524ab55f42f3455656d632bb6be6ae36424)
- chore: update changelog [`44adf53`](https://github.com/nocobase/nocobase/commit/44adf53c1105016beb850005199c73d9189347fb)

## [v0.10.1-alpha.1](https://github.com/nocobase/nocobase/compare/v0.10.0-alpha.5...v0.10.1-alpha.1) - 2023-07-07

### Merged

- fix(client): fix variable component for preload label based on value [`#2200`](https://github.com/nocobase/nocobase/pull/2200)
- fix: add new collection linakge disabled [`#2198`](https://github.com/nocobase/nocobase/pull/2198)
- refactor: the default value setting of association field supports variables [`#2138`](https://github.com/nocobase/nocobase/pull/2138)
- refactor: performance optimization of association field data scope [`#2113`](https://github.com/nocobase/nocobase/pull/2113)
- refactor: duplicate support  inherited collection [`#2181`](https://github.com/nocobase/nocobase/pull/2181)
- fix: optional fields of the child collection cannot be displayed correctly in the parent collection [`#2194`](https://github.com/nocobase/nocobase/pull/2194)
- fix(data-templates): fix filter is empty [`#2193`](https://github.com/nocobase/nocobase/pull/2193)
- feat(api-keys): the expiration field support custom option [`#2186`](https://github.com/nocobase/nocobase/pull/2186)
- refactor(plugin-workflow): refactor nodes variable option api [`#2192`](https://github.com/nocobase/nocobase/pull/2192)
- fix: error reported when rewriting the collection field [`#2189`](https://github.com/nocobase/nocobase/pull/2189)
- refactor: enable child collection support current object [`#2188`](https://github.com/nocobase/nocobase/pull/2188)
- refactor(client): refactor variable components and variables in workflow [`#2157`](https://github.com/nocobase/nocobase/pull/2157)
- feat: support token blacklist [`#2168`](https://github.com/nocobase/nocobase/pull/2168)
- fix: change ci timeout minutes [`#2187`](https://github.com/nocobase/nocobase/pull/2187)
- fix: cannot open the template when the data template filter is a custom function [`#2183`](https://github.com/nocobase/nocobase/pull/2183)
- feat(collection-manager): tableOID field and collection field [`#2161`](https://github.com/nocobase/nocobase/pull/2161)
- fix(utils): fix json-template type checking logic [`#2177`](https://github.com/nocobase/nocobase/pull/2177)
- fix: error opening when data scope is null [`#2178`](https://github.com/nocobase/nocobase/pull/2178)
- fix(plugin-workflow): fix data scope on todo table block [`#2176`](https://github.com/nocobase/nocobase/pull/2176)
- fix: time zone when showTime is false [`#2170`](https://github.com/nocobase/nocobase/pull/2170)
- chore(database): skip update association if through model is a view [`#2173`](https://github.com/nocobase/nocobase/pull/2173)
- test: add data-testid attr [`#2167`](https://github.com/nocobase/nocobase/pull/2167)
- fix(plugin-workflow): fix cancel action on trigger config [`#2166`](https://github.com/nocobase/nocobase/pull/2166)
- fix(utils): avoid to use default value for null in json-templates [`#2165`](https://github.com/nocobase/nocobase/pull/2165)
- fix(plugin-api-keys): use currentRoles instead of get roles from roles:list [`#2163`](https://github.com/nocobase/nocobase/pull/2163)
- docs: update api-keys related documentation [`#2162`](https://github.com/nocobase/nocobase/pull/2162)
- feat: data visualization [`#2160`](https://github.com/nocobase/nocobase/pull/2160)
- refactor: optimization of tree table stuck performance [`#2154`](https://github.com/nocobase/nocobase/pull/2154)
- feat(plugin-api-keys): support fetch api via api-keys [`#2136`](https://github.com/nocobase/nocobase/pull/2136)
- feat(map-plugin): support google map [`#2027`](https://github.com/nocobase/nocobase/pull/2027)
- fix: 修复 gulp-less 版本导致的初始化 bug [`#2153`](https://github.com/nocobase/nocobase/pull/2153)

### Commits

- chore(versions): 😊 publish v0.10.1-alpha.1 [`15f0282`](https://github.com/nocobase/nocobase/commit/15f028295c1f788c16da7a0643f7feff41e08434)
- chore: update changelog [`a96c4cd`](https://github.com/nocobase/nocobase/commit/a96c4cdd8410fcb1011b014f75b09c14f3960b88)
- fix(acl): add roles.users field [`7e0ac57`](https://github.com/nocobase/nocobase/commit/7e0ac57057d884583fe4fdbd89353ac30f408925)

## [v0.10.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.10.0-alpha.4...v0.10.0-alpha.5) - 2023-06-29

### Merged

- fix(assigned field):dynamic value validation error when assigned field [`#2117`](https://github.com/nocobase/nocobase/pull/2117)
- fix(upload): fix the upload status not being updated if the upload was successful [`#2133`](https://github.com/nocobase/nocobase/pull/2133)
- fix:  association fields cannot config in table [`#2146`](https://github.com/nocobase/nocobase/pull/2146)
- feat: error cache [`#2145`](https://github.com/nocobase/nocobase/pull/2145)
- fix(client): fix field initializer in detail block [`#2144`](https://github.com/nocobase/nocobase/pull/2144)
- fix: dropdownMatchSelectWidth=false [`#2143`](https://github.com/nocobase/nocobase/pull/2143)
- fix(doc): 同级目录跳转 [`#2140`](https://github.com/nocobase/nocobase/pull/2140)
- refactor: should use useDocumentTitle to change document title [`#2137`](https://github.com/nocobase/nocobase/pull/2137)
- Add *.pdf preview [`#2105`](https://github.com/nocobase/nocobase/pull/2105)
- fix: migration up error [`#2135`](https://github.com/nocobase/nocobase/pull/2135)

### Commits

- chore(versions): 😊 publish v0.10.0-alpha.5 [`560c00c`](https://github.com/nocobase/nocobase/commit/560c00cc3eda9352f32dd33d234668673f835175)
- chore: update changelog [`c32533e`](https://github.com/nocobase/nocobase/commit/c32533e1b8e660c827ddcb18b7c41cf4b15e90e5)

## [v0.10.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.10.0-alpha.3...v0.10.0-alpha.4) - 2023-06-27

### Merged

- refactor: request data when the drop-down list is opened [`#2127`](https://github.com/nocobase/nocobase/pull/2127)
- fix: fix dialog does not appear [`#2134`](https://github.com/nocobase/nocobase/pull/2134)
- fix(association-field):submitting failed after adding data in subform for multiple association fields [`#2065`](https://github.com/nocobase/nocobase/pull/2065)
- fix(sub-apps): fix incorrect page display when navigating sub-apps [`#2126`](https://github.com/nocobase/nocobase/pull/2126)
- fix: tree gantt block does not display correctly [`#2123`](https://github.com/nocobase/nocobase/pull/2123)
- fix(plugin-workflow): change to use formv2 to avoid values updating issue [`#2124`](https://github.com/nocobase/nocobase/pull/2124)
- style:list and gridCard block style improve [`#2087`](https://github.com/nocobase/nocobase/pull/2087)
- fix: fix designer button does not appear [`#2120`](https://github.com/nocobase/nocobase/pull/2120)
- fix: fix the drop-down menu does not disapper [`#2109`](https://github.com/nocobase/nocobase/pull/2109)
- chore: fix typo [`#2108`](https://github.com/nocobase/nocobase/pull/2108)

### Commits

- chore(versions): 😊 publish v0.10.0-alpha.4 [`f3f91bd`](https://github.com/nocobase/nocobase/commit/f3f91bd649c5c7c57ef3927d4ae47b5e5b1a9e74)
- chore: update changelog [`ce79e4d`](https://github.com/nocobase/nocobase/commit/ce79e4dc5bc6584c74ec335b33216163a8f6deec)
- Revert "chore: upgrade types of react" [`b2e7185`](https://github.com/nocobase/nocobase/commit/b2e71850f8f52b1c65c0c3783dbb48f64810c57b)

## [v0.10.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.10.0-alpha.2...v0.10.0-alpha.3) - 2023-06-25

### Merged

- fix:  deleting the last field from  sub table, the entire table will be delete [`#2077`](https://github.com/nocobase/nocobase/pull/2077)
- fix(sub-table): inherited fields cannot be edited in a subtable [`#2106`](https://github.com/nocobase/nocobase/pull/2106)
- fix(input-number): change step to 1 [`#2104`](https://github.com/nocobase/nocobase/pull/2104)
- fix: schema-uid-invalid [`#2107`](https://github.com/nocobase/nocobase/pull/2107)
- fix(plugin-workflow): fix branch and exit logic [`#2103`](https://github.com/nocobase/nocobase/pull/2103)
- fix: create plugin cli error [`#2102`](https://github.com/nocobase/nocobase/pull/2102)
- fix: select options [`#2101`](https://github.com/nocobase/nocobase/pull/2101)
- chore(deps): bump formily from 2.2.24 to 2.2.26 [`#2088`](https://github.com/nocobase/nocobase/pull/2088)
- fix(sub-table): allows configuration of "Display association fields" [`#2073`](https://github.com/nocobase/nocobase/pull/2073)
- style: enable child collection modal style improve [`#2100`](https://github.com/nocobase/nocobase/pull/2100)
- feat: data scope support variables for association fields [`#2049`](https://github.com/nocobase/nocobase/pull/2049)
- refactor: fix warning of antd 4.x [`#1998`](https://github.com/nocobase/nocobase/pull/1998)
- fix(plugin-workflow): fix job button style [`#2098`](https://github.com/nocobase/nocobase/pull/2098)
- fix(mobile-client): fix multiple bugs and do some improvement [`#2072`](https://github.com/nocobase/nocobase/pull/2072)
- fix(plugin-verification): fix duplication of installation [`#2097`](https://github.com/nocobase/nocobase/pull/2097)
- fix: incomplete field list for assigned fields [`#2093`](https://github.com/nocobase/nocobase/pull/2093)
- fix: add useAdminSchemaUid [`#2092`](https://github.com/nocobase/nocobase/pull/2092)
- refactor(db): add batch logic to update for better performance [`#2070`](https://github.com/nocobase/nocobase/pull/2070)
- fix: unable to load data from chinaRegion during the first configuation [`#2089`](https://github.com/nocobase/nocobase/pull/2089)
- refactor: migrate adminSchemaUid & mobileSchemaUid to system settings [`#2084`](https://github.com/nocobase/nocobase/pull/2084)
- fix(plugin-workflow): fix occasional error on enter workflow page [`#2086`](https://github.com/nocobase/nocobase/pull/2086)
- fix: mobile docs style [`#2083`](https://github.com/nocobase/nocobase/pull/2083)

### Commits

- chore(versions): 😊 publish v0.10.0-alpha.3 [`83bf8ea`](https://github.com/nocobase/nocobase/commit/83bf8ea3bbf7d5e2d2c8094d56844cec8560274f)
- chore: update changelog [`cc37667`](https://github.com/nocobase/nocobase/commit/cc376673a931411435a8b4ffffa22dc4921fcbf8)
- feat: update docs [`5672ffc`](https://github.com/nocobase/nocobase/commit/5672ffc9fa4b7b311e97fbb59fce8c368369c9c7)

## [v0.10.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.9.4-alpha.2...v0.10.0-alpha.2) - 2023-06-20

### Merged

- refactor: upgrade `umi`, `react` and `react-router-dom` [`#1921`](https://github.com/nocobase/nocobase/pull/1921)
- fix(collection-manager): share collection when COLLECTION_MANAGER_SCHEMA not set [`#2081`](https://github.com/nocobase/nocobase/pull/2081)
- fix(plugin-formula): fix formula field effect and read-pretty component [`#2076`](https://github.com/nocobase/nocobase/pull/2076)
- fix: file collection  field should default to preview as the title field [`#2059`](https://github.com/nocobase/nocobase/pull/2059)
- fix(client): remove incorrect onchange in json component [`#2079`](https://github.com/nocobase/nocobase/pull/2079)
- fix(client): fix onchange mistake [`#2075`](https://github.com/nocobase/nocobase/pull/2075)
- fix(client): fix locale [`#2074`](https://github.com/nocobase/nocobase/pull/2074)
- fix(Varaible): fix option is disabled [`#2043`](https://github.com/nocobase/nocobase/pull/2043)
- fix: rowSelection undefined [`#2071`](https://github.com/nocobase/nocobase/pull/2071)
- fix: association field cannot enable link in table column [`#2066`](https://github.com/nocobase/nocobase/pull/2066)
- refactor(plugin-workflow): manual collection block migration [`#2064`](https://github.com/nocobase/nocobase/pull/2064)
- refactor(association-field): support sub table [`#1862`](https://github.com/nocobase/nocobase/pull/1862)
- fix: avoid error [`#2060`](https://github.com/nocobase/nocobase/pull/2060)
- fix(Data-template): fix field cannot be expanded [`#2057`](https://github.com/nocobase/nocobase/pull/2057)
- feat(association field):quick add new [`#1953`](https://github.com/nocobase/nocobase/pull/1953)
- fix: duplicate action locale [`#2052`](https://github.com/nocobase/nocobase/pull/2052)
- fix: fix default value of optional field [`#2053`](https://github.com/nocobase/nocobase/pull/2053)
- refactor: List block and GridCard block style improve [`#1988`](https://github.com/nocobase/nocobase/pull/1988)
- fix: block disappears when dragged over its parent [`#2048`](https://github.com/nocobase/nocobase/pull/2048)
- fix: form performance [`#2047`](https://github.com/nocobase/nocobase/pull/2047)
- fix:  default value for multiple select cannot be set [`#2031`](https://github.com/nocobase/nocobase/pull/2031)
- fix: display on the PC side of moblie access is incomplete [`#2039`](https://github.com/nocobase/nocobase/pull/2039)
- fix: enable tab and deleting tab page  will result in an error [`#2045`](https://github.com/nocobase/nocobase/pull/2045)
- refactor(PluginManager): remove useless code [`#2022`](https://github.com/nocobase/nocobase/pull/2022)
- fix(mobile-client): some mobile-client bugs [`#2017`](https://github.com/nocobase/nocobase/pull/2017)
- fix: error reported after deleting the associationFilter  block linkage field [`#2038`](https://github.com/nocobase/nocobase/pull/2038)
- fix(association-field): default values for the fields of a association field [`#2037`](https://github.com/nocobase/nocobase/pull/2037)
- chore(database): return emtpy fields when attributes not specified [`#2034`](https://github.com/nocobase/nocobase/pull/2034)
- refactor:  child and parent field are not linked [`#2030`](https://github.com/nocobase/nocobase/pull/2030)
- fix(oidc): bugs of integration with logto [`#2032`](https://github.com/nocobase/nocobase/pull/2032)
- fix(data-template): filter out foreign keys [`#2033`](https://github.com/nocobase/nocobase/pull/2033)
- fix(client): fix json input component value handling [`#2028`](https://github.com/nocobase/nocobase/pull/2028)
- feat: filter out IDs in sub-forms [`#2025`](https://github.com/nocobase/nocobase/pull/2025)
- fix(GridCard): column count not work [`#2023`](https://github.com/nocobase/nocobase/pull/2023)
- feat: use `ActionContextProvider` instated of `ActionContext.Provider` [`#2019`](https://github.com/nocobase/nocobase/pull/2019)
- fix: re-insert repeat routes [`#2018`](https://github.com/nocobase/nocobase/pull/2018)
- refactor(plugin-workflow): change node config api render to component [`#2014`](https://github.com/nocobase/nocobase/pull/2014)
- chore(github-actions): separate frontend and backend tests [`#2013`](https://github.com/nocobase/nocobase/pull/2013)
- feat(plugin-mobile-client): support mobile-side client [`#1879`](https://github.com/nocobase/nocobase/pull/1879)
- chore(database): append inherit inspect attribute with eager load [`#2010`](https://github.com/nocobase/nocobase/pull/2010)
- feat(auth): support custom authentication [`#2007`](https://github.com/nocobase/nocobase/pull/2007)
- feat(plugin-fm): add option for storage to remove file physically or not [`#2005`](https://github.com/nocobase/nocobase/pull/2005)
- fix: eager load with nested association [`#2002`](https://github.com/nocobase/nocobase/pull/2002)
- chore(acl): write role to acl if it exists in database and not found … [`#2001`](https://github.com/nocobase/nocobase/pull/2001)
- feat: duplicate action [`#1973`](https://github.com/nocobase/nocobase/pull/1973)
- refactor(association-field): useAssociationNames hook [`#1956`](https://github.com/nocobase/nocobase/pull/1956)
- chore(collection-manager): should not throw error when source collection destoryed [`#1999`](https://github.com/nocobase/nocobase/pull/1999)
- fix: assignedField can not select dynamicValue [`#2000`](https://github.com/nocobase/nocobase/pull/2000)
- test: add tests for client [`#1960`](https://github.com/nocobase/nocobase/pull/1960)
- fix: display title enable [`#1995`](https://github.com/nocobase/nocobase/pull/1995)
- fix(plugin-formula): fix result component caused page crash [`#1996`](https://github.com/nocobase/nocobase/pull/1996)
- feat(collection-manger): lazy load collection field [`#1993`](https://github.com/nocobase/nocobase/pull/1993)
- fix: the edit drawer's audit logs block can only get records by this … [`#1917`](https://github.com/nocobase/nocobase/pull/1917)
- feat: upgrade formily [`#1880`](https://github.com/nocobase/nocobase/pull/1880)
- refactor(plugin-fm): change api and allow to select storage [`#1250`](https://github.com/nocobase/nocobase/pull/1250)
- fix: fix default value is invalid in subform [`#1989`](https://github.com/nocobase/nocobase/pull/1989)
- feat(database): add firstOrCreate and updateOrCreate in repository [`#1943`](https://github.com/nocobase/nocobase/pull/1943)
- feat(database): append child collection name after eager load [`#1978`](https://github.com/nocobase/nocobase/pull/1978)
- fix(multip-app-manager): init multiple Application instances while starting up a sub app [`#1986`](https://github.com/nocobase/nocobase/pull/1986)
- feat(plugin-workflow): manual forms [`#1748`](https://github.com/nocobase/nocobase/pull/1748)
- fix(charts): fields undefined bug [`#1980`](https://github.com/nocobase/nocobase/pull/1980)
- chore(database): pg oid and name data type in view [`#1982`](https://github.com/nocobase/nocobase/pull/1982)
- feat: infer belongs to association field in view collection [`#1756`](https://github.com/nocobase/nocobase/pull/1756)
- fix: treeCollection config in detail block [`#1975`](https://github.com/nocobase/nocobase/pull/1975)
- fix(database): missing reference when rewrite parent field [`#1977`](https://github.com/nocobase/nocobase/pull/1977)
- fix(evaluators): fix number lead key in variable path [`#1976`](https://github.com/nocobase/nocobase/pull/1976)
- fix(association-field): form.get & set valuesIn field.path [`#1972`](https://github.com/nocobase/nocobase/pull/1972)
- fix: useCreateActionProps [`#1971`](https://github.com/nocobase/nocobase/pull/1971)
- fix(database): update association values with nested associations [`#1970`](https://github.com/nocobase/nocobase/pull/1970)
- fix:  adding inherited blocks in relation fields under edited operate should only display themselves [`#1967`](https://github.com/nocobase/nocobase/pull/1967)
- fix(form-item): data scope and sorting rule config should only display in association field [`#1964`](https://github.com/nocobase/nocobase/pull/1964)
- fix: select with color tag value [`#1963`](https://github.com/nocobase/nocobase/pull/1963)
- fix: select toValue [`#1962`](https://github.com/nocobase/nocobase/pull/1962)
- fix: select null value [`#1961`](https://github.com/nocobase/nocobase/pull/1961)
- refactor(sub-form):sub-form style  [`#1959`](https://github.com/nocobase/nocobase/pull/1959)
- fix(plugin-formula): fix read-pretty component when used in association field [`#1957`](https://github.com/nocobase/nocobase/pull/1957)
- perf(data-scope): async loading of variable data [`#1932`](https://github.com/nocobase/nocobase/pull/1932)
- fix: undefined mode [`#1950`](https://github.com/nocobase/nocobase/pull/1950)
- fix(grid-card, list): display title only work on current block [`#1942`](https://github.com/nocobase/nocobase/pull/1942)
- refactor(linkage-rule): linkage rules condition support toMany association fields [`#1924`](https://github.com/nocobase/nocobase/pull/1924)
- feat(plugin-manager): better plugin manager experience [`#1927`](https://github.com/nocobase/nocobase/pull/1927)
- chore(database): sort many to many associations by primary key by … [`#1948`](https://github.com/nocobase/nocobase/pull/1948)
- test(audit-logs): audit log changes [`#1928`](https://github.com/nocobase/nocobase/pull/1928)
- fix: eager load belongs to many with through table [`#1946`](https://github.com/nocobase/nocobase/pull/1946)

### Commits

- chore(versions): 😊 publish v0.10.0-alpha.2 [`0b06e2c`](https://github.com/nocobase/nocobase/commit/0b06e2cd6967ee355a76ce201a80338bee536c97)
- Revert "fix: the edit drawer's audit logs block can only get records by this … (#1917)" [`a1872fa`](https://github.com/nocobase/nocobase/commit/a1872fa75beae8ae02774a8e4550a192518e7aa7)
- fix(association-field): show add new button when no data [`261ca0d`](https://github.com/nocobase/nocobase/commit/261ca0dbbb5659841b31026dad33b799782a8511)

## [v0.9.4-alpha.2](https://github.com/nocobase/nocobase/compare/v0.9.4-alpha.1...v0.9.4-alpha.2) - 2023-05-26

### Merged

- fix: parse nested associations in filterParser [`#1941`](https://github.com/nocobase/nocobase/pull/1941)
- fix(association-field): allow dissociate [`#1940`](https://github.com/nocobase/nocobase/pull/1940)
- fix(data-template): fix title input prevented proper data switching [`#1937`](https://github.com/nocobase/nocobase/pull/1937)
- refactor: association select display loading when data is loading [`#1925`](https://github.com/nocobase/nocobase/pull/1925)
- fix(association-field): allow multiple [`#1938`](https://github.com/nocobase/nocobase/pull/1938)
- feat(multi-app-manager): support auto start [`#1931`](https://github.com/nocobase/nocobase/pull/1931)
- fix(client): fix some warnings [`#1934`](https://github.com/nocobase/nocobase/pull/1934)

### Commits

- chore(versions): 😊 publish v0.9.4-alpha.2 [`d7f2146`](https://github.com/nocobase/nocobase/commit/d7f21460c68ba7415d7d46f93303ead706b6d8f9)
- fix(association-field): display sub-details by default [`1e870cf`](https://github.com/nocobase/nocobase/commit/1e870cf5ef7770b3e71051b39983dbca7d496706)
- chore: update changelog [`f2619b0`](https://github.com/nocobase/nocobase/commit/f2619b032597a0b65db7717cab418a6282a12651)

## [v0.9.4-alpha.1](https://github.com/nocobase/nocobase/compare/v0.9.3-alpha.1...v0.9.4-alpha.1) - 2023-05-25

### Merged

- chore: load view collection when source not found [`#1930`](https://github.com/nocobase/nocobase/pull/1930)
- feat(data-template): support to set data scope and title field [`#1918`](https://github.com/nocobase/nocobase/pull/1918)
- feat(data-template): support for unlimited levels of fields selection [`#1910`](https://github.com/nocobase/nocobase/pull/1910)
- chore: when using association field by picker mode,it's open size can be changed [`#1926`](https://github.com/nocobase/nocobase/pull/1926)
- fix(ConfigurationTabs): avoid error [`#1782`](https://github.com/nocobase/nocobase/pull/1782)
- fix: tableField query data in add child action [`#1876`](https://github.com/nocobase/nocobase/pull/1876)
- refactor: front-end testing with vitest [`#1900`](https://github.com/nocobase/nocobase/pull/1900)
- fix: disable popup button in add-modal [`#1808`](https://github.com/nocobase/nocobase/pull/1808)
- fix: append acl resource params [`#1923`](https://github.com/nocobase/nocobase/pull/1923)
- chore: update guard with array contains null [`#1922`](https://github.com/nocobase/nocobase/pull/1922)
- refactor: initialization when switching field components [`#1915`](https://github.com/nocobase/nocobase/pull/1915)
- fix(association-field): only when the new data is successfully created can the data be associated [`#1884`](https://github.com/nocobase/nocobase/pull/1884)
- fix: eager load with belongs to many with custom source key [`#1913`](https://github.com/nocobase/nocobase/pull/1913)
- fix: hiding the title of a subform will hide all embedded titles [`#1904`](https://github.com/nocobase/nocobase/pull/1904)
- fix: updateAssociationValues [`#1903`](https://github.com/nocobase/nocobase/pull/1903)
- fix(plugin-formula): use read-pretty component in result [`#1911`](https://github.com/nocobase/nocobase/pull/1911)
- fix: can't set default value when turn on the form field required [`#1887`](https://github.com/nocobase/nocobase/pull/1887)
- fix(Data-template): fix bug when deleting fields [`#1907`](https://github.com/nocobase/nocobase/pull/1907)
- feat(app): add clear cache button [`#1909`](https://github.com/nocobase/nocobase/pull/1909)
- fix: eager load belongs to many association [`#1906`](https://github.com/nocobase/nocobase/pull/1906)
- feat: support to-multi field variables [`#1680`](https://github.com/nocobase/nocobase/pull/1680)
- fix: append belongs to association with fields [`#1894`](https://github.com/nocobase/nocobase/pull/1894)
- fix: appends belongs to association [`#1893`](https://github.com/nocobase/nocobase/pull/1893)
- fix: preload relational data [`#1847`](https://github.com/nocobase/nocobase/pull/1847)
- feat: support reboot application manually [`#1889`](https://github.com/nocobase/nocobase/pull/1889)
- Refactor/append fields [`#1883`](https://github.com/nocobase/nocobase/pull/1883)
- chore: pg sql parser [`#1890`](https://github.com/nocobase/nocobase/pull/1890)
- fix(plugin-workflow): fix language [`#1886`](https://github.com/nocobase/nocobase/pull/1886)
- fix: field required  when setting sorting rules [`#1885`](https://github.com/nocobase/nocobase/pull/1885)
- feat(plugin-workflow): add node description to drawer when edit node [`#1882`](https://github.com/nocobase/nocobase/pull/1882)
- fix(plugin-workflow): fix variable api caller in loop [`#1877`](https://github.com/nocobase/nocobase/pull/1877)
- chore(github-template): clean comments and format [`#1878`](https://github.com/nocobase/nocobase/pull/1878)
- feat(association-field): default one data for to-many association [`#1873`](https://github.com/nocobase/nocobase/pull/1873)
- fix(plugin-workflow): fix trigger title when workflow not loaded [`#1875`](https://github.com/nocobase/nocobase/pull/1875)
- feat(plugin-workflow): aggregate [`#1852`](https://github.com/nocobase/nocobase/pull/1852)
- Feat/translation es_ES [`#1801`](https://github.com/nocobase/nocobase/pull/1801)
- fix: data is not updated when appends are changed [`#1872`](https://github.com/nocobase/nocobase/pull/1872)
- fix:association select no options when clearing filter [`#1866`](https://github.com/nocobase/nocobase/pull/1866)
- fix(acl): issue with repeated createdById field [`#1871`](https://github.com/nocobase/nocobase/pull/1871)
- feat(client): allow search by title in collection select [`#1869`](https://github.com/nocobase/nocobase/pull/1869)
- chore: skip get standalone deployment sub application [`#1868`](https://github.com/nocobase/nocobase/pull/1868)
- fix(plugin-workflow): remove useless context option [`#1867`](https://github.com/nocobase/nocobase/pull/1867)
- fix: inherit fields filter Foreign Key fields [`#1864`](https://github.com/nocobase/nocobase/pull/1864)
- feat(plugin-workflow): loop [`#1787`](https://github.com/nocobase/nocobase/pull/1787)
- fix: insertAdjacent not find [`#1861`](https://github.com/nocobase/nocobase/pull/1861)
- refactor(add-new):association field add new support button edit [`#1854`](https://github.com/nocobase/nocobase/pull/1854)
- feat: support List and Grid Card block [`#1753`](https://github.com/nocobase/nocobase/pull/1753)
- fix: fix multi-select field not show 'Allow multiple' switch [`#1857`](https://github.com/nocobase/nocobase/pull/1857)
- fix: field for attachment interface type  without appends [`#1856`](https://github.com/nocobase/nocobase/pull/1856)
- fix: action error when field deleted [`#1849`](https://github.com/nocobase/nocobase/pull/1849)
- feat: support running single sub app [`#1853`](https://github.com/nocobase/nocobase/pull/1853)
- fix: assign field with delete field [`#1850`](https://github.com/nocobase/nocobase/pull/1850)
- fix: title field in assign fields value [`#1848`](https://github.com/nocobase/nocobase/pull/1848)
- fix:association appends [`#1842`](https://github.com/nocobase/nocobase/pull/1842)
- feat(plugin-workflow): add delete button in workflow canvas page [`#1844`](https://github.com/nocobase/nocobase/pull/1844)
- fix(block-provider): getNesterAppends filter fix [`#1839`](https://github.com/nocobase/nocobase/pull/1839)
- feat: repository aggregate method [`#1829`](https://github.com/nocobase/nocobase/pull/1829)

### Commits

- feat(docs): update docs [`0b0a8d2`](https://github.com/nocobase/nocobase/commit/0b0a8d2be5f007c94c2050ddf28767100eba2ea8)
- chore(versions): 😊 publish v0.9.4-alpha.1 [`9c94840`](https://github.com/nocobase/nocobase/commit/9c94840c6b8cafa7dfc37bb660a7269c2480f995)
- chore: update changelog [`a6c7b41`](https://github.com/nocobase/nocobase/commit/a6c7b417dee9b45006b77459a29ebbdb8428dfc5)

## [v0.9.3-alpha.1](https://github.com/nocobase/nocobase/compare/v0.9.2-alpha.4...v0.9.3-alpha.1) - 2023-05-11

### Merged

- refactor: association field [`#1838`](https://github.com/nocobase/nocobase/pull/1838)
- fix: tree with fields option [`#1833`](https://github.com/nocobase/nocobase/pull/1833)
- fix(client): fix ime status in variable textarea [`#1832`](https://github.com/nocobase/nocobase/pull/1832)
- chore: should not return children property when child nodes are empty [`#1825`](https://github.com/nocobase/nocobase/pull/1825)
- fix: tree with sort field [`#1822`](https://github.com/nocobase/nocobase/pull/1822)
- fix(plugin-workflow): select menu width [`#1820`](https://github.com/nocobase/nocobase/pull/1820)
- fix: filter with appends [`#1819`](https://github.com/nocobase/nocobase/pull/1819)
- Fix/filter by array field [`#1813`](https://github.com/nocobase/nocobase/pull/1813)
- Fix/empty tree query [`#1814`](https://github.com/nocobase/nocobase/pull/1814)
- fix: association scope inherit [`#1806`](https://github.com/nocobase/nocobase/pull/1806)
- fix: update tree node [`#1812`](https://github.com/nocobase/nocobase/pull/1812)
- fix: list trees [`#1810`](https://github.com/nocobase/nocobase/pull/1810)
- test: filter nested association [`#1802`](https://github.com/nocobase/nocobase/pull/1802)
- fix: table configuration delete button problem [`#1764`](https://github.com/nocobase/nocobase/pull/1764)
- fix: fix Menu dismiss on Drag&Drop [`#1772`](https://github.com/nocobase/nocobase/pull/1772)
- fix(linkage-rule): condition variable field is allow select  To many association fields [`#1798`](https://github.com/nocobase/nocobase/pull/1798)
- chore: duration calculation [`#1770`](https://github.com/nocobase/nocobase/pull/1770)
- fix: tree performance [`#1779`](https://github.com/nocobase/nocobase/pull/1779)
- fix: close the drawer incorrectly after submit [`#1775`](https://github.com/nocobase/nocobase/pull/1775)
- Fix/recreate association field [`#1789`](https://github.com/nocobase/nocobase/pull/1789)
- fix: drop repeated "Connect data blocks" [`#1763`](https://github.com/nocobase/nocobase/pull/1763)
- fix:  failed to open child collections add new modal [`#1780`](https://github.com/nocobase/nocobase/pull/1780)
- fix(utils): fix json-templates bug and moved to utils [`#1784`](https://github.com/nocobase/nocobase/pull/1784)
- fix(evaluators): fix date result in variable [`#1781`](https://github.com/nocobase/nocobase/pull/1781)
- fix: fix button design about edit action [`#1755`](https://github.com/nocobase/nocobase/pull/1755)
- chore: enable overring field default value [`#1777`](https://github.com/nocobase/nocobase/pull/1777)

### Commits

- chore(versions): 😊 publish v0.9.3-alpha.1 [`cf0a921`](https://github.com/nocobase/nocobase/commit/cf0a921f85e4eb783ce7d61a7d5f5f354078a7c1)
- chore: update changelog [`daf2034`](https://github.com/nocobase/nocobase/commit/daf2034f8d6aa5857fc0802586668a35f0140b4a)
- chore: fix lint errors [`23ad507`](https://github.com/nocobase/nocobase/commit/23ad507261399b0be72b02e5399bf42ff9df48cb)

## [v0.9.2-alpha.4](https://github.com/nocobase/nocobase/compare/v0.9.2-alpha.3...v0.9.2-alpha.4) - 2023-04-26

### Merged

- feat: node args in pm2 runtime [`#1774`](https://github.com/nocobase/nocobase/pull/1774)
- fix: hide default value for expression [`#1765`](https://github.com/nocobase/nocobase/pull/1765)
- fix(AssociationSelect): fix x-read-pretty not working [`#1766`](https://github.com/nocobase/nocobase/pull/1766)
- fix: fixed the configuration field filter [`#1742`](https://github.com/nocobase/nocobase/pull/1742)
- fix(filter-block): fix association fields not being filtered [`#1758`](https://github.com/nocobase/nocobase/pull/1758)
- fix(variable-input): fix style [`#1761`](https://github.com/nocobase/nocobase/pull/1761)
- chore: skip sync overriding field default value [`#1762`](https://github.com/nocobase/nocobase/pull/1762)
- fix: gantt abnormal drag and drop update action [`#1760`](https://github.com/nocobase/nocobase/pull/1760)

### Commits

- chore(versions): 😊 publish v0.9.2-alpha.4 [`923f6e7`](https://github.com/nocobase/nocobase/commit/923f6e788419991b8215110a5f2ffc7eba4d2d5f)
- docs: update changelog [`2c75aa7`](https://github.com/nocobase/nocobase/commit/2c75aa723d61c4d07554aaa5c4abb8df7e102359)
- chore: cleanup [`77a6cbf`](https://github.com/nocobase/nocobase/commit/77a6cbf7733ea55c0db761c5d23974a41563fbd3)

## [v0.9.2-alpha.3](https://github.com/nocobase/nocobase/compare/v0.9.2-alpha.2...v0.9.2-alpha.3) - 2023-04-25

### Merged

- fix: eslint [`#1759`](https://github.com/nocobase/nocobase/pull/1759)
- feat: deleted collection field give some tips [`#1744`](https://github.com/nocobase/nocobase/pull/1744)
- chore: optimize the white screen problem [`#1639`](https://github.com/nocobase/nocobase/pull/1639)
- fix: plugin-manage and designable-switch add tooltip [`#1749`](https://github.com/nocobase/nocobase/pull/1749)
- chore: update dockerfile [`#1754`](https://github.com/nocobase/nocobase/pull/1754)
- chore(comment): collectionOptions.duplicator [`#1752`](https://github.com/nocobase/nocobase/pull/1752)
- fix: custom column title, same as form field title [`#1745`](https://github.com/nocobase/nocobase/pull/1745)
- feat: support to use variables to set default value [`#1726`](https://github.com/nocobase/nocobase/pull/1726)
- fix(plugin-workflow): request headers and params should support input [`#1750`](https://github.com/nocobase/nocobase/pull/1750)
- fix(client): fix initializer meno props based on antd@^4.24 [`#1746`](https://github.com/nocobase/nocobase/pull/1746)
- fix: improve the display of the title field [`#1741`](https://github.com/nocobase/nocobase/pull/1741)
- fix: batch edit deletes relational table fields [`#1743`](https://github.com/nocobase/nocobase/pull/1743)
- style: automatically omit table cell content based on width [`#1646`](https://github.com/nocobase/nocobase/pull/1646)
- feat(collection-manager): support for setting the title field [`#1729`](https://github.com/nocobase/nocobase/pull/1729)
- fix: acl scope support variables [`#1660`](https://github.com/nocobase/nocobase/pull/1660)
- fix: filter-condition-update-incorrectly(switch "and"、"or") [`#1737`](https://github.com/nocobase/nocobase/pull/1737)
- fix(plugin-workflow): fix foreignkey in variable [`#1740`](https://github.com/nocobase/nocobase/pull/1740)
- fix(plugin-formula): remove showUnchecked option [`#1730`](https://github.com/nocobase/nocobase/pull/1730)
- fix(plugin-workflow): fix manual migration script [`#1735`](https://github.com/nocobase/nocobase/pull/1735)
- fix: correcting misspelled word [`#1731`](https://github.com/nocobase/nocobase/pull/1731)
- fix(FilterFormBlock): fix association field can not to filter [`#1699`](https://github.com/nocobase/nocobase/pull/1699)
- feat: add react-hooks lint [`#1728`](https://github.com/nocobase/nocobase/pull/1728)
- fix: missing spacing after dragging [`#1671`](https://github.com/nocobase/nocobase/pull/1671)
- fix: load view collection [`#1727`](https://github.com/nocobase/nocobase/pull/1727)

### Commits

- chore(versions): 😊 publish v0.9.2-alpha.3 [`9756dd1`](https://github.com/nocobase/nocobase/commit/9756dd134b741dfcea4546f36182f64c56b87a52)
- fix(collection-manager): fix table layout [`683db5b`](https://github.com/nocobase/nocobase/commit/683db5b3ba3cfe83e5f5574075ebc1b657d42de1)
- refactor: fix lint error [`7b9bfa1`](https://github.com/nocobase/nocobase/commit/7b9bfa116ff625a06d7c575f51fefd7dfb6cf711)

## [v0.9.2-alpha.2](https://github.com/nocobase/nocobase/compare/v0.9.2-alpha.1...v0.9.2-alpha.2) - 2023-04-19

### Merged

- fix: press enter to reload when the Pagination is focused [`#1720`](https://github.com/nocobase/nocobase/pull/1720)

### Commits

- chore(versions): 😊 publish v0.9.2-alpha.2 [`3dfd5a1`](https://github.com/nocobase/nocobase/commit/3dfd5a1f7a3ff14606357f441f547f40fdaa1344)

## [v0.9.2-alpha.1](https://github.com/nocobase/nocobase/compare/v0.9.1-alpha.2...v0.9.2-alpha.1) - 2023-04-19

### Merged

- refactor(plugin-workflow): change single form to custom form block [`#1707`](https://github.com/nocobase/nocobase/pull/1707)
- chore(ci): add timeout config for jobs [`#1725`](https://github.com/nocobase/nocobase/pull/1725)
- refactor(plugin-workflow): migrate menu items to options [`#1724`](https://github.com/nocobase/nocobase/pull/1724)
- fix(client): fix error on clear value in variable input [`#1723`](https://github.com/nocobase/nocobase/pull/1723)
- fix(record-picker): fix the table paging problem [`#1718`](https://github.com/nocobase/nocobase/pull/1718)
- fix(map-plugin): some data is incorrect [`#1717`](https://github.com/nocobase/nocobase/pull/1717)
- fix: data scope not effect in gantt [`#1716`](https://github.com/nocobase/nocobase/pull/1716)
- fix: button loading does not disappear when the  operation submit failed [`#1698`](https://github.com/nocobase/nocobase/pull/1698)
- fix(linkage rule):multiple select  condition judgment failed  [`#1715`](https://github.com/nocobase/nocobase/pull/1715)
- Fix/save through table data [`#1714`](https://github.com/nocobase/nocobase/pull/1714)
- feat: improve ui design for linkage action [`#1659`](https://github.com/nocobase/nocobase/pull/1659)
- feat(map): support to filter other blocks [`#1691`](https://github.com/nocobase/nocobase/pull/1691)
- refactor: improve linkage rule enable [`#1700`](https://github.com/nocobase/nocobase/pull/1700)
- fix: find fields arg [`#1710`](https://github.com/nocobase/nocobase/pull/1710)
- feat(form-block): data templates [`#1704`](https://github.com/nocobase/nocobase/pull/1704)
- fix: linkage relationship data condition judgment failed [`#1681`](https://github.com/nocobase/nocobase/pull/1681)
- fix(gantt): update permission check  in gantt block [`#1701`](https://github.com/nocobase/nocobase/pull/1701)
- fix: clearFormGraph [`#1706`](https://github.com/nocobase/nocobase/pull/1706)
- fix(plugin-workflow): fix request body variable component [`#1703`](https://github.com/nocobase/nocobase/pull/1703)
- fix(gantt):  improve task bar text [`#1696`](https://github.com/nocobase/nocobase/pull/1696)
- fix: long text should be line feed [`#1686`](https://github.com/nocobase/nocobase/pull/1686)
- fix: cannot display data when remove last page and the page only just one item [`#1685`](https://github.com/nocobase/nocobase/pull/1685)
- fix: meta acl with association query [`#1695`](https://github.com/nocobase/nocobase/pull/1695)
- fix: linkage rule title can not set empty [`#1688`](https://github.com/nocobase/nocobase/pull/1688)
- feat: improve plugin manager ui [`#1650`](https://github.com/nocobase/nocobase/pull/1650)
- feat: gantt block [`#1393`](https://github.com/nocobase/nocobase/pull/1393)
- fix(client): fix constant input lose focus in variable [`#1689`](https://github.com/nocobase/nocobase/pull/1689)
- feat(plugin-workflow): add workflow specific logger [`#1677`](https://github.com/nocobase/nocobase/pull/1677)
- fix: remove designer [`#1684`](https://github.com/nocobase/nocobase/pull/1684)
- test: should load the .env.test [`#1678`](https://github.com/nocobase/nocobase/pull/1678)
- fix: incorrect language after logout [`#1679`](https://github.com/nocobase/nocobase/pull/1679)
- feat: optimize file collection [`#1666`](https://github.com/nocobase/nocobase/pull/1666)
- fix: sort field init performance [`#1675`](https://github.com/nocobase/nocobase/pull/1675)
- fix(plugin-workflow): fix null collection fields [`#1674`](https://github.com/nocobase/nocobase/pull/1674)
- fix(client): fix variable component read pretty mode [`#1673`](https://github.com/nocobase/nocobase/pull/1673)
- fix: ui problem of compact theme [`#1670`](https://github.com/nocobase/nocobase/pull/1670)
- fix: linkage rule enable effect in form [`#1669`](https://github.com/nocobase/nocobase/pull/1669)
- feat: collection template summary [`#1672`](https://github.com/nocobase/nocobase/pull/1672)
- feat: (plugin-workflow) dynamic expression [`#1560`](https://github.com/nocobase/nocobase/pull/1560)
- chore: find inherit collection warn [`#1663`](https://github.com/nocobase/nocobase/pull/1663)
- fix: linkage rule title config clear exception [`#1665`](https://github.com/nocobase/nocobase/pull/1665)
- feat: support tableoid filter [`#1657`](https://github.com/nocobase/nocobase/pull/1657)
- feat(plugin-workflow): add array mapping support in processor [`#1662`](https://github.com/nocobase/nocobase/pull/1662)
- fix(plugin-workflow): fix appends null to collection trigger [`#1661`](https://github.com/nocobase/nocobase/pull/1661)
- feat(filter-operators): eq and ne operators support array [`#1658`](https://github.com/nocobase/nocobase/pull/1658)
- fix(plugin-workflow): fix todo drawer data load [`#1656`](https://github.com/nocobase/nocobase/pull/1656)
- refactor(client): improve translation [`#1654`](https://github.com/nocobase/nocobase/pull/1654)
- fix: fix the 'Add menu item' button disappears [`#1655`](https://github.com/nocobase/nocobase/pull/1655)
- chore: add new allowAddtoCurrent config [`#1652`](https://github.com/nocobase/nocobase/pull/1652)
- feat: support file collection [`#1636`](https://github.com/nocobase/nocobase/pull/1636)
- fix(plugin-workflow): fix manual node drawer [`#1653`](https://github.com/nocobase/nocobase/pull/1653)
- chore: inhertis api with difference schema [`#1545`](https://github.com/nocobase/nocobase/pull/1545)
- fix: select record can not enable child collection [`#1649`](https://github.com/nocobase/nocobase/pull/1649)
- feat: plugin before enable hook [`#1648`](https://github.com/nocobase/nocobase/pull/1648)
- chore: add transaction in set field action [`#1647`](https://github.com/nocobase/nocobase/pull/1647)
- fix(linkage rule):linkage rule not display in action  [`#1644`](https://github.com/nocobase/nocobase/pull/1644)
- refactor: view collection options [`#1643`](https://github.com/nocobase/nocobase/pull/1643)
- fix: update field error [`#1645`](https://github.com/nocobase/nocobase/pull/1645)
- feat(Table): column action support linkage rules [`#1638`](https://github.com/nocobase/nocobase/pull/1638)
- fix(view-collection):  field name cannot be edited when there with field source [`#1642`](https://github.com/nocobase/nocobase/pull/1642)
- fix: linkage rule config closing rules require reopening the form to take effect [`#1640`](https://github.com/nocobase/nocobase/pull/1640)
- refactor(client): change Variable.TextArea to controlled component [`#1605`](https://github.com/nocobase/nocobase/pull/1605)
- fix: get pg view def [`#1641`](https://github.com/nocobase/nocobase/pull/1641)
- fix: infer view column type with alias [`#1634`](https://github.com/nocobase/nocobase/pull/1634)
- fix(plugin-workflow): fix minors ui issues [`#1635`](https://github.com/nocobase/nocobase/pull/1635)
- chore: disabled underscored in view collection. [`#1633`](https://github.com/nocobase/nocobase/pull/1633)
- fix: form action dragging area is too large [`#1628`](https://github.com/nocobase/nocobase/pull/1628)
- fix: FixedBlock related ui [`#1632`](https://github.com/nocobase/nocobase/pull/1632)
- feat:  database view collection [`#1587`](https://github.com/nocobase/nocobase/pull/1587)
- fix: init sort value in sort field with scopeKey [`#1626`](https://github.com/nocobase/nocobase/pull/1626)
- style: linkage rule style improve [`#1625`](https://github.com/nocobase/nocobase/pull/1625)
- fix: find with attributes and group [`#1411`](https://github.com/nocobase/nocobase/pull/1411)
- docs: transform video link to video tag [`#1414`](https://github.com/nocobase/nocobase/pull/1414)
- feat(parse-variables): support to parse variables in filter params [`#1558`](https://github.com/nocobase/nocobase/pull/1558)
- fix(linkage rules) :  support naming, enabling and disabling, copying, and assigning null values [`#1511`](https://github.com/nocobase/nocobase/pull/1511)
- chore: update test ci [`#1622`](https://github.com/nocobase/nocobase/pull/1622)
- fix:  history add new button does not support enabling child collection [`#1536`](https://github.com/nocobase/nocobase/pull/1536)
- fix/(linkages-action): detail block actions does not support linkage rules [`#1504`](https://github.com/nocobase/nocobase/pull/1504)
- fix: avoid fixedblock height working in popup [`#1621`](https://github.com/nocobase/nocobase/pull/1621)
- fix: when the page has FixedBlock, the table of popup is not displayed [`#1619`](https://github.com/nocobase/nocobase/pull/1619)
- feat: association-filter-improve  [`#1606`](https://github.com/nocobase/nocobase/pull/1606)
- fix(Table): cannot display table data [`#1617`](https://github.com/nocobase/nocobase/pull/1617)
- fix(plugin-workflow): fix todo list form read-pretty for non-assigneed user [`#1615`](https://github.com/nocobase/nocobase/pull/1615)
- feat(table): hidden pagination when only one page is available [`#1614`](https://github.com/nocobase/nocobase/pull/1614)
- refactor:  improve FixedBlock performance [`#1593`](https://github.com/nocobase/nocobase/pull/1593)
- fix(collection-manager): infinite recursion [`#1608`](https://github.com/nocobase/nocobase/pull/1608)
- fix(audit-logs): Add ellipsis feature to table columns  [`#1603`](https://github.com/nocobase/nocobase/pull/1603)
- feat: improve the non-link ui of association data [`#1602`](https://github.com/nocobase/nocobase/pull/1602)
- feat(Kanban): the card support open mode [`#1601`](https://github.com/nocobase/nocobase/pull/1601)
- fix( importable-field): incorrect display when moving sort handle [`#1613`](https://github.com/nocobase/nocobase/pull/1613)
- fix: enable child collections remain after deleting a child collection [`#1610`](https://github.com/nocobase/nocobase/pull/1610)
- fix: destroy through table record referencing collections table [`#1611`](https://github.com/nocobase/nocobase/pull/1611)
- fix(plugin-workflow): add default actions value of manual node [`#1600`](https://github.com/nocobase/nocobase/pull/1600)
- feat(plugin-workflow): add failOnEmpty option for query node [`#1599`](https://github.com/nocobase/nocobase/pull/1599)
- fix(plugin-workflow): use toJSON instead of get to get valid result [`#1596`](https://github.com/nocobase/nocobase/pull/1596)
- Translation pt-BR (Brazilian Portuguese) [`#1591`](https://github.com/nocobase/nocobase/pull/1591)
- fix: role permission add new scope display blank [`#1592`](https://github.com/nocobase/nocobase/pull/1592)
- fix(FixedBlock): avoid kanban triggering programmatic scrolling [`#1406`](https://github.com/nocobase/nocobase/pull/1406)
- fix: repeat request categories when switching between graph interface and collection&fields [`#1590`](https://github.com/nocobase/nocobase/pull/1590)
- fix: collectionFieldsOptions cannot get all fields [`#1588`](https://github.com/nocobase/nocobase/pull/1588)
- fix(plugin-workflow): fix input width in request node config [`#1585`](https://github.com/nocobase/nocobase/pull/1585)
- feat(filter-blocks): support filter-blocks [`#1505`](https://github.com/nocobase/nocobase/pull/1505)
- refactor: multi-app [`#1578`](https://github.com/nocobase/nocobase/pull/1578)
- feat: compact theme [`#1574`](https://github.com/nocobase/nocobase/pull/1574)
- feat: support cron field [`#1421`](https://github.com/nocobase/nocobase/pull/1421)
- fix(Calendar): ensur to get correct gridInitializer when adding a new… [`#1425`](https://github.com/nocobase/nocobase/pull/1425)
- feat(markdown): support mermaid and better style [`#1583`](https://github.com/nocobase/nocobase/pull/1583)
- fix(plugin-map): map block repeats [`#1582`](https://github.com/nocobase/nocobase/pull/1582)
- feat: tree collection [`#1561`](https://github.com/nocobase/nocobase/pull/1561)
- feat(plugin-map): add map block [`#1486`](https://github.com/nocobase/nocobase/pull/1486)
- chore: lazy load sub app in share collection [`#1569`](https://github.com/nocobase/nocobase/pull/1569)
- fix(record-picker): supports adding sub-collection records [`#1573`](https://github.com/nocobase/nocobase/pull/1573)
- fix: app manager reload [`#1565`](https://github.com/nocobase/nocobase/pull/1565)
- feat: multi-app-share-collection plugin [`#1562`](https://github.com/nocobase/nocobase/pull/1562)
- feat: record picker support to enable links [`#1515`](https://github.com/nocobase/nocobase/pull/1515)
- feat: multiple apps [`#1540`](https://github.com/nocobase/nocobase/pull/1540)
- docs(client): add variable docs [`#1556`](https://github.com/nocobase/nocobase/pull/1556)
- fix(charts): improve chart table preview with object type [`#1555`](https://github.com/nocobase/nocobase/pull/1555)
- feat(plugin-workflow) config preload associations in triggers and nodes [`#1548`](https://github.com/nocobase/nocobase/pull/1548)

### Fixed

- fix(plugin-workflow): fix todo list form read-pretty for non-assigneed user (#1615) [`#1572`](https://github.com/nocobase/nocobase/issues/1572)

### Commits

- chore(versions): 😊 publish v0.9.2-alpha.1 [`d1adc9d`](https://github.com/nocobase/nocobase/commit/d1adc9de0b87b896e90c81c226646b840309c240)
- fix(file-manager): upgrade s3 version [`50183b0`](https://github.com/nocobase/nocobase/commit/50183b065d32be5d2f6590bfb0c6190fafc12881)
- fix: linkage rule [`b8776fe`](https://github.com/nocobase/nocobase/commit/b8776fe2d0fd6729c18b968d9f7b15e7c81c4ef2)

## [v0.9.1-alpha.2](https://github.com/nocobase/nocobase/compare/v0.9.1-alpha.1...v0.9.1-alpha.2) - 2023-03-09

### Merged

- fix(plugin-workflow): fix module import (#1550) [`#1552`](https://github.com/nocobase/nocobase/pull/1552)
- chore: relation repository response when source model not found [`#1546`](https://github.com/nocobase/nocobase/pull/1546)
- fix(plugin-workflow): fix assignees config component in manual node [`#1547`](https://github.com/nocobase/nocobase/pull/1547)
- feat: stopped state in application [`#1543`](https://github.com/nocobase/nocobase/pull/1543)
- fix(plugin-workflow): fix AssociationInput field path [`#1542`](https://github.com/nocobase/nocobase/pull/1542)
- fix: cache with index.html [`#1541`](https://github.com/nocobase/nocobase/pull/1541)
- fix: belongs to many through table with custom schema [`#1539`](https://github.com/nocobase/nocobase/pull/1539)
- fix(plugin-formula): expose formula field result in form [`#1534`](https://github.com/nocobase/nocobase/pull/1534)
- test: with collection_manager_schema env [`#1532`](https://github.com/nocobase/nocobase/pull/1532)
- fix: filter by association field with underscored [`#1537`](https://github.com/nocobase/nocobase/pull/1537)
- fix(charts): fix copy [`#1533`](https://github.com/nocobase/nocobase/pull/1533)
- feat: add chart plugin [`#1477`](https://github.com/nocobase/nocobase/pull/1477)
- feat: support add new  in block for inheritance collection [`#1518`](https://github.com/nocobase/nocobase/pull/1518)
- refactor(plugin-workflow): change canvas card and adjust styles [`#1529`](https://github.com/nocobase/nocobase/pull/1529)
- fix: test with nocobase plugin [`#1525`](https://github.com/nocobase/nocobase/pull/1525)
- fix: nginx cache [`#1523`](https://github.com/nocobase/nocobase/pull/1523)
- fix: remove field when collection has difference schema with database [`#1524`](https://github.com/nocobase/nocobase/pull/1524)

### Commits

- chore(versions): 😊 publish v0.9.1-alpha.2 [`bc5156d`](https://github.com/nocobase/nocobase/commit/bc5156d458adecce8189aa535e5738672e63c2c0)
- fix: add new blocks [`3904aa7`](https://github.com/nocobase/nocobase/commit/3904aa7c111eaa522cc7072a268a579aa115906e)
- fix: schema name conflicts [`a463c3d`](https://github.com/nocobase/nocobase/commit/a463c3d747666496721571110bd77dba3726c2f7)

## [v0.9.1-alpha.1](https://github.com/nocobase/nocobase/compare/v0.9.0-alpha.2...v0.9.1-alpha.1) - 2023-03-03

### Merged

- refactor: audit logs block [`#1517`](https://github.com/nocobase/nocobase/pull/1517)
- fix(evaluators): fix preprocessing and add test cases [`#1519`](https://github.com/nocobase/nocobase/pull/1519)
- chore(debug): fix debug filename when run test [`#1520`](https://github.com/nocobase/nocobase/pull/1520)
- feat: collection manager schema env [`#1506`](https://github.com/nocobase/nocobase/pull/1506)
- fix(client): fix checkbox unchecked display [`#1508`](https://github.com/nocobase/nocobase/pull/1508)
- feat(snapshot-field): improve transition [`#1513`](https://github.com/nocobase/nocobase/pull/1513)
- fix(plugin-workflow): fix CollectionField validation when using variable [`#1512`](https://github.com/nocobase/nocobase/pull/1512)
- feat(plugin-formula): calculation with snapshot field [`#1498`](https://github.com/nocobase/nocobase/pull/1498)
- fix(association-select): filter without data scope not work [`#1509`](https://github.com/nocobase/nocobase/pull/1509)
- feat: fallback sort field init to createdAt field [`#1507`](https://github.com/nocobase/nocobase/pull/1507)
- fix(graphical-interface): collection category does not display title [`#1503`](https://github.com/nocobase/nocobase/pull/1503)
- fix(association-select): data is incorrect when use data scope [`#1491`](https://github.com/nocobase/nocobase/pull/1491)
- feat: dialect version accessors [`#1502`](https://github.com/nocobase/nocobase/pull/1502)
- fix: collection schema updated but model _schema not change [`#1500`](https://github.com/nocobase/nocobase/pull/1500)
- Update zh_CN.ts [`#1481`](https://github.com/nocobase/nocobase/pull/1481)
- fix(linkageRules): support empty condiction [`#1496`](https://github.com/nocobase/nocobase/pull/1496)
- feat: form/button linkage rules [`#1456`](https://github.com/nocobase/nocobase/pull/1456)
- fix: collection importer has incorrect reference [`#1495`](https://github.com/nocobase/nocobase/pull/1495)
- feat: support custom plugin deployment in dockerfile [`#1494`](https://github.com/nocobase/nocobase/pull/1494)
- fix: environment variables [`#1490`](https://github.com/nocobase/nocobase/pull/1490)
- feat: prepare database method [`#1492`](https://github.com/nocobase/nocobase/pull/1492)
- Fix/multiple schema query [`#1488`](https://github.com/nocobase/nocobase/pull/1488)
- fix: string violation [`#1487`](https://github.com/nocobase/nocobase/pull/1487)
- refactor(plugin-workflow): migrate evaluators [`#1485`](https://github.com/nocobase/nocobase/pull/1485)
- docs: fix typo [`#1482`](https://github.com/nocobase/nocobase/pull/1482)
- fix(plugin-workflow): fix customized job status [`#1484`](https://github.com/nocobase/nocobase/pull/1484)
- fix(plugin-workflow): fix condition config param [`#1483`](https://github.com/nocobase/nocobase/pull/1483)
- fix(plugin-workflow): fix migration [`#1479`](https://github.com/nocobase/nocobase/pull/1479)
- fix(plugin-workflow): fix migration on table prefix [`#1478`](https://github.com/nocobase/nocobase/pull/1478)
- refactor(plugin-formula): combine 2 formula field type into 1 [`#1457`](https://github.com/nocobase/nocobase/pull/1457)
- fix(plugin-workflow): fix migration for calculation [`#1476`](https://github.com/nocobase/nocobase/pull/1476)
- fix(plugin-workflow): fix schedule trigger number type repeat [`#1475`](https://github.com/nocobase/nocobase/pull/1475)
- Feat(plugin-workflow) manual instruction [`#1339`](https://github.com/nocobase/nocobase/pull/1339)
- feat: support for importing attachments [`#1466`](https://github.com/nocobase/nocobase/pull/1466)
- fix:  column not exists error after destory relation field [`#1465`](https://github.com/nocobase/nocobase/pull/1465)
- fix: add schema [`#1464`](https://github.com/nocobase/nocobase/pull/1464)
- fix: avoid o2o, o2m can select the data already selected [`#1462`](https://github.com/nocobase/nocobase/pull/1462)
- feat: add test cases [`#1463`](https://github.com/nocobase/nocobase/pull/1463)
- feat: update zh_CN.ts [`#1458`](https://github.com/nocobase/nocobase/pull/1458)
- refactor: export plugin [`#1460`](https://github.com/nocobase/nocobase/pull/1460)
- Fix/pg schema with inherit [`#1446`](https://github.com/nocobase/nocobase/pull/1446)
- feat: multiple apps admin [`#1431`](https://github.com/nocobase/nocobase/pull/1431)
- chore: fix build plugin error [`#1454`](https://github.com/nocobase/nocobase/pull/1454)
- feat: provide the underscored option for the database [`#1366`](https://github.com/nocobase/nocobase/pull/1366)
- Revert "fix(table): make filed overflow behavior right (#1392)" [`#1452`](https://github.com/nocobase/nocobase/pull/1452)
- fix(collection category): zh_cn locale defect [`#1451`](https://github.com/nocobase/nocobase/pull/1451)
- feat: add namespace and duplicator parameters for collection options [`#1449`](https://github.com/nocobase/nocobase/pull/1449)
- fix(snapshot-field): remove depth limit [`#1450`](https://github.com/nocobase/nocobase/pull/1450)
- chore: update licenses url [`#1285`](https://github.com/nocobase/nocobase/pull/1285)
- feat: association snapshot [`#1438`](https://github.com/nocobase/nocobase/pull/1438)
- fix(table): make filed overflow behavior right [`#1392`](https://github.com/nocobase/nocobase/pull/1392)
- fix(plugin-sequence): fix missed createdAt field in bulk hook [`#1448`](https://github.com/nocobase/nocobase/pull/1448)
- fix: error:0308010C:digital envelope routines::unsupported [`#1447`](https://github.com/nocobase/nocobase/pull/1447)
- feat: collection categories [`#1327`](https://github.com/nocobase/nocobase/pull/1327)
- fix(plugin-fm): fix path config for storages [`#1445`](https://github.com/nocobase/nocobase/pull/1445)
- fix: node.js 17+, add openssl-legacy-provider [`#1434`](https://github.com/nocobase/nocobase/pull/1434)
- fix(plugin-workflow): fix schedule on field null value [`#1442`](https://github.com/nocobase/nocobase/pull/1442)
- feat: pg schema support [`#1439`](https://github.com/nocobase/nocobase/pull/1439)
- fix(i18n): set key and ns separator default to false [`#1432`](https://github.com/nocobase/nocobase/pull/1432)
- feat: disable trigger when import collection [`#1417`](https://github.com/nocobase/nocobase/pull/1417)
- chore: translate 'Add tab' in page header [`#1424`](https://github.com/nocobase/nocobase/pull/1424)
- fix(plugin-workflow): use promise to request [`#1426`](https://github.com/nocobase/nocobase/pull/1426)
- fix(acl): custom appends merge strategy [`#1416`](https://github.com/nocobase/nocobase/pull/1416)
- docs: update G2Plot example url [`#1408`](https://github.com/nocobase/nocobase/pull/1408)
- docs: fix typo [`#1412`](https://github.com/nocobase/nocobase/pull/1412)
- fix(FixedBlock): using both association filters and FixedBlock does not show the complete table [`#1405`](https://github.com/nocobase/nocobase/pull/1405)
- feat(calendar): startDate and endDate support the use of association fields [`#1397`](https://github.com/nocobase/nocobase/pull/1397)
- fix: load through collection before belongsToMany field bind [`#1409`](https://github.com/nocobase/nocobase/pull/1409)
- feat(verification-plugin): support tencent sms [`#1382`](https://github.com/nocobase/nocobase/pull/1382)
- fix: foreign keys are editable when adding fields [`#1404`](https://github.com/nocobase/nocobase/pull/1404)
- fix: navbar_ui style [`#1398`](https://github.com/nocobase/nocobase/pull/1398)
- fix: inherit startup sort [`#1402`](https://github.com/nocobase/nocobase/pull/1402)
- fix(plugin-workflow): fix url input width for request config [`#1401`](https://github.com/nocobase/nocobase/pull/1401)
- Fix/snapshot [`#1396`](https://github.com/nocobase/nocobase/pull/1396)
- feat: fix  through collections inherits filter [`#1394`](https://github.com/nocobase/nocobase/pull/1394)
- Fix(plugin-sequence): support sequence field in m2m through table [`#1383`](https://github.com/nocobase/nocobase/pull/1383)
- fix(plugin-workflow): adjust executed alert position [`#1381`](https://github.com/nocobase/nocobase/pull/1381)
- fix: through collection individual hooks [`#1378`](https://github.com/nocobase/nocobase/pull/1378)
- fix: through collection records should not be reset [`#1377`](https://github.com/nocobase/nocobase/pull/1377)
- feat(client): add form disabled context [`#1374`](https://github.com/nocobase/nocobase/pull/1374)
- Fix(plugin-workflow): request node [`#1367`](https://github.com/nocobase/nocobase/pull/1367)

### Commits

- docs: add plug-in documentation [`68511f0`](https://github.com/nocobase/nocobase/commit/68511f05bc7dbca49e0ab95eb868a193a3502d71)
- feat(db): field value parser [`5805b69`](https://github.com/nocobase/nocobase/commit/5805b69455532ad643e9c87831da985d41bc5d6d)
- chore(versions): 😊 publish v0.9.1-alpha.1 [`946c8f2`](https://github.com/nocobase/nocobase/commit/946c8f25a3df538f4a83abe4468786cf554d8914)

## [v0.9.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.9.0-alpha.1...v0.9.0-alpha.2) - 2023-01-14

### Merged

- feat: load multiple languages dynamically [`#1355`](https://github.com/nocobase/nocobase/pull/1355)
- refactor(plugin-workflow): refactor request instruction [`#1356`](https://github.com/nocobase/nocobase/pull/1356)
- feat: update dependencies [`#1353`](https://github.com/nocobase/nocobase/pull/1353)

### Commits

- feat: add en-US.example.json [`86554c0`](https://github.com/nocobase/nocobase/commit/86554c0205d6cb8f5dd3a293c9929b4aa9cb5897)
- fix: locale cache [`a4116a2`](https://github.com/nocobase/nocobase/commit/a4116a251b00109dad96e5062bf9b6441544f8b3)
- chore(versions): 😊 publish v0.9.0-alpha.2 [`daa91e9`](https://github.com/nocobase/nocobase/commit/daa91e95a6192bac19702eb17e9f764a7df11477)

## [v0.9.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.8.1-alpha.4...v0.9.0-alpha.1) - 2023-01-11

### Merged

- feat: change license [`#1350`](https://github.com/nocobase/nocobase/pull/1350)
- feat: formula plugin [`#1344`](https://github.com/nocobase/nocobase/pull/1344)
- feat: acl optimization [`#1136`](https://github.com/nocobase/nocobase/pull/1136)
- feat: duplicator plugin [`#1265`](https://github.com/nocobase/nocobase/pull/1265)
- fix(plugin-workflow): fix missed preparing [`#1337`](https://github.com/nocobase/nocobase/pull/1337)
- fix: FixedBlock does not disappear when the current tab is deleted [`#1324`](https://github.com/nocobase/nocobase/pull/1324)
- feat(Select): should compile title and label [`#1332`](https://github.com/nocobase/nocobase/pull/1332)
- fix: improve filter [`#1333`](https://github.com/nocobase/nocobase/pull/1333)

### Commits

- chore(versions): 😊 publish v0.9.0-alpha.1 [`013f091`](https://github.com/nocobase/nocobase/commit/013f0916a521fef74970ba6feed76c1b17b6ff01)
- fix: typeError: Cannot read properties of undefined (reading 'find') [`1dc4142`](https://github.com/nocobase/nocobase/commit/1dc4142da2195fb6f09bd691b23948d9d5f9e01d)
- feat: improve translation [`31794d3`](https://github.com/nocobase/nocobase/commit/31794d3c1b7af13d9dbaca8d12b1843c18553307)

## [v0.8.1-alpha.4](https://github.com/nocobase/nocobase/compare/v0.8.1-alpha.2...v0.8.1-alpha.4) - 2023-01-05

### Merged

- chore(versions): 😊 publish v0.8.1-alpha.4 [`#1331`](https://github.com/nocobase/nocobase/pull/1331)

## [v0.8.1-alpha.2](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.13...v0.8.1-alpha.2) - 2023-01-05

### Merged

- fix(plugin-sequence-field): integer generated should not less then start [`#1330`](https://github.com/nocobase/nocobase/pull/1330)
- fix: filter removeNullConditions [`#1329`](https://github.com/nocobase/nocobase/pull/1329)
- fix: snapshot display fix [`#1328`](https://github.com/nocobase/nocobase/pull/1328)
- fix(plugin-workflow): fix history drawer in workflow canvas [`#1326`](https://github.com/nocobase/nocobase/pull/1326)
- feat: snapshot field plugin [`#1253`](https://github.com/nocobase/nocobase/pull/1253)
- feat: configure fields style fix [`#1322`](https://github.com/nocobase/nocobase/pull/1322)
- fix(plugin-workflow): fix events in prepare [`#1325`](https://github.com/nocobase/nocobase/pull/1325)
- fix(database): filter match [`#1319`](https://github.com/nocobase/nocobase/pull/1319)
- fix: action merge params [`#1321`](https://github.com/nocobase/nocobase/pull/1321)
- chore:  set belongs to many on delete to cascade [`#1311`](https://github.com/nocobase/nocobase/pull/1311)
- fix: disable filterByTk options in destory method when collection has no primary key or has composite primary key [`#1313`](https://github.com/nocobase/nocobase/pull/1313)
- fix: slow find with include in mysql [`#1304`](https://github.com/nocobase/nocobase/pull/1304)
- fix(map-plugin): cannot save because the value is null  [`#1309`](https://github.com/nocobase/nocobase/pull/1309)
- fix: create inherits with table name contains upper case [`#1308`](https://github.com/nocobase/nocobase/pull/1308)
- fix: upgrade error [`#1303`](https://github.com/nocobase/nocobase/pull/1303)
- fix: association filter [`#1301`](https://github.com/nocobase/nocobase/pull/1301)
- fix: pageSize 200 & not a function [`#1299`](https://github.com/nocobase/nocobase/pull/1299)
- refactor(client): make tab initializer more common [`#1298`](https://github.com/nocobase/nocobase/pull/1298)
- fix(Select): title field and clear button not work [`#1296`](https://github.com/nocobase/nocobase/pull/1296)
- fix(plugin-fm): fix local storage config and skip empty base url [`#1294`](https://github.com/nocobase/nocobase/pull/1294)
- feat: antd-&gt;4.2.8 [`#1231`](https://github.com/nocobase/nocobase/pull/1231)
- feat: association filter [`#1274`](https://github.com/nocobase/nocobase/pull/1274)
- chore: upgrade sequelize version to to latest [`#1234`](https://github.com/nocobase/nocobase/pull/1234)
- feat: add iframe-block plugin [`#1281`](https://github.com/nocobase/nocobase/pull/1281)
- feat: update page size to 200 and limit fields [`#1282`](https://github.com/nocobase/nocobase/pull/1282)
- fix: prevent horizontal scroll of menus [`#1279`](https://github.com/nocobase/nocobase/pull/1279)
- Turkish language created for Docs. Belgeler için türkçe dil desteği [`#1071`](https://github.com/nocobase/nocobase/pull/1071)
- fix(client/kanban): fix kanban card default active all fields bug [`#1270`](https://github.com/nocobase/nocobase/pull/1270)
- fix: cannot delete event in calendar [`#1277`](https://github.com/nocobase/nocobase/pull/1277)
- fix(AssociationSelect): missing field title in details [`#1275`](https://github.com/nocobase/nocobase/pull/1275)
- fix: menu cannot scroll [`#1276`](https://github.com/nocobase/nocobase/pull/1276)
- feat: support fixed block [`#1267`](https://github.com/nocobase/nocobase/pull/1267)
- fix(plugin-sequence): fix test case [`#1268`](https://github.com/nocobase/nocobase/pull/1268)
- fix(plugin-sequence): fix update pattern index [`#1266`](https://github.com/nocobase/nocobase/pull/1266)
- feat : support fixed menu and header [`#1260`](https://github.com/nocobase/nocobase/pull/1260)
- fix: destroy field in parent table [`#1263`](https://github.com/nocobase/nocobase/pull/1263)
- refactor(client/popup): text: 'Set popup size' changed to 'Popup size' [`#1262`](https://github.com/nocobase/nocobase/pull/1262)
- feat: page tabs [`#1261`](https://github.com/nocobase/nocobase/pull/1261)
- fix(plugin-fm): drawer form values [`#1259`](https://github.com/nocobase/nocobase/pull/1259)
- feat: support sync button [`#1258`](https://github.com/nocobase/nocobase/pull/1258)
- fix: isOverride cannot work [`#1257`](https://github.com/nocobase/nocobase/pull/1257)
- refactor(sequence-field): move to plugin and use table to record [`#1209`](https://github.com/nocobase/nocobase/pull/1209)
- feat: add map plugin [`#1229`](https://github.com/nocobase/nocobase/pull/1229)
- fix(plugin-workflow): fix job result in history [`#1242`](https://github.com/nocobase/nocobase/pull/1242)
- feat: set field [`#1237`](https://github.com/nocobase/nocobase/pull/1237)
- chore: update ci [`#1239`](https://github.com/nocobase/nocobase/pull/1239)
- feat(client/popup): support set drawer and modal popup size [`#1224`](https://github.com/nocobase/nocobase/pull/1224)
- fix(plugin-file-manager): fix local serve middleware [`#1226`](https://github.com/nocobase/nocobase/pull/1226)
- feat: iframe block [`#1225`](https://github.com/nocobase/nocobase/pull/1225)
- fix(workflow/request-var): fix request node var editor [`#1223`](https://github.com/nocobase/nocobase/pull/1223)
- fix: change nginx timeout as 10min [`#1222`](https://github.com/nocobase/nocobase/pull/1222)
- fix: change import timeout as 10 min [`#1221`](https://github.com/nocobase/nocobase/pull/1221)
- fix: field component options appears in non-association interface [`#1220`](https://github.com/nocobase/nocobase/pull/1220)
- Fix(plugin-workflow): client refactor [`#1163`](https://github.com/nocobase/nocobase/pull/1163)
- feat(cli): quickstart [`#1204`](https://github.com/nocobase/nocobase/pull/1204)
- fix(plugin-cm): fix interfaces injection and getter [`#1196`](https://github.com/nocobase/nocobase/pull/1196)
- fix(i18n): move back key to global [`#1195`](https://github.com/nocobase/nocobase/pull/1195)
- test(plugin-workflow): add cache and test for sqlite [`#1194`](https://github.com/nocobase/nocobase/pull/1194)
- fix(plugin-workflow): use dual pipes to process triggers [`#1187`](https://github.com/nocobase/nocobase/pull/1187)
- fix(plugin-workflow): temp skip case [`#1188`](https://github.com/nocobase/nocobase/pull/1188)
- feat(menu): when a group is selected, the submenu items are also selected together [`#1152`](https://github.com/nocobase/nocobase/pull/1152)
- fix(plugin-workflow): fix transaction in trigger [`#1186`](https://github.com/nocobase/nocobase/pull/1186)
- feat:  export blob type error [`#1170`](https://github.com/nocobase/nocobase/pull/1170)
- fix(plugin-workflow): dispatch when server start [`#1183`](https://github.com/nocobase/nocobase/pull/1183)
- fix: yarn start error in windows system [`#1177`](https://github.com/nocobase/nocobase/pull/1177)
- fix(plugin-users): fix initialization of sms verification [`#1173`](https://github.com/nocobase/nocobase/pull/1173)
- fix(plugin-workflow): fix test case [`#1172`](https://github.com/nocobase/nocobase/pull/1172)
- feat(plugin-workflow): add duplicate action [`#1171`](https://github.com/nocobase/nocobase/pull/1171)
- fix(plugin-workflow): fix context operand [`#1169`](https://github.com/nocobase/nocobase/pull/1169)
- fix: auto deploy error [`#1168`](https://github.com/nocobase/nocobase/pull/1168)
- feat: configurable the scope of target collections [`#1165`](https://github.com/nocobase/nocobase/pull/1165)
- ci(workflows): fix auto deploy error [`#1166`](https://github.com/nocobase/nocobase/pull/1166)
- ci(workflows): support manual depoly and stop pr [`#1132`](https://github.com/nocobase/nocobase/pull/1132)
- fix: saml oidc text [`#1164`](https://github.com/nocobase/nocobase/pull/1164)
- fix: transaction error [`#1162`](https://github.com/nocobase/nocobase/pull/1162)
- fix: create inherits with empty table [`#1160`](https://github.com/nocobase/nocobase/pull/1160)
- fix: sso optimization  [`#1159`](https://github.com/nocobase/nocobase/pull/1159)
- feat: saml [`#1143`](https://github.com/nocobase/nocobase/pull/1143)
- feat: oidc [`#1126`](https://github.com/nocobase/nocobase/pull/1126)
- feat: belongs to many on delete [`#1158`](https://github.com/nocobase/nocobase/pull/1158)
- Feat/collection templates [`#1124`](https://github.com/nocobase/nocobase/pull/1124)
- Fix/action 404 [`#1157`](https://github.com/nocobase/nocobase/pull/1157)
- fix: 404 response [`#1156`](https://github.com/nocobase/nocobase/pull/1156)
- Feat: plugin verification config [`#1129`](https://github.com/nocobase/nocobase/pull/1129)
- feat: support use select field [`#1105`](https://github.com/nocobase/nocobase/pull/1105)
- fix(plugin-workflow): fix trigger context getters [`#1149`](https://github.com/nocobase/nocobase/pull/1149)
- feat: option readPretty optimization [`#1138`](https://github.com/nocobase/nocobase/pull/1138)
- fix(plugin-workflow): fix locale [`#1145`](https://github.com/nocobase/nocobase/pull/1145)
- fix(plugin-workflow): fix endsOn field [`#1144`](https://github.com/nocobase/nocobase/pull/1144)
- fix: create empty collection [`#1141`](https://github.com/nocobase/nocobase/pull/1141)
- fix(client): fix no key warning in menu [`#1140`](https://github.com/nocobase/nocobase/pull/1140)
- Fix(plugin workflow) interval [`#1139`](https://github.com/nocobase/nocobase/pull/1139)
- fix: x-collection-field [`#1134`](https://github.com/nocobase/nocobase/pull/1134)
- feat: update many [`#1135`](https://github.com/nocobase/nocobase/pull/1135)
- feat(workflow): support Http Request Node [`#1102`](https://github.com/nocobase/nocobase/pull/1102)
- fix: incorrect repeat of calendar [`#1131`](https://github.com/nocobase/nocobase/pull/1131)
- fix(database): refresh indexes [`#1127`](https://github.com/nocobase/nocobase/pull/1127)
- fix: reference check after remove collection [`#1123`](https://github.com/nocobase/nocobase/pull/1123)
- fix: sort field with table dose not have primary key [`#1119`](https://github.com/nocobase/nocobase/pull/1119)
- fix: test [`#1118`](https://github.com/nocobase/nocobase/pull/1118)
- fix: update to bigint [`#1117`](https://github.com/nocobase/nocobase/pull/1117)
- fix(cm): default values for override [`#1112`](https://github.com/nocobase/nocobase/pull/1112)
- fix: update sequence and foreignKey [`#1116`](https://github.com/nocobase/nocobase/pull/1116)
- fix(plugin-workflow): fix workflow schema [`#1115`](https://github.com/nocobase/nocobase/pull/1115)
- fix(client): menu key warnings [`#1114`](https://github.com/nocobase/nocobase/pull/1114)
- fix: fk type invalid [`#1113`](https://github.com/nocobase/nocobase/pull/1113)
- fix: handle column does not exist error [`#1110`](https://github.com/nocobase/nocobase/pull/1110)
- fix: inherits with collection not exists [`#1109`](https://github.com/nocobase/nocobase/pull/1109)
- fix(locale): move description to global [`#1108`](https://github.com/nocobase/nocobase/pull/1108)
- feat: using bigint for id field [`#1100`](https://github.com/nocobase/nocobase/pull/1100)
- refactor: formula plugin [`#1082`](https://github.com/nocobase/nocobase/pull/1082)
- fix: create inherits from a table that has no id [`#1104`](https://github.com/nocobase/nocobase/pull/1104)
- fix: find table sequence [`#1101`](https://github.com/nocobase/nocobase/pull/1101)
- Feat/collection inherits [`#1097`](https://github.com/nocobase/nocobase/pull/1097)
- fix: create collection with emtpy inhertis params [`#1096`](https://github.com/nocobase/nocobase/pull/1096)
- fix: remove node after collection removed [`#1095`](https://github.com/nocobase/nocobase/pull/1095)
- fix: unbind error [`#1094`](https://github.com/nocobase/nocobase/pull/1094)
- chore: type conflict error message [`#1093`](https://github.com/nocobase/nocobase/pull/1093)
- feat: collection inheritance [`#1069`](https://github.com/nocobase/nocobase/pull/1069)
- feat: no recursive update associations [`#1091`](https://github.com/nocobase/nocobase/pull/1091)
- fix(plugin-workflow): fix transaction chain in trigger [`#1089`](https://github.com/nocobase/nocobase/pull/1089)
- fix(plugin-workflow): fix schema name conflict [`#1087`](https://github.com/nocobase/nocobase/pull/1087)
- refactor(plugin-workflow): split transaction for collection trigger [`#1080`](https://github.com/nocobase/nocobase/pull/1080)
- fix: skip records that do not exist [`#1084`](https://github.com/nocobase/nocobase/pull/1084)
- refactor(plugin-workflow): adjust style [`#1079`](https://github.com/nocobase/nocobase/pull/1079)
- fix: mysql variable 'lower_case_table_names' must be set to '0' or '2' [`#1078`](https://github.com/nocobase/nocobase/pull/1078)
- feat: logging package [`#1021`](https://github.com/nocobase/nocobase/pull/1021)
- Refactor: plugin-workflow client [`#1077`](https://github.com/nocobase/nocobase/pull/1077)
- fix: reference options sync [`#1061`](https://github.com/nocobase/nocobase/pull/1061)
- refactor(plugin-workflow): adjust some api [`#1067`](https://github.com/nocobase/nocobase/pull/1067)
- fix(plugin-workflow): fix trigger getter [`#1060`](https://github.com/nocobase/nocobase/pull/1060)
- Update README.md [`#1053`](https://github.com/nocobase/nocobase/pull/1053)
- test(collection-manager): 20221104151410-update-collections-hidden test correct [`#1042`](https://github.com/nocobase/nocobase/pull/1042)

### Fixed

- fix(client): page title translation doesn't work [`#838`](https://github.com/nocobase/nocobase/issues/838)

### Commits

- feat: update docs [`15cbad3`](https://github.com/nocobase/nocobase/commit/15cbad30b4e40121ab768273d6d42832960cd4bf)
- Revert "refactor: formula plugin (#1082)" [`0cbfa0a`](https://github.com/nocobase/nocobase/commit/0cbfa0a52177cce6b5400107a639d97de0b4e7a9)
- chore(versions): 😊 publish v0.8.1-alpha.2 [`4ecd2ee`](https://github.com/nocobase/nocobase/commit/4ecd2ee40d0ddfdfc5440670aa4f2b3a64f1c819)

## [v0.8.0-alpha.13](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.11...v0.8.0-alpha.13) - 2022-11-04

### Merged

- test(collection-manager): migration - 20221104151410-update-collections-hidden test optimize [`#1040`](https://github.com/nocobase/nocobase/pull/1040)

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.13 [`ce588ee`](https://github.com/nocobase/nocobase/commit/ce588eefb0bfc50f7d5bbee575e0b5e843bf6644)

## [v0.8.0-alpha.11](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.9...v0.8.0-alpha.11) - 2022-11-04

### Merged

- chore(collection-manager): migration - 20221104151410-update-collections-hidden [`#1039`](https://github.com/nocobase/nocobase/pull/1039)
- fix: db sync failed [`#1037`](https://github.com/nocobase/nocobase/pull/1037)
- feat: 添加字段浮窗定位优化 [`#1034`](https://github.com/nocobase/nocobase/pull/1034)
- fix: association accessors rebind [`#1027`](https://github.com/nocobase/nocobase/pull/1027)
- chore(debugger): clean scripts [`#1029`](https://github.com/nocobase/nocobase/pull/1029)
- fix(calendar): events cannot support moment [`#1017`](https://github.com/nocobase/nocobase/pull/1017)
- Fix: debugger [`#1014`](https://github.com/nocobase/nocobase/pull/1014)

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.11 [`6d9006f`](https://github.com/nocobase/nocobase/commit/6d9006f361f569546777f05f03414acc66d06506)
- feat: more console log [`f15c67a`](https://github.com/nocobase/nocobase/commit/f15c67afd5745ccf37b5303f2bf8d61513d62183)
- feat(client): add filter option [`af3fbeb`](https://github.com/nocobase/nocobase/commit/af3fbeb99b9d2b80433bb25ec7c1158ae8addda6)

## [v0.8.0-alpha.9](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.8...v0.8.0-alpha.9) - 2022-11-02

### Merged

- feat: improve collection manager [`#1013`](https://github.com/nocobase/nocobase/pull/1013)
- feat(calendar): support for add/remove repeats events [`#988`](https://github.com/nocobase/nocobase/pull/988)
- Fix: sequence field [`#1009`](https://github.com/nocobase/nocobase/pull/1009)
- feat: update docs [`#1006`](https://github.com/nocobase/nocobase/pull/1006)
- fix(sample): fix shop-i18n client [`#1005`](https://github.com/nocobase/nocobase/pull/1005)
- chore(versions): 😊 publish v0.8.0-alpha.7 [`#1002`](https://github.com/nocobase/nocobase/pull/1002)
- fix(plugin-workflow): fix trigger config [`#997`](https://github.com/nocobase/nocobase/pull/997)

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.9 [`642e044`](https://github.com/nocobase/nocobase/commit/642e04490d41acd9c4abba00112fa7f634d83d89)
- chore(versions): 😊 publish v0.8.0-alpha.8 [`d5680f8`](https://github.com/nocobase/nocobase/commit/d5680f80d7e468ee5972f008e162eca39c86aa87)
- fix: remove sample plugin client files [`7cded43`](https://github.com/nocobase/nocobase/commit/7cded4395a95922918a2b8abe041160b715a601b)

## [v0.8.0-alpha.8](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.7...v0.8.0-alpha.8) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.8 [`6d3aa09`](https://github.com/nocobase/nocobase/commit/6d3aa092c0e788824bd0f7fd92607002e8000d66)
- fix: remove sample plugin client files [`8da81f0`](https://github.com/nocobase/nocobase/commit/8da81f00e5f65d3cd17819f1959d0ef4575461fd)

## [v0.8.0-alpha.7](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.6...v0.8.0-alpha.7) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.7 [`9fbb789`](https://github.com/nocobase/nocobase/commit/9fbb78932ac739fa4c97869fa28d9a676f905519)
- fix(pm): upgrade error when using sqlite database [`bc7848d`](https://github.com/nocobase/nocobase/commit/bc7848da68516f18a5332c3ab1154675314f1ab1)

## [v0.8.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.5...v0.8.0-alpha.6) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.6 [`88b8a0f`](https://github.com/nocobase/nocobase/commit/88b8a0f379a261b2b65ee5ba3a958a1d450e0e37)
- fix: upgrade failure using docker [`af32f08`](https://github.com/nocobase/nocobase/commit/af32f08d5f624468c371bff61d2e7f62cfe20db8)
- Update README.zh-CN.md [`fc7b17b`](https://github.com/nocobase/nocobase/commit/fc7b17b0858b328a0f2844260ebd3adfaa3f08e3)

## [v0.8.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.3...v0.8.0-alpha.5) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.5 [`3453f46`](https://github.com/nocobase/nocobase/commit/3453f46997df9648f6aace49c80922a19611bf99)

## [v0.8.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.2...v0.8.0-alpha.3) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.3 [`3395eb6`](https://github.com/nocobase/nocobase/commit/3395eb66898d506fd5f465f11c60513a1b46bcab)

## [v0.8.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.8.0-alpha.1...v0.8.0-alpha.2) - 2022-11-01

### Commits

- chore(versions): 😊 publish v0.8.0-alpha.2 [`7f4c2de`](https://github.com/nocobase/nocobase/commit/7f4c2de98dd9bad88398351080c56753b0cac03c)

## [v0.8.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.7-alpha.1...v0.8.0-alpha.1) - 2022-11-01

### Merged

- Some features [`#979`](https://github.com/nocobase/nocobase/pull/979)
- fix(client/form-fields): fix fields's x-read-pretty [`#994`](https://github.com/nocobase/nocobase/pull/994)
- feat: reference check [`#989`](https://github.com/nocobase/nocobase/pull/989)
- fix(client/menu-permisssions-page): fix menu-permisssions-page no data [`#993`](https://github.com/nocobase/nocobase/pull/993)
- feat: update docs [`#996`](https://github.com/nocobase/nocobase/pull/996)
- fix(client): add locale for sequence field [`#995`](https://github.com/nocobase/nocobase/pull/995)
- docs: update api docs [`#973`](https://github.com/nocobase/nocobase/pull/973)
- feat: update docs [`#990`](https://github.com/nocobase/nocobase/pull/990)
- fix(client/upload): fix upload mutiple files always uploading status [`#974`](https://github.com/nocobase/nocobase/pull/974)
- fix(client/table-selector-provider): make data range config effective [`#960`](https://github.com/nocobase/nocobase/pull/960)
- fix(client/formula): set cursor focus on input [`#959`](https://github.com/nocobase/nocobase/pull/959)
- feat: plugin workflow visualization [`#987`](https://github.com/nocobase/nocobase/pull/987)
- feat: support show lunar day in week and day [`#977`](https://github.com/nocobase/nocobase/pull/977)
- fix: add sample plugins [`#986`](https://github.com/nocobase/nocobase/pull/986)
- feat: improve code [`#978`](https://github.com/nocobase/nocobase/pull/978)
- chore: improve ci [`#976`](https://github.com/nocobase/nocobase/pull/976)
- feat: support show lunar day [`#972`](https://github.com/nocobase/nocobase/pull/972)
- chore: fix incorrect deps [`#970`](https://github.com/nocobase/nocobase/pull/970)
- fix: empty logic operator filter [`#961`](https://github.com/nocobase/nocobase/pull/961)
- fix(plugin-workflow): fix workflow update action [`#964`](https://github.com/nocobase/nocobase/pull/964)
- fix(database/formula-field): when formula's field caculate result is 0 it alse will be save [`#962`](https://github.com/nocobase/nocobase/pull/962)
- feat(file-manager): support tencent cos [`#958`](https://github.com/nocobase/nocobase/pull/958)
- feat: push ali docker registry [`#957`](https://github.com/nocobase/nocobase/pull/957)
- fix(plugin-workflow): fix constant schedule trigger time [`#956`](https://github.com/nocobase/nocobase/pull/956)
- Turkish readme [`#955`](https://github.com/nocobase/nocobase/pull/955)
- chore(versions): 😊 publish v0.7.6-alpha.2 [`#954`](https://github.com/nocobase/nocobase/pull/954)
- Turkish language [`#939`](https://github.com/nocobase/nocobase/pull/939)
- refactor(plugin-file-manager): move client code into plugin folder and enable path config [`#913`](https://github.com/nocobase/nocobase/pull/913)
- refactor: plugin manager [`#965`](https://github.com/nocobase/nocobase/pull/965)
- feat: add filter action to collection table [`#953`](https://github.com/nocobase/nocobase/pull/953)
- feat: ui schema cache [`#877`](https://github.com/nocobase/nocobase/pull/877)
- feat: changed with associations [`#943`](https://github.com/nocobase/nocobase/pull/943)
- feat: docker optimizing [`#948`](https://github.com/nocobase/nocobase/pull/948)
- fix(plugin-workflow): test changedWithAssociations() [`#950`](https://github.com/nocobase/nocobase/pull/950)
- fix(plugin-workflow): skip time based test [`#951`](https://github.com/nocobase/nocobase/pull/951)
- fix(plugin-workflow): fix schedule trigger bug [`#949`](https://github.com/nocobase/nocobase/pull/949)
- fix(plugin-workflow): fix collection fieldset component [`#942`](https://github.com/nocobase/nocobase/pull/942)
- fix(plugin-workflow): avoid revision with ghost nodes [`#941`](https://github.com/nocobase/nocobase/pull/941)
- fix(plugin-workflow): add req context to processor [`#936`](https://github.com/nocobase/nocobase/pull/936)
- feat: plugin workflow collection field [`#934`](https://github.com/nocobase/nocobase/pull/934)
- fix(plugin-workflow): fix schedule infinitely trigger when repeat not set [`#926`](https://github.com/nocobase/nocobase/pull/926)
- fix(plugin-workflow): temp disable validation of collection field in node [`#928`](https://github.com/nocobase/nocobase/pull/928)
- Doc/db repository [`#896`](https://github.com/nocobase/nocobase/pull/896)
- docs: fix resource & action dev doc [`#880`](https://github.com/nocobase/nocobase/pull/880)
- docs: fix i18n dev sample [`#910`](https://github.com/nocobase/nocobase/pull/910)
- feat: create with array of values [`#912`](https://github.com/nocobase/nocobase/pull/912)
- fix: unbind on error throwing [`#914`](https://github.com/nocobase/nocobase/pull/914)
- fix: appends merge now using primary key [`#911`](https://github.com/nocobase/nocobase/pull/911)
- Doc: api database events [`#887`](https://github.com/nocobase/nocobase/pull/887)
- feat: limit database identifier [`#908`](https://github.com/nocobase/nocobase/pull/908)
- fix: sync collection field default value [`#907`](https://github.com/nocobase/nocobase/pull/907)
- fix: appends merge includes [`#905`](https://github.com/nocobase/nocobase/pull/905)
- fix(samples): fix test case [`#903`](https://github.com/nocobase/nocobase/pull/903)
- fix: single relation repository appends query issue [`#901`](https://github.com/nocobase/nocobase/pull/901)
- feat(plugin-workflow): add concat calculator [`#894`](https://github.com/nocobase/nocobase/pull/894)
- fix(client/record-picker): support record-picker show format DataPicker [`#888`](https://github.com/nocobase/nocobase/pull/888)
- fix(client/block-select-collection): fix select collection menu view error [`#889`](https://github.com/nocobase/nocobase/pull/889)
- fix: unable to submit form during file upload [`#892`](https://github.com/nocobase/nocobase/pull/892)
- fix: run test by jest [`#891`](https://github.com/nocobase/nocobase/pull/891)
- feat(collection-manager): inverse fields can be configured [`#883`](https://github.com/nocobase/nocobase/pull/883)
- fix(formula): support integer and fix NaN error [`#879`](https://github.com/nocobase/nocobase/pull/879)
- fix: sort parameter is missing [`#849`](https://github.com/nocobase/nocobase/pull/849)
- fix: slow join query issued by appends field in find method of repository  [`#845`](https://github.com/nocobase/nocobase/pull/845)
- feat(core/cache): support cache [`#876`](https://github.com/nocobase/nocobase/pull/876)
- feat: update option must have filter or filterByTk [`#847`](https://github.com/nocobase/nocobase/pull/847)
- added Russian translation [`#840`](https://github.com/nocobase/nocobase/pull/840)
- feat(database): add sequence field type [`#779`](https://github.com/nocobase/nocobase/pull/779)
- fix: can't access pages without permission via url [`#826`](https://github.com/nocobase/nocobase/pull/826)
- fix: listen promisify [`#899`](https://github.com/nocobase/nocobase/pull/899)
- refactor(core): simplify some code [`#895`](https://github.com/nocobase/nocobase/pull/895)
- feat: sample-custom-signup-page [`#893`](https://github.com/nocobase/nocobase/pull/893)
- docs: relation repository & acl [`#848`](https://github.com/nocobase/nocobase/pull/848)
- Update actions.md [`#873`](https://github.com/nocobase/nocobase/pull/873)
- docs: add testing dev doc [`#871`](https://github.com/nocobase/nocobase/pull/871)
- Doc: dev migration [`#870`](https://github.com/nocobase/nocobase/pull/870)
- Doc: command [`#869`](https://github.com/nocobase/nocobase/pull/869)
- docs: add hooks dev doc [`#868`](https://github.com/nocobase/nocobase/pull/868)
- feat: update development doc [`#866`](https://github.com/nocobase/nocobase/pull/866)
- feat: ratelimit sample plugin [`#862`](https://github.com/nocobase/nocobase/pull/862)
- feat: custom block sample [`#867`](https://github.com/nocobase/nocobase/pull/867)
- docs: move http to dev [`#861`](https://github.com/nocobase/nocobase/pull/861)
- refactor: middleware [`#857`](https://github.com/nocobase/nocobase/pull/857)
- Doc: dev i18n [`#858`](https://github.com/nocobase/nocobase/pull/858)
- docs: add resources-actions doc and sample [`#853`](https://github.com/nocobase/nocobase/pull/853)
- feat: add custom page sample and doc [`#855`](https://github.com/nocobase/nocobase/pull/855)
- feat: nocobase cli doc [`#854`](https://github.com/nocobase/nocobase/pull/854)
- fix:  auto install a plugin on enable [`#852`](https://github.com/nocobase/nocobase/pull/852)
- Doc: dev collection fields [`#846`](https://github.com/nocobase/nocobase/pull/846)
- docs: server application api [`#842`](https://github.com/nocobase/nocobase/pull/842)
- docs: add actions api [`#844`](https://github.com/nocobase/nocobase/pull/844)
- refactor(doc): change to new structure [`#804`](https://github.com/nocobase/nocobase/pull/804)
- refactor: plugin manager [`#775`](https://github.com/nocobase/nocobase/pull/775)

### Commits

- feat: release notes [`b185412`](https://github.com/nocobase/nocobase/commit/b18541255c4c07d138793a018c785451542aab74)
- Update v08-changelog.md [`d242169`](https://github.com/nocobase/nocobase/commit/d24216962b46c286411d15051e85861f764f5a03)
- fix(client): tab pane initializers for create form block [`929a4f8`](https://github.com/nocobase/nocobase/commit/929a4f848a327d7f8c55bcc786f584f4444ad36e)

## [v0.7.7-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.6-alpha.2...v0.7.7-alpha.1) - 2022-10-26

### Merged

- fix(database/formula-field): when formula's field caculate result is 0 it alse will be save [`#962`](https://github.com/nocobase/nocobase/pull/962)
- feat(file-manager): support tencent cos [`#958`](https://github.com/nocobase/nocobase/pull/958)
- feat: push ali docker registry [`#957`](https://github.com/nocobase/nocobase/pull/957)
- fix(plugin-workflow): fix constant schedule trigger time [`#956`](https://github.com/nocobase/nocobase/pull/956)
- Turkish readme [`#955`](https://github.com/nocobase/nocobase/pull/955)
- chore(versions): 😊 publish v0.7.6-alpha.2 [`#954`](https://github.com/nocobase/nocobase/pull/954)

### Commits

- chore(versions): 😊 publish v0.7.7-alpha.1 [`a7a807c`](https://github.com/nocobase/nocobase/commit/a7a807c433df69e4edf93dfb1bd31ee5a9f4beab)
- fix: lerna ERR! EUNCOMMIT  M yarn.lock [`39eb3c9`](https://github.com/nocobase/nocobase/commit/39eb3c90bea25e6308723a87f91c80f60939d3cb)
- feat: api service [`59f102d`](https://github.com/nocobase/nocobase/commit/59f102de8acd7dd16a8ba0955aeef9df8d77d655)

## [v0.7.6-alpha.2](https://github.com/nocobase/nocobase/compare/v0.7.5-alpha.1.1666403334...v0.7.6-alpha.2) - 2022-10-24

### Merged

- Turkish language [`#939`](https://github.com/nocobase/nocobase/pull/939)
- refactor(plugin-file-manager): move client code into plugin folder and enable path config [`#913`](https://github.com/nocobase/nocobase/pull/913)
- feat: add filter action to collection table [`#953`](https://github.com/nocobase/nocobase/pull/953)
- feat: ui schema cache [`#877`](https://github.com/nocobase/nocobase/pull/877)
- feat: docker optimizing [`#948`](https://github.com/nocobase/nocobase/pull/948)
- fix(plugin-workflow): test changedWithAssociations() [`#950`](https://github.com/nocobase/nocobase/pull/950)
- fix(plugin-workflow): skip time based test [`#951`](https://github.com/nocobase/nocobase/pull/951)
- fix(plugin-workflow): fix schedule trigger bug [`#949`](https://github.com/nocobase/nocobase/pull/949)

### Commits

- chore(versions): 😊 publish v0.7.6-alpha.1 [`a0382a9`](https://github.com/nocobase/nocobase/commit/a0382a90c1e764dc48d25153f03856d991bc27d2)
- chore(versions): 😊 publish v0.7.6-alpha.2 [`b304681`](https://github.com/nocobase/nocobase/commit/b3046819d88b3341b9e2ead41e9c15bde2c41da8)
- Revert "fix: registry.npmjs.org" [`e24d6bd`](https://github.com/nocobase/nocobase/commit/e24d6bdebce7b076974dd4759688ab434369e41c)

## [v0.7.5-alpha.1.1666403334](https://github.com/nocobase/nocobase/compare/v0.7.5-alpha.1...v0.7.5-alpha.1.1666403334) - 2022-10-22

### Merged

- feat: changed with associations [`#943`](https://github.com/nocobase/nocobase/pull/943)
- fix(plugin-workflow): fix collection fieldset component [`#942`](https://github.com/nocobase/nocobase/pull/942)
- fix(plugin-workflow): avoid revision with ghost nodes [`#941`](https://github.com/nocobase/nocobase/pull/941)
- fix(plugin-workflow): add req context to processor [`#936`](https://github.com/nocobase/nocobase/pull/936)
- Feat/plugin workflow collection field [`#934`](https://github.com/nocobase/nocobase/pull/934)
- fix(plugin-workflow): fix schedule infinitely trigger when repeat not set [`#926`](https://github.com/nocobase/nocobase/pull/926)
- fix(plugin-workflow): temp disable validation of collection field in node [`#928`](https://github.com/nocobase/nocobase/pull/928)

### Commits

- chore(versions): 😊 publish v0.7.5-alpha.1.1666403334 [`692f7e7`](https://github.com/nocobase/nocobase/commit/692f7e7ae5ddca3a3f3793bf57604603924c6af9)
- chore: dockerfile [`65724de`](https://github.com/nocobase/nocobase/commit/65724de42cfe65cbcfcbc56496c9fda1b0509ff7)
- chore: dockerfile [`bd5a0ce`](https://github.com/nocobase/nocobase/commit/bd5a0cefed7ff837237ff730ccf6e50a0419b49f)

## [v0.7.5-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.4-alpha.7...v0.7.5-alpha.1) - 2022-10-16

### Merged

- chore(versions): 😊 publish v0.7.5-alpha.1 [`#920`](https://github.com/nocobase/nocobase/pull/920)
- Feat: plugin workflow collection field [`#919`](https://github.com/nocobase/nocobase/pull/919)
- feat: create with array of values [`#912`](https://github.com/nocobase/nocobase/pull/912)
- fix: unbind on error throwing [`#914`](https://github.com/nocobase/nocobase/pull/914)
- fix: appends merge now using primary key [`#911`](https://github.com/nocobase/nocobase/pull/911)
- feat: limit database identifier [`#908`](https://github.com/nocobase/nocobase/pull/908)
- fix: sync collection field default value [`#907`](https://github.com/nocobase/nocobase/pull/907)
- fix: appends merge includes [`#905`](https://github.com/nocobase/nocobase/pull/905)
- fix: single relation repository appends query issue [`#901`](https://github.com/nocobase/nocobase/pull/901)
- feat(plugin-workflow): add concat calculator [`#894`](https://github.com/nocobase/nocobase/pull/894)
- fix(client/record-picker): support record-picker show format DataPicker [`#888`](https://github.com/nocobase/nocobase/pull/888)
- fix(client/block-select-collection): fix select collection menu view error [`#889`](https://github.com/nocobase/nocobase/pull/889)
- fix: unable to submit form during file upload [`#892`](https://github.com/nocobase/nocobase/pull/892)
- fix: run test by jest [`#891`](https://github.com/nocobase/nocobase/pull/891)
- feat(collection-manager): inverse fields can be configured [`#883`](https://github.com/nocobase/nocobase/pull/883)
- fix(formula): support integer and fix NaN error [`#879`](https://github.com/nocobase/nocobase/pull/879)
- fix: sort parameter is missing [`#849`](https://github.com/nocobase/nocobase/pull/849)
- fix: slow join query issued by appends field in find method of repository  [`#845`](https://github.com/nocobase/nocobase/pull/845)
- feat(core/cache): support cache [`#876`](https://github.com/nocobase/nocobase/pull/876)
- feat: update option must have filter or filterByTk [`#847`](https://github.com/nocobase/nocobase/pull/847)
- added Russian translation [`#840`](https://github.com/nocobase/nocobase/pull/840)
- feat(database): add sequence field type [`#779`](https://github.com/nocobase/nocobase/pull/779)
- fix: can't access pages without permission via url [`#826`](https://github.com/nocobase/nocobase/pull/826)
- refactor(resourcer): combine middleware class [`#825`](https://github.com/nocobase/nocobase/pull/825)
- refactor(database): fix some fields and types [`#820`](https://github.com/nocobase/nocobase/pull/820)
- feat(locale): added Japanese translation [`#813`](https://github.com/nocobase/nocobase/pull/813)
- fix(plugin-workflow): fix value type for DatePicker to moment (#815) [`#819`](https://github.com/nocobase/nocobase/pull/819)
- refactor(plugin-workflow): export client calculators registry [`#816`](https://github.com/nocobase/nocobase/pull/816)
- fix: number storage type changed to double [`#810`](https://github.com/nocobase/nocobase/pull/810)
- refactor(server) [`#795`](https://github.com/nocobase/nocobase/pull/795)
- fix(plugin-verification): change provider rate limit error to 429 [`#788`](https://github.com/nocobase/nocobase/pull/788)
- fix(plugin-cm): fix field disappear after failed to update [`#773`](https://github.com/nocobase/nocobase/pull/773)
- fix: fix uiSchema undefined [`#770`](https://github.com/nocobase/nocobase/pull/770)
- fix(plugin-cm): fix unique option default value to update [`#768`](https://github.com/nocobase/nocobase/pull/768)
- fix(plugin-users): fix update profile 500 (#766) [`#767`](https://github.com/nocobase/nocobase/pull/767)
- fix: mysql column in where clause is ambiguous [`#756`](https://github.com/nocobase/nocobase/pull/756)
- feat(plugin-cm): add unique option for base fields [`#745`](https://github.com/nocobase/nocobase/pull/745)
- feat(plugin-verification): add plugin-verification and phone for users [`#722`](https://github.com/nocobase/nocobase/pull/722)
- feat: resize grid columns with drag and drop [`#748`](https://github.com/nocobase/nocobase/pull/748)
- refactor(client): split schema-initializer items into multiple files [`#744`](https://github.com/nocobase/nocobase/pull/744)
- refactor(plugin-workflow): change files mode to 644 [`#755`](https://github.com/nocobase/nocobase/pull/755)
- fix: db version check [`#749`](https://github.com/nocobase/nocobase/pull/749)
- feat: add examples [`#718`](https://github.com/nocobase/nocobase/pull/718)

### Fixed

- fix(plugin-workflow): fix value type for DatePicker to moment (#815) (#819) [`#815`](https://github.com/nocobase/nocobase/issues/815)
- fix(plugin-users): fix update profile 500 (#766) (#767) [`#766`](https://github.com/nocobase/nocobase/issues/766)
- fix: db version check (#749) [`#742`](https://github.com/nocobase/nocobase/issues/742)

### Commits

- fix(client): tab pane initializers for create form block [`7efc4bc`](https://github.com/nocobase/nocobase/commit/7efc4bca0e3c5f2e1c5cd9e1365e77a005f3e108)
- fix: transaction cannot be rolled back because it has been finished with state: rollback [`6dacec4`](https://github.com/nocobase/nocobase/commit/6dacec4158103fd165ec2865ea87ed9d3d4ceaa4)
- fix(database): fix the index name too long error [`7bfe6b8`](https://github.com/nocobase/nocobase/commit/7bfe6b8c46bef0183c4703683175561c7fc91aee)

## [v0.7.4-alpha.7](https://github.com/nocobase/nocobase/compare/v0.7.4-alpha.4...v0.7.4-alpha.7) - 2022-08-15

### Merged

- chore(versions): 😊 publish v0.7.4-alpha.7 [`#740`](https://github.com/nocobase/nocobase/pull/740)

### Commits

- docs: update release notes [`a260d29`](https://github.com/nocobase/nocobase/commit/a260d29222abe49d1453df828bb06a368e83dcf3)
- fix(collection-manager): update collection without fields [`03538ee`](https://github.com/nocobase/nocobase/commit/03538ee82f7b7cd73367d9904e4ac3c87d7a4345)

## [v0.7.4-alpha.4](https://github.com/nocobase/nocobase/compare/v0.7.4-alpha.1...v0.7.4-alpha.4) - 2022-08-12

### Merged

- chore(versions): 😊 publish v0.7.4-alpha.4 [`#727`](https://github.com/nocobase/nocobase/pull/727)
- fix: sync table sort to export [`#723`](https://github.com/nocobase/nocobase/pull/723)
- feat: full version of the NocoBase dockerfile [`#719`](https://github.com/nocobase/nocobase/pull/719)
- fix(plugin-workflow): fix extend collection [`#708`](https://github.com/nocobase/nocobase/pull/708)
- fix: DB_TABLE_PREFIX doesn't get applied [`#710`](https://github.com/nocobase/nocobase/pull/710)
- feat: default value [`#679`](https://github.com/nocobase/nocobase/pull/679)
- fix: required field delete submit error (#688) [`#694`](https://github.com/nocobase/nocobase/pull/694)

### Commits

- feat: add examples [`b848b9c`](https://github.com/nocobase/nocobase/commit/b848b9cd6774df6ed86acd30edb81ed6381c3555)
- fix: record provider required for read pretty [`38c3e3e`](https://github.com/nocobase/nocobase/commit/38c3e3e4cc2698069c741d25ddda8e3e8e4d1db0)
- Update README.zh-CN.md [`ba0e618`](https://github.com/nocobase/nocobase/commit/ba0e61873e7f69dee6a76929eb774828ac980760)

## [v0.7.4-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.3-alpha.1...v0.7.4-alpha.1) - 2022-07-28

### Merged

- chore(versions): 😊 publish v0.7.4-alpha.1 [`#696`](https://github.com/nocobase/nocobase/pull/696)
- fix: append roles to current user [`#695`](https://github.com/nocobase/nocobase/pull/695)
- fix: fix date format [`#686`](https://github.com/nocobase/nocobase/pull/686)
- test(plugin-workflow): skip prompt tests [`#692`](https://github.com/nocobase/nocobase/pull/692)
- fix: fix accuracy of percent [`#685`](https://github.com/nocobase/nocobase/pull/685)
- fix(plugin-workflow): adjust await sleep time for test cases [`#691`](https://github.com/nocobase/nocobase/pull/691)
- feat(plugin-workflow): add assignees config for prompt instruction [`#690`](https://github.com/nocobase/nocobase/pull/690)
- fix: role export button display (#616) [`#666`](https://github.com/nocobase/nocobase/pull/666)
- feat: uid validate [`#681`](https://github.com/nocobase/nocobase/pull/681)
- refactor: replace react-drag-listview with @dnd-kit/sortable [`#660`](https://github.com/nocobase/nocobase/pull/660)
- refactor(plugin-users): improve extendibility of middlewares [`#677`](https://github.com/nocobase/nocobase/pull/677)
- feat: o2m delete not refresh [`#646`](https://github.com/nocobase/nocobase/pull/646)
- feat: kanban add description [`#659`](https://github.com/nocobase/nocobase/pull/659)
- fix: field loss enum [`#667`](https://github.com/nocobase/nocobase/pull/667)
- feat: add editor hot key Ctrl+Shift+U [`#675`](https://github.com/nocobase/nocobase/pull/675)
- fix: Fix calendar change field error (#626) [`#671`](https://github.com/nocobase/nocobase/pull/671)
- chore: fix eslint not work [`#670`](https://github.com/nocobase/nocobase/pull/670)
- feat: number precision [`#661`](https://github.com/nocobase/nocobase/pull/661)
- feat: nginx config [`#664`](https://github.com/nocobase/nocobase/pull/664)
- feat: form item designer form switch issue [`#656`](https://github.com/nocobase/nocobase/pull/656)

### Commits

- fix(client): fieldNames of RecordPicker [`9038d11`](https://github.com/nocobase/nocobase/commit/9038d111ea71a89798cb1499f3dadc3f9c3dbfd7)
- fix(client): required for the sub-table field [`609b0e2`](https://github.com/nocobase/nocobase/commit/609b0e2ff2d5aece96185cbcd30ec1810194be0d)
- feat(client): tab icon [`d9b2bf8`](https://github.com/nocobase/nocobase/commit/d9b2bf8af1c42e2f4e81533f6db92b19523410bd)

## [v0.7.3-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.2-alpha.2...v0.7.3-alpha.1) - 2022-08-10

### Merged

- chore(versions): 😊 publish v0.7.3-alpha.1 [`#657`](https://github.com/nocobase/nocobase/pull/657)
- feat: print action [`#652`](https://github.com/nocobase/nocobase/pull/652)
- feat: restore action-hooks [`#655`](https://github.com/nocobase/nocobase/pull/655)
- feat: collections&fields pagination issue [`#653`](https://github.com/nocobase/nocobase/pull/653)
- fix(core): change proxied agent methods to native [`#654`](https://github.com/nocobase/nocobase/pull/654)
- feat: remove table field details actions [`#638`](https://github.com/nocobase/nocobase/pull/638)
- fix: link to default value [`#641`](https://github.com/nocobase/nocobase/pull/641)
- feat: support for displaying relational table fields in details or form blocks [`#635`](https://github.com/nocobase/nocobase/pull/635)
- fix: record picker cannot select from different pages [`#623`](https://github.com/nocobase/nocobase/pull/623)
- fix: dragging an element to the left, right, or bottom would cause the element to disappear [`#620`](https://github.com/nocobase/nocobase/pull/620)
- feat: table action add reload button [`#630`](https://github.com/nocobase/nocobase/pull/630)
- feat: improve language settings [`#627`](https://github.com/nocobase/nocobase/pull/627)
- feat: field assignment for custom actions supports string variables [`#597`](https://github.com/nocobase/nocobase/pull/597)
- fix: skip recursive remove on grid component [`#621`](https://github.com/nocobase/nocobase/pull/621)
- feat: fix time and collection pagination [`#618`](https://github.com/nocobase/nocobase/pull/618)
- feat: recordblockinitializers fields pick [`#558`](https://github.com/nocobase/nocobase/pull/558)
- fix: incorrectly :active background [`#607`](https://github.com/nocobase/nocobase/pull/607)
- fix: obo table selector [`#613`](https://github.com/nocobase/nocobase/pull/613)
- feat: form validator [`#569`](https://github.com/nocobase/nocobase/pull/569)
- fix: table selector [`#612`](https://github.com/nocobase/nocobase/pull/612)
- chore(versions): 😊 publish v0.7.2-alpha.7 [`#611`](https://github.com/nocobase/nocobase/pull/611)
- chore(versions): 😊 publish v0.7.2-alpha.3 [`#608`](https://github.com/nocobase/nocobase/pull/608)
- chore(versions): 😊 publish v0.7.2-alpha.2 [`#606`](https://github.com/nocobase/nocobase/pull/606)

### Commits

- fix(client): build error [`600f13f`](https://github.com/nocobase/nocobase/commit/600f13f4a06ccfed27df928d7435afa83391c18a)
- fix(client): blocks are deleted when they are dragged below the current block [`20ab8c1`](https://github.com/nocobase/nocobase/commit/20ab8c15017d9dbf941bf963ce3023115050edf8)
- feat(client): plugin toolbar icons and translations [`c51c6c0`](https://github.com/nocobase/nocobase/commit/c51c6c097f24417f0ff82d3c5178ec3be1ee7630)

## [v0.7.2-alpha.2](https://github.com/nocobase/nocobase/compare/v0.7.2-alpha.1...v0.7.2-alpha.2) - 2022-07-07

### Merged

- fix: field permissions cannot be saved [`#605`](https://github.com/nocobase/nocobase/pull/605)
- fix(plugin-workflow): fix revision bug [`#603`](https://github.com/nocobase/nocobase/pull/603)
- fix(plugin-workflow): fix select value [`#600`](https://github.com/nocobase/nocobase/pull/600)
- fix(plugin-workflow): fix CollectionFieldSelect component [`#598`](https://github.com/nocobase/nocobase/pull/598)
- feat(plugin-workflow): add association select in calculation [`#584`](https://github.com/nocobase/nocobase/pull/584)

### Fixed

- fix: field permissions cannot be saved (#605) [`#599`](https://github.com/nocobase/nocobase/issues/599)

### Commits

- chore(versions): 😊 publish v0.7.2-alpha.1 [`a0cc501`](https://github.com/nocobase/nocobase/commit/a0cc50154cc292248ef107c95a24bcc0c7a586fa)
- fix(g2plot): import all plots [`2bb8fd9`](https://github.com/nocobase/nocobase/commit/2bb8fd984fb5c9cdd484cffc18411f4b644b8fb3)
- Update issue templates [`7767335`](https://github.com/nocobase/nocobase/commit/7767335ba7fe83e22bcc1976a8fd57926dc12c0a)

## [v0.7.2-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.1-alpha.5...v0.7.2-alpha.1) - 2022-07-05

### Merged

- chore(versions): 😊 publish v0.7.2-alpha.1 [`#578`](https://github.com/nocobase/nocobase/pull/578)
- fix: drop all foreign keys [`#576`](https://github.com/nocobase/nocobase/pull/576)
- fix(plugin-workflow): fix collection trigger config [`#575`](https://github.com/nocobase/nocobase/pull/575)
- feat: filter with variable [`#574`](https://github.com/nocobase/nocobase/pull/574)
- feat(cli): check database version before installation [`#572`](https://github.com/nocobase/nocobase/pull/572)
- fix(database): index invalid [`#564`](https://github.com/nocobase/nocobase/pull/564)
- fix: export association table data [`#561`](https://github.com/nocobase/nocobase/pull/561)
- Refactor(plugin workflow): move client files into plugin [`#556`](https://github.com/nocobase/nocobase/pull/556)
- fix(database): constraints default to false [`#550`](https://github.com/nocobase/nocobase/pull/550)
- fix(plugin-workflow): fix select width [`#552`](https://github.com/nocobase/nocobase/pull/552)
- feat: compatible with old kanban [`#553`](https://github.com/nocobase/nocobase/pull/553)
- feat: display association fields [`#512`](https://github.com/nocobase/nocobase/pull/512)
- Fix(plugin workflow) [`#549`](https://github.com/nocobase/nocobase/pull/549)
- fix:update mysql port [`#548`](https://github.com/nocobase/nocobase/pull/548)
- fix: export of relation blocks [`#546`](https://github.com/nocobase/nocobase/pull/546)
- fix(plugin-workflow): clear options when change collection [`#547`](https://github.com/nocobase/nocobase/pull/547)
- feat(plugin-workflow): add race mode [`#542`](https://github.com/nocobase/nocobase/pull/542)
- fix(client): change toArr to _.castArray in select component [`#543`](https://github.com/nocobase/nocobase/pull/543)
- chore(versions): 😊 publish v0.7.1-alpha.7 [`#539`](https://github.com/nocobase/nocobase/pull/539)

### Commits

- fix(client): comment out useless code [`4e9384b`](https://github.com/nocobase/nocobase/commit/4e9384bce27676a3cc1ce8d8fd08f5611cffbe5a)
- fix(workflow): merge workflow providers [`008a7f7`](https://github.com/nocobase/nocobase/commit/008a7f7f3351bdedf01b4490d1658edeacc95a16)
- feat(client): integer field [`9928424`](https://github.com/nocobase/nocobase/commit/9928424f5a163fe4edd7cfd60f349ca65b47c9bf)

## [v0.7.1-alpha.5](https://github.com/nocobase/nocobase/compare/v0.7.1-alpha.4...v0.7.1-alpha.5) - 2022-06-26

### Commits

- chore(versions): 😊 publish v0.7.1-alpha.5 [`c9159c6`](https://github.com/nocobase/nocobase/commit/c9159c6cf4b7deb80e87122d4b7967a510b8ae7c)
- fix(cli): upgrade from docker [`c4c96e5`](https://github.com/nocobase/nocobase/commit/c4c96e5a79562d87b597d23f0e536cd19687c890)

## [v0.7.1-alpha.4](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.82...v0.7.1-alpha.4) - 2022-06-26

### Merged

- chore(create-nocobase-app): fix some bugs [`#538`](https://github.com/nocobase/nocobase/pull/538)
- fix: destroy collection fields [`#536`](https://github.com/nocobase/nocobase/pull/536)
- feat(plugin-workflow): add delay node type [`#532`](https://github.com/nocobase/nocobase/pull/532)
- refactor: client application [`#533`](https://github.com/nocobase/nocobase/pull/533)
- fix: missing transaction [`#531`](https://github.com/nocobase/nocobase/pull/531)
- fix: add ellipsis property to record picker [`#527`](https://github.com/nocobase/nocobase/pull/527)
- fix: remove pattern without form item [`#528`](https://github.com/nocobase/nocobase/pull/528)
- fix(plugin-workflow): set current when update [`#526`](https://github.com/nocobase/nocobase/pull/526)
- fix: order nulls last [`#519`](https://github.com/nocobase/nocobase/pull/519)
- fix: action loading, refresh context, form submit and validate [`#523`](https://github.com/nocobase/nocobase/pull/523)
- Fix field pattern [`#520`](https://github.com/nocobase/nocobase/pull/520)
- fix(plugin-workflow): fix searchable select min-width [`#524`](https://github.com/nocobase/nocobase/pull/524)
- fix: template with fields only [`#517`](https://github.com/nocobase/nocobase/pull/517)
- fix(plugin-workflow): fix update workflow current property [`#521`](https://github.com/nocobase/nocobase/pull/521)
- refactor(plugin-workflow): abstract to classes [`#515`](https://github.com/nocobase/nocobase/pull/515)
- feat: column sortable and form item pattern [`#518`](https://github.com/nocobase/nocobase/pull/518)
- fix(custom-request): support string/json templates [`#514`](https://github.com/nocobase/nocobase/pull/514)
- feat: add block title [`#513`](https://github.com/nocobase/nocobase/pull/513)
- fix: remove collections & fields from db [`#511`](https://github.com/nocobase/nocobase/pull/511)
- feat: improve migrations [`#510`](https://github.com/nocobase/nocobase/pull/510)
- fix(client): consolidate usage of date/time as UTC in transfering [`#509`](https://github.com/nocobase/nocobase/pull/509)
- fix: formula bug [`#508`](https://github.com/nocobase/nocobase/pull/508)
- fix: default exportable fields [`#506`](https://github.com/nocobase/nocobase/pull/506)
- feat: association field block [`#493`](https://github.com/nocobase/nocobase/pull/493)
- feat: plugin export [`#479`](https://github.com/nocobase/nocobase/pull/479)
- fix(client): package path (fix #503) [`#504`](https://github.com/nocobase/nocobase/pull/504)
- fix: create or delete collection error [`#501`](https://github.com/nocobase/nocobase/pull/501)
- feat: update collections & fields [`#500`](https://github.com/nocobase/nocobase/pull/500)
- fix: rollback when field creation fails [`#498`](https://github.com/nocobase/nocobase/pull/498)
- fix(client): set `dropdownMatchSelectWidth` to false globally [`#497`](https://github.com/nocobase/nocobase/pull/497)
- fix(client): no-key warning in user menu items [`#496`](https://github.com/nocobase/nocobase/pull/496)
- Feat(plugin workflow): cron field for schedule trigger configuration [`#495`](https://github.com/nocobase/nocobase/pull/495)
- feat: audit logs [`#494`](https://github.com/nocobase/nocobase/pull/494)
- refactor(plugin-workflow): add revision column to execution [`#491`](https://github.com/nocobase/nocobase/pull/491)
- feat: relation field uiSchema [`#487`](https://github.com/nocobase/nocobase/pull/487)
- feat: change FK to input component [`#488`](https://github.com/nocobase/nocobase/pull/488)
- fix(plugin-multi-app-manager): fix pg cannot create database block tests [`#486`](https://github.com/nocobase/nocobase/pull/486)
- refactor(database): hook proxy [`#402`](https://github.com/nocobase/nocobase/pull/402)
- feat: chart blocks [`#484`](https://github.com/nocobase/nocobase/pull/484)
- Refactor(plugin workflow): support number in repeat config for schedule [`#482`](https://github.com/nocobase/nocobase/pull/482)
- chore(debug): add debug config [`#475`](https://github.com/nocobase/nocobase/pull/475)
- fix: has one bug [`#478`](https://github.com/nocobase/nocobase/pull/478)
- feat: relationships [`#473`](https://github.com/nocobase/nocobase/pull/473)
- fix(plugin-workflow): fix collection trigger transaction [`#474`](https://github.com/nocobase/nocobase/pull/474)
- fix(plugin-workflow): temporary solution for collection trigger conditions [`#472`](https://github.com/nocobase/nocobase/pull/472)
- fix: markdown component [`#469`](https://github.com/nocobase/nocobase/pull/469)
- fix: formula field and percent field [`#467`](https://github.com/nocobase/nocobase/pull/467)
- fix(plugin-workflow): fix update workflow action [`#464`](https://github.com/nocobase/nocobase/pull/464)
- fix: update formula field and percent field  [`#461`](https://github.com/nocobase/nocobase/pull/461)
- feat: add formula field type [`#457`](https://github.com/nocobase/nocobase/pull/457)
- fix: the details of the associated data in the subtable are not displayed [`#454`](https://github.com/nocobase/nocobase/pull/454)
- fix(plugin-workflow): fix languages [`#451`](https://github.com/nocobase/nocobase/pull/451)
- fix: afterSync hook not triggered [`#450`](https://github.com/nocobase/nocobase/pull/450)
- docs(various): Improve readability [`#447`](https://github.com/nocobase/nocobase/pull/447)
- feat: custom request [`#439`](https://github.com/nocobase/nocobase/pull/439)
- Feat(plugin workflow): schedule trigger [`#438`](https://github.com/nocobase/nocobase/pull/438)
- feat: db migrator [`#432`](https://github.com/nocobase/nocobase/pull/432)
- fix(client): select component cannot be opened in sub-table block [`#431`](https://github.com/nocobase/nocobase/pull/431)
- docs(github): change to markdown format [`#430`](https://github.com/nocobase/nocobase/pull/430)
- fix(cli): typo [`#429`](https://github.com/nocobase/nocobase/pull/429)

### Fixed

- fix(client): package path (fix #503) (#504) [`#503`](https://github.com/nocobase/nocobase/issues/503)

### Commits

- feat(client): update locales [`e57e60e`](https://github.com/nocobase/nocobase/commit/e57e60e6cb84431e694e69830d128cd71938388f)
- docs: update doc [`e5cb948`](https://github.com/nocobase/nocobase/commit/e5cb94803f738961fcbc1986a94d258ef9e191a9)
- fix(client): improve datepicker component, date with time zone, gmt support [`1c03fbb`](https://github.com/nocobase/nocobase/commit/1c03fbb853b5885547835f50fc9a0932f63c363b)

## [v0.7.0-alpha.82](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.67...v0.7.0-alpha.82) - 2022-05-27

### Merged

- feat(client,sdk): improve api client [`#425`](https://github.com/nocobase/nocobase/pull/425)
- feat: add create-plugin command [`#423`](https://github.com/nocobase/nocobase/pull/423)
- feat: add button color [`#420`](https://github.com/nocobase/nocobase/pull/420)
- chore(versions): 😊 publish v0.7.0-alpha.78 [`#419`](https://github.com/nocobase/nocobase/pull/419)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.82 [`4820fd0`](https://github.com/nocobase/nocobase/commit/4820fd09375c7200d1ea0bb0aab1bd4783b80d3d)
- docs: update installation documentation [`90623e8`](https://github.com/nocobase/nocobase/commit/90623e8e9a175238c3fc8bb527c8884c207ff78e)
- fix: "typescript": "4.5.5" [`c071217`](https://github.com/nocobase/nocobase/commit/c071217fff819378e982e611af1fd9fa71ebc5fb)

## [v0.7.0-alpha.67](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.64...v0.7.0-alpha.67) - 2022-05-24

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.67 [`3262979`](https://github.com/nocobase/nocobase/commit/326297936b17c6da3f6e86891c9772c72b088312)
- chore(versions): 😊 publish v0.7.0-alpha.66 [`9c19e4d`](https://github.com/nocobase/nocobase/commit/9c19e4d67f0b59b8ec957b1a9164acc88a50416d)

## [v0.7.0-alpha.64](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.60...v0.7.0-alpha.64) - 2022-05-24

### Merged

- feat: update docs [`#413`](https://github.com/nocobase/nocobase/pull/413)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.63 [`c01c695`](https://github.com/nocobase/nocobase/commit/c01c6952a58c2677d9f45fb41872363afda25197)
- chore(versions): 😊 publish v0.7.0-alpha.64 [`35d01a5`](https://github.com/nocobase/nocobase/commit/35d01a5fb0f0522e263c7fc37bc8384f99424240)
- fix(plugin-users): add translations (#416) [`72c3ba4`](https://github.com/nocobase/nocobase/commit/72c3ba4fae5cdee6b84eed65e3a35180186a987e)

## [v0.7.0-alpha.60](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.59...v0.7.0-alpha.60) - 2022-05-23

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.60 [`f0d0afb`](https://github.com/nocobase/nocobase/commit/f0d0afbb19dbd90ac3cf4155748fa084c67f54ee)
- fix(create-nocobase-app): storage path [`a0245ca`](https://github.com/nocobase/nocobase/commit/a0245caeb816fede8bb40c33e694de6419a21f26)

## [v0.7.0-alpha.59](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.58...v0.7.0-alpha.59) - 2022-05-23

### Merged

- refactor(plugin-workflow): change column type of executed from boolean to integer [`#411`](https://github.com/nocobase/nocobase/pull/411)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.59 [`c90e5ae`](https://github.com/nocobase/nocobase/commit/c90e5aee4c8257a3ab7ff492e69cb568cccff8b5)
- docs: update roadmap and release notes [`f198411`](https://github.com/nocobase/nocobase/commit/f198411c7386afaa4b6fc41ebb1806d40e3752b1)
- Update roadmap.md [`e5c5e16`](https://github.com/nocobase/nocobase/commit/e5c5e16b73174bf8092f730b196ef2ef088001b4)

## [v0.7.0-alpha.58](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.57...v0.7.0-alpha.58) - 2022-05-22

### Merged

- fix: 204 no content response [`#378`](https://github.com/nocobase/nocobase/pull/378)
- feat: destroy association field after target collection destroy [`#376`](https://github.com/nocobase/nocobase/pull/376)
- fix(type): use sequelize native Transactionable instead of TransactionAble [`#410`](https://github.com/nocobase/nocobase/pull/410)
- fix(plugin-workflow): remove previous listeners when collection changed in config [`#409`](https://github.com/nocobase/nocobase/pull/409)
- feat: add custom action [`#396`](https://github.com/nocobase/nocobase/pull/396)
- refactor(plugin-workflow): multiple instances and event management (fix #384) [`#408`](https://github.com/nocobase/nocobase/pull/408)

### Fixed

- refactor(plugin-workflow): multiple instances and event management (fix #384) (#408) [`#384`](https://github.com/nocobase/nocobase/issues/384) [`#384`](https://github.com/nocobase/nocobase/issues/384)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.58 [`19ee422`](https://github.com/nocobase/nocobase/commit/19ee42257edf17804d548ffd5ba9ddff6dc775d1)
- fix(plugin-acl): missing pagination parameters #394 [`b44753d`](https://github.com/nocobase/nocobase/commit/b44753d528a12075e64754828982ca80dfc90263)
- fix: missing isTruly/isFalsy filter operators #390 [`e596e6d`](https://github.com/nocobase/nocobase/commit/e596e6d365a3e46859e7d7bafcc3e54d286656cf)

## [v0.7.0-alpha.57](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.34...v0.7.0-alpha.57) - 2022-05-19

### Merged

- fix(plugin-workflow): fix node type title in drawers [`#389`](https://github.com/nocobase/nocobase/pull/389)

### Commits

- feat: build, cli, devtools, sdk, docs... [`6410bc8`](https://github.com/nocobase/nocobase/commit/6410bc8a75fa4dda9fe2bccfadca336fc8e794d0)
- chore(versions): 😊 publish v0.7.0-alpha.57 [`33f076e`](https://github.com/nocobase/nocobase/commit/33f076e430645055d79254592971c50d9f131a6d)
- Update README.md [`e24e007`](https://github.com/nocobase/nocobase/commit/e24e007395ed09463acdc3cf53b856ca9e0dd664)

## [v0.7.0-alpha.34](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.33...v0.7.0-alpha.34) - 2022-05-14

### Merged

- Fix(plugin workflow): fix cannot get job result properties [`#382`](https://github.com/nocobase/nocobase/pull/382)
- feat: exist on server start throw error [`#374`](https://github.com/nocobase/nocobase/pull/374)
- chore: application options [`#375`](https://github.com/nocobase/nocobase/pull/375)
- fix: not in operator with null value record [`#377`](https://github.com/nocobase/nocobase/pull/377)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.34 [`48b2b4b`](https://github.com/nocobase/nocobase/commit/48b2b4bc7bbc39533e461d34d7f026a4ad1a9b5c)
- feat: add plugins:getPinned action api [`b5c24aa`](https://github.com/nocobase/nocobase/commit/b5c24aa7999934f2b6f7ca1e9e9448b220a61af2)

## [v0.7.0-alpha.33](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.30...v0.7.0-alpha.33) - 2022-05-13

### Merged

- Feat(plugin workflow): revisions [`#379`](https://github.com/nocobase/nocobase/pull/379)
- fix(database): fix option-parser include list index [`#371`](https://github.com/nocobase/nocobase/pull/371)
- fix(plugin-worklfow): fix duplicated description in fields values [`#368`](https://github.com/nocobase/nocobase/pull/368)
- fix(database): fix type and transaction in repository [`#366`](https://github.com/nocobase/nocobase/pull/366)
- Fix(plugin workflow): fix transaction of execution [`#364`](https://github.com/nocobase/nocobase/pull/364)
- fix(plugin-workflow): add document title [`#363`](https://github.com/nocobase/nocobase/pull/363)
- fix: set visible with confirm [`#361`](https://github.com/nocobase/nocobase/pull/361)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.33 [`c4b5f4f`](https://github.com/nocobase/nocobase/commit/c4b5f4f84b18c2d8bc40f82947b9338e2f620984)
- Update issue templates [`8466159`](https://github.com/nocobase/nocobase/commit/846615937add786319dde167f2b28e981941e18e)
- fix: link-to field data scope error  (#1337) [`2156c70`](https://github.com/nocobase/nocobase/commit/2156c70ff3a7e65a8ad1bf14602f0dad150382ab)

## [v0.7.0-alpha.30](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.29...v0.7.0-alpha.30) - 2022-05-05

### Merged

- fix(plugin-workflow): fix tests [`#360`](https://github.com/nocobase/nocobase/pull/360)
- Feat: Unsaved changes tip [`#359`](https://github.com/nocobase/nocobase/pull/359)
- Fix acl error [`#358`](https://github.com/nocobase/nocobase/pull/358)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.30 [`781fb0a`](https://github.com/nocobase/nocobase/commit/781fb0a999854341cd8c353d31ae5a11ecbbe775)
- fix(client): upgrade formily packages [`58b151c`](https://github.com/nocobase/nocobase/commit/58b151c74512d5fa3f33c094580c4f5f15792342)
- fix(client): setFormValueChanged must be defined [`b33c819`](https://github.com/nocobase/nocobase/commit/b33c8198e676cc935bccf995ff3d18b249290062)

## [v0.7.0-alpha.29](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.28...v0.7.0-alpha.29) - 2022-05-04

### Merged

- fix: empty resource acl error [`#357`](https://github.com/nocobase/nocobase/pull/357)
- Feat: from values changed when unsaved will prompt [`#351`](https://github.com/nocobase/nocobase/pull/351)
- fix: modify filter close icon color [`#356`](https://github.com/nocobase/nocobase/pull/356)
- fix(plugin-workflow): fix i18n [`#354`](https://github.com/nocobase/nocobase/pull/354)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.29 [`46e660b`](https://github.com/nocobase/nocobase/commit/46e660b10d1cf94ecb808a9a45edb5e8d40398dc)
- fix(client): color styling [`90a58cc`](https://github.com/nocobase/nocobase/commit/90a58cc3cf3eab02bc61f363d4476454383907d3)
- feat(client): translation [`33a99d9`](https://github.com/nocobase/nocobase/commit/33a99d91b8dc19186ed743b1bbc073c09dd4629e)

## [v0.7.0-alpha.28](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.24...v0.7.0-alpha.28) - 2022-05-02

### Merged

- Fix(plugin-workflow) [`#353`](https://github.com/nocobase/nocobase/pull/353)
- fix(plugin-file-manager): upgrade multer-aliyun-oss package to fix size [`#352`](https://github.com/nocobase/nocobase/pull/352)
- feat: improve code [`#350`](https://github.com/nocobase/nocobase/pull/350)
- Fix/plugin workflow [`#349`](https://github.com/nocobase/nocobase/pull/349)
- fix: db:sync not working [`#348`](https://github.com/nocobase/nocobase/pull/348)
- fix(plugin-workflow): fix trigger bind logic to avoid duplication [`#347`](https://github.com/nocobase/nocobase/pull/347)
- Fix(plugin workflow) [`#346`](https://github.com/nocobase/nocobase/pull/346)
- Fix:menu url style [`#344`](https://github.com/nocobase/nocobase/pull/344)
- chore(plugin-workflow): add translation [`#345`](https://github.com/nocobase/nocobase/pull/345)
- fix(plugin-workflow): break cycling trigger through transaction id [`#341`](https://github.com/nocobase/nocobase/pull/341)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.28 [`a48d004`](https://github.com/nocobase/nocobase/commit/a48d00492ebc34c66c63d9644530c5b8a7c9914a)
- chore(versions): 😊 publish v0.7.0-alpha.27 [`ebfe11f`](https://github.com/nocobase/nocobase/commit/ebfe11ff09bf50b4b2322cbbad65b4ea936fdb71)
- chore(versions): 😊 publish v0.7.0-alpha.26 [`515d952`](https://github.com/nocobase/nocobase/commit/515d95276700ffafe7d2785a93fc510d36da462b)

## [v0.7.0-alpha.24](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.16...v0.7.0-alpha.24) - 2022-04-29

### Merged

- fix: model.beforeCreate not called [`#343`](https://github.com/nocobase/nocobase/pull/343)
- fix: thumbnail image in kanban card [`#338`](https://github.com/nocobase/nocobase/pull/338)
- feat: db authenticate [`#342`](https://github.com/nocobase/nocobase/pull/342)
- chore: install subApp asynchronous [`#336`](https://github.com/nocobase/nocobase/pull/336)
- fix(plugin-workflow): change collection values input ux in workflow nodes [`#340`](https://github.com/nocobase/nocobase/pull/340)
- feat: improvements [`#335`](https://github.com/nocobase/nocobase/pull/335)
- Feat(plugin workflow): add changed fields to model trigger config [`#332`](https://github.com/nocobase/nocobase/pull/332)

### Commits

- docs: update readme.md [`aacec30`](https://github.com/nocobase/nocobase/commit/aacec306733ee1cab3c3c7e5a7fcbbeb372a03e9)
- chore(versions): 😊 publish v0.7.0-alpha.24 [`1fb2dd8`](https://github.com/nocobase/nocobase/commit/1fb2dd884c4f2d2167f5dde40a15012a752e53ab)
- feat: uuid field [`2c0d3fc`](https://github.com/nocobase/nocobase/commit/2c0d3fcc5ad1bce2cbc47e82e76277918c66c565)

## [v0.7.0-alpha.16](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.15...v0.7.0-alpha.16) - 2022-04-27

### Merged

- fix: cannot find module mkdirp [`#330`](https://github.com/nocobase/nocobase/pull/330)
- Fix(plugin workflow): UX issues [`#329`](https://github.com/nocobase/nocobase/pull/329)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.16 [`27399f4`](https://github.com/nocobase/nocobase/commit/27399f4e5e6d1f9f2c0eee4d6be8ff89df625bd8)
- feat: improve code [`c71f45c`](https://github.com/nocobase/nocobase/commit/c71f45ca6a15149703fdf12f4d0f68a226d10a7e)
- Update README.md [`4317de7`](https://github.com/nocobase/nocobase/commit/4317de7eb116dd7d538d0cf2c4782372e1b5fce2)

## [v0.7.0-alpha.15](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.6...v0.7.0-alpha.15) - 2022-04-26

### Merged

- fix: create-nocobase-app compatibility [`#323`](https://github.com/nocobase/nocobase/pull/323)
- fix: create-nocobase-app client package version [`#321`](https://github.com/nocobase/nocobase/pull/321)
- fix: app manager [`#320`](https://github.com/nocobase/nocobase/pull/320)

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.15 [`f0d9b0e`](https://github.com/nocobase/nocobase/commit/f0d9b0ec026b589b3d10dcdbbbb656baca1a9004)
- chore(versions): 😊 publish v0.7.0-alpha.14 [`8736278`](https://github.com/nocobase/nocobase/commit/87362789f331e043336b571137a7ace7e38a6da1)
- chore(versions): 😊 publish v0.7.0-alpha.13 [`62eb85d`](https://github.com/nocobase/nocobase/commit/62eb85de5f341f343577232ebecce7f9fb7a5b21)

## [v0.7.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.5...v0.7.0-alpha.6) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.6 [`7d0087c`](https://github.com/nocobase/nocobase/commit/7d0087cbb3b7663ba05366ca3b80db2853669ee9)

## [v0.7.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.4...v0.7.0-alpha.5) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.5 [`a00b45a`](https://github.com/nocobase/nocobase/commit/a00b45a2686695c5f4824d074ac5e1aff210793a)
- fix(plugin-system-settings): cannot read property cliArgs of undefined [`b0d3274`](https://github.com/nocobase/nocobase/commit/b0d3274b2d98147679f91c468327287675de0c08)

## [v0.7.0-alpha.4](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.3...v0.7.0-alpha.4) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.4 [`327e413`](https://github.com/nocobase/nocobase/commit/327e413b6dd94dad9b756b1e08cda47cad734dc1)

## [v0.7.0-alpha.3](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.2...v0.7.0-alpha.3) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.3 [`b12507f`](https://github.com/nocobase/nocobase/commit/b12507f6e4bcb5f1fd8285670a43fb3807d90ea0)
- fix: antd use ~v4.19.5 [`733c704`](https://github.com/nocobase/nocobase/commit/733c7048ed0e00bd2c01bfaf8452731a9a89670e)

## [v0.7.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.1...v0.7.0-alpha.2) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.2 [`0e0e99e`](https://github.com/nocobase/nocobase/commit/0e0e99ef79c0b25bb0b45ecaa477c049cb16afee)
- feat(license): update license [`ed9b2b6`](https://github.com/nocobase/nocobase/commit/ed9b2b6d950cab33423225069a7b0de24b65ef45)
- feat: kanban disableCardDrag [`05a251b`](https://github.com/nocobase/nocobase/commit/05a251b1fc06012e77e402b422e3120430effef1)

## [v0.7.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.7.0-alpha.0...v0.7.0-alpha.1) - 2022-04-25

### Commits

- chore(versions): 😊 publish v0.7.0-alpha.1 [`e7293ad`](https://github.com/nocobase/nocobase/commit/e7293ad7aadbdf2084042f7800a232af6e0b7a8a)

## [v0.7.0-alpha.0](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.12...v0.7.0-alpha.0) - 2022-04-25

### Merged

- refactor: modify default lable style [`#318`](https://github.com/nocobase/nocobase/pull/318)
- Fix multiple apps [`#317`](https://github.com/nocobase/nocobase/pull/317)
- Fix multiple apps [`#316`](https://github.com/nocobase/nocobase/pull/316)
- Fix acl target action error [`#311`](https://github.com/nocobase/nocobase/pull/311)
- feat: file storages [`#314`](https://github.com/nocobase/nocobase/pull/314)
- fix(plugin-workflow): fix some ux [`#313`](https://github.com/nocobase/nocobase/pull/313)
- fix(plugin-workflow): fix query node getter field [`#308`](https://github.com/nocobase/nocobase/pull/308)
- Fix create nocobase app [`#307`](https://github.com/nocobase/nocobase/pull/307)
- fix: create-nocobase-app [`#306`](https://github.com/nocobase/nocobase/pull/306)
- Fix create nocobase app [`#305`](https://github.com/nocobase/nocobase/pull/305)
- fix: block item add overflow:hidden [`#304`](https://github.com/nocobase/nocobase/pull/304)

### Commits

- feat(license): replace MIT license with Apache-2.0 [`717efa8`](https://github.com/nocobase/nocobase/commit/717efa889d471fac3f909137e2adb96586414aad)
- feat: translations [`5c0184a`](https://github.com/nocobase/nocobase/commit/5c0184a397885d6de5307a7087c2d93042cd49f8)
- feat: translations [`1f04f90`](https://github.com/nocobase/nocobase/commit/1f04f90a00e071aa9ab294f21e8d02373191eecc)

## [v0.6.2-alpha.12](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.11...v0.6.2-alpha.12) - 2022-04-21

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.12 [`5a668cf`](https://github.com/nocobase/nocobase/commit/5a668cf9d0450944f3d2d5beed9e8d5e5b96f5d7)
- fix: create-nocobase-app publish [`269e73e`](https://github.com/nocobase/nocobase/commit/269e73ef19d41835813609b39744c40fb1fff92e)
- chore: create-nocobase-app package.json [`1c30ee1`](https://github.com/nocobase/nocobase/commit/1c30ee1c630d021dc919ce6fcc56cce179db20ae)

## [v0.6.2-alpha.11](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.10...v0.6.2-alpha.11) - 2022-04-20

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.11 [`8741015`](https://github.com/nocobase/nocobase/commit/8741015a6237cd3ea7342edcb7aa11fe794e6b18)
- fix: read-config [`f6d23ad`](https://github.com/nocobase/nocobase/commit/f6d23add8c1845dd4b567d2958c24ada8ae8cee0)

## [v0.6.2-alpha.10](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.9...v0.6.2-alpha.10) - 2022-04-20

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.10 [`693c668`](https://github.com/nocobase/nocobase/commit/693c668282d8032b69245ae7e5c1cafa3c41e584)
- fix: publish [`9e717ae`](https://github.com/nocobase/nocobase/commit/9e717ae3ca2f453005602df03b08edca14c56505)

## [v0.6.2-alpha.9](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.7...v0.6.2-alpha.9) - 2022-04-20

### Merged

- feat: details block [`#302`](https://github.com/nocobase/nocobase/pull/302)
- Fix(plugin workflow): fix collection data form view [`#301`](https://github.com/nocobase/nocobase/pull/301)
- feat: add $isCurrentUser filter operator [`#299`](https://github.com/nocobase/nocobase/pull/299)
- fix: through table primaryKey error [`#297`](https://github.com/nocobase/nocobase/pull/297)
- feat: junction collection for linkTo field [`#296`](https://github.com/nocobase/nocobase/pull/296)
- fix: long text will wrap in FormItem [`#295`](https://github.com/nocobase/nocobase/pull/295)
- fix(client): avoid cannot getField by randomly generated name and throw error [`#294`](https://github.com/nocobase/nocobase/pull/294)
- Feat/create nocobase app [`#273`](https://github.com/nocobase/nocobase/pull/273)
- feat(plugin-workflow): add all crud nodes for workflow [`#293`](https://github.com/nocobase/nocobase/pull/293)
- feat(plugin-workflow): add create node component [`#292`](https://github.com/nocobase/nocobase/pull/292)
- fix: rich text removed value avoid dispaly html string [`#290`](https://github.com/nocobase/nocobase/pull/290)

### Commits

- fix: update yarn.lock [`fcfde7e`](https://github.com/nocobase/nocobase/commit/fcfde7ed0a5b7fdae3fe7424e406ca2e5d944f9b)
- chore(versions): 😊 publish v0.6.2-alpha.9 [`1afc867`](https://github.com/nocobase/nocobase/commit/1afc86733cb090cf5f45c781ad6488c32caa740c)
- fix: update useCreateActionProps & useUpdateActionProps [`fca0943`](https://github.com/nocobase/nocobase/commit/fca0943e8d013a0e8bb46756b89cfc992aa1b6c1)

## [v0.6.2-alpha.7](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.6...v0.6.2-alpha.7) - 2022-04-16

### Commits

- feat: improve code [`2202cc6`](https://github.com/nocobase/nocobase/commit/2202cc64d960918113b50bf0dc352a59cac04484)
- chore(versions): 😊 publish v0.6.2-alpha.7 [`d165782`](https://github.com/nocobase/nocobase/commit/d165782860681af206005039f4bec00fc7fe4241)

## [v0.6.2-alpha.6](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.5...v0.6.2-alpha.6) - 2022-04-15

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.6 [`faa064a`](https://github.com/nocobase/nocobase/commit/faa064ae8dbdcba98e1782a8e2c0b5a338e68219)

## [v0.6.2-alpha.5](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.4...v0.6.2-alpha.5) - 2022-04-15

### Commits

- chore: create-nocobase-app lib [`fc27ebc`](https://github.com/nocobase/nocobase/commit/fc27ebc08a5c889596432a2ece6ba9e0c8957bab)
- chore: create-nocobase-app [`8d0703c`](https://github.com/nocobase/nocobase/commit/8d0703c568ad0e66a14e3a4d47d57b1d63cd64f8)
- chore(versions): 😊 publish v0.6.2-alpha.5 [`2b21546`](https://github.com/nocobase/nocobase/commit/2b21546c4c50c7b5447d991d3852b90dca7219b9)

## [v0.6.2-alpha.4](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.3...v0.6.2-alpha.4) - 2022-04-15

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.4 [`e3a9e92`](https://github.com/nocobase/nocobase/commit/e3a9e924e002afeb02fb785fcecb124dd6d995a1)

## [v0.6.2-alpha.3](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.1...v0.6.2-alpha.3) - 2022-04-15

### Commits

- feat: workspaces [`0eb6997`](https://github.com/nocobase/nocobase/commit/0eb6997c7257332751e49d4a6c623c2ccd786495)
- chore(versions): 😊 publish v0.6.2-alpha.3 [`2feae05`](https://github.com/nocobase/nocobase/commit/2feae051e24a46c0b78b31ef2a4dafdb14344398)
- chore: 0.6.2-alpha.2 [`dbf86d5`](https://github.com/nocobase/nocobase/commit/dbf86d52ccc7653e6b23386c2aa465402702da85)

## [v0.6.2-alpha.1](https://github.com/nocobase/nocobase/compare/v0.6.2-alpha.0...v0.6.2-alpha.1) - 2022-04-15

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.1 [`c6b58b2`](https://github.com/nocobase/nocobase/commit/c6b58b215e43a48d625b8493eefc438c6b9e1e7a)

## [v0.6.2-alpha.0](https://github.com/nocobase/nocobase/compare/v0.6.1-alpha.0...v0.6.2-alpha.0) - 2022-04-15

### Commits

- chore(versions): 😊 publish v0.6.2-alpha.0 [`5351fb3`](https://github.com/nocobase/nocobase/commit/5351fb3ab34a92b97102640dffa7aeafa5294b97)

## [v0.6.1-alpha.0](https://github.com/nocobase/nocobase/compare/v0.6.0...v0.6.1-alpha.0) - 2022-04-15

### Commits

- chore(versions): 😊 publish v0.6.1-alpha.0 [`0b52b73`](https://github.com/nocobase/nocobase/commit/0b52b731dcd23e6ae251c4d5f5c4da781dd109d5)

## [v0.6.0](https://github.com/nocobase/nocobase/compare/v0.6.0-alpha.1...v0.6.0) - 2022-04-15

### Merged

- Feat: plugin-workflow [`#288`](https://github.com/nocobase/nocobase/pull/288)
- fix: slate style [`#289`](https://github.com/nocobase/nocobase/pull/289)
- fix: toJSON with belongsTo Assoication [`#287`](https://github.com/nocobase/nocobase/pull/287)
- feat: improve acl module [`#283`](https://github.com/nocobase/nocobase/pull/283)
- fix: destroy own records [`#285`](https://github.com/nocobase/nocobase/pull/285)
- feat(plugin-workflow): support context variables from model trigger [`#284`](https://github.com/nocobase/nocobase/pull/284)
- fix: acl write [`#280`](https://github.com/nocobase/nocobase/pull/280)
- fix: call root server hook after insertNewSchema [`#282`](https://github.com/nocobase/nocobase/pull/282)
- Feat/plugin workflow [`#278`](https://github.com/nocobase/nocobase/pull/278)
- feat: acl provider [`#279`](https://github.com/nocobase/nocobase/pull/279)
- feat: add Slate component [`#272`](https://github.com/nocobase/nocobase/pull/272)
- Feat/plugin users with jwt [`#258`](https://github.com/nocobase/nocobase/pull/258)
- fix: modify antd style of default [`#277`](https://github.com/nocobase/nocobase/pull/277)
- fix(client): meet undefined error after clear filter cascader value [`#267`](https://github.com/nocobase/nocobase/pull/267)
- Feat(plugin workflow): refactor calculation and add filter for query [`#264`](https://github.com/nocobase/nocobase/pull/264)
- feat: block provider [`#261`](https://github.com/nocobase/nocobase/pull/261)
- fix: toJSON with null association [`#260`](https://github.com/nocobase/nocobase/pull/260)
- fix: error handle error [`#259`](https://github.com/nocobase/nocobase/pull/259)

### Commits

- fix: yarn.lock [`7a7eb0c`](https://github.com/nocobase/nocobase/commit/7a7eb0cc82af0b1621476d2bb163b43ccc92da80)
- fix: yarn.lock [`e226f04`](https://github.com/nocobase/nocobase/commit/e226f04e505ed7f4d94abf3074ad4f375d15c67d)
- feat: rich text [`5b41b33`](https://github.com/nocobase/nocobase/commit/5b41b338072ec75f579a695bdae34dd69918752b)

## [v0.6.0-alpha.1](https://github.com/nocobase/nocobase/compare/v0.5.0-alpha.33...v0.6.0-alpha.1) - 2022-04-05

### Merged

- fix: textarea read pretty can support break line [`#255`](https://github.com/nocobase/nocobase/pull/255)
- fix: markdown support ellipsis [`#257`](https://github.com/nocobase/nocobase/pull/257)
- featPlugin multiple apps [`#248`](https://github.com/nocobase/nocobase/pull/248)
- add action log tempalte [`#239`](https://github.com/nocobase/nocobase/pull/239)
- fix some bugs [`#252`](https://github.com/nocobase/nocobase/pull/252)
- fix(plugin-workflow): fix adding/removing node in parallel branches [`#253`](https://github.com/nocobase/nocobase/pull/253)
- Feat: client base entry of plugin workflow [`#225`](https://github.com/nocobase/nocobase/pull/225)
- fix: updateAt on move scope change [`#251`](https://github.com/nocobase/nocobase/pull/251)
- feat: get json schema with async node [`#246`](https://github.com/nocobase/nocobase/pull/246)
- feat: insertNewSchema [`#245`](https://github.com/nocobase/nocobase/pull/245)
- fix: transaction error [`#242`](https://github.com/nocobase/nocobase/pull/242)
- feat: block templates [`#240`](https://github.com/nocobase/nocobase/pull/240)
- feat: uiSchema clearAncestor [`#241`](https://github.com/nocobase/nocobase/pull/241)
- feat: init sort field values [`#236`](https://github.com/nocobase/nocobase/pull/236)
- fix: move action without alter updatedAt [`#235`](https://github.com/nocobase/nocobase/pull/235)
- feat: role check action [`#234`](https://github.com/nocobase/nocobase/pull/234)
- feat: ne operator [`#233`](https://github.com/nocobase/nocobase/pull/233)
- fix: user current role [`#232`](https://github.com/nocobase/nocobase/pull/232)
- featEnable permission [`#229`](https://github.com/nocobase/nocobase/pull/229)
- test: update reverseField [`#231`](https://github.com/nocobase/nocobase/pull/231)
- feat: kanban [`#230`](https://github.com/nocobase/nocobase/pull/230)
- Nocobase next kanban [`#223`](https://github.com/nocobase/nocobase/pull/223)
- add: test [`#224`](https://github.com/nocobase/nocobase/pull/224)
- Plugin error handler [`#222`](https://github.com/nocobase/nocobase/pull/222)
- fix: array $noneOf with null [`#220`](https://github.com/nocobase/nocobase/pull/220)
- fix: filter parser with number in key [`#219`](https://github.com/nocobase/nocobase/pull/219)
- feat: ui-schema-tree-path descendant index [`#218`](https://github.com/nocobase/nocobase/pull/218)
- fix: array operator query error [`#217`](https://github.com/nocobase/nocobase/pull/217)
- fix: operator query value [`#216`](https://github.com/nocobase/nocobase/pull/216)
- feat: string operators [`#215`](https://github.com/nocobase/nocobase/pull/215)
- feat: error handle middleware [`#214`](https://github.com/nocobase/nocobase/pull/214)
- refactor: filter schema component [`#213`](https://github.com/nocobase/nocobase/pull/213)
- fix: empty operator with $or filter [`#212`](https://github.com/nocobase/nocobase/pull/212)
- feat: plugin install [`#211`](https://github.com/nocobase/nocobase/pull/211)
- feat: sortBy through table value [`#209`](https://github.com/nocobase/nocobase/pull/209)
- Feat: plugin workflow [`#210`](https://github.com/nocobase/nocobase/pull/210)
- fix: collection fields sort [`#208`](https://github.com/nocobase/nocobase/pull/208)
- feat: sort in collection fields [`#207`](https://github.com/nocobase/nocobase/pull/207)
- fix Collection rest api [`#205`](https://github.com/nocobase/nocobase/pull/205)
- feat: non paged list [`#204`](https://github.com/nocobase/nocobase/pull/204)
- feat: finish calendar component develop [`#199`](https://github.com/nocobase/nocobase/pull/199)
- fix(dependencies): move json-template into original sub packages [`#203`](https://github.com/nocobase/nocobase/pull/203)
- Feat(plugin workflow): add more instructions [`#201`](https://github.com/nocobase/nocobase/pull/201)
- fix: getJsonSchema with properties [`#202`](https://github.com/nocobase/nocobase/pull/202)
- fix: postgres array operator [`#200`](https://github.com/nocobase/nocobase/pull/200)
- fix: postgres sort with appends issue [`#198`](https://github.com/nocobase/nocobase/pull/198)
- feat: uiSchema remove api [`#196`](https://github.com/nocobase/nocobase/pull/196)
- refactor: perPage to pageSize [`#197`](https://github.com/nocobase/nocobase/pull/197)
- fix: option parser test [`#195`](https://github.com/nocobase/nocobase/pull/195)
- fix: nest append [`#194`](https://github.com/nocobase/nocobase/pull/194)
- fix: test with database [`#193`](https://github.com/nocobase/nocobase/pull/193)
- fix(plugin-workflow): fix dependencies in package [`#192`](https://github.com/nocobase/nocobase/pull/192)
- Fix: plugin-workflow test [`#191`](https://github.com/nocobase/nocobase/pull/191)
- Refactor(plugin-workflow): upgrade plugin to use abstract plugin class and fix types [`#190`](https://github.com/nocobase/nocobase/pull/190)
- fix: ui schema storage [`#188`](https://github.com/nocobase/nocobase/pull/188)
- fix: ui schema storage [`#187`](https://github.com/nocobase/nocobase/pull/187)
- fix: update guard with Model instance [`#186`](https://github.com/nocobase/nocobase/pull/186)
- fix: getProperties with order [`#183`](https://github.com/nocobase/nocobase/pull/183)
- feat(server): improve application [`#177`](https://github.com/nocobase/nocobase/pull/177)
- Feature: plugin-workflow MVP [`#171`](https://github.com/nocobase/nocobase/pull/171)
- fix(root): fix dependencies in packages to avoid building errors [`#178`](https://github.com/nocobase/nocobase/pull/178)
- Application [`#175`](https://github.com/nocobase/nocobase/pull/175)
- feat: add acl plugin [`#169`](https://github.com/nocobase/nocobase/pull/169)
- add Filter component into schema componens [`#176`](https://github.com/nocobase/nocobase/pull/176)
- feat: add Markdown component into schema components [`#173`](https://github.com/nocobase/nocobase/pull/173)
- feat: table related components [`#172`](https://github.com/nocobase/nocobase/pull/172)
- feat: add select component into schema component [`#168`](https://github.com/nocobase/nocobase/pull/168)
- feat: add TreeSelect component into schema components [`#167`](https://github.com/nocobase/nocobase/pull/167)
- Plugin acl [`#166`](https://github.com/nocobase/nocobase/pull/166)
- add upload component into schema components [`#165`](https://github.com/nocobase/nocobase/pull/165)
- migrate TimePicker component into schema components [`#164`](https://github.com/nocobase/nocobase/pull/164)
- Feat/plugin UI schema v0.6 [`#143`](https://github.com/nocobase/nocobase/pull/143)
- Feat/plugin collection manager [`#147`](https://github.com/nocobase/nocobase/pull/147)
- Acl [`#162`](https://github.com/nocobase/nocobase/pull/162)
- feat: acl [`#153`](https://github.com/nocobase/nocobase/pull/153)
- feat: add InputNumber Component into schema component [`#160`](https://github.com/nocobase/nocobase/pull/160)
- feature/nocobase next password [`#159`](https://github.com/nocobase/nocobase/pull/159)
- feat: add DatePicker into schema components [`#161`](https://github.com/nocobase/nocobase/pull/161)
- feat: add input into schema component [`#158`](https://github.com/nocobase/nocobase/pull/158)
- feat: add radio into schema component [`#154`](https://github.com/nocobase/nocobase/pull/154)
- optimize: rename checkbox component file [`#155`](https://github.com/nocobase/nocobase/pull/155)
- Nocobase next color select [`#157`](https://github.com/nocobase/nocobase/pull/157)
- feat: add async-data-provider component [`#151`](https://github.com/nocobase/nocobase/pull/151)
- feat: client v0.6 [`#150`](https://github.com/nocobase/nocobase/pull/150)
- Feat/GitHub actions [`#148`](https://github.com/nocobase/nocobase/pull/148)
- feat: filter by target key [`#146`](https://github.com/nocobase/nocobase/pull/146)
- refactor: actions [`#137`](https://github.com/nocobase/nocobase/pull/137)
- feat: context field type support [`#131`](https://github.com/nocobase/nocobase/pull/131)
- feat: database next [`#130`](https://github.com/nocobase/nocobase/pull/130)
- feat: rename resourceKey & associatedKey to resourceIndex & associatedIndex [`#126`](https://github.com/nocobase/nocobase/pull/126)
- refactor: table cell text overflow that show ellipsis [`#125`](https://github.com/nocobase/nocobase/pull/125)
- Add S3 storage and refactors [`#124`](https://github.com/nocobase/nocobase/pull/124)
- Fix: plugin-file-manager [`#111`](https://github.com/nocobase/nocobase/pull/111)
- refactor: code splitting of the table component [`#121`](https://github.com/nocobase/nocobase/pull/121)
- refactor: code splitting of the table component [`#120`](https://github.com/nocobase/nocobase/pull/120)
- feat: add reset button in the filter panel [`#110`](https://github.com/nocobase/nocobase/pull/110)
- feat: allow user to change password [`#109`](https://github.com/nocobase/nocobase/pull/109)

### Commits

- v0.6 [`732d310`](https://github.com/nocobase/nocobase/commit/732d31009eafbded78dd35dee5d891438783ba53)
- create-nocobase-app template from [develop] [`9f4bea7`](https://github.com/nocobase/nocobase/commit/9f4bea79668643d37c2b488eb969b2c93a241026)
- feat: improve view action schema initializer [`590ca26`](https://github.com/nocobase/nocobase/commit/590ca267b27b093b67aa140c4e94fd2b97c8eeb6)

## [v0.5.0-alpha.33](https://github.com/nocobase/nocobase/compare/v0.4.0-alpha.6...v0.5.0-alpha.33) - 2021-11-22

### Merged

- fix: upgrade formily & side menu render with createPortal & use deep compare effect [`#103`](https://github.com/nocobase/nocobase/pull/103)
- fix: SchemaRenderer get schema value [`#102`](https://github.com/nocobase/nocobase/pull/102)
- fix: upgrade formily and form.setValues uses overwrite strategy  [`#101`](https://github.com/nocobase/nocobase/pull/101)
- feat: support  i18n [`#99`](https://github.com/nocobase/nocobase/pull/99)
- feat: new version of the documentation [`#95`](https://github.com/nocobase/nocobase/pull/95)
- option-tag style [`#92`](https://github.com/nocobase/nocobase/pull/92)
- create-nocobase-app: favicon [`#91`](https://github.com/nocobase/nocobase/pull/91)
- feat: create nocobase app with simple & quickstart option [`#87`](https://github.com/nocobase/nocobase/pull/87)
- feat: export plugin [`#73`](https://github.com/nocobase/nocobase/pull/73)

### Commits

- v0.5 [`2cbcd08`](https://github.com/nocobase/nocobase/commit/2cbcd087ce6629d8f0df550ee35e02065db41dbc)
- refactor [`75cd158`](https://github.com/nocobase/nocobase/commit/75cd158a270935559a9922d1dd074811253013b9)
- feat: improve code [`c6b68f2`](https://github.com/nocobase/nocobase/commit/c6b68f2b10e4e8df5257345f5e39408666c5810d)

## [v0.4.0-alpha.6](https://github.com/nocobase/nocobase/compare/v0.4.0-alpha.5...v0.4.0-alpha.6) - 2021-04-18

### Merged

- docs: add docs [`#75`](https://github.com/nocobase/nocobase/pull/75)
- refactor: use boolean value instead of null [`#74`](https://github.com/nocobase/nocobase/pull/74)

### Commits

- fix: improve login form styles [`5319000`](https://github.com/nocobase/nocobase/commit/5319000bd613ce9d2ac0a66f73ab403a84c5b8dd)
- fix: error message for login and registration [`214b227`](https://github.com/nocobase/nocobase/commit/214b227a6c1fe92bf54968e369aeaeabb8f73d7a)
- docs: nodejs provided by docker [`22739af`](https://github.com/nocobase/nocobase/commit/22739afa2da4dd38eda9077f5ca566cd022f4dc2)

## [v0.4.0-alpha.5](https://github.com/nocobase/nocobase/compare/v0.4.0-alpha.2...v0.4.0-alpha.5) - 2021-04-07

### Commits

- chore(versions): publish packages 0.4.0-alpha.5 [`ef93a3c`](https://github.com/nocobase/nocobase/commit/ef93a3c11c28419e1e842f73799cf005d49a5116)
- chore(versions): publish packages 0.4.0-alpha.4 [`a22efec`](https://github.com/nocobase/nocobase/commit/a22efec65d85fd15e59332d2eb6483cb84a1e619)
- chore(versions): publish packages 0.4.0-alpha.3 [`e72eebb`](https://github.com/nocobase/nocobase/commit/e72eebb8cd5e666b642030a9e268961385cc4d4d)

## [v0.4.0-alpha.2](https://github.com/nocobase/nocobase/compare/v0.4.0-alpha.1...v0.4.0-alpha.2) - 2021-04-07

### Commits

- refactor: app middlewares [`17362a8`](https://github.com/nocobase/nocobase/commit/17362a844439e5510f254195fa135b6335866ef3)
- chore(versions): publish packages 0.4.0-alpha.2 [`c2f1876`](https://github.com/nocobase/nocobase/commit/c2f18763c9e7c03a7a46edafd26b1fa884b8f272)

## v0.4.0-alpha.1 - 2021-04-07

### Merged

- fix: minor problems [`#72`](https://github.com/nocobase/nocobase/pull/72)
- Develop [`#68`](https://github.com/nocobase/nocobase/pull/68)
- Feature: plugin-china-region [`#66`](https://github.com/nocobase/nocobase/pull/66)
- Feature: filter for linkTo field [`#64`](https://github.com/nocobase/nocobase/pull/64)
- fix: make default view/tab cannot be destroyed [`#63`](https://github.com/nocobase/nocobase/pull/63)
- Feature/plugin automations [`#65`](https://github.com/nocobase/nocobase/pull/65)
- Feature/action logs [`#62`](https://github.com/nocobase/nocobase/pull/62)
- Feature/action logs [`#61`](https://github.com/nocobase/nocobase/pull/61)
- Feature/destroy lock [`#60`](https://github.com/nocobase/nocobase/pull/60)
- fix: ignore some typescript error [`#59`](https://github.com/nocobase/nocobase/pull/59)
- feat: route permissions [`#58`](https://github.com/nocobase/nocobase/pull/58)
- Feature: add permission plugin api [`#57`](https://github.com/nocobase/nocobase/pull/57)
- fix: updatedBy foreignKey [`#56`](https://github.com/nocobase/nocobase/pull/56)
- feat: add permissions plugin [`#53`](https://github.com/nocobase/nocobase/pull/53)
- fix: updatedBy field in bulkUpdate hook [`#54`](https://github.com/nocobase/nocobase/pull/54)
- test: skip bug test cases for ci passing [`#52`](https://github.com/nocobase/nocobase/pull/52)
- fix: avoid bug when update other field [`#51`](https://github.com/nocobase/nocobase/pull/51)
- feat: date-only operators [`#50`](https://github.com/nocobase/nocobase/pull/50)
- Feature field for set default [`#49`](https://github.com/nocobase/nocobase/pull/49)
- Feature: custom operators for querying [`#48`](https://github.com/nocobase/nocobase/pull/48)
- fix: toInclude bug with nested associations [`#47`](https://github.com/nocobase/nocobase/pull/47)
- feat: make single file upload to attachment available [`#46`](https://github.com/nocobase/nocobase/pull/46)
- feature: add file manager base architecture [`#44`](https://github.com/nocobase/nocobase/pull/44)
- feat: add createdBy/updatedBy field config for table managed by collections [`#43`](https://github.com/nocobase/nocobase/pull/43)
- fix: use wrapped and logic for merging filters [`#42`](https://github.com/nocobase/nocobase/pull/42)
- fix: filterByFields should return same value when input == null (close 0) [`#41`](https://github.com/nocobase/nocobase/pull/41)
- fix: Symbol property could not be iterated in for-in [`#39`](https://github.com/nocobase/nocobase/pull/39)
- Feature/sort [`#38`](https://github.com/nocobase/nocobase/pull/38)
- refactor: change sort strategy from offset to targetId [`#37`](https://github.com/nocobase/nocobase/pull/37)
- Feature/sort [`#36`](https://github.com/nocobase/nocobase/pull/36)
- feat: add filter and transaction for destroy action [`#35`](https://github.com/nocobase/nocobase/pull/35)
- fix: field filter logic for create/update [`#34`](https://github.com/nocobase/nocobase/pull/34)
- Feature: action fields options for create/update [`#32`](https://github.com/nocobase/nocobase/pull/32)
- Fix: change strategy from add to set for updateAssociations [`#33`](https://github.com/nocobase/nocobase/pull/33)
- Test/ci [`#31`](https://github.com/nocobase/nocobase/pull/31)
- feat: improve collection hooks/fields/actions/views... [`#30`](https://github.com/nocobase/nocobase/pull/30)
- Fix/model update associations [`#29`](https://github.com/nocobase/nocobase/pull/29)
- fix: database test cases and table options [`#28`](https://github.com/nocobase/nocobase/pull/28)
- feat: add virtual attribute geter & setter support [`#27`](https://github.com/nocobase/nocobase/pull/27)
- feat: collection options & hooks [`#21`](https://github.com/nocobase/nocobase/pull/21)
- feat(users): add users module [`#26`](https://github.com/nocobase/nocobase/pull/26)
- feat: add sort action [`#22`](https://github.com/nocobase/nocobase/pull/22)
- Test/list [`#19`](https://github.com/nocobase/nocobase/pull/19)
- feat: pagination options [`#20`](https://github.com/nocobase/nocobase/pull/20)
- test: refactor test in database and add more [`#17`](https://github.com/nocobase/nocobase/pull/17)
- feat: actions & views [`#18`](https://github.com/nocobase/nocobase/pull/18)
- Test cases for database [`#16`](https://github.com/nocobase/nocobase/pull/16)
- Refactor: change global injection of test for actions package. [`#15`](https://github.com/nocobase/nocobase/pull/15)
- feat: improve plugins [`#14`](https://github.com/nocobase/nocobase/pull/14)
- Doc: add README.md for server. [`#12`](https://github.com/nocobase/nocobase/pull/12)
- fix: parseRequest & registerHandlers [`#10`](https://github.com/nocobase/nocobase/pull/10)
- fix #9 [`#11`](https://github.com/nocobase/nocobase/pull/11)
- feat: support register and call partial actions [`#7`](https://github.com/nocobase/nocobase/pull/7)
- 发布核心框架 [`#6`](https://github.com/nocobase/nocobase/pull/6)

### Fixed

- fix #9 (#11) [`#9`](https://github.com/nocobase/nocobase/issues/9) [`#9`](https://github.com/nocobase/nocobase/issues/9)

### Commits

- chore: adjust parameters [`b95e2da`](https://github.com/nocobase/nocobase/commit/b95e2da129aa49b5d8fb3e31ba8975818f7053cb)
- first commit [`e5d30b3`](https://github.com/nocobase/nocobase/commit/e5d30b30ba4dd38de764b0e5044f836f04a03706)
- style: code formatting [`ce4a22f`](https://github.com/nocobase/nocobase/commit/ce4a22fbb9b1ba9b88db1dc86609e94944f9d904)
