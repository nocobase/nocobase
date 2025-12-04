:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Uwierzytelnianie użytkowników

Moduł uwierzytelniania użytkowników w NocoBase składa się głównie z dwóch części:

- `@nocobase/auth` w jądrze systemu definiuje rozszerzalne interfejsy i oprogramowanie pośredniczące (middleware) związane z uwierzytelnianiem użytkowników, takie jak logowanie, rejestracja i weryfikacja. Służy również do rejestrowania i zarządzania różnymi rozszerzonymi metodami uwierzytelniania.
- `@nocobase/plugin-auth` (wtyczka) służy do inicjalizacji modułu zarządzania uwierzytelnianiem w jądrze systemu, a także zapewnia podstawową metodę uwierzytelniania za pomocą nazwy użytkownika (lub adresu e-mail) i hasła.

> Należy pamiętać, że moduł ten wymaga współpracy z funkcją zarządzania użytkownikami, którą zapewnia [`@nocobase/plugin-users` wtyczka](/users-permissions/user).

Ponadto NocoBase oferuje również inne wtyczki do uwierzytelniania użytkowników:

- [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Umożliwia logowanie za pomocą weryfikacji SMS.
- [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Zapewnia funkcję logowania SAML SSO.
- [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Zapewnia funkcję logowania OIDC SSO.
- [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Zapewnia funkcję logowania CAS SSO.
- [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Zapewnia funkcję logowania LDAP SSO.
- [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Umożliwia logowanie za pomocą WeCom.
- [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Umożliwia logowanie za pomocą DingTalk.

Dzięki powyższym wtyczkom, po skonfigurowaniu przez administratora odpowiednich metod uwierzytelniania, użytkownicy mogą logować się do systemu bezpośrednio za pomocą tożsamości udostępnianych przez platformy takie jak Google Workspace czy Microsoft Azure. Możliwa jest również integracja z narzędziami platformowymi, takimi jak Auth0, Logto czy Keycloak. Co więcej, deweloperzy mogą w prosty sposób rozszerzać system o inne potrzebne metody uwierzytelniania, korzystając z udostępnionych przez nas podstawowych interfejsów.