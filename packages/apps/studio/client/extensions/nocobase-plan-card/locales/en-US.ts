/** Every key the plan card looks up, so each locale is checked against the same list. */
export interface PlanCardLocale {
  readonly 'planCard.loadFailed': string;
  readonly 'planCard.status.pending': string;
  readonly 'planCard.status.executing': string;
  readonly 'planCard.status.executed': string;
  readonly 'planCard.status.failed': string;
  readonly 'planCard.status.stale': string;
  readonly 'planCard.status.voided': string;
  readonly 'planCard.status.expired': string;
  readonly 'planCard.status.undone': string;
  readonly 'planCard.superseded': string;
  readonly 'planCard.source.intake': string;
  readonly 'planCard.source.conversation': string;
  readonly 'planCard.source.statusRule': string;
  readonly 'planCard.source.other': string;
  readonly 'planCard.proposedBy': string;
  readonly 'planCard.decidedBy': string;
  readonly 'planCard.rowCount_one': string;
  readonly 'planCard.rowCount_other': string;
  readonly 'planCard.expiresIn': string;
  readonly 'planCard.undoableFor': string;
  readonly 'planCard.executedAt': string;
  readonly 'planCard.expand': string;
  readonly 'planCard.collapse': string;
  readonly 'planCard.rows': string;
  readonly 'planCard.issues': string;
  readonly 'planCard.edit': string;
  readonly 'planCard.doneEditing': string;
  readonly 'planCard.execute': string;
  readonly 'planCard.retry': string;
  readonly 'planCard.void': string;
  readonly 'planCard.undo': string;
  readonly 'planCard.cancel': string;
  readonly 'planCard.executed': string;
  readonly 'planCard.executeFailed': string;
  readonly 'planCard.retried': string;
  readonly 'planCard.retryFailed': string;
  readonly 'planCard.voided': string;
  readonly 'planCard.undoDone': string;
  readonly 'planCard.staleNotice': string;
  readonly 'planCard.failedNotice': string;
  readonly 'planCard.failedRow': string;
  readonly 'planCard.skippedTitle': string;
  readonly 'planCard.skipped.changed': string;
  readonly 'planCard.skipped.gone': string;
  readonly 'planCard.skipped.notReversible': string;
  readonly 'planCard.voidTitle': string;
  readonly 'planCard.voidDescription': string;
  readonly 'planCard.executeTitle': string;
  readonly 'planCard.executeDescription': string;
  readonly 'planCard.undoPreview.title': string;
  readonly 'planCard.undoPreview.description': string;
  readonly 'planCard.undoPreview.revertTitle_one': string;
  readonly 'planCard.undoPreview.revertTitle_other': string;
  readonly 'planCard.undoPreview.skippedTitle_one': string;
  readonly 'planCard.undoPreview.skippedTitle_other': string;
  readonly 'planCard.undoPreview.skippedRow': string;
  readonly 'planCard.undoPreview.restore': string;
  readonly 'planCard.undoPreview.separator': string;
  readonly 'planCard.undoPreview.nothing': string;
  readonly 'planCard.undoPreview.failed': string;
  readonly 'planCard.undoPreview.confirm': string;
  readonly 'planCard.undoPreview.ops.issue.retract': string;
  readonly 'planCard.undoPreview.ops.comment.retract': string;
  readonly 'planCard.undoPreview.ops.project.retract': string;
  readonly 'planCard.undoPreview.ops.dependency': string;
  readonly 'planCard.unknownIssue': string;
  readonly 'planCard.wakes': string;
  readonly 'planCard.wakesSkipped': string;
  readonly 'planCard.wakeSkip.deferred': string;
  readonly 'planCard.wakeSkip.denied': string;
  readonly 'planCard.wakeSkip.blocked': string;
  readonly 'planCard.wakeSkip.dormant': string;
  readonly 'planCard.wakeSkip.duplicate': string;
  readonly 'planCard.wakeSkip.archived': string;
  readonly 'planCard.wakeSkip.noRunner': string;
  readonly 'planCard.wakeSkip.unavailable': string;
  readonly 'planCard.flags.label': string;
  readonly 'planCard.flags.startsRun': string;
  readonly 'planCard.flags.finalStatus': string;
  readonly 'planCard.flags.ownerChange': string;
  readonly 'planCard.flags.createsProject': string;
  readonly 'planCard.flags.agentExecutor': string;
  readonly 'planCard.ops.issue.create': string;
  readonly 'planCard.ops.issue.update': string;
  readonly 'planCard.ops.comment.create': string;
  readonly 'planCard.ops.dependency': string;
  readonly 'planCard.ops.project.create': string;
  readonly 'planCard.ops.issue.retract': string;
  readonly 'planCard.ops.comment.retract': string;
  readonly 'planCard.ops.project.retract': string;
  readonly 'planCard.becomes': string;
  readonly 'planCard.openResult': string;
  readonly 'planCard.rowDone': string;
  readonly 'planCard.removed': string;
  readonly 'planCard.fields.title': string;
  readonly 'planCard.fields.description': string;
  readonly 'planCard.fields.projectId': string;
  readonly 'planCard.fields.parentIssueId': string;
  readonly 'planCard.fields.stage': string;
  readonly 'planCard.fields.statusKey': string;
  readonly 'planCard.fields.priority': string;
  readonly 'planCard.fields.ownerUserId': string;
  readonly 'planCard.fields.executor': string;
  readonly 'planCard.fields.labelIds': string;
  readonly 'planCard.fields.startDate': string;
  readonly 'planCard.fields.dueDate': string;
  readonly 'planCard.fields.blockedBy': string;
  readonly 'planCard.fields.content': string;
  readonly 'planCard.fields.name': string;
  readonly 'planCard.fields.visibility': string;
  readonly 'planCard.fields.leadUserId': string;
  readonly 'planCard.columns.title': string;
  readonly 'planCard.columns.project': string;
  readonly 'planCard.columns.priority': string;
  readonly 'planCard.columns.labels': string;
  readonly 'planCard.columns.executor': string;
  readonly 'planCard.columns.owner': string;
  readonly 'planCard.columns.stage': string;
  readonly 'planCard.columns.actions': string;
  readonly 'planCard.priority.none': string;
  readonly 'planCard.priority.urgent': string;
  readonly 'planCard.priority.high': string;
  readonly 'planCard.priority.medium': string;
  readonly 'planCard.priority.low': string;
  readonly 'planCard.removeRow': string;
  readonly 'planCard.restoreRow': string;
  readonly 'planCard.referenced': string;
  readonly 'planCard.indent': string;
  readonly 'planCard.outdent': string;
  readonly 'planCard.editDescription': string;
  readonly 'planCard.untitled': string;
  readonly 'planCard.newProject': string;
  readonly 'planCard.noProject': string;
  readonly 'planCard.defaultOwner': string;
  readonly 'planCard.noExecutor': string;
  readonly 'planCard.clearDate': string;
  readonly 'planCard.labelsPlaceholder': string;
  readonly 'planCard.createNamed': string;
  readonly 'planCard.noOptions': string;
  readonly 'planCard.saving': string;
  readonly 'planCard.change.added': string;
  readonly 'planCard.change.changed': string;
  readonly 'planCard.unsaved': string;
  readonly 'planCard.saveChanges': string;
  readonly 'planCard.saveAndExecute': string;
  readonly 'planCard.discardChanges': string;
  readonly 'planCard.createIssues_one': string;
  readonly 'planCard.createIssues_other': string;
  readonly 'planCard.executedIssues_one': string;
  readonly 'planCard.executedIssues_other': string;
  readonly 'planCard.rowsFailed': string;
  readonly 'planCard.nothingLeft': string;
  readonly 'planCard.labelCreateFailed': string;
}

