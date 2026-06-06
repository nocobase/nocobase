# مصادقة المستخدم

يتكون وحدة مصادقة المستخدم في NocoBase بشكل رئيسي من جزأين:

- `@nocobase/auth` في النواة يحدد واجهات قابلة للتوسيع وبرمجيات وسيطة متعلقة بمصادقة المستخدم كتسجيل الدخول والتسجيل والتحقق وغيرها، ويُستخدم أيضًا لتسجيل وإدارة طرق المصادقة المختلفة الموسعة.
- `@nocobase/plugin-auth` في الإضافة يُستخدم لتهيئة وحدة إدارة المصادقة في النواة، ويوفر أيضًا طريقة المصادقة الأساسية باسم المستخدم (أو البريد الإلكتروني) / كلمة المرور.

> يحتاج إلى استخدامه بالتزامن مع وظيفة إدارة المستخدمين التي توفرها [إضافة `@nocobase/plugin-users`](/users-permissions/user).

بالإضافة إلى ذلك، يوفر NocoBase أيضًا إضافات طرق مصادقة مستخدم متنوعة أخرى:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - يوفر وظيفة تسجيل الدخول بالتحقق عبر SMS
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - يوفر وظيفة تسجيل الدخول الموحد SAML SSO
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - يوفر وظيفة تسجيل الدخول الموحد OIDC SSO
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - يوفر وظيفة تسجيل الدخول الموحد CAS SSO
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - يوفر وظيفة تسجيل الدخول الموحد LDAP SSO
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - يوفر وظيفة تسجيل الدخول عبر WeCom
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - يوفر وظيفة تسجيل الدخول عبر DingTalk

من خلال الإضافات المذكورة أعلاه، بعد أن يهيئ المسؤول طريقة المصادقة المقابلة، يمكن للمستخدمين استخدام هوية المستخدم المقدمة من منصات مثل Google Workspace وMicrosoft Azure لتسجيل الدخول إلى النظام مباشرةً، ويمكنهم أيضًا الاتصال بأدوات منصات مثل Auth0 وLogto وKeycloak وغيرها. بالإضافة إلى ذلك، يمكن للمطورين أيضًا توسيع طرق المصادقة الأخرى التي يحتاجونها بسهولة من خلال الواجهات الأساسية التي نوفرها.
