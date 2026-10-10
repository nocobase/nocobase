/**
 * Studio's wording around the knowledge plugin's view (`@nocobase/app-plugin-knowledge`, which words the view itself):
 * the system knowledge page and the project tab, Studio's spaces, and the inbox cards of proposals. Under `knowledge`
 * in the application's locales (`client/locales/en-US.ts` and `zh-CN.ts` spread these in).
 */
export const knowledgeEnUS = {
  systemTitle: 'System knowledge',
  switcher: { projects: 'Project knowledge' },
  access: {
    no: 'No',
    everyone: 'Yes',
    everywhere: 'Yes',
    lead: 'Project lead',
    seesProject: 'Who sees the project',
    source: 'From your roles: {{roles}}',
    systemRead:
      'System knowledge: a role that may read or propose may do so for every system document.',
    systemEdit:
      'System knowledge is edited, and its proposals decided, only by roles whose Edit reaches everything.',
    projectRead:
      'Project knowledge: a role that may read or propose does so in the projects the person can see.',
    projectEdit:
      'Project knowledge is edited, and its proposals decided, by the project lead when the role’s Edit is “Related”, or by any role whose Edit reaches everything.',
    systemManage:
      'Who may access each system folder and article is changed only by roles whose Manage reaches everything; they keep access to all of it.',
    projectManage:
      'Who may access each folder and article of a project is changed by its lead when the role’s Manage is “Related”, or by any role whose Manage reaches everything; they keep access to all of it.',
  },
  subjects: {
    types: {
      user: 'People',
      role: 'Roles',
      project: 'Project',
      agent: 'Agents',
    },
    projectMembers: 'Project members',
    projectLead: 'Project lead',
  },
  projectTab: 'Knowledge',
  spaces: {
    project: 'This project',
    system: 'System',
    inheritedHint:
      'Shared by every project. Read-only here; it is edited on the system knowledge page.',
  },
  search: { inherited: 'System' },
  searchSettings: {
    none: 'None',
    save: 'Save',
    saved: 'Knowledge search settings saved',
    fromModels: 'From model services',
    manageModels: 'Manage models',
    status: {
      title: 'Search status',
      description:
        'Search always matches words; with a vector store and an embedding model it also finds sections by meaning.',
      keyword: 'Keyword search',
      semantic: 'Semantic search',
      available: 'Available',
      unavailable: 'Unavailable',
      off: 'Off',
      building: 'Building',
      keywordHint: 'Matches the words of the query in titles and sections.',
      noModel: 'Choose an embedding model below to turn it on.',
      buildingHint:
        'Embedding {{indexed}} of {{total}} sections; search uses keywords until it is ready.',
      ready: 'Finds sections by meaning, merged with the keyword match.',
      docs: 'How to set up the vector store',
    },
    reasons: {
      VECTORS_OFF: {
        title: 'Vectors are turned off.',
        fix: 'Set agents.vectors.store to sqlite-vec or pgvector in config.yml and restart.',
      },
      VECTOR_STORE_UNKNOWN: {
        title: 'The configured vector store type is not known.',
        fix: 'Set agents.vectors.store to sqlite-vec or pgvector in config.yml and restart.',
      },
      SQLITE_VEC_UNSUPPORTED: {
        title: 'sqlite-vec cannot load on this server.',
        fix: 'Its binary is missing for this platform (such as Alpine). Use pgvector, or run on a glibc Linux, macOS or Windows build.',
      },
      SQLITE_VEC_OPEN_FAILED: {
        title: 'The vector database file cannot be opened.',
        fix: 'Check that agents.vectors.path points to a writable location.',
      },
      PGVECTOR_NOT_CONFIGURED: {
        title: 'pgvector has no database to connect to.',
        fix: 'Set agents.vectors.url, or host, database, user and password, in config.yml.',
      },
      PGVECTOR_CONNECTION_FAILED: {
        title: 'The pgvector database cannot be reached.',
        fix: 'Check its address, credentials and network, then reload this page.',
      },
      PGVECTOR_EXTENSION_MISSING: {
        title: 'The pgvector extension is not installed.',
        fix: 'Install pgvector on that PostgreSQL server, or run CREATE EXTENSION vector as a superuser.',
      },
      VECTOR_STORE_FAILED: {
        title: 'The vector store reported an error.',
        fix: 'See the server log for details, then reload this page.',
      },
      INDEX_NOT_SET_UP: {
        title: 'The vector index is not set up yet.',
        fix: 'Wait for the application to finish starting, then reload this page.',
      },
    },
    store: {
      title: 'Vector store',
      description:
        'Where the embedded sections are kept, apart from the application database.',
      type: 'Type',
      target: 'Location',
      state: 'Status',
      index: 'Index',
      types: {
        'sqlite-vec': 'sqlite-vec (local file)',
        pgvector: 'pgvector (PostgreSQL)',
      },
      none: 'Not configured',
      noIndex: 'No index yet',
      ready: 'Ready: {{indexed}} of {{total}} sections, {{model}}',
      buildingIndex: 'Building: {{indexed}} of {{total}} sections, {{model}}',
      pending: '{{count}} sections waiting to be embedded',
      failed: '{{count}} sections failed for now; they are tried again',
      configNote:
        'Set in config.yml under agents.vectors; restart the application after changing it. A new store builds the index again in the background.',
      restart:
        'Changing the store needs a restart; after it the index is built again in the background, and until it is ready search is by keywords only.',
    },
    embedding: {
      title: 'Embedding model',
      description:
        'Sections are embedded with this model so search also finds them by meaning. Changing it builds a new index in the background; the old one answers until it is ready.',
      empty: 'No embedding model in the model services yet.',
    },
    rerank: {
      title: 'Rerank model',
      description:
        'Reorders the best hits by how well they answer the query. None keeps the merged order.',
      empty: 'No rerank model in the model services yet.',
    },
    contextual: {
      title: 'Add context to sections',
      description:
        'Before a section is embedded, a chat model writes one sentence placing it in its document, which helps search find short sections. For example, a section that only says “Run pnpm build first.” gets “From the release guide, on preparing a deployment.” before it.',
      enable: 'Add context to sections',
      cost: 'Each new or changed section in the spaces turned on costs one extra model call.',
      model: 'Context model',
      empty: 'No chat model in the model services yet.',
      spaces: 'Spaces',
      chooseModel: 'Choose a context model to pick the spaces.',
      space: 'Add context to sections in {{space}}',
      noSpaces: 'No space has knowledge yet.',
    },
    chunking: {
      title: 'Sections',
      description:
        'Articles and files (their extracted text) are cut into sections at their headings for search and citations: Word keeps its own headings, each PDF or slide page and each sheet is a level 2 heading, and text without headings is cut by length. At level 1 only, files are not cut by page or sheet. A space may set its own; saving cuts the documents again in the background and re-indexes them.',
      depth: 'Cut at headings',
      depths: {
        '1': 'Level 1 only (#)',
        '2': 'Down to level 2 (##)',
        '3': 'Down to level 3 (###)',
      },
      target: 'Target length (characters)',
      targetHint:
        'A long section is cut between paragraphs into pieces near this.',
      max: 'Limit (characters)',
      maxHint:
        'A section longer than this is cut. Code blocks and tables are never cut.',
      invalid:
        'Lengths are 200 to 8000 characters, and the target is at most the limit.',
    },
    recall: {
      title: 'Ranking',
      description:
        'How many hits search answers, which it drops, and how it weighs keywords against meaning.',
      limit: 'Results',
      limitHint:
        'How many hits a search answers unless it asks for another number (1–100).',
      minScore: 'Minimum relevance',
      minScoreHint:
        'Hits below this are dropped (0–1). A hit ranked first by keywords and by meaning scores 1; 0 keeps everything.',
      keywordWeight: 'Keyword weight',
      keywordWeightHint:
        'Keywords against meaning (0–1): 0.5 weighs them equally, 1 ranks by keywords only, 0 by meaning only.',
      rerankCandidates: 'Hits the rerank model reads',
      rerankCandidatesHint:
        'The best hits handed to the rerank model, when one is set (1–50).',
      invalid: 'Check the ranges above.',
    },
    whole: {
      title: 'Put small knowledge bases in the prompt',
      description:
        'When everything an online agent may read is estimated below this many tokens, it goes whole into the agent’s prompt (cached by the model service) instead of being searched. 0 turns this off.',
      approx: 'About {{value}} tokens',
      off: 'Off',
      invalid: 'Enter a whole number from 0 to 1,000,000.',
    },
  },
  doc: { notFound: 'This document no longer exists, or you may not see it.' },
  proposals: {
    readOnly: 'Someone who may edit this knowledge decides it.',
    outcomes: {
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    },
  },
  inbox: {
    proposal: 'Knowledge proposal',
    proposalDetail: 'A proposed knowledge change',
    decided: 'Knowledge decided',
    proposalTitle: '{{proposer}} proposes a change to “{{title}}”',
    proposalNewTitle: '{{proposer}} proposes a new document “{{title}}”',
    proposalVerifyTitle: '{{proposer}} confirms “{{title}}” still holds',
    decidedTitle: '{{decider}} {{outcome}} the proposal for “{{title}}”',
    someone: 'Someone',
    open: 'Open in knowledge',
    space: 'Space',
  },
};

