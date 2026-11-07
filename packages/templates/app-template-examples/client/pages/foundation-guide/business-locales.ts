export const enUS = {
  db: {
    summary:
      'Manage connected business information consistently across lists, details and reports.',
    scenario:
      'Customer, contact, order and inventory records that need ongoing maintenance.',
    prompt:
      'Build data management for [business]. Manage [customers, contacts and orders], their relationships and required information. Provide lists, search, filters, creation, editing and details. Limit access and changes according to [roles and responsibilities]. Verify duplicate handling, related records and report totals.',
  },
  concurrency: {
    summary:
      'Coordinate simultaneous changes to the same business record to reduce conflicts.',
    scenario:
      'Competing order claims, balance updates or inventory operations.',
    prompt:
      'Handle concurrent changes to [record] in [business]. Decide which operations wait and which reject duplicates, with clear waiting, conflict and retry feedback. Check whether coordination covers all running application instances, then verify the result when two users act simultaneously.',
  },
  i18n: {
    summary:
      'Make pages, form guidance and operation results understandable across languages.',
    scenario:
      'Teams in different regions sharing customer, order or employee applications.',
    prompt:
      'Add [Chinese and English] interface content to [business]. Cover menus, field labels, validation, empty states and operation results with consistent business terminology. Check long text and missing translations. Do not automatically rewrite user-entered business content.',
  },
  jobs: {
    summary:
      'Run lengthy work in the background while users continue other tasks.',
    scenario: 'Bulk exports, data preparation or external synchronization.',
    prompt:
      'Add a background [bulk export] task to [business]. Show a task record immediately, with progress, results and failure reasons available after leaving the page. Define safe retries and prevent duplicate business results from repeated clicks. Restrict result access and downloads to authorized users.',
  },
  lifecycle: {
    summary:
      'Organize business records into clear states, allowed actions and processing history.',
    scenario:
      'Support tickets, expenses, purchase requests and order fulfillment.',
    prompt:
      'Create a [draft, pending, completed, closed] process for [business record]. Define who handles each state, allowed actions and conditions for the next step. Provide process guidance, work queues and history. Verify that unauthorized actions and invalid state changes are blocked.',
  },
  queue: {
    summary: 'Process bursts of work in a queue without keeping users waiting.',
    scenario: 'Order follow-up, bulk messages and data synchronization.',
    prompt:
      'Queue [follow-up work] in [business]. Define when it is queued, the successful outcome and how failures are retried or handled manually. Receiving the same work twice must not duplicate business effects. Provide a way to inspect processing status.',
  },
  realtime: {
    summary: 'Keep pages up to date as business information changes.',
    scenario: 'Collaborative tasks, notifications and export progress.',
    prompt:
      'Update [business page] when other users change records. Show only changes the current user may access. Indicate disconnection and recover the latest data after reconnecting. Verify updates, access isolation and recovery with two accounts.',
  },
  'app-plugin-file': {
    summary:
      'Attach files to business records with upload, preview, download and access controls.',
    scenario:
      'Contracts, expense receipts, employee photos and order attachments.',
    prompt:
      'Add attachments to [contract management]. Each contract can have multiple PDFs or images, up to [20 MB] each, with preview, download and deletion. Owners may upload and delete; participants may view and download; others must not access attachments. Preserve the form after upload failures and allow retry. Verify permissions with different roles and confirm each attachment belongs to the correct contract.',
  },
  'app-plugin-authentication': {
    summary:
      'Let users sign in with their own identities and manage their sessions.',
    scenario: 'Application access for employees, customers or partners.',
    prompt:
      'Complete sign-in, sign-out and session-expiry handling for [application], using [existing account method]. Clarify whether self-registration is allowed. Return users to their intended page after sign-in and prevent protected access after sign-out or expiry. Verify successful, failed and expired sessions.',
  },
  'app-plugin-users': {
    summary: 'Manage application members, account status and assigned roles.',
    scenario:
      'Onboarding, departures, team changes and responsibility updates.',
    prompt:
      'Provide member management for [application]. Administrators can add members, assign [roles] and deactivate departing users. Assign roles only to explicitly selected people and make assignments visible and editable. Verify ordinary members cannot administer other accounts and deactivated accounts cannot sign in.',
  },
  'app-plugin-authorization': {
    summary: 'Define who may view, change and act on business information.',
    scenario:
      'Salespeople accessing their customers, managers viewing team data and finance handling selected records.',
    prompt:
      'Configure [sales management] permissions: salespeople view and edit their own customers; managers view team customers; finance sees only [payment information]. Specify pages, actions and record scopes for each role and provide explicit member assignment in administration. Verify page, operation and data access with different roles.',
  },
  'app-plugin-mail': {
    summary:
      'Connect email accounts, sending, receiving and synchronization to business work.',
    scenario: 'Customer follow-up, quotations and business correspondence.',
    prompt:
      'Connect [authorized mailbox] to [customer management]. Provide reading, composing and sending with clear send or sync failures. Define how messages relate to customers and restrict mailbox use to authorized people. Verify with a test mailbox and test recipients before real business use.',
  },
  'app-plugin-notification': {
    summary:
      'Notify the right people when business events need their attention.',
    scenario: 'Task assignments, status changes and work reminders.',
    prompt:
      'In [task management], notify [relevant people] when a task is assigned or its status changes to [specified state]. Explain the event and link to the task. Define delivery channels, avoid duplicate alerts for the same event, handle failures and verify recipients and access scope.',
  },
  'app-plugin-knowledge': {
    summary:
      'Organize knowledge so teams can find and use information within their permissions.',
    scenario:
      'Employee handbooks, product information, procedures and project documents.',
    prompt:
      'Build [team knowledge base] organized by [department or topic], with navigation, search and reading. Define who may read, edit and manage each area. Make common answers easy to find and verify search and content access with authorized and unauthorized accounts.',
  },
  'app-plugin-agents': {
    summary:
      'Bring AI assistants into business work to find information, organize it and perform defined tasks.',
    scenario:
      'Knowledge questions, customer information and business assistance.',
    prompt:
      'Add a [business assistant] to [application] to help [users] with [specific task]. It may access only information the user is allowed to see. Specify automatic actions and actions requiring user confirmation, and identify missing information rather than guessing. Provide a conversation entry and verify answers and action boundaries with realistic questions.',
  },
  'app-plugin-api-keys': {
    summary:
      'Allow approved external systems to access the application for a specific user.',
    scenario: 'System integrations and scheduled synchronization.',
    prompt:
      'Provide access-key management for [external system] connecting to [application]. Each key belongs to a specific user and is limited to [purpose]. Let users create and revoke keys and see their purpose. Do not repeatedly expose complete keys in pages or logs. Verify revocation and that access cannot exceed the owning user’s permissions.',
  },
  'app-plugin-scheduler': {
    summary: 'Run recurring work at specified times and inspect each result.',
    scenario:
      'Daily customer synchronization, weekly summaries and scheduled reminders.',
    prompt:
      'Create a recurring [daily customer sync] in [application], running at [time] in [timezone]. Provide a task list, enable/disable controls and execution history with results and failure reasons. Define repeat and catch-up behavior. Test one run and verify the next scheduled time.',
  },
  'app-plugin-authz-default-access': {
    summary:
      'Set a shared baseline of visible records for people who already have the relevant permissions.',
    scenario: 'Public customers or shared resources visible to team members.',
    prompt:
      'In [customer management], let [team members] who already have view permission see [public customers] by default. Define public records and restricted fields. Do not add edit or delete permissions, and verify people without view permission still cannot see these records.',
  },
  'app-plugin-authz-sharing-rules': {
    summary: 'Share selected business records with collaborators across teams.',
    scenario: 'Customer collaboration, project support and order handovers.',
    prompt:
      'Add sharing rules for [customers or projects], sharing [matching records] with [specified collaborators]. Define the scope and how sharing is removed while respecting recipients’ existing action permissions. Verify visibility before, during and after sharing.',
  },
  'app-plugin-authz-restriction-rules': {
    summary:
      'Further narrow selected users’ data access to protect sensitive records.',
    scenario:
      'Temporary collaborators limited to selected projects or restricted customer records.',
    prompt:
      'Limit [specified people] in [application] to [allowed records]. Explain the combined effect of existing roles and sharing rules and make restrictions visible in administration. Verify allowed records remain accessible and records outside the scope are blocked even if previously shared.',
  },
  'app-plugin-concurrency': {
    summary:
      'Connect business operations to shared coordination to reduce simultaneous execution conflicts.',
    scenario:
      'Repeated handling of the same order or users competing for one resource.',
    prompt:
      'Coordinate [order processing] so concurrent handling of [the same order] does not conflict. Check the coverage of the current deployment and explain whether it supports multiple running application instances. Provide waiting or conflict feedback and verify processing can resume after errors.',
  },
  'app-plugin-database-explorer': {
    summary:
      'Help administrators understand what business information the application stores and how it is organized.',
    scenario: 'Review existing data before planning new pages and features.',
    prompt:
      'Provide [administrators] a read-only view of business data structures, fields and relationships with understandable labels. Do not offer data or structure modification. Verify ordinary users cannot enter, then identify which existing data [new feature] can reuse.',
  },
  'app-plugin-foundation': {
    summary:
      'Inspect which foundation capabilities the application actually uses before extending it.',
    scenario: 'Taking over an existing application and planning further work.',
    prompt:
      'Inspect the capabilities actually used by [current application]. Explain which business features are integrated and which are merely available dependencies. Provide a way to verify usage, then identify reusable parts and missing prerequisites for [planned feature].',
  },
  'app-plugin-i18n': {
    summary:
      'Let users switch the application language and retain their preference.',
    scenario: 'Chinese- and English-speaking teams using the same application.',
    prompt:
      'Add a [Chinese, English] language selector to [application], defaulting to [Chinese] and retaining each user’s preference. Update menus, forms and feedback together and preserve the choice on refresh. Verify the first visit and signing in again.',
  },
  'app-plugin-notification-in-app': {
    summary:
      'Collect personal notifications inside the application for convenient review.',
    scenario: 'Task reminders, status changes and personal business updates.',
    prompt:
      'Add a personal inbox to [application] for [task assignments and status changes]. Show unread status, allow marking messages read and link to related records. Users may see only their own messages. Verify empty states, inaccessible linked records and switching accounts.',
  },
  'app-plugin-notification-providers': {
    summary:
      'Deliver business notifications through email, Feishu or DingTalk.',
    scenario:
      'Important reminders that should reach people outside the application.',
    prompt:
      'Send [business notifications] through [email, Feishu or DingTalk]. Check existing channels and recipient settings and identify missing connection information. Provide channel management and delivery results. Verify formatting and delivery with test recipients before connecting real business events.',
  },
  'app-plugin-template-print': {
    summary:
      'Give the Agent guidance for building documents that follow business templates.',
    scenario: 'Contracts, quotations and invoices with a prescribed layout.',
    prompt:
      'Use the template-printing guidance to build document generation for [quotations] from [my template]. Fill customer details, line items, amounts and dates and allow Word downloads; offer PDF only after checking environment support. Restrict generation to authorized users and verify pagination, amounts and missing data.',
  },
  'app-plugin-authorization-example': {
    summary: 'Explore how roles differ across projects, quotations and orders.',
    scenario:
      'Designing responsibility and data access in a sales application.',
    prompt:
      'Use the sales permissions example to design project, quotation and order access in [my sales app] for [sales, managers and finance]. Define actions and data scopes before building administration and business pages. Keep explicit role assignment and verify sharing and restrictions with different accounts.',
  },
  'app-plugin-cli-example': {
    summary:
      'Show how an Agent can create maintenance commands for repetitive work.',
    scenario: 'Operator-run data checks or report generation.',
    prompt:
      'Use the command extension example to add an operator-run [data check] tool to [application]. Define inputs, scope and results; inspect without modifying by default. Explain success and failure clearly and provide usage steps and a test result.',
  },
  'app-plugin-database-example': {
    summary:
      'Use an example to prepare data structures and initial content for a new business feature.',
    scenario: 'Preparing consistent data for a new module.',
    prompt:
      'Use the data extension example to prepare fields, relationships and initial settings for [new module]. Separate required setup from demonstration data and preserve existing records. Verify a new environment works and an existing environment retains its data after updating.',
  },
  'app-plugin-file-example': {
    summary:
      'Try employee photos and order attachments to see how files fit different business records.',
    scenario: 'Adding file operations to employee or order pages.',
    prompt:
      'Use the attachment example to add one profile photo to [employee records] and multiple attachments to [orders]. Support replacement, upload and viewing with defined file types and size limits. Restrict permissions and verify record consistency after replacing or deleting files.',
  },
  'app-plugin-jobs-example': {
    summary:
      'Try task submission, progress and recurring execution before adapting them to business work.',
    scenario: 'Bulk exports or daily data preparation.',
    prompt:
      'Use the background jobs example to build [bulk export] and [daily preparation] in [application]. Provide task lists, progress, results, failure details, safe retries and recurring-task controls. Verify results remain accessible after leaving the page and repeated operations do not repeat business effects.',
  },
  'app-plugin-lifecycle-example': {
    summary:
      'Use ticket, expense and order examples to organize business states and processing.',
    scenario: 'Moving an offline process into an application.',
    prompt:
      'Use the business process examples to implement [current offline process]. Define requesters, handlers, states, return conditions and history with work queues and process administration. Complete a realistic run, then verify returns, cancellation and unauthorized actions.',
  },
  'app-plugin-mail-example': {
    summary:
      'Explore mail management with simulated mailboxes before connecting a real account.',
    scenario: 'Validating email workflows before business integration.',
    prompt:
      'Demonstrate [team mailbox] account management, sync, composing, templates and signatures with the mail example. Keep delivery simulated and send nothing to real recipients. Identify reusable pages and features and the prerequisites for connecting [my mail service].',
  },
  'app-plugin-notification-example': {
    summary: 'See how task assignment triggers a personal notification.',
    scenario: 'Adding reminders to task or support-ticket applications.',
    prompt:
      'Use the task notification example to notify [assigned handlers] when [tickets] are assigned or updated. Include a summary and a link to the ticket. Test assignment and a status update with two accounts, verifying correct recipients and ticket access.',
  },
  'app-plugin-office-flows-example': {
    summary:
      'Use data requests, incoming documents and office tasks to organize collaboration.',
    scenario:
      'Department coordination, information requests and related tasks.',
    prompt:
      'Use the office process example to build [data-use requests]. Requesters provide purpose and scope; [designated people] handle requests and create related collaboration tasks when needed. Provide My requests, My work and history and verify linked task and request states stay consistent.',
  },
  'app-plugin-queue-example': {
    summary:
      'Use an example to process batches of work item by item in the background.',
    scenario: 'Digest generation, messages and order follow-up.',
    prompt:
      'Use the queue example to process [batch business work] item by item. Show submission and processing results and define retry and duplicate handling. Verify all-success, partial-failure and resubmission with test data and provide an entry point or usage instructions.',
  },
  'app-plugin-realtime-example': {
    summary:
      'Try live task collaboration, personal notifications and export progress.',
    scenario: 'Adding automatic updates to business pages.',
    prompt:
      'Use the realtime business example to update [team tasks] automatically. Changes by one person should reach other authorized users, while personal messages remain private. Test with two accounts, disconnect and reconnect, and confirm the latest data is restored.',
  },
  'app-plugin-repository-example': {
    summary:
      'Use customer, order and reporting examples to build connected business pages.',
    scenario: 'Customer contacts, order items and sales summaries.',
    prompt:
      'Use the business data examples to build [customers, contacts, orders and line items]. Support related views, filters and sales summaries and keep related information consistent within each submission. Verify totals, relationship changes and role-specific data scopes.',
  },
  'app-plugin-routes-example': {
    summary:
      'Use an example to add a business page with real data to the application.',
    scenario: 'A new business entry point or small feature page.',
    prompt:
      'Use the page integration example to add [business page] and navigation to [application]. Display [required information] with loading, empty and failure states. Limit access to [specified roles] and verify refresh and direct links work.',
  },
  'app-plugin-service-provider-example': {
    summary:
      'Use a service-status example to understand ongoing background work.',
    scenario: 'Business capabilities that need a continuously running service.',
    prompt:
      'Use the service example to plan operation and status checks for [ongoing business work]. Define startup, shutdown and error recovery and restrict access to status information. Verify with simulated work first, then identify prerequisites for real integration.',
  },
  'app-plugin-skills-example': {
    summary:
      'Show how reusable capability guidance helps an Agent build consistently.',
    scenario:
      'Repeated reuse of existing components and business capabilities.',
    prompt:
      'Use the capability-guidance example to document [existing team feature] for an Agent. Explain suitable scenarios, required business information, reusable entry points and verification. Have the Agent build a [business notice] example from the guidance and identify missing or ambiguous instructions.',
  },
  'app-plugin-template-print-example': {
    summary:
      'Try filling a document template with sales data and downloading the result.',
    scenario: 'Verifying quotation or invoice printing workflows.',
    prompt:
      'Use the printing example to generate downloadable Word documents for [my sales records] using [specified template] and authorized data. Verify customer details, line items, amounts and pagination. Enable PDF only after confirming conversion support and explain permission or missing-data failures.',
  },
  unlistedPlugin: {
    summary:
      'This capability has no business guide yet. Ask the Agent to check which problems it can help solve.',
    scenario: 'Assessing suitability for a planned feature.',
    prompt:
      'Check whether [selected capability] can help with [my business requirement]. Read the guidance available in this application, confirm actual functionality and prerequisites, and do not infer capability from its name. Explain reusable parts, missing conditions and verification before completing the agreed scope.',
  },
};

