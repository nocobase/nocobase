const accessZhCN = {
  access: {
    businessSection: '知识库',
    businesses: {
      knowledge: {
        title: '知识',
        description: '各个知识空间里的文档。',
        actions: {
          read: {
            title: '阅读知识',
            description: '阅读系统知识，以及与自己相关的空间的知识',
            related: '阅读知识（与自己相关的空间）',
            relatedLabel: '与我相关的空间',
            relatedHint: '由系统决定哪些空间与我相关',
            all: '阅读知识（全部）',
          },
          propose: {
            title: '提议知识',
            description:
              '提出修改，由有编辑权限的人决定；Agent 最多只能被授予这一项',
            related: '提议知识（与自己相关的空间）',
            relatedLabel: '与我相关的空间',
            relatedHint: '由系统决定哪些空间与我相关',
            all: '提议知识（全部）',
          },
          edit: {
            title: '编辑知识',
            description:
              '编辑、归档、标记已核对，并决定提议；系统知识需要“全部”',
            related: '编辑知识（与自己相关的空间）',
            relatedLabel: '与我相关的空间',
            relatedHint: '由系统决定哪些空间与我相关',
            all: '编辑知识（全部）',
          },
          manage: {
            title: '管理知识权限',
            description:
              '修改每个文件夹和文章的访问权限，并始终可以访问全部内容；系统知识需要“全部”',
            related: '管理知识权限（与自己相关的空间）',
            relatedLabel: '与我相关的空间',
            relatedHint: '由系统决定哪些空间与我相关',
            all: '管理知识权限（全部）',
          },
        },
      },
    },
  },
};

export default accessZhCN;
