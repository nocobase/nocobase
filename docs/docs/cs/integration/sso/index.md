:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Integrace jednotného přihlášení (SSO)

NocoBase nabízí komplexní řešení jednotného přihlášení (SSO), které podporuje řadu běžných autentizačních protokolů a umožňuje bezproblémovou integraci s vašimi stávajícími podnikovými identitními systémy.

## Přehled

Jednotné přihlášení umožňuje uživatelům přístup k několika souvisejícím, ale nezávislým systémům pomocí jediné sady přihlašovacích údajů. Uživatelé se přihlásí pouze jednou a získají přístup ke všem autorizovaným aplikacím, aniž by museli opakovaně zadávat uživatelské jméno a heslo. To nejen zlepšuje uživatelský zážitek, ale také zvyšuje bezpečnost systému a efektivitu správy.

## Podporované autentizační protokoly

NocoBase prostřednictvím **pluginů** podporuje následující autentizační protokoly a metody:

### Podnikové SSO protokoly

- **[SAML 2.0](/auth-verification/auth-saml/)**: Otevřený standard založený na XML, široce používaný pro podnikovou autentizaci identit. Vhodný pro integraci s podnikovými poskytovateli identit (IdP).

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Moderní autentizační vrstva postavená na OAuth 2.0, která poskytuje mechanismy pro autentizaci a autorizaci. Podporuje integraci s hlavními poskytovateli identit (např. Google, Azure AD atd.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Protokol SSO vyvinutý Yale University, široce používaný ve vysokoškolských a vzdělávacích institucích.

- **[LDAP](/auth-verification/auth-ldap/)**: Lightweight Directory Access Protocol pro přístup a správu distribuovaných adresářových informačních služeb. Vhodný pro integraci s Active Directory nebo jinými LDAP servery.

### Autentizace třetích stran

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Podporuje přihlášení pomocí QR kódu WeCom a bezproblémovou autentizaci v aplikaci.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Podporuje přihlášení pomocí QR kódu DingTalk a bezproblémovou autentizaci v aplikaci.

### Další metody autentizace

- **[SMS ověřovací kód](/auth-verification/auth-sms/)**: Autentizace pomocí ověřovacího kódu zaslaného na mobilní telefon.

- **[Uživatelské jméno/Heslo](/auth-verification/auth/)**: Vestavěná základní autentizační metoda NocoBase.

## Kroky integrace

### 1. Nainstalujte autentizační **plugin**

Podle vašich požadavků vyhledejte a nainstalujte příslušný autentizační **plugin** ze správce **pluginů**. Většina autentizačních **pluginů** pro SSO vyžaduje samostatný nákup nebo předplatné.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Například nainstalujte autentizační **plugin** SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Nebo nainstalujte autentizační **plugin** OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Nakonfigurujte metodu autentizace

1. Přejděte na stránku **Nastavení systému > Autentizace uživatelů**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klikněte na **Přidat metodu autentizace**
3. Vyberte nainstalovaný typ autentizace (např. SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Nebo vyberte OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Nakonfigurujte požadované parametry podle pokynů

### 3. Nakonfigurujte poskytovatele identity

Každý autentizační protokol vyžaduje specifickou konfiguraci poskytovatele identity:

- **SAML**: Nakonfigurujte metadata IdP, certifikáty atd.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Nakonfigurujte Client ID, Client Secret, discovery endpoint atd.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Nakonfigurujte adresu CAS serveru
- **LDAP**: Nakonfigurujte adresu LDAP serveru, Bind DN atd.
- **WeCom/DingTalk**: Nakonfigurujte přihlašovací údaje aplikace, Corp ID atd.

### 4. Otestujte přihlášení

Po dokončení konfigurace doporučujeme provést testovací přihlášení:

1. Odhlaste se z aktuální relace
2. Na přihlašovací stránce vyberte nakonfigurovanou metodu SSO

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Dokončete autentizační proces poskytovatele identity
4. Ověřte, zda jste se úspěšně přihlásili do NocoBase

## Mapování uživatelů a přiřazení rolí

Po úspěšné autentizaci SSO NocoBase automaticky spravuje uživatelské účty:

- **První přihlášení**: Automaticky vytvoří nový uživatelský účet a synchronizuje základní informace (přezdívka, e-mail atd.) od poskytovatele identity.
- **Následná přihlášení**: Použije stávající účet; volitelně synchronizuje aktualizované uživatelské informace.
- **Přiřazení rolí**: Můžete nakonfigurovat výchozí role nebo automaticky přiřadit role na základě uživatelských atributů od poskytovatele identity.

## Bezpečnostní doporučení

1. **Používejte HTTPS**: Zajistěte, aby NocoBase byl nasazen v prostředí HTTPS, abyste ochránili přenos autentizačních dat.
2. **Pravidelné aktualizace certifikátů**: Včas aktualizujte a obměňujte bezpečnostní pověření, jako jsou SAML certifikáty.
3. **Nakonfigurujte whitelist URL pro zpětné volání**: Správně nakonfigurujte URL pro zpětné volání NocoBase u poskytovatele identity.
4. **Princip nejmenších oprávnění**: Přiřaďte uživatelům SSO odpovídající role a oprávnění.
5. **Povolte auditní logování**: Zaznamenávejte a monitorujte aktivity přihlášení SSO.

## Řešení problémů

### Selhalo přihlášení SSO?

1. Zkontrolujte, zda je konfigurace poskytovatele identity správná.
2. Ujistěte se, že jsou URL pro zpětné volání správně nakonfigurovány.
3. Zkontrolujte protokoly NocoBase pro podrobné chybové zprávy.
4. Potvrďte, že certifikáty a klíče jsou platné.

### Nesynchronizují se uživatelské informace?

1. Zkontrolujte uživatelské atributy vrácené poskytovatelem identity.
2. Ověřte, zda je konfigurace mapování polí správná.
3. Potvrďte, že je povolena možnost synchronizace uživatelských informací.

### Jak podporovat více metod autentizace?

NocoBase podporuje současnou konfiguraci více autentizačních metod. Uživatelé si mohou na přihlašovací stránce vybrat preferovanou metodu.

## Související zdroje

- [Dokumentace k autentizaci](/auth-verification/auth/)
- [Autentizace pomocí API klíčů](/integration/api-keys/)
- [Správa uživatelů a oprávnění](/plugins/@nocobase/plugin-users/)