export const zhCN: typeof enUS = {
  db: {
    summary: '管理相互关联的业务信息，让列表、详情和统计使用一致的数据。',
    scenario: '客户、联系人、订单、库存等需要长期维护的信息。',
    prompt:
      '帮我搭建【业务名称】的数据管理功能。需要管理【客户、联系人、订单】，明确它们之间的关系和必填信息。提供列表、搜索、筛选、新增、编辑和详情入口。按【角色与职责】限制可查看和修改的数据；检查重复信息、关联数据和统计结果是否正确。',
  },
  concurrency: {
    summary: '协调多人同时操作同一条业务记录，减少相互覆盖和冲突。',
    scenario: '多人抢单、同时修改余额或操作同一笔库存。',
    prompt:
      '在【业务名称】中处理多人同时操作【业务记录】的情况。明确哪些操作需要排队或拒绝重复执行，为用户显示等待、冲突和重试提示。先确认当前部署是否能覆盖所有同时运行的应用，再验证两人同时操作时的数据结果。',
  },
  i18n: {
    summary: '让不同语言的团队读懂页面、表单提示和操作结果。',
    scenario: '跨地区团队共用客户、订单或员工管理应用。',
    prompt:
      '把【业务名称】的界面支持语言扩展为【中文、英文】。覆盖菜单、字段名称、校验提示、空状态和操作结果，保持业务术语一致。检查长文本显示和遗漏翻译；不要自动改写用户录入的业务内容。',
  },
  jobs: {
    summary: '让耗时工作在后台完成，用户可以继续处理其他事务。',
    scenario: '批量导出、数据整理或外部信息同步。',
    prompt:
      '为【业务名称】增加【批量导出】后台任务。提交后立即显示任务记录，用户离开页面后仍能查看进度、结果和失败原因。明确哪些失败允许重试，重复点击不能生成重复业务结果；只允许有权限的人查看和下载结果。',
  },
  lifecycle: {
    summary: '把业务单据的状态、可执行操作和处理记录组织成清晰流程。',
    scenario: '工单、报销、采购申请和订单履约。',
    prompt:
      '为【业务单据】建立【草稿、待处理、已完成、已关闭】流程。说明每个状态由谁处理、允许哪些操作，以及什么条件下可以进入下一步。提供流程说明、待办入口和处理历史；验证越权操作与不允许的状态变化会被阻止。',
  },
  queue: {
    summary: '把集中到来的工作排队处理，避免用户一直等待。',
    scenario: '订单后续处理、批量消息发送和数据同步。',
    prompt:
      '将【业务名称】中的【后续处理工作】改成排队处理。说明什么时候进入队列、处理成功后做什么，以及失败后如何重试或人工处理。重复收到同一项工作不能重复产生业务结果；提供可检查处理状态的入口。',
  },
  realtime: {
    summary: '让页面及时显示业务变化，减少反复手动刷新。',
    scenario: '协作任务、消息提醒和导出进度。',
    prompt:
      '让【业务页面】在其他人修改记录后及时更新。只向当前用户展示有权查看的变化；断网后显示连接状态，恢复连接后补齐最新数据。用两个账号验证更新效果、权限隔离和重新连接。',
  },
  'app-plugin-file': {
    summary: '为业务记录添加附件，支持上传、预览和下载，并控制谁能访问。',
    scenario: '合同原件、报销票据、员工头像和订单附件。',
    prompt:
      '请为【合同管理】增加附件功能。每份合同可上传多个 PDF 或图片，单个文件不超过【20 MB】，支持预览、下载和删除。合同负责人可以上传和删除，参与人只能查看和下载，其他人不能访问附件。上传失败时保留表单内容并允许重试。请用不同角色验证权限，并确认附件与对应合同关联正确。',
  },
  'app-plugin-authentication': {
    summary: '让用户以自己的身份登录应用，并管理登录状态。',
    scenario: '面向员工、客户或合作伙伴的应用入口。',
    prompt:
      '为【业务应用】完善登录、退出和登录过期处理。使用【已有账号方式】，明确是否允许自行注册。未登录时引导登录，登录后返回原本要访问的页面；退出或登录过期后不能继续查看受保护的信息。请验证成功、失败和过期场景。',
  },
  'app-plugin-users': {
    summary: '管理应用成员、账号状态和各自承担的角色。',
    scenario: '员工入离职、团队调整和职责变更。',
    prompt:
      '为【业务应用】提供成员管理。管理员可以新增成员、调整【角色】并停用离职账号。角色只分配给明确选中的人员，页面中能查看和修改分配结果。验证普通成员无法管理他人账号，停用后的账号不能继续登录。',
  },
  'app-plugin-authorization': {
    summary: '定义谁能查看、修改和处理哪些业务数据。',
    scenario: '销售只能看自己的客户，主管查看团队数据，财务处理指定单据。',
    prompt:
      '为【销售管理】配置权限：销售人员查看和编辑自己负责的客户；主管查看本团队客户；财务只查看【回款相关信息】。列出各角色能访问的页面、执行的操作和可见的数据范围，在管理页面提供明确的人员分配入口。用不同角色验证页面、操作和数据访问权限。',
  },
  'app-plugin-mail': {
    summary: '把邮件往来接入业务，处理账号、收发和同步。',
    scenario: '客户跟进、报价发送和业务邮件归档。',
    prompt:
      '为【客户管理】接入【已授权邮箱】，提供查看邮件、撰写和发送入口，并显示发送或同步失败的原因。说明邮件与客户的关联规则，限制只有授权人员能使用邮箱。先用测试邮箱和测试收件人验证，确认后再用于真实业务。',
  },
  'app-plugin-notification': {
    summary: '在业务发生变化时通知相关人员，帮助他们及时处理。',
    scenario: '任务分配、状态变化和待办提醒。',
    prompt:
      '在【任务管理】中，当任务分配给成员或状态发生【指定变化】时通知【相关人员】。消息说明发生了什么，并提供查看任务的入口。明确使用哪些通知方式，避免同一次变化重复通知；处理发送失败，验证收件人和可见范围正确。',
  },
  'app-plugin-knowledge': {
    summary: '集中管理知识资料，让团队按权限查找和使用内容。',
    scenario: '员工手册、产品资料、操作规范和项目文档。',
    prompt:
      '搭建【团队知识库】，按【部门或主题】组织资料，提供目录、搜索和内容查看。明确哪些人可以阅读、编辑和管理各类资料。为常见问题提供容易找到的入口，并用有权限和无权限的账号验证搜索与内容访问。',
  },
  'app-plugin-agents': {
    summary: '把 AI 助手接入业务，辅助查资料、整理信息和完成指定工作。',
    scenario: '知识问答、客户信息整理和业务处理辅助。',
    prompt:
      '为【业务应用】增加一个【业务助手】。它帮助【使用者】完成【具体任务】，只能访问该用户有权查看的资料。列出允许自动执行的操作，以及必须由用户确认的操作；信息不足时说明缺少什么。提供对话入口并用真实业务问题验证回答与操作边界。',
  },
  'app-plugin-api-keys': {
    summary: '让获准的外部系统代表指定用户访问应用。',
    scenario: '业务系统对接和定时同步。',
    prompt:
      '为【外部系统】访问【业务应用】提供访问密钥管理。每个密钥属于明确的用户，只允许【指定用途】；用户能够创建、查看用途和撤销密钥。不要在页面或日志中反复展示完整密钥。验证撤销立即生效，外部系统无法超出所属用户的权限。',
  },
  'app-plugin-scheduler': {
    summary: '按指定时间重复执行工作，并查看每次执行的结果。',
    scenario: '每天同步客户、每周汇总数据和定时提醒。',
    prompt:
      '为【业务应用】建立【每日客户同步】定时任务，在【时区】每天【时间】执行。提供任务列表、启停入口和执行记录，展示成功、失败及原因。说明重复执行和补执行的规则；先测试一次，再验证下一次执行时间正确。',
  },
  'app-plugin-authz-default-access': {
    summary: '为已有操作权限的人员设置共同可见的数据范围。',
    scenario: '让团队成员都能查看公共客户或公共资料。',
    prompt:
      '在【客户管理】中，让已经具备查看权限的【团队成员】默认看到【公共客户】。明确哪些记录属于公共范围，以及哪些字段仍受限制。不要因此增加编辑或删除权限；验证没有查看权限的人仍看不到这些记录。',
  },
  'app-plugin-authz-sharing-rules': {
    summary: '把指定业务记录共享给协作人员，支持跨团队配合。',
    scenario: '客户协作、项目支援和订单交接。',
    prompt:
      '为【客户或项目】增加共享规则，将【符合条件的记录】共享给【指定协作人员】。说明共享范围和取消共享的方式，继续遵守接收者已有的操作权限。验证共享前后可见范围，以及取消共享后的访问结果。',
  },
  'app-plugin-authz-restriction-rules': {
    summary: '进一步缩小特定人员的数据可见范围，保护敏感记录。',
    scenario: '临时协作者只能查看指定项目，或敏感客户限制访问。',
    prompt:
      '为【业务应用】设置数据限制，让【指定人员】只能访问【允许的记录范围】。说明已有角色权限和共享规则如何共同影响结果，管理页中能查看限制。验证允许的记录可访问，范围外的记录即使曾被共享也不能访问。',
  },
  'app-plugin-concurrency': {
    summary: '为需要协调的业务操作接入统一处理方式，减少同时执行的冲突。',
    scenario: '同一笔订单被多次处理，或多人同时争用同一资源。',
    prompt:
      '为【订单处理】接入操作协调，避免多人同时处理【同一订单】产生冲突。结合当前部署确认能覆盖的范围；如果有多台应用同时运行，先说明是否满足要求。提供等待或冲突反馈，并验证异常后仍能继续处理。',
  },
  'app-plugin-database-explorer': {
    summary: '帮助管理员了解应用保存了哪些业务信息以及它们的结构。',
    scenario: '梳理已有数据，再规划新页面和业务功能。',
    prompt:
      '为【管理员】提供只读的数据结构查看入口，列出应用中的业务数据、字段和关联。用容易理解的名称说明用途，不提供修改数据或结构的操作。验证普通用户无权进入，再根据查看结果说明【新功能】可以复用哪些数据。',
  },
  'app-plugin-foundation': {
    summary: '查看当前应用实际使用了哪些基础能力，为后续搭建提供依据。',
    scenario: '接手已有应用，了解现有能力和使用情况。',
    prompt:
      '检查【当前应用】实际使用的基础能力，向我说明哪些业务功能已接入、哪些只有依赖但尚未使用。提供可核对的使用情况入口，并结合【准备搭建的功能】列出可复用的部分和仍缺少的条件。',
  },
  'app-plugin-i18n': {
    summary: '让用户切换应用语言，并在下次访问时保留选择。',
    scenario: '中英文团队使用同一套业务应用。',
    prompt:
      '为【业务应用】提供【中文、英文】语言切换入口，默认语言为【中文】，保留用户的选择。切换后菜单、表单和提示一起更新，刷新页面后语言不变。检查首次打开和退出后重新登录的显示效果。',
  },
  'app-plugin-notification-in-app': {
    summary: '把通知放进应用内的个人收件箱，方便集中查看和处理。',
    scenario: '任务提醒、状态变化和与个人相关的业务消息。',
    prompt:
      '为【业务应用】增加个人消息中心，展示【任务分配和状态变化】通知。支持未读提示、标记已读和进入相关业务记录。每个人只能查看自己的消息；验证无新消息、通知对应记录已不可访问和登录切换的情况。',
  },
  'app-plugin-notification-providers': {
    summary: '通过邮件、飞书或钉钉等渠道把业务通知送达团队。',
    scenario: '用户离开应用后仍需及时收到重要提醒。',
    prompt:
      '把【业务通知】发送到【邮件、飞书或钉钉】。先确认现有渠道与收件人设置，缺少连接信息时列出需要补充的内容。提供渠道管理和发送结果查看，用测试收件人验证格式与送达情况，再接入真实业务事件。',
  },
  'app-plugin-template-print': {
    summary: '为 Agent 提供单据打印的搭建指引，帮助制作符合业务格式的文件。',
    scenario: '合同、报价单和发票等需要固定排版的单据。',
    prompt:
      '参考模板打印指引，为【报价单】搭建文档生成功能。使用【我提供的模板】，填入客户、明细、金额和日期，支持下载 Word 文档；确认环境支持后再提供 PDF。只允许有权限的人生成单据，验证明细分页、金额和无数据情况。',
  },
  'app-plugin-authorization-example': {
    summary: '通过项目、报价和订单示例，理解不同角色看到和处理的数据差异。',
    scenario: '为自己的销售应用设计人员分工与数据范围。',
    prompt:
      '参考销售权限示例，为【我的销售应用】梳理项目、报价和订单的权限。使用【销售、主管、财务】角色，先列出各自的操作和数据范围，再搭建管理与业务页面。保留角色分配入口，用不同账号验证共享和限制后的结果。',
  },
  'app-plugin-cli-example': {
    summary: '展示如何让 Agent 通过维护命令完成重复工作。',
    scenario: '由运维人员执行的数据检查或报表生成。',
    prompt:
      '参考命令行扩展示例，为【业务应用】增加一个由运维人员执行的【数据检查】工具。明确输入、检查范围和输出结果，默认只检查不修改。成功和失败都要给出可理解的说明，并提供使用步骤和一次测试结果。',
  },
  'app-plugin-database-example': {
    summary: '参考示例为新业务准备数据结构和初始内容。',
    scenario: '新增业务模块时统一准备必要信息。',
    prompt:
      '参考数据扩展示例，为【新业务模块】准备所需字段、关系和初始设置。区分必须存在的初始信息与仅供演示的数据，不覆盖已有业务记录。验证新环境可正常使用，已有环境更新后原数据仍完整。',
  },
  'app-plugin-file-example': {
    summary: '体验员工头像和订单附件，了解不同业务如何使用文件。',
    scenario: '给自己的员工或订单页面增加附件操作。',
    prompt:
      '参考附件示例，为【员工档案】增加单个头像，为【订单】增加多个附件。支持替换头像、上传和查看附件，说明允许的文件类型与大小。限定操作权限，验证删除或替换文件后业务记录仍正确。',
  },
  'app-plugin-jobs-example': {
    summary: '体验任务提交、进度查看和定时执行，再复用到自己的业务。',
    scenario: '批量导出或每天运行的数据整理。',
    prompt:
      '参考后台任务示例，为【业务应用】搭建【批量导出】和【每日整理】功能。提供任务列表、进度、结果和失败说明，支持允许的重试与定时任务启停。验证用户离开页面后仍能找到结果，重复操作不会重复处理业务。',
  },
  'app-plugin-lifecycle-example': {
    summary: '参考工单、报销和订单示例，组织业务状态与处理过程。',
    scenario: '把线下处理步骤搬进应用。',
    prompt:
      '参考业务流程示例，把【当前线下流程】做成应用功能。明确发起人、处理人、状态、退回条件和处理记录，提供待办与流程管理入口。按真实业务顺序走通一次，再验证退回、取消和无权限操作。',
  },
  'app-plugin-mail-example': {
    summary: '通过模拟邮箱体验邮件管理，无需立即连接真实邮箱。',
    scenario: '先确认邮件操作流程，再接入正式业务。',
    prompt:
      '用邮件示例演示【团队邮箱】的账号管理、同步、写信、模板和签名。保持模拟收发，不向真实收件人发信。整理可复用的页面与功能，并说明正式接入【我的邮箱服务】还缺少哪些条件。',
  },
  'app-plugin-notification-example': {
    summary: '通过任务分配示例，体验业务变化如何触发个人通知。',
    scenario: '在自己的任务或工单应用中增加提醒。',
    prompt:
      '参考任务通知示例，让【工单】分配或更新时提醒【对应处理人】。消息中展示摘要和打开工单的入口。用两个账号完成一次分配和状态更新，验证只有正确的人收到消息且可以访问对应工单。',
  },
  'app-plugin-office-flows-example': {
    summary: '参考资料申请、收文和办公任务示例，组织跨人员的协作。',
    scenario: '部门协同、资料使用申请和分层任务处理。',
    prompt:
      '参考办公流程示例，搭建【资料使用申请】。申请人填写用途和资料范围，由【指定负责人】处理；需要协作时创建关联任务。提供我的申请、我的待办和处理历史，验证申请与关联任务的状态保持一致。',
  },
  'app-plugin-queue-example': {
    summary: '参考示例把批量工作交给后台逐项处理。',
    scenario: '集中生成摘要、发送消息或处理订单后续工作。',
    prompt:
      '参考队列示例，为【批量业务工作】搭建逐项处理功能。显示提交结果与处理情况，定义失败重试和重复工作处理规则。用一组测试数据验证全部成功、部分失败和再次提交的情况，并提供使用入口或操作说明。',
  },
  'app-plugin-realtime-example': {
    summary: '体验多人任务协作、个人消息和导出进度的即时变化。',
    scenario: '为自己的业务页面增加自动更新。',
    prompt:
      '参考实时业务示例，为【团队任务】增加自动更新。一个人修改任务后，其他有权限的人能及时看到变化；个人通知仅本人可见。用两个账号测试，再断开并恢复网络，确认页面最终显示最新数据。',
  },
  'app-plugin-repository-example': {
    summary: '参考客户、订单与统计示例，搭建相互关联的业务页面。',
    scenario: '客户联系人、订单明细和销售汇总。',
    prompt:
      '参考业务数据操作示例，搭建【客户、联系人、订单和订单明细】页面。支持关联查看、筛选和销售汇总，确保一次业务提交中的相关信息一起保存。验证金额统计、关联修改和不同角色的数据范围。',
  },
  'app-plugin-routes-example': {
    summary: '参考示例把一个业务页面接入应用，并展示真实数据。',
    scenario: '新增独立业务入口或小型功能页面。',
    prompt:
      '参考页面接入示例，在【业务应用】新增【业务页面】和导航入口。页面展示【需要的信息】，提供加载、空数据和失败提示。只有【指定角色】能够使用，刷新或直接打开页面地址也应正常工作。',
  },
  'app-plugin-service-provider-example': {
    summary: '通过运行状态示例，了解应用如何持续提供一项后台服务。',
    scenario: '需要后台持续工作的业务能力。',
    prompt:
      '参考服务运行示例，为【持续运行的业务工作】规划运行与状态检查方式。说明应用启动、停止和异常恢复时应发生什么，限制状态信息的可见范围。先用模拟工作验证，再说明接入真实业务所需的条件。',
  },
  'app-plugin-skills-example': {
    summary: '展示如何把能力的使用说明交给 Agent，让它按既定方式搭建。',
    scenario: '让团队反复复用已有组件和业务能力。',
    prompt:
      '参考能力指引示例，为【团队已有功能】整理 Agent 可以使用的搭建说明。说明适用场景、需要的业务信息、可复用入口和验证方法。让 Agent 按说明搭建一个【业务通知】示例，并记录说明中缺失或容易误解的部分。',
  },
  'app-plugin-template-print-example': {
    summary: '体验把销售数据填入单据模板，并下载生成的文件。',
    scenario: '验证报价、发票等单据的打印流程。',
    prompt:
      '参考模板打印示例，为【我的销售单据】生成可下载的 Word 文件。使用【指定模板】和当前有权查看的业务数据，检查客户、明细、金额和分页。确认环境满足转换条件后再支持 PDF；无权限或数据缺失时给出明确提示。',
  },
  unlistedPlugin: {
    summary: '这项能力尚未补充业务介绍，可先让 Agent 检查它适合解决什么问题。',
    scenario: '评估是否能用于准备搭建的新功能。',
    prompt:
      '请检查【所选能力】能否帮助搭建【我的业务需求】。先阅读当前应用中已有的说明，确认实际功能和使用条件，不要仅根据名称推测。说明可复用的部分、尚缺的条件和验证方法，再完成已明确范围内的工作。',
  },
};
