/**
 * The wording of the CI setup's inbox entries, in their own namespace (`ci.ts`).
 */
export const CI_NAMESPACE = 'studio-inbox-ci';

const enUS = {
  types: {
    ci_key_rotation_failed: 'CI key not rotated',
    ci_key_revoked: 'CI key revoked',
    repository_app_removed: 'Linked App deleted',
  },
  headings: {
    ci_key_rotation_failed: 'A repository’s CI key could not be rotated',
    ci_key_revoked: 'A repository’s CI key was revoked',
    repository_app_removed: 'An App a repository builds was deleted',
  },
  appRemovedTitle: '{{app}}, built by {{repo}}, was deleted',
  appRemovedSentence:
    'Its role in the repository was turned off. CI creates it again on its next deploy that names it; its variables are not restored.',
  rotationTitle: 'CI key for {{repo}} expires in {{days}} days',
  rotationSentence:
    'Studio could not rotate it: {{error}} Rotate it from the project, or set the repository secret by hand.',
  revokedTitle: 'The CI key of {{repo}} was {{how}}',
  revokedSentence:
    'Its CI is set up by hand until someone sets it up again from the project.',
  how: { disabled: 'disabled', deleted: 'deleted' },
  open: 'Open project',
  unknown: 'a repository',
};

const zhCN: typeof enUS = {
  types: {
    ci_key_rotation_failed: 'CI 密钥未能轮换',
    ci_key_revoked: 'CI 密钥被撤销',
    repository_app_removed: '关联的应用已被删除',
  },
  headings: {
    ci_key_rotation_failed: '仓库的 CI 密钥未能轮换',
    ci_key_revoked: '仓库的 CI 密钥被撤销',
    repository_app_removed: '仓库构建的应用已被删除',
  },
  appRemovedTitle: '{{repo}} 构建的应用 {{app}} 已被删除',
  appRemovedSentence:
    '它在仓库中的角色已关闭。CI 下次部署到这个应用时会重新创建它，原有变量不会恢复。',
  rotationTitle: '{{repo}} 的 CI 密钥将在 {{days}} 天后过期',
  rotationSentence:
    'Studio 未能轮换它：{{error}} 请在项目中轮换，或手动设置仓库 Secret。',
  revokedTitle: '{{repo}} 的 CI 密钥已被{{how}}',
  revokedSentence: '在有人从项目中重新配置之前，它的 CI 需要手动配置。',
  how: { disabled: '停用', deleted: '删除' },
  open: '打开项目',
  unknown: '某个仓库',
};

export const ciResources = { 'en-US': enUS, 'zh-CN': zhCN };
