---
pkg: "@nocobase/plugin-verification"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Ověřování

:::info{title=Poznámka}
Počínaje verzí `1.6.0-alpha.30` byla původní funkce „ověřovací kód“ povýšena na „Správu ověřování“, která podporuje správu a integraci různých metod ověřování uživatelské identity. Jakmile si uživatelé navážou odpovídající metodu ověřování, mohou provádět ověřování identity v nezbytných situacích. Tato funkce má být stabilně podporována od verze `1.7.0`.
:::



## Úvod

**Centrum správy ověřování podporuje správu a integraci různých metod ověřování uživatelské identity.** Například:

- SMS ověřovací kód – Standardně poskytováno pluginem pro ověřování. Viz: [Ověřování: SMS](./sms)
- TOTP autentifikátor – Viz: [Ověřování: TOTP autentifikátor](../verification-totp/)

Vývojáři mohou také rozšířit další typy ověřování prostřednictvím pluginů. Viz: [Rozšíření typů ověřování](./dev/type)

**Uživatelé mohou provádět ověřování identity v nezbytných situacích poté, co si navážou odpovídající metodu ověřování.** Například:

- Přihlášení pomocí SMS ověřovacího kódu – Viz: [Autentizace: SMS](../auth-sms/index.md)
- Dvoufaktorová autentizace (2FA) – Viz: [Dvoufaktorová autentizace (2FA)](../2fa/)
- Sekundární ověření pro rizikové operace – Podpora v budoucnu

Vývojáři mohou také integrovat ověřování identity do dalších nezbytných scénářů rozšířením pluginů. Viz: [Rozšíření scénářů ověřování](./dev/scene)

**Rozdíly a vztahy mezi modulem ověřování a modulem uživatelské autentizace:** Modul uživatelské autentizace je primárně zodpovědný za ověřování identity během přihlašování uživatelů, přičemž procesy jako přihlášení pomocí SMS a dvoufaktorová autentizace spoléhají na ověřovače poskytované modulem ověřování; zatímco modul ověřování se stará o ověřování identity pro různé rizikové operace, přičemž přihlášení uživatele je jedním z těchto scénářů.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)