export const knowledgeZhCN: typeof knowledgeEnUS = {
  systemTitle: '系统知识',
  switcher: { projects: '项目知识' },
  access: {
    no: '否',
    everyone: '是',
    everywhere: '是',
    lead: '项目负责人',
    seesProject: '能看到项目的人',
    source: '来自你的角色：{{roles}}',
    systemRead: '系统知识：可以阅读或提议的角色，对所有系统文档都可以这样做。',
    systemEdit:
      '系统知识只能由「编辑」范围为全部的角色编辑，提议也由他们决定。',
    projectRead:
      '项目知识：可以阅读或提议的角色，在这个人能看到的项目中这样做。',
    projectEdit:
      '项目知识由项目负责人编辑并决定提议（角色的「编辑」为「相关」时），或由「编辑」范围为全部的任何角色编辑。',
    systemManage:
      '系统知识中每个文件夹和文章的访问权限，只能由「管理」范围为全部的角色修改；他们始终可以访问全部内容。',
    projectManage:
      '项目中每个文件夹和文章的访问权限，由项目负责人（角色的「管理」为「相关」时）或「管理」范围为全部的角色修改；他们始终可以访问全部内容。',
  },
  subjects: {
    types: {
      user: '人员',
      role: '角色',
      project: '项目',
      agent: 'Agent',
    },
    projectMembers: '项目成员',
    projectLead: '项目负责人',
  },
  projectTab: '知识库',
  spaces: {
    project: '本项目',
    system: '系统',
    inheritedHint: '所有项目共享。这里只读，在系统知识页面编辑。',
  },
  search: { inherited: '系统' },
  searchSettings: {
    none: '无',
    save: '保存',
    saved: '知识检索设置已保存',
    fromModels: '来自模型服务',
    manageModels: '管理模型',
    status: {
      title: '检索状态',
      description:
        '检索始终按关键词匹配；配置好向量存储和向量模型后，还能按语义查找段落。',
      keyword: '关键词检索',
      semantic: '语义检索',
      available: '可用',
      unavailable: '不可用',
      off: '未开启',
      building: '建立中',
      keywordHint: '在标题和段落中匹配查询的词。',
      noModel: '在下方选择向量模型后开启。',
      buildingHint:
        '已生成 {{indexed}} / {{total}} 个段落的向量；建好之前按关键词检索。',
      ready: '按语义查找段落，并与关键词匹配合并排序。',
      docs: '如何配置向量存储',
    },
    reasons: {
      VECTORS_OFF: {
        title: '向量已关闭。',
        fix: '在 config.yml 中把 agents.vectors.store 设为 sqlite-vec 或 pgvector，然后重启。',
      },
      VECTOR_STORE_UNKNOWN: {
        title: '配置的向量存储类型无法识别。',
        fix: '在 config.yml 中把 agents.vectors.store 设为 sqlite-vec 或 pgvector，然后重启。',
      },
      SQLITE_VEC_UNSUPPORTED: {
        title: '这台服务器无法加载 sqlite-vec。',
        fix: '当前平台（例如 Alpine）没有它的二进制文件。请改用 pgvector，或在 glibc Linux、macOS、Windows 上运行。',
      },
      SQLITE_VEC_OPEN_FAILED: {
        title: '无法打开向量数据库文件。',
        fix: '检查 agents.vectors.path 指向的位置是否可写。',
      },
      PGVECTOR_NOT_CONFIGURED: {
        title: 'pgvector 没有可连接的数据库。',
        fix: '在 config.yml 中设置 agents.vectors.url，或 host、database、user、password。',
      },
      PGVECTOR_CONNECTION_FAILED: {
        title: '无法连接 pgvector 数据库。',
        fix: '检查地址、账号密码和网络，然后刷新本页。',
      },
      PGVECTOR_EXTENSION_MISSING: {
        title: '没有安装 pgvector 扩展。',
        fix: '在该 PostgreSQL 服务器上安装 pgvector，或用超级用户执行 CREATE EXTENSION vector。',
      },
      VECTOR_STORE_FAILED: {
        title: '向量存储报告了错误。',
        fix: '查看服务器日志了解详情，然后刷新本页。',
      },
      INDEX_NOT_SET_UP: {
        title: '向量索引还没有准备好。',
        fix: '等应用启动完成后刷新本页。',
      },
    },
    store: {
      title: '向量存储',
      description: '段落向量的存放位置，与应用数据库分开。',
      type: '类型',
      target: '位置',
      state: '状态',
      index: '索引',
      types: {
        'sqlite-vec': 'sqlite-vec（本地文件）',
        pgvector: 'pgvector（PostgreSQL）',
      },
      none: '未配置',
      noIndex: '尚无索引',
      ready: '已就绪：{{indexed}} / {{total}} 个段落，{{model}}',
      buildingIndex: '建立中：{{indexed}} / {{total}} 个段落，{{model}}',
      pending: '{{count}} 个段落等待生成向量',
      failed: '{{count}} 个段落暂时失败，会自动重试',
      configNote:
        '在 config.yml 的 agents.vectors 中配置，修改后需重启应用。换用新的存储会在后台重新建立索引。',
      restart:
        '改存储需要重启；重启后在后台重建索引，建好之前只能按关键词检索。',
    },
    embedding: {
      title: '向量模型',
      description:
        '用这个模型为各段落生成向量，检索时也能按语义查找。更换模型会在后台建立新索引，建好之前继续使用旧索引。',
      empty: '模型服务中还没有向量模型。',
    },
    rerank: {
      title: '重排模型',
      description:
        '按与查询的相关程度重新排列靠前的结果。选「无」则保持合并后的顺序。',
      empty: '模型服务中还没有重排模型。',
    },
    contextual: {
      title: '为段落补充上下文',
      description:
        '段落生成向量之前，先由一个对话模型写一句话说明它在文档中的位置，便于检索到简短的段落。例如只写着“先运行 pnpm build。”的段落，会在前面补上“出自发布指南，讲部署前的准备”。',
      enable: '为段落补充上下文',
      cost: '开启的空间中，每个新增或变化的段落都会多调用一次模型。',
      model: '上下文模型',
      empty: '模型服务中还没有对话模型。',
      spaces: '空间',
      chooseModel: '选择上下文模型后才能选择空间。',
      space: '在{{space}}为段落补充上下文',
      noSpaces: '还没有空间包含知识。',
    },
    chunking: {
      title: '分段',
      description:
        '文章和文件（提取出的文字）按标题切成段落，供检索和引用：Word 用原有标题，PDF 和 PPT 每页、表格每个工作表各是一个二级标题；没有标题的按长度切。只按一级标题时，文件不按页或工作表分开。空间可以单独设置；保存后会在后台重新分段并重建索引。',
      depth: '按标题切分',
      depths: {
        '1': '只按一级标题（#）',
        '2': '到二级标题（##）',
        '3': '到三级标题（###）',
      },
      target: '目标长度（字符）',
      targetHint: '过长的段落在段与段之间再切开，每块接近这个长度。',
      max: '上限（字符）',
      maxHint: '超过这个长度的段落会被切开；代码块和表格不会被切开。',
      invalid: '长度须在 200 到 8000 字符之间，且目标不大于上限。',
    },
    recall: {
      title: '排序',
      description:
        '检索返回多少条结果、丢弃哪些，以及关键词和语义各占多少分量。',
      limit: '结果数',
      limitHint: '检索没有指定数量时返回的结果数（1–100）。',
      minScore: '最低相关度',
      minScoreHint:
        '低于这个值的结果会被丢弃（0–1）。关键词和语义都排第一的结果为 1；0 表示全部保留。',
      keywordWeight: '关键词权重',
      keywordWeightHint:
        '关键词相对语义的分量（0–1）：0.5 两者相同，1 只按关键词，0 只按语义。',
      rerankCandidates: '交给重排的结果数',
      rerankCandidatesHint:
        '设置了重排模型时，交给它重新排序的靠前结果数（1–50）。',
      invalid: '请检查上面的取值范围。',
    },
    whole: {
      title: '小知识库直接放进提示词',
      description:
        '在线 Agent 可读的全部知识估算低于这个 token 数时，直接整体放入它的提示词（由模型服务缓存），不再检索。0 表示关闭。',
      approx: '约 {{value}} token',
      off: '已关闭',
      invalid: '请输入 0 到 1,000,000 之间的整数。',
    },
  },
  doc: { notFound: '这篇文档已不存在，或者你没有权限查看。' },
  proposals: {
    readOnly: '由有编辑权限的人决定。',
    outcomes: {
      accepted: '已接受',
      rejected: '已拒绝',
      withdrawn: '已撤回',
    },
  },
  inbox: {
    proposal: '知识提议',
    proposalDetail: '一项知识修改提议',
    decided: '知识提议已决定',
    proposalTitle: '{{proposer}} 提议修改「{{title}}」',
    proposalNewTitle: '{{proposer}} 提议新建文档「{{title}}」',
    proposalVerifyTitle: '{{proposer}} 确认「{{title}}」仍然有效',
    decidedTitle: '{{decider}}{{outcome}}了关于「{{title}}」的提议',
    someone: '有人',
    open: '在知识库中打开',
    space: '空间',
  },
};
