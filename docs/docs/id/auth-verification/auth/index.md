:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Autentikasi Pengguna

Modul autentikasi pengguna NocoBase terdiri dari dua bagian utama:

-   `@nocobase/auth` di dalam kernel mendefinisikan antarmuka dan middleware yang dapat diperluas terkait autentikasi pengguna seperti login, registrasi, dan verifikasi. Ini juga digunakan untuk mendaftarkan dan mengelola berbagai metode autentikasi yang diperluas.
-   `@nocobase/plugin-auth` di dalam plugin digunakan untuk menginisialisasi modul manajemen autentikasi di kernel, serta menyediakan metode autentikasi dasar menggunakan nama pengguna (atau email) / kata sandi.

> Ini perlu digunakan bersama dengan fitur manajemen pengguna yang disediakan oleh [`plugin @nocobase/plugin-users`](/users-permissions/user).

Selain itu, NocoBase juga menyediakan berbagai plugin metode autentikasi pengguna lainnya:

-   [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Menyediakan fungsi login verifikasi SMS
-   [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Menyediakan fungsi login SSO SAML
-   [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Menyediakan fungsi login SSO OIDC
-   [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Menyediakan fungsi login SSO CAS
-   [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Menyediakan fungsi login SSO LDAP
-   [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Menyediakan fungsi login WeCom
-   [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Menyediakan fungsi login DingTalk

Melalui plugin-plugin di atas, setelah administrator mengonfigurasi metode autentikasi yang sesuai, pengguna dapat langsung menggunakan identitas pengguna yang disediakan oleh platform seperti Google Workspace, Microsoft Azure untuk login ke sistem. Pengguna juga dapat terhubung dengan alat platform seperti Auth0, Logto, Keycloak. Selain itu, pengembang juga dapat dengan mudah memperluas metode autentikasi lain yang mereka butuhkan melalui antarmuka dasar yang kami sediakan.