# Design permissions around an organisation

Part of [the organisation dimension](overview.md). Use it to decide who gets what once departments exist: which permission sets to write, whom to assign them to and which data scope each grant uses. [Department scopes and heads](scopes.md) has the registration code.

The core needs only the authorization plugin: permission sets, the department and department-head subject types, and the two department data scopes. Default access, sharing rules and restriction rules are separate, optional plugins; the sections that use them are marked optional and each gives the permission-set alternative where there is one. Before designing with one, confirm it is installed as the authorization Skill's `references/optional-capabilities.md` describes.

## Core design with permission sets

### A permission set is a job role, not a person

Write one set per job, such as sales assistant, sales engineer, department head or delivery specialist, and never one per person or per department.

Give each grant a relative scope such as 本部门 / My departments or 本部门及下属部门 / My departments and below, so one set serves every holder: the North head and the South head hold the same head set and each sees their own part of the tree.

A person's access is the union of every set they hold, directly or inherited. Adding a person to a department, appointing a head or granting a job never needs a new set.

### Assign the baseline to departments and the job role to people

Assign to a department only what everyone in it and below it should have: page access and the read-only baseline their work shares.

Assign job-specific sets to the person, or to a position subject when positions exist. A department with both assistants and engineers must not hold the engineer set, because every assistant would inherit engineering rights; the assistants keep the department baseline and each engineer receives the engineer set directly.

Revoking a department's set then leaves every direct job role intact, and a person moving department keeps their job and swaps their baseline.

### Department heads are a derived subject

Model heads as a fixed subject type, 部门负责人 / Department heads with the single id `*`, that resolves for everyone who heads an active department. Assign the head set to it once.

The assignment follows appointments: whoever is appointed receives the set on their next request, and whoever is replaced loses it, with nobody editing assignments.

One head set with 本部门及下属部门 serves directors and managers alike, because the scope starts from the departments each head leads. A head need not be a member of the department they lead; count the departments they head as their own.

Write a second head set only for a genuinely different capability, such as approving, and still assign it to the heads subject.

Title the subject type with the same localized term as the department's Head field, as [one localized name](settings-page.md#one-localized-name) describes, and store the titles of seeded sets and rules as translation descriptors.

### Choose the scope by the relationship

| Scope                                       | Selects records whose owner is an active member of | Use it for                                           |
| ------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 本部门 / My departments                     | The viewer's own departments                       | Peer visibility: colleagues see each other's work    |
| 本部门及下属部门 / My departments and below | Those departments and every one below them         | Heads and managers overseeing their part of the tree |

Both scopes are relative to the viewer, not to the subject the set is assigned to: a member of two departments sees the owners of both. Because they are computed for whoever reads, neither can express "another department's data": 本部门及下属部门 assigned to Delivery selects what Delivery's members own, never what Sales owns. Cross-department access therefore selects the records themselves, as [cross-department work](#cross-department-work-with-permission-sets-alone) describes.

Only active memberships in departments whose whole ancestor chain is active count, on the owner's side and the viewer's; disabling a department ends both.

### Owner-based or record-carried department

An owner-based scope reads the department of the record's owner, so the record follows the person: when an engineer transfers from North to South, their projects move to the South head. Use it when the work belongs to whoever does it, such as sales pipelines, personal tasks and expense claims.

A record-carried scope reads a `departmentId` stored on the record, so the record stays with the unit when people move. Use it for a department's assets, budgets, contracts or cases that a successor inherits. [Subjects, sync and seeds](subjects.md#scope-business-records-by-department) shows that resolver.

When records have no owner of their own, such as orders, resolve through the parent record's owner. When a record has both an owner and a preparer, choose the one whose department should decide and say so, since a North engineer's draft for a South project follows the engineer.

### Organisation attributes feed business scopes

