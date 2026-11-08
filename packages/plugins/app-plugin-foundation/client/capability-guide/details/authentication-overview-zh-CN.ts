export default {
  statusNote:
    '这里按应用提供的页面、密码登录与注册开关、找回密码可用性分别判断。未列出的登录方式不代表未配置；找回密码可用也不代表邮件投递已验证。',
  guestHint:
    '这些页面面向未登录用户；当前已登录时会返回应用首页。可复制链接，在无痕窗口查看。',
  denied: '当前账号无权访问此入口。',
  retry: '重试读取状态',
  deviceTitle: 'CLI / 设备登录确认界面',
  deviceDescription:
    '在浏览器中确认命令行工具发起的登录请求。这里判断确认界面是否存在；使用时还需要工具发起请求并提供验证码。',
  features: {
    password: {
      title: '密码登录',
      configured: '已提供登录页面，并已启用密码登录。',
      missing: '密码登录尚未启用，或应用尚未提供登录页面。',
      unknown: '登录页面已存在，但当前无法确认密码登录是否启用。',
      open: '打开登录页面',
    },
    registration: {
      title: '自助注册',
      configured:
        '已提供注册页面，并允许用户自行创建账号。注册不代表自动获得所有业务权限。',
      missing:
        '当前未开放自助注册，或缺少配套页面。是否开放由应用的账号策略决定。',
      unknown: '注册页面已存在，但当前无法确认是否允许自助注册。',
      open: '打开注册页面',
    },
    recovery: {
      title: '找回密码',
      configured: '已提供找回和重置密码页面，应用已报告找回密码可用。',
      missing:
        '找回密码尚未启用或未准备好，或缺少找回、重置密码页面。只有页面还不足以使用此功能。',
      unknown:
        '正在确认找回密码是否可用；读取失败时请重试，不将未知状态视为未配置。',
      open: '打开找回密码页面',
    },
  },
  actions: {
    login: {
      title: '添加或调整登录页面',
      description: '配置密码登录，调整应用名称、品牌、页面布局和登录后的去向。',
      prompt:
        '请为当前应用【添加或调整登录页面，具体要求】。先阅读 nocobase-app-plugin-authentication Skill 和 client-session-and-pages 参考，检查现有登录页面、认证配置和跳转逻辑。优先修改应用自己的页面组合、文案和组件参数，复用现有认证表单和 usePasswordLogin，不修改插件源码。需要密码登录时确认 auth.emailAndPassword.enabled；保留已有登录方式及账号。复用应用会话和退出逻辑，不另造 token。完成后验证登录、错误反馈、退出及登录后返回原页面，不能因登录成功自动授予业务权限。',
      inspect:
        '检查 client/pages/auth/login.tsx、shared.tsx、client/routes.ts 和 server/config/auth.ts，明确要调整品牌、布局、登录方式还是跳转目标。',
      configure:
        '通过页面组合与组件参数调整界面，复用现有表单及认证动作；密码登录由 auth.emailAndPassword.enabled 控制。保留 guest 路由和原页面返回逻辑。',
      verify:
        '验证正确和错误凭据、停用账号、退出登录及原页面跳转。登录入口可用与业务访问权限分别验收。',
    },
    registration: {
      title: '开放或关闭自助注册',
      description: '决定用户能否自行创建账号，并同步注册入口和反馈。',
      prompt:
        '请按【账号策略：开放或关闭自助注册】调整当前应用。先阅读身份认证 Skill，核对密码登录、注册页面及现有账号策略。通过 auth.emailAndPassword.disableSignUp 控制服务端注册，同时让注册路由和所有入口跟随可用性。关闭时保留页面和组件以便恢复，不只隐藏按钮。开放时先确认是否自动登录、是否需要邮箱验证以及新账号的权限，不默认授予业务角色。注册反馈必须符合实际流程，不在未配置邮件时承诺已发送邮件。验证允许、禁止和重复账号等情况，保留已有用户。',
      inspect:
        '确认账号由用户自助注册还是管理员创建；如允许注册，明确注册后登录、邮箱验证和新账号权限策略。',
      configure:
        '在 auth.emailAndPassword 中设置 disableSignUp，并同步注册路由和页面入口。需要邮箱验证时配置对应流程；关闭注册时保留源文件，服务端同样拒绝注册。',
      verify:
        '分别验证开放和关闭时的页面入口及直接注册请求。确认重复账号反馈、新账号会话和业务权限符合策略。',
    },
    recovery: {
      title: '配置找回密码',
      description: '准备邮件发送和重置流程，让用户通过邮箱找回密码。',
      prompt:
        '请为当前应用配置通过邮箱找回密码。先阅读身份认证 Skill 的 authentication-email 参考，检查现有找回和重置页面、auth.passwordReset、现有发送回调、mailers 和公开访问地址。优先复用已有发送方式；新配置使用 mailers，设置 auth.passwordReset.enabled: true，并配置 app.publicOrigin。不要为了认证邮件新增邮箱管理或通知插件。保留现有密码策略及账号，凭据通过安全渠道提供。让登录页入口跟随实际找回密码可用性，验证邮件链接、过期或重复使用的链接、发送失败及密码重置后的登录；不要在没有实际发送时承诺邮件已送达。',
      inspect:
        '确认已启用密码登录，已有 /forgot-password 和 /reset-password 页面，并检查现有自定义发送回调，避免覆盖已有流程。',
      configure:
        '启用 auth.passwordReset.enabled，配置 app.publicOrigin 和可用的 mailer。可通过 auth.email.mailer 指定共享 mailer；已有发送回调按现有优先级保留。',
      verify:
        '执行配置检查，使配置生效后核对找回密码可用性。用测试邮箱验证真实投递、链接域名、有效期、重置结果及失败反馈。',
    },
    sso: {
      title: '增加企业或第三方登录',
      description: '对接企业身份平台或第三方账号，明确账号绑定和登录入口。',
      prompt:
        '请为当前应用增加【身份平台或登录方式】。先阅读身份认证 Skill 的 adding-sign-in-methods 参考，确认平台协议、登录入口、账号创建与绑定规则，以及回调域名。核对应用安装的 Better Auth 版本，优先使用受支持的 socialProviders、genericOAuth 或官方插件；仅不支持的协议才考虑自定义插件。配置配套客户端能力和登录按钮，所需表或字段通过应用迁移添加，不修改认证插件历史迁移。凭据只放服务端。使用稳定的外部身份标识绑定账号，不凭未经验证的邮箱合并账号。保留现有登录方式，并验证首次登录、已有账号、失败回调和退出流程。',
      inspect:
        '确认平台和协议、回调地址、已有账号的绑定方式，以及是否允许首次登录创建账号。',
      configure:
        '按已安装的 Better Auth 版本选择官方 provider 或插件，在应用认证配置中加入它及配套客户端能力，补齐登录入口和必要的应用迁移。',
      verify:
        '验证首次与再次登录、账号绑定、取消或无效回调，以及现有密码登录。登录后的业务授权另行配置。',
    },
    security: {
      title: '增加双重验证或通行密钥',
      description: '按账号安全要求增加第二步验证或无密码登录方式。',
      prompt:
        '请为当前应用增加【双重验证或通行密钥】，适用人员为【范围】。先阅读身份认证 Skill 的 better-auth-plugins 参考，核对当前 Better Auth 版本对应的官方插件。明确启用、绑定、恢复及丢失凭据时的处理方式，再补齐应用认证配置、配套客户端能力、应用迁移和用户操作界面。仅注册插件不算完成。保留现有可用登录方式，不在没有恢复途径时强制切换全部账号。验证启用、登录、恢复和关闭流程，并检查原有账号登录不受影响。',
      inspect:
        '明确适用人员、是否强制启用、设备与域名要求，以及凭据丢失时的恢复方式。',
      configure:
        '选择当前版本支持的官方 Better Auth 插件，配套完成应用配置、迁移和用户绑定、验证、恢复界面。',
      verify:
        '验证启用与未启用账号、正常登录、恢复及关闭流程。确认现有账号仍有可用的登录方式。',
    },
    device: {
      title: '配置 CLI / 设备登录',
      description: '让命令行工具通过浏览器确认，以用户身份访问应用。',
      prompt:
        '请为【命令行工具】配置浏览器确认登录。先阅读身份认证 Skill 中的 device login 参考，检查现有 deviceAuthorization、bearer、deviceAuthorizationClient 和 /device 页面，优先复用已有实现。确认允许的 clientId 和验证地址，不直接放开所有客户端；按插件实际要求补齐应用迁移。让工具发起授权、展示验证地址及用户码，并按返回间隔等待批准。使用普通用户会话和已有业务权限，不能用 API 密钥管理界面替代设备确认。验证批准、拒绝、过期、限速和退出失效。',
      inspect:
        '检查已有设备确认页面及协议配置，确定工具的 clientId、验证地址和允许的客户端范围。',
      configure:
        '在应用配置中配套使用 deviceAuthorization、bearer 及 deviceAuthorizationClient，复用 /device 页面，并按官方插件要求补齐迁移。',
      verify:
        '从真实 CLI 请求开始，验证浏览器批准或拒绝、代码过期、轮询间隔以及获得会话后的权限和退出失效。',
    },
  },
};
