export default {
  Workflow: '工作流',
  'Execution history': '执行历史',
  'Clear all executions': '清除所有执行记录',
  'Clear executions will not reset executed count, and started executions will not be deleted, are you sure you want to delete them all?':
    '清空执行记录不会重置执行次数，且执行中的也不会被删除，确定要删除所有执行记录吗？',
  Executed: '已执行',
  Sync: '同步',
  'Sync enabled status of all workflows from database': '从数据库同步所有工作流的启用状态',
  'Trigger type': '触发方式',
  Status: '状态',
  On: '启用',
  Off: '停用',
  Version: '版本',
  'Copy to new version': '复制到新版本',
  Duplicate: '复制',
  'Duplicate to new workflow': '复制为新工作流',
  'Delete a main version will cause all other revisions to be deleted too.': '删除主版本将导致其他版本一并被删除。',
  Loading: '加载中',
  'Load failed': '加载失败',
  'Use transaction': '启用事务',
  'Data operation nodes in workflow will run in a same transaction until any interruption. Any failure will cause data rollback, and will also rollback the history of the execution.':
    '工作流中的节点将在同一个事务中运行。任何失败都会导致数据回滚，同时也会回滚相应的执行历史。',
  'Auto delete history when execution is on end status': '执行结束后自动删除对应状态的历史记录',
  Trigger: '触发器',
  'Trigger variables': '触发器变量',
  'Trigger data': '触发数据',
  'Trigger time': '触发时间',
  'Triggered at': '触发时间',

  'Form event': '表单事件',
  'Event triggers when submitted a workflow bound form action.': '在提交绑定工作流的表单操作按钮后触发。',
  'Form data model': '表单数据模型',
  'Use a collection to match form data.': '使用一个数据表来匹配表单数据。',
  'Associations to use': '待使用的关系数据',
  'User submitted form': '提交表单的用户',
  'Bind workflows': '绑定工作流',
  'Workflow will be triggered after submitting succeeded.': '提交成功后触发工作流。',
  'Workflow will be triggered after saving succeeded.': '保存成功后触发工作流。',
  'Workflow will be triggered directly once the button clicked.': '按钮点击后直接触发工作流。',
  'Submit to workflow': '提交至工作流',
  'Add workflow': '添加工作流',
  'Select workflow': '选择工作流',
  'Trigger data context': '触发数据上下文',
  'Full form data': '完整表单数据',
  'Select context': '选择上下文',
  'Collection event': '数据表事件',
  'Event will be triggered on collection data row created, updated or deleted.':
    '当数据表中的数据被新增、更新或删除时触发。',
  'Trigger on': '触发时机',
  'After record added': '新增数据后',
  'After record updated': '更新数据后',
  'After record added or updated': '新增或更新数据后',
  'After record deleted': '删除数据后',
  'Changed fields': '发生变动的字段',
  'Triggered only if one of the selected fields changes. If unselected, it means that it will be triggered when any field changes. When record is added or deleted, any field is considered to have been changed.':
    '只有被选中的某个字段发生变动时才会触发。如果不选择，则表示任何字段变动时都会触发。新增或删除数据时，任意字段都被认为发生变动。',
  'Only triggers when match conditions': '满足以下条件才触发',
  'Preload associations': '预加载关联数据',
  'Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.':
    '请选中需要在后续节点中被访问的关系字段。超过两层的对多关联可能会导致性能问题，请谨慎使用。',
  'Schedule event': '定时任务',
  'Event will be scheduled and triggered base on time conditions.': '基于时间条件进行定时触发的事件。',
  'Trigger mode': '触发模式',
  'Based on certain date': '自定义时间',
  'Based on date field of collection': '根据数据表时间字段',
  'Starts on': '开始于',
  'Ends on': '结束于',
  'No end': '不结束',
  'Exactly at': '当时',
  'Repeat mode': '重复模式',
  'Repeat limit': '重复次数',
  'No limit': '不限',
  Seconds: '秒',
  Minutes: '分钟',
  Hours: '小时',
  Days: '天',
  Weeks: '周',
  Months: '月',
  'No repeat': '不重复',
  Every: '每',
  'By minute': '按分钟',
  'By hour': '按小时',
  'By day': '按天',
  'By week': '按周',
  'By month': '按月',
  'By field': '数据表字段',
  'By custom date': '自定义时间',
  Advanced: '高级模式',
  End: '结束',
  'Node result': '节点数据',
  'Variable key of node': '节点变量标识',
  Calculator: '运算',
  'Calculate an expression based on a calculation engine and obtain a value as the result. Variables in the upstream nodes can be used in the expression. The expression can be static or dynamic one from an expression collections.':
    '基于计算引擎对一个表达式进行计算，并获得一个值作为结果。表达式中可以使用上游节点里的变量。表达式可以是静态的，也可以是表达式表中的动态表达式。',
  'String operation': '字符串',
  'System variables': '系统变量',
  'System time': '系统时间',
  'Date variables': '日期变量',

  'Executed at': '执行于',
  Queueing: '队列中',
  'On going': '进行中',
  Resolved: '完成',
  Pending: '待处理',
  Failed: '失败',
  Error: '出错',
  Aborted: '已终止',
  Canceled: '已取消',
  Rejected: '已拒绝',
  'Retry needed': '需重试',

  'Triggered but still waiting in queue to execute.': '已触发但仍在队列中等待执行。',
  'Started and executing, maybe waiting for an async callback (manual, delay etc.).':
    '已开始执行，可能在等待异步回调（人工、延时等）。',
  'Successfully finished.': '成功完成。',
  'Failed to satisfy node configurations.': '未满足节点配置造成的失败。',
  'Some node meets error.': '某个节点出错。',
  'Running of some node was aborted by program flow.': '某个节点被程序流程终止。',
  'Manually canceled whole execution when waiting.': '等待时被手动取消整个执行。',
  'Rejected from a manual node.': '被人工节点拒绝继续。',
  'General failed but should do another try.': '执行失败，需重试。',

  'Continue the process': '继续流程',
  'Terminate the process': '终止流程',
  'Save temporarily': '暂存',

  Operations: '操作',
  'This node contains branches, deleting will also be preformed to them, are you sure?':
    '节点包含分支，将同时删除其所有分支下的子节点，确定继续？',
  Control: '流程控制',
  'Collection operations': '数据表操作',
  Manual: '人工处理',
  'Extended types': '扩展类型',
  'Node type': '节点类型',
  Calculation: '运算',
  'Calculation engine': '运算引擎',
  Basic: '基础',
  'Calculation expression': '运算表达式',
  'Expression syntax error': '表达式语法错误',
  'Syntax references: ': '语法参考：',
  'Calculation result': '运算结果',
  True: '真',
  False: '假',
  concat: '连接',
  Condition: '条件判断',
  'Based on boolean result of the calculation to determine whether to "continue" or "exit" the process, or continue on different branches of "yes" and "no".':
    '基于运算结果的真假来决定“继续”或“退出”流程，或者在“是”与“否”的分支上分别继续。',
  Mode: '模式',
  'Continue when "Yes"': '“是”则继续',
  'Branch into "Yes" and "No"': '“是”和“否”分别继续',
  'Condition expression': '条件表达式',
  'Create record': '新增数据',
  'Add new record to a collection. You can use variables from upstream nodes to assign values to fields.':
    '向一个数据表中添加新的数据。可以使用上游节点里的变量为字段赋值。',
  'Update record': '更新数据',
  'Update records of a collection. You can use variables from upstream nodes as query conditions and field values.':
    '更新一个数据表中的数据。可以使用上游节点里的变量作为查询条件和数据值。',
  'Update mode': '更新模式',
  'Update in a batch': '批量更新',
  'Update one by one': '逐条更新',
  'Update all eligible data at one time, which has better performance when the amount of data is large. But the updated data will not trigger other workflows, and will not record audit logs.':
    '一次性更新所有符合条件的数据，在数据量较大时有比较好的性能；但被更新的数据不会触发其他工作流，也不会记录更新日志。',
  'The updated data can trigger other workflows, and the audit log will also be recorded. But it is usually only applicable to several or dozens of pieces of data, otherwise there will be performance problems.':
    '被更新的数据可以再次触发其他工作流，也会记录更新日志；但通常只适用于数条或数十条数据，否则会有性能问题。',
  'Query record': '查询数据',
  'Query records from a collection. You can use variables from upstream nodes as query conditions.':
    '查询一个数据表中的数据。可以使用上游节点里的变量作为查询条件。',
  'Allow multiple records as result': '允许结果是多条数据',
  'If checked, when there are multiple records in the query result, an array will be returned as the result, which can be operated on one by one using a loop node. Otherwise, only one record will be returned.':
    '选中后，当查询结果有多条记录时，会返回数组作为结果，可以使用循环节点对它逐条操作；否则，仅返回一条数据。',
  'Exit when query result is null': '查询结果为空时，退出流程',
  'Please select collection first': '请先选择数据表',
  'Only update records matching conditions': '只更新满足条件的数据',
  'Please add at least one condition': '请添加至少一个条件',
  'Unassigned fields will be set to default values, and those without default values will be set to null.':
    '未被赋值的字段将被设置为默认值，没有默认值的设置为空值。',

  'Delete record': '删除数据',
  'Delete records of a collection. Could use variables in workflow context as filter. All records match the filter will be deleted.':
    '删除一个数据表中的数据。可以使用上游节点里的变量作为过滤条件。所有满足条件的数据都将被删除。',

  'Executed workflow cannot be modified': '已经执行过的工作流不能被修改',
  'Can not delete': '无法删除',
  'The result of this node has been referenced by other nodes ({{nodes}}), please remove the usage before deleting.':
    '该节点的执行结果已被其他节点（{{nodes}}）引用，删除前请先移除引用。',

  'HTTP request': 'HTTP 请求',
  'Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.':
    '向指定 URL 发送 HTTP 请求。可以使用上游节点里的变量作为请求头、参数和请求体。',
  'HTTP method': 'HTTP 方法',
  URL: '地址',
  Headers: '请求头',
  'Add request header': '添加请求头',
  Parameters: '参数',
  'Add parameter': '添加参数',
  Body: '请求体',
  'Use variable': '使用变量',
  Format: '格式化',
  Insert: '插入',
  'Timeout config': '超时设置',
  ms: '毫秒',
  'Input request data': '输入请求数据',
  'Only support standard JSON data': '仅支持标准 JSON 数据',
  '"Content-Type" only support "application/json", and no need to specify':
    '"Content-Type" 请求头仅支持 "application/json"，无需填写',
  'Ignore failed request and continue workflow': '忽略失败的请求并继续工作流',
};
