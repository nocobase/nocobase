:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Kullanıcı Kimlik Doğrulaması

NocoBase'in kullanıcı kimlik doğrulama modülü temel olarak iki bölümden oluşur:

- Çekirdekteki (`kernel`) `@nocobase/auth`, oturum açma, kayıt, doğrulama ve diğer kullanıcı kimlik doğrulamasıyla ilgili genişletilebilir arayüzleri ve ara yazılımları tanımlar. Aynı zamanda çeşitli genişletilmiş kimlik doğrulama yöntemlerini kaydetmek ve yönetmek için de kullanılır.
- Eklentideki (`plugin`) `@nocobase/plugin-auth`, çekirdekteki kimlik doğrulama yönetim modülünü başlatmak için kullanılır ve aynı zamanda temel kullanıcı adı (veya e-posta) / parola kimlik doğrulama yöntemini sağlar.

> Bu, [`@nocobase/plugin-users` eklentisi](/users-permissions/user) tarafından sağlanan kullanıcı yönetimi işleviyle birlikte kullanılmalıdır.

Buna ek olarak, NocoBase başka çeşitli kullanıcı kimlik doğrulama yöntemi eklentileri de sunar:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - SMS doğrulama ile oturum açma işlevi sağlar
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - SAML SSO oturum açma işlevi sağlar
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - OIDC SSO oturum açma işlevi sağlar
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - CAS SSO oturum açma işlevi sağlar
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - LDAP SSO oturum açma işlevi sağlar
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - WeCom ile oturum açma işlevi sağlar
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - DingTalk ile oturum açma işlevi sağlar

Yukarıdaki eklentiler aracılığıyla, yönetici ilgili kimlik doğrulama yöntemini yapılandırdıktan sonra, kullanıcılar Google Workspace, Microsoft Azure gibi platformlar tarafından sağlanan kullanıcı kimliklerini doğrudan kullanarak sisteme giriş yapabilirler. Ayrıca Auth0, Logto, Keycloak gibi platform araçlarına da entegre olabilirler. Buna ek olarak, geliştiriciler de sunduğumuz temel arayüzler aracılığıyla ihtiyaç duydukları diğer kimlik doğrulama yöntemlerini kolayca genişletebilirler.