const enUS: PlanCardLocale = {
  'planCard.loadFailed': 'Unable to load the plan',
  'planCard.status.pending': 'Waiting for you',
  'planCard.status.executing': 'Executing',
  'planCard.status.executed': 'Executed',
  'planCard.status.failed': 'Failed',
  'planCard.status.stale': 'Out of date',
  'planCard.status.voided': 'Voided',
  'planCard.status.expired': 'Expired',
  'planCard.status.undone': 'Undone',
  'planCard.superseded': 'Replaced by a newer plan',
  'planCard.source.intake': 'From intake',
  'planCard.source.conversation': 'From a conversation',
  'planCard.source.statusRule': 'From a status rule',
  'planCard.source.other': 'From {{kind}}',
  'planCard.proposedBy': 'Proposed by {{name}}',
  'planCard.decidedBy': 'For {{name}} to decide',
  'planCard.rowCount_one': '{{count}} change',
  'planCard.rowCount_other': '{{count}} changes',
  'planCard.expiresIn': 'Expires in {{hours}} h',
  'planCard.undoableFor': 'Can be undone for {{hours}} h',
  'planCard.executedAt': 'Executed {{time}}',
  'planCard.expand': 'Show the changes',
  'planCard.collapse': 'Hide the changes',
  'planCard.rows': 'Changes',
  'planCard.issues': 'Issues',
  'planCard.edit': 'Edit',
  'planCard.doneEditing': 'Done',
  'planCard.execute': 'Execute',
  'planCard.retry': 'Check again',
  'planCard.void': 'Void',
  'planCard.undo': 'Undo',
  'planCard.cancel': 'Cancel',
  'planCard.executed': 'The plan was executed.',
  'planCard.executeFailed': 'The plan was not executed; nothing changed.',
  'planCard.retried': 'The plan was checked again.',
  'planCard.retryFailed': 'Some changes no longer pass; fix or remove them.',
  'planCard.voided': 'The plan was voided.',
  'planCard.undoDone': 'The plan was undone.',
  'planCard.staleNotice':
    'Something this plan changes was changed by someone else after it was checked. Nothing was applied; check it again to execute it with the current values.',
  'planCard.failedNotice': 'A change failed, so nothing was applied.',
  'planCard.failedRow': 'Change {{position}}: {{message}}',
  'planCard.skippedTitle': 'Left alone when undone (changed since)',
  'planCard.skipped.changed': 'Someone changed it since',
  'planCard.skipped.gone': 'It no longer exists',
  'planCard.skipped.notReversible': 'It cannot be undone',
  'planCard.voidTitle': 'Void this plan?',
  'planCard.voidDescription':
    'None of its changes will be made. Whoever proposed it can propose another one.',
  'planCard.executeTitle': 'Execute this plan?',
  'planCard.executeDescription': 'These changes reach beyond the plan itself:',
  'planCard.undoPreview.title': 'Undo this plan?',
  'planCard.undoPreview.description':
    'Undoing reverts what the plan did, at once. What someone changed since is left alone.',
  'planCard.undoPreview.revertTitle_one': '{{count}} change will be reverted',
  'planCard.undoPreview.revertTitle_other':
    '{{count}} changes will be reverted',
  'planCard.undoPreview.skippedTitle_one': '{{count}} change is left alone',
  'planCard.undoPreview.skippedTitle_other': '{{count}} changes are left alone',
  'planCard.undoPreview.skippedRow': 'Change {{position}}: {{reason}}',
  'planCard.undoPreview.restore': '{{target}}: {{fields}} back as before',
  'planCard.undoPreview.separator': ', ',
  'planCard.undoPreview.nothing':
    'Everything the plan did was changed since; there is nothing left to undo.',
  'planCard.undoPreview.failed': 'Could not check what undoing would do.',
  'planCard.undoPreview.confirm': 'Undo',
  'planCard.undoPreview.ops.issue.retract': 'Delete the issue {{target}}',
  'planCard.undoPreview.ops.comment.retract':
    'Delete the comment on {{target}}',
  'planCard.undoPreview.ops.project.retract': 'Delete the project {{target}}',
  'planCard.undoPreview.ops.dependency':
    'Reverse the dependency change on {{target}}',
  'planCard.unknownIssue': 'An issue',
  'planCard.wakes': 'Wakes {{name}}',
  'planCard.wakesSkipped': 'Would wake {{name}}, but {{reason}}',
  'planCard.wakeSkip.deferred': 'not yet',
  'planCard.wakeSkip.denied': 'they may not work on it',
  'planCard.wakeSkip.blocked': 'the issue is blocked',
  'planCard.wakeSkip.dormant': 'the issue is in backlog',
  'planCard.wakeSkip.duplicate': 'it is already working on it',
  'planCard.wakeSkip.archived': 'it is archived',
  'planCard.wakeSkip.noRunner': 'no runner is online',
  'planCard.wakeSkip.unavailable': 'it is unavailable',
  'planCard.flags.label': 'What it affects',
  'planCard.flags.startsRun': 'Starts an agent’s run',
  'planCard.flags.finalStatus': 'Closes an issue',
  'planCard.flags.ownerChange': 'Changes an owner',
  'planCard.flags.createsProject': 'Creates a project',
  'planCard.flags.agentExecutor': 'Makes an agent the executor',
  'planCard.ops.issue.create': 'New issue',
  'planCard.ops.issue.update': 'Change issue',
  'planCard.ops.comment.create': 'Comment',
  'planCard.ops.dependency': 'Dependency',
  'planCard.ops.project.create': 'New project',
  'planCard.ops.issue.retract': 'Remove issue',
  'planCard.ops.comment.retract': 'Delete comment',
  'planCard.ops.project.retract': 'Remove project',
  'planCard.becomes': 'becomes',
  'planCard.openResult': 'Open',
  'planCard.rowDone': 'Done',
  'planCard.removed': 'Removed from the plan',
  'planCard.fields.title': 'Title',
  'planCard.fields.description': 'Description',
  'planCard.fields.projectId': 'Project',
  'planCard.fields.parentIssueId': 'Parent issue',
  'planCard.fields.stage': 'Stage',
  'planCard.fields.statusKey': 'Status',
  'planCard.fields.priority': 'Priority',
  'planCard.fields.ownerUserId': 'Owner',
  'planCard.fields.executor': 'Executor',
  'planCard.fields.labelIds': 'Labels',
  'planCard.fields.startDate': 'Start',
  'planCard.fields.dueDate': 'Due',
  'planCard.fields.blockedBy': 'Waits for',
  'planCard.fields.content': 'Comment',
  'planCard.fields.name': 'Name',
  'planCard.fields.visibility': 'Visibility',
  'planCard.fields.leadUserId': 'Lead',
  'planCard.columns.title': 'Title',
  'planCard.columns.project': 'Project',
  'planCard.columns.priority': 'Priority',
  'planCard.columns.labels': 'Labels',
  'planCard.columns.executor': 'Executor',
  'planCard.columns.owner': 'Owner',
  'planCard.columns.stage': 'Stage',
  'planCard.columns.actions': 'Actions',
  'planCard.priority.none': 'No priority',
  'planCard.priority.urgent': 'Urgent',
  'planCard.priority.high': 'High',
  'planCard.priority.medium': 'Medium',
  'planCard.priority.low': 'Low',
  'planCard.removeRow': 'Remove {{title}}',
  'planCard.restoreRow': 'Keep {{title}}',
  'planCard.referenced': 'Other changes depend on it',
  'planCard.indent': 'Make {{title}} a sub-issue of the row above',
  'planCard.outdent': 'Move {{title}} up one level',
  'planCard.editDescription': 'Description of {{title}}',
  'planCard.untitled': 'Untitled',
  'planCard.newProject': 'The project created above',
  'planCard.noProject': 'No project',
  'planCard.defaultOwner': 'Me',
  'planCard.noExecutor': 'Unassigned',
  'planCard.clearDate': 'Clear the date',
  'planCard.labelsPlaceholder': 'Add labels',
  'planCard.createNamed': 'Create "{name}"',
  'planCard.noOptions': 'No options',
  'planCard.saving': 'Saving…',
  'planCard.change.added': 'New',
  'planCard.change.changed': 'Changed',
  'planCard.unsaved': 'Unsaved changes',
  'planCard.saveChanges': 'Save changes',
  'planCard.saveAndExecute': 'Save and execute',
  'planCard.discardChanges': 'Discard changes',
  'planCard.createIssues_one': 'Create {{count}} issue',
  'planCard.createIssues_other': 'Create {{count}} issues',
  'planCard.executedIssues_one': '{{count}} issue created.',
  'planCard.executedIssues_other': '{{count}} issues created.',
  'planCard.rowsFailed':
    'Some changes do not pass. Fix or remove them, then save again.',
  'planCard.nothingLeft': 'A plan needs at least one change.',
  'planCard.labelCreateFailed': 'Could not create the label.',
};

export default enUS;