Attributes the organisation owns, such as a department's region, belong on the department and sync into the business module's own scope tables, as [subjects, sync and seeds](subjects.md#organisation-attributes-feed-business-data-scopes) shows. A region scope then follows the organisation without the business module knowing departments exist.

### Cross-department work with permission sets alone

The department scopes cannot give one department another department's records, so without the sharing-rules plugin there is no department-relative way to do it. What remains is a grant that names the records: a composite grant's data scope may be a record selection instead of a record access key, such as `projects.grant({ view: { projects: selection.records(['project-12', 'project-15']) } })`, or the built-in custom filter on a column the records carry. Assign that set to the receiving department. It works, but it grants the action and the records together, so it is a set per arrangement rather than per job role, and every change to the list edits the set. Keep it for a small, standing arrangement; when the list changes often or must be reviewed apart from job roles, install the sharing-rules plugin.

Do not give the receiving department a viewer-relative scope in the hope of reaching the other unit: it reaches what the receiving department's own members own, which for a member of two departments includes colleagues nobody meant to share.

## Optional: cross-department sharing

Requires the sharing-rules plugin. A sharing rule has recipients (授权对象), which may be a department, and shares either specific records or a data scope with them. It adds records to an action the recipients already hold; it never grants the action.

For one department to see another's records, the rule's recipient is the receiving department and its selection is the specific records. A data scope does not work here: the department scopes are computed for the viewer, so 本部门及下属部门 in a rule for Delivery still selects Delivery's own records.

The receiving department needs the action, so assign it a light set that grants it with a scope that reaches nothing unintended, such as 本人拥有的记录 / Records I Own (`recordsIOwn`): Delivery's members own no projects, so what they see is exactly what the rule shares. A viewer-relative scope such as 本部门 would also show a member who belongs to a second department that department's records. Without the plugin, the seed skips the rule and the department sees nothing through it. Removing the rule removes only the widened records.

Prefer sharing over the permission-set alternative when the arrangement is an exception administrators turn on and off, or when it should be reviewed apart from the job roles. Seed the rule and its assignment only after confirming the plugin's Collections exist.

## Optional: restrictions for a department

Requires the restriction-rules plugin. A restriction assigned to a department applies to every member of it and of the departments below it; assigned to the root department it covers the whole company. A head who is not a member is outside it, so assign the restriction to the heads subject as well when it must cover them.

Keep a restriction that must survive a transfer on the person as well, since leaving the department ends it.

Without the plugin, keep excluded records out of every scope you grant: write the confidentiality condition into the record access itself, or grant a scope that never selects those records.

## Optional: default access

Requires the default-access plugin. Default access is one baseline per resource for every holder of the action, across the whole application.

A department scope makes a good baseline only when everyone who holds the action belongs to a department: someone outside every department receives nothing from 本部门.

Because it is global, changing a resource's default reaches every holder, including accounts outside the organisation and other modules' users. Prefer a department-assigned set when only part of the company should get the baseline. Without the plugin, grant the baseline scope in each job's set.

## Worked example

A trading company with a Sales Center (North Sales and South Sales below it), a Delivery department and an Executive Office:

| Who                          | What they see                                              | How it is granted                                                                                            | Why                                                                             |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Every salesperson            | The sales pages, and orders of their region                | Assistant set assigned to Sales Center; region scope                                                         | The shared baseline of the sales unit                                           |
| North Sales members          | Each other's projects, read-only                           | Project viewer set with 本部门, assigned to North Sales                                                      | Peer visibility within one team                                                 |
| Engineers                    | Their region's projects, editable                          | Engineer set assigned to each engineer                                                                       | A job role the assistants beside them must not inherit                          |
| Sales Center and North heads | Projects, quotes and orders of their departments and below | Head set with 本部门及下属部门, assigned once to Department heads                                            | Follows each appointment; one set for every level                               |
| Delivery                     | The sales projects it prepares                             | Own-projects viewer set (`recordsIOwn`) assigned to Delivery; optional sharing rule selecting those projects | The action from the set, the records from the rule; without the plugin, nothing |
| Everyone in the company      | Nothing confidential                                       | Optional restriction assigned to the root department                                                         | One company-wide invariant                                                      |
