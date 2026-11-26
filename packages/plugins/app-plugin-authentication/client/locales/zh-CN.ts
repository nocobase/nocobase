import type { AuthenticationResource } from './en-US.js';

const zhCN: AuthenticationResource = {
  errors: {
    generic: '出了点问题，请重试。',
    network: '无法连接服务器，请检查网络后重试。',
    rateLimited: '尝试次数过多，请稍后再试。',
    INVALID_EMAIL_OR_PASSWORD: '邮箱或密码不正确。',
    INVALID_USERNAME_OR_PASSWORD: '用户名或密码不正确。',
    INVALID_PASSWORD: '密码不正确。',
    INVALID_EMAIL: '请输入有效的邮箱地址。',
    INVALID_USERNAME: '用户名只能包含字母、数字、下划线和点。',
    USERNAME_TOO_SHORT: '用户名太短。',
    USERNAME_TOO_LONG: '用户名太长。',
    USERNAME_IS_ALREADY_TAKEN: '这个用户名已被占用。',
    USER_ALREADY_EXISTS: '这个邮箱已经注册过账号。',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      '这个邮箱已经注册过账号，请换一个邮箱。',
    PASSWORD_TOO_SHORT: '密码太短。',
    RESET_PASSWORD_DISABLED: '未开启自助找回，请联系管理员重置密码。',
    PASSWORD_TOO_LONG: '密码太长。',
    EMAIL_NOT_VERIFIED: '请先验证邮箱再登录。',
    INVALID_TOKEN: '链接无效或已过期。',
    TOKEN_EXPIRED: '链接已过期。',
    ACCOUNT_DISABLED: '该账号已停用，请联系管理员。',
    SERVICE_ACCOUNT_NO_LOGIN: '服务账号不能登录，只能通过 API 密钥操作。',
    invalidOriginWithAddress:
      '当前访问地址未受信任。请将 config.yml 中的 app.publicOrigin 改为 {{origin}}，重启应用后重试。',
    INVALID_ORIGIN:
      '当前访问地址未受信任。请检查 config.yml 中的 app.publicOrigin，重启应用后重试。',
    FAILED_TO_UNLINK_LAST_ACCOUNT: '只剩一种登录方式时不能解绑。',
    INVALID_CSRF_ORIGIN: '请求来自其他站点，已被拒绝。请刷新页面后重试。',
  },
  settings: {
    title: '身份认证',
    navigationDescription: '登录方式、自助注册、找回密码和登录状态。',
    description:
      '谁能用什么方式登录、能否自己注册、密码怎么找回、登录状态保持多久。这些设置写在应用配置里，随部署生效；本页显示当前实际生效的值和来源，并指出需要处理的问题。修改方法在每一项的「怎么改」里。',
    loadFailed: '无法加载身份认证设置。',
    retry: '重试',
    howToChange: '怎么改',
    howToChangeNote: '改完后重新部署或重启应用生效。本页不保存任何配置。',
    yes: '是',
    no: '否',
    source: {
      env: '环境变量',
      file: 'config.yml',
      code: '代码',
      default: '默认值',
    },
    columns: {
      value: '当前值',
      source: '来源',
      method: '方式',
      config: '配置项',
      status: '状态',
    },
    duration: {
      days_one: '{{count}} 天',
      days_other: '{{count}} 天',
      hours_one: '{{count}} 小时',
      hours_other: '{{count}} 小时',
      minutes_one: '{{count}} 分钟',
      minutes_other: '{{count}} 分钟',
      seconds_one: '{{count}} 秒',
      seconds_other: '{{count}} 秒',
    },
    tabs: {
      methods: '登录方式',
      registration: '注册',
      password: '密码与找回',
      session: '会话与安全',
    },
    issues: {
      title_one: '{{count}} 项需要处理',
      title_other: '{{count}} 项需要处理',
      passwordResetUnavailable:
        '找回密码未开启：用户忘记密码只能找管理员重置。',
      publicOriginMissing:
        '未设置 app.publicOrigin：邮件里的链接和第三方登录的回调地址无法确定。',
      registrationFeedback:
        '已注册的邮箱再次注册时，用户收不到任何提示。请开启注册后直接登录、验证邮箱或已有用户提醒。',
      view: '查看',
    },
    status: { enabled: '已开启', notConfigured: '未配置' },
    methods: {
      details: '详情',
      howToEnable: '如何开启',
      noteRedeploy:
        '开启新的登录方式要改代码或配置并重新部署；需要新数据表的（两步验证、通行密钥）还要加一个数据库迁移。本页不保存任何配置。',
      noteUsers:
        '停用某个用户、重置密码、让他退出全部登录，在「用户」详情里操作。',
      password: {
        title: '账号密码',
        descriptionEmail: '邮箱 + 密码',
        description: '邮箱或用户名 + 密码',
      },
      device: {
        title: '命令行登录',
        description: '在浏览器里批准命令行工具的登录请求（/device）',
      },
      apiKey: {
        title: 'API 密钥',
        description: '程序调用接口，不经过登录页',
      },
      sso: {
        title: '企业 SSO（OIDC）',
        description: '飞书、钉钉、企业微信、Okta、Microsoft Entra ID 等',
      },
      social: {
        title: '社交账号',
        description: 'Google、GitHub、Microsoft 等',
      },
      twoFactor: {
        title: '两步验证',
        description: '登录时再输入一次验证码',
      },
      passkey: {
        title: '通行密钥',
        description: '用指纹、面容或安全密钥登录',
      },
    },
    signInPage: {
      title: '登录页上会显示',
      password: '账号密码',
      signUp: '没有账号？注册',
      forgotPassword: '忘记密码',
      providers: '使用 {{names}} 登录',
      noProviders: '第三方登录按钮',
      noButton: '已配置，登录页没有按钮',
      hidden: '不显示',
    },
    registration: {
      title: '自助注册',
      selfSignUp: '允许自己注册',
      selfSignUpHint: '登录页显示「没有账号？注册」。',
      allowed: '允许',
      notAllowed: '不允许',
      autoSignIn: '注册后直接登录',
      requireEmailVerification: '验证邮箱',
      requireEmailVerificationHint: '开启后需要配置发信。',
      required: '要求',
      notRequired: '不要求',
      invite: '邀请加入',
      inviteAction: '去「用户」邀请',
      inviteDescription:
        '关闭自助注册后，新成员通过「用户」里发出的邀请链接加入。',
      noteDisable:
        '关闭注册只是隐藏入口并让服务端拒绝注册请求，以后可以再打开。',
      noteFeedback:
        '若关闭「注册后直接登录」又不验证邮箱，已注册的邮箱再次注册时用户收不到任何提示；这种组合会在上方标为需要处理。',
    },
    password: {
      title: '密码规则',
      length: '长度',
      lengthValue: '{{min}}–{{max}} 个字符',
      username: '用户名',
      usernameValue: '{{min}}–{{max}} 位字母、数字、下划线或点，不区分大小写',
    },
    reset: {
      title: '忘记密码（通过邮件找回）',
      off: '未开启',
      custom:
        '应用用自己的 sendResetPassword 回调发送重置邮件，优先于下面的检查项。',
      enabled: '开启找回密码',
      notSet: '未设置',
      sender: '发信设置',
      senderMailer: '使用发信设置 {{name}}',
      senderInline: '使用 auth.email（{{provider}}）',
      sender_legacyChannel: '使用旧版通知渠道',
      sender_custom: '应用自己的回调',
      sender_none: '没有配置发信',
      publicOrigin: '应用公开地址',
      publicOriginMissing: '未设置，重置链接无法生成',
      availableNote: '登录页显示「忘记密码」，用户通过邮件里的链接重置密码。',
      unavailableNote:
        '三项都满足后，登录页才显示「忘记密码」。现在用户忘记密码只能请管理员在「用户」详情里重置。',
      noteRateLimit:
        '找回邮件按邮箱和 IP 限制频率；无论邮箱是否存在，页面都给出同样的提示。',
      noteSessions:
        '管理员重置密码、用户修改密码后，这个人在其他设备上的登录会被退出。',
    },
    session: {
      title: '登录状态',
      expiresIn: '保持登录',
      expiresInHint: '期间有使用就自动延长。',
      updateAge: '延长频率',
      updateAgeValue: '每 {{duration}}最多一次',
      storage: '保存位置',
      storageHint: '管理员可在用户详情里让某人退出全部登录。',
      storage_database: '数据库',
      storage_cache: '仅缓存',
      cookieCache: 'Cookie 缓存',
      cookieCacheHint: '开启时，被退出的设备在缓存过期前仍保持登录。',
      cookie: 'Cookie',
      httpsOnly: '仅 HTTPS',
      httpAndHttps: 'HTTP 和 HTTPS',
    },
    security: {
      title: '安全',
      signingKeys: '签名密钥',
      signingKeysHint:
        '在应用的 secrets 里轮换；删除旧版本会让所有人重新登录。',
      keys_authSecret: '单个 auth.secret，没有版本',
      keys_authSecrets_one:
        '在 auth.secrets 中设置 · 当前 v{{version}}，保留 {{count}} 个旧版本',
      keys_authSecrets_other:
        '在 auth.secrets 中设置 · 当前 v{{version}}，保留 {{count}} 个旧版本',
      keys_secretsKeys_one:
        '由 secrets.keys 派生 · 当前 v{{version}}，保留 {{count}} 个旧版本',
      keys_secretsKeys_other:
        '由 secrets.keys 派生 · 当前 v{{version}}，保留 {{count}} 个旧版本',
      oauthTokens: '第三方令牌',
      encrypted: '加密保存',
      notEncrypted: '未加密保存',
      rateLimit: '登录频率限制',
      rateLimitOn: '开启 · 每 {{window}}最多 {{max}} 次',
      rateLimitOff: '关闭',
      keysNote:
        '签名密钥在应用的 secrets 里管理，本页不显示。改完后重新部署或重启应用生效。',
    },
    blocked: {
      title: '这些账号不能登录',
      disabled: '已停用的用户',
      disabledDescription:
        '登录时提示「账号已停用」，已登录的设备立即退出、实时连接断开。',
      service: '服务账号',
      serviceDescription:
        '系统密钥背后的身份，只能用密钥调用接口，不能用密码或 SSO 登录。',
    },
  },
  guide: {
    handOver: '交给 Agent',
    promptHint: '提示词已按本应用当前的配置填好；需要时可以先改再复制。',
    publicOriginMissing:
      '没有设置 app.publicOrigin，提示词按当前访问地址（{{origin}}）填写，请确认是正式访问域名。',
    notes: '注意',
    after: '部署后',
    twoFactor: {
      title: '开启两步验证',
      description:
        '开启后，用户在「账号与安全」里绑定验证器 App；之后登录时，输完密码还要再输入一次 6 位验证码。开启要改代码、加数据库迁移并重新部署：把下面的提示词交给你的开发 Agent（Claude Code、Codex 等，在应用代码仓库里运行）即可。本页不保存任何内容。',
      note1: '开启后不会强制所有人使用：每个用户在「账号与安全」里自己绑定。',
      after:
        '回到「登录方式」看到状态变为「已开启」；「账号与安全」出现「两步验证」区块。',
    },
    passkey: {
      title: '开启通行密钥',
      description:
        '开启后，用户在「账号与安全」里添加通行密钥（指纹、面容或安全密钥）；登录页出现「使用通行密钥登录」。开启要改代码、加数据库迁移并重新部署：把下面的提示词交给你的开发 Agent（Claude Code、Codex 等，在应用代码仓库里运行）即可。本页不保存任何内容。',
      note1:
        '必须通过 HTTPS 访问（本机 localhost 除外），否则浏览器不允许使用通行密钥。',
      note2: '部署后修改域名，已添加的通行密钥都会失效。',
      after:
        '回到「登录方式」看到状态变为「已开启」；登录页出现「使用通行密钥登录」，「账号与安全」出现「通行密钥」区块。',
    },
  },
  prompt: {
    title: '提示词',
    copy: '复制提示词',
    label: '交给开发 Agent 的提示词',
    followSignIn:
      '按 nocobase-app-plugin-authentication Skill 的「Adding sign-in methods」做：',
    followPlugin:
      '按 nocobase-app-plugin-authentication Skill 的「Enabling an official Better Auth plugin」做：',
    discoveryUnknown:
      '（{{name}} 提供的 OIDC discovery 地址，以 /.well-known/openid-configuration 结尾）',
    sso: {
      intro:
        '请在这个 NocoBase 应用里开启 {{name}} 单点登录（Better Auth genericOAuth，OIDC）。',
      add: '在 server/config/auth.ts 的 plugins 里加 better-auth/plugins 的 genericOAuth，保留已有插件；providerId 为 {{id}}，discovery 地址为 {{discovery}}。clientId、clientSecret 从环境变量 {{prefix}}_CLIENT_ID、{{prefix}}_CLIENT_SECRET 读取，不要写进代码。浏览器端不需要客户端插件，登录和绑定走 signIn.social 和 linkSocial。',
    },
    application: '应用名为 {{appName}}，访问地址为 {{origin}}。',
    oauth: {
      intro:
        '请在这个 NocoBase 应用里开启 {{name}} 登录。{{name}} 不是 Better Auth 内置的社交提供方，请用通用 OAuth 插件（genericOAuth，支持 OAuth 2.0 和 OIDC）接入，不要写进只接受内置标识的 socialProviders。',
      add: '在 server/config/auth.ts 的 plugins 里加上 better-auth/plugins 的 genericOAuth，保留已有插件；providerId 为 {{id}}。如果 {{name}} 提供 OIDC 发现地址，就填 discoveryUrl，不要设置 accountSubject：Better Auth 会从 sub 声明读取账号标识。否则按 {{name}} 的文档填写 authorizationUrl、tokenUrl、userInfoUrl：Better Auth 会从用户信息的 id 字段读取账号标识；只有 {{name}} 把稳定的账号标识放在别的字段（例如 user_id）时，才用 accountSubject 读取该字段，例如 ({ profile }) => String(profile.user_id)。mapProfileToUser 只映射邮箱、姓名、头像等资料。clientId、clientSecret 从环境变量 {{prefix}}_CLIENT_ID、{{prefix}}_CLIENT_SECRET 读取，不要写进代码。浏览器端不需要客户端插件：登录和绑定都走 signIn.social 和 linkSocial。',
    },
    social: {
      intro:
        '请在这个 NocoBase 应用里开启 {{name}} 登录（Better Auth socialProviders.{{id}}）。',
      add: '在 server/config/auth.ts 的 socialProviders 里加 {{id}}，clientId、clientSecret 从环境变量 {{prefix}}_CLIENT_ID、{{prefix}}_CLIENT_SECRET 读取，不要写进代码。',
    },
    firstSignIn: {
      create:
        '首次登录：自动创建账号，角色同自助注册（disableSignUp: false）。',
      existing:
        '首次登录：只允许已有账号（disableSignUp: true）。先在「用户」里邀请，用户在「账号与安全」里绑定 {{name}} 后才能用它登录。',
    },
    matching:
      '账号按提供方返回的 issuer + subject 对应，不按邮箱自动合并到已有用户：设置 account.accountLinking.disableImplicitLinking: true。',
    callback:
      '回调地址是 {{callback}}，确认 app.publicOrigin 设为 {{origin}}。',
    checkProvider:
      '确认登录页出现「使用 {{name}} 登录」（同时把提供方写进 authentication({ signInButtons })），「账号与安全」能绑定、解绑 {{name}}。',
    testsProvider:
      '补上登录流程测试，跑通 lint、typecheck、test、build。不需要数据库迁移。',
    configIntro: '可以从这段配置开始：',
    doneProvider: '完成后告诉我改了哪些文件，以及部署时要设置哪些环境变量。',
    twoFactor: {
      intro:
        '请在这个 NocoBase 应用里开启两步验证（Better Auth 官方插件 twoFactor）。',
      add: '在 server/config/auth.ts 的 plugins 里加 better-auth/plugins 的 twoFactor({ issuer: {{appName}} })，在 client/config/auth.ts 里加 better-auth/client/plugins 的 twoFactorClient()，保留已有插件。',
      migration:
        '按已安装 better-auth 版本的 twoFactor schema（Skill 里有 1.7.21 对应的迁移），在 database/main/migrations/ 加一个迁移：新建 twoFactor 表，user 表加 twoFactorEnabled 字段，写好 down。不要用 better-auth 自带的 migrate 或 schema 生成。',
      account:
        '在「账号与安全」加「两步验证」区块（扩展页面，或用 authentication({ accountSecurityComponentLoader }) 整页替换）：用户输入密码开启，用验证器 App 扫码并校验，保存备用码，也能关闭。不强制所有人使用。',
      signIn:
        '登录页在登录返回 twoFactorRedirect 时要求输入验证码，用 twoFactor.verifyTotp 完成登录，备用码走 twoFactor.verifyBackupCode。',
      tests:
        '确认「账号与安全」出现「两步验证」区块。补上迁移测试和登录流程测试，跑通 lint、typecheck、test、build。',
    },
    passkey: {
      intro:
        '请在这个 NocoBase 应用里开启通行密钥（Better Auth 官方插件 passkey，在 @better-auth/passkey 包里）。',
      add: "按 better-auth 的同一版本安装 @better-auth/passkey。在 server/config/auth.ts 的 plugins 里加 @better-auth/passkey 的 passkey，rpName 为 {{appName}}，rpID（主机名）和 origin 从 app.publicOrigin 读取、不要写死；正式地址是 {{origin}}，同时把它设为 app.publicOrigin。传入 schema: { passkey: { fields: { credentialID: 'credentialId' } } }，因为蛇形列名无法还原 credentialID。在 client/config/auth.ts 里加 @better-auth/passkey/client 的 passkeyClient，保留已有插件。",
      migration:
        '按已安装版本的 passkey schema（Skill 里有 1.7.21 对应的迁移），在 database/main/migrations/ 加一个迁移，credentialID 存为 credentialId：新建 passkey 表，写好 down。不要用 better-auth 自带的 migrate 或 schema 生成。',
      account:
        '在「账号与安全」加「通行密钥」区块（扩展页面，或用 authentication({ accountSecurityComponentLoader }) 整页替换），能添加、重命名、删除通行密钥。',
      signIn: '登录页加「使用通行密钥登录」（signIn.passkey）。',
      tests:
        '确认「账号与安全」出现「通行密钥」区块、登录页出现通行密钥按钮。补上迁移测试，跑通 lint、typecheck、test、build。',
    },
    doneMethod: '完成后告诉我改了哪些文件，以及部署时要注意什么。',
  },
  sso: {
    breadcrumb: '开启单点登录或社交账号登录',
    title: '开启单点登录（OIDC）',
    socialTitle: '开启社交账号登录',
    description:
      '先在身份提供方创建应用，再把下面的提示词交给你的开发 Agent（Claude Code、Codex 等，在应用代码仓库里运行）。Client Secret 只放在部署环境变量里，不在本页输入。本页不保存任何内容。',
    provider: '身份提供方',
    other: '其他',
    id: '标识',
    idLocked:
      '这是 Better Auth 为 {{name}} 规定的标识，socialProviders 只接受它。要接入其他提供方，请选「其他」。',
    idHint: '出现在回调地址里，部署后不要再改，否则已绑定的账号会失效。',
    createApp: '1. 在 {{name}} 创建应用',
    copy: '复制',
    copied: '已复制',
    callbackHint:
      '把回调地址填到 {{name}} 开发者后台的重定向 URL，记下 Client ID 和 Client Secret。',
    publicOriginMissing:
      '没有设置 app.publicOrigin，回调地址按当前访问地址生成，请确认是正式访问域名。',
    firstSignIn: '2. 首次登录',
    create: '自动创建账号',
    createHint: '第一次用 {{name}} 登录时创建新用户，角色同自助注册。',
    existing: '只允许已有账号',
    existingHint:
      '先在「用户」里邀请，用户在「账号与安全」里绑定 {{name}} 后才能用它登录。',
    handOver: '3. 交给 Agent',
    promptHint: '随上面的选择自动更新；需要时可以先改再复制。',
    deploy: '4. 部署',
    deployDescription:
      '在部署环境设置 {{prefix}}_CLIENT_ID、{{prefix}}_CLIENT_SECRET 后重新部署。回到「登录方式」看到状态变为「已开启」，登录页出现「使用 {{name}} 登录」。',
    back: '返回',
  },

  account: {
    title: '账号与安全',
    navigationDescription: '你的登录信息、密码和登录过的设备。',
    description: '你的登录信息、密码和登录过的设备。只影响你本人。',
    cancel: '取消',
    save: '保存',
    failed: '出了点问题，请重试。',
    signIn: {
      title: '登录信息',
      username: '用户名',
      email: '邮箱',
      contactAdmin: '修改用户名或邮箱请联系管理员。',
    },
    password: {
      title: '密码',
      changedAt: '上次修改：{{date}}',
      change: '修改密码',
      none: '你通过绑定的账号登录，没有设置密码。',
      mismatch: '两次输入的新密码不一致。',
      changed: '密码已修改',
      current: '当前密码',
      new: '新密码',
      confirm: '确认新密码',
      revokeOthers: '同时退出其他设备',
      revokeOthersCount_one: '同时退出其他设备（{{count}} 个）',
      revokeOthersCount_other: '同时退出其他设备（{{count}} 个）',
    },
    devices: {
      title: '登录过的设备',
      count_one: '{{count}} 个',
      count_other: '{{count}} 个',
      signOutOthers: '退出其他所有设备',
      signedOutOthers: '已退出其他所有设备',
      commandLine: '{{client}} · 命令行',
      unknown: '未知设备',
      noAddress: '地址未知',
      current: '当前设备',
      lastUsed: '最近使用 {{date}}',
      signOut: '退出',
      signedOut: '设备已退出',
      note: '命令行工具通过 /device 批准登录后也会出现在这里；退出即撤销它的登录。API 密钥不在这里。',
    },
    linked: {
      title: '第三方账号',
      description: '可以用来登录的企业 SSO 和社交账号',
      linkedAs: '已绑定 · {{id}}',
      notLinked: '未绑定',
      link: '绑定',
      unlink: '解绑',
      unlinked: '已解绑',
      lastMethod: '只剩一种登录方式时不能解绑。',
    },
  },
};

export default zhCN;
