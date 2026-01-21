---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Ověření: TOTP autentifikátor

## Úvod

TOTP autentifikátor umožňuje uživatelům navázat jakýkoli autentifikátor, který splňuje specifikaci TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), a provádět ověření identity pomocí jednorázového hesla založeného na čase (TOTP).

## Konfigurace administrátorem

Přejděte na stránku Správa ověření.

![](https://static-docs.nocobase.com/202502271726791.png)

Přidat - TOTP autentifikátor

![](https://static-docs.nocobase.com/202502271745028.png)

Kromě jedinečného identifikátoru a názvu nevyžaduje TOTP autentifikátor žádnou další konfiguraci.

![](https://static-docs.nocobase.com/202502271746034.png)

## Navázání uživatelem

Po přidání autentifikátoru si uživatelé mohou TOTP autentifikátor navázat v sekci správy ověření ve svém osobním centru.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Plugin v současné době neposkytuje mechanismus pro obnovovací kódy. Po navázání TOTP autentifikátoru se doporučuje, aby jej uživatelé pečlivě uschovali. Pokud autentifikátor neúmyslně ztratíte, můžete k ověření identity použít jinou metodu ověření, autentifikátor odpojit a poté jej znovu navázat.
:::

## Odpojení uživatelem

Odpojení autentifikátoru vyžaduje ověření pomocí již navázané metody ověření.

![](https://static-docs.nocobase.com/202502282103205.png)