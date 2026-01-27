---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Dvoufaktorové ověřování (2FA)

## Úvod

Dvoufaktorové ověřování (2FA) je dodatečné bezpečnostní opatření používané při přihlašování do aplikace. Když je v aplikaci povoleno 2FA, uživatelé musí při přihlašování heslem poskytnout další formu ověření, například: OTP kód, TOTP apod.

:::info{title=Tip}
V současné době se proces 2FA vztahuje pouze na přihlašování pomocí hesla. Pokud vaše aplikace používá SSO nebo jiné metody ověřování, použijte prosím vícefaktorové ověřování (MFA) poskytované příslušným IdP.
:::

## Aktivace pluginu

![](https://static-docs.nocobase.com/202502282108145.png)

## Nastavení administrátora

Po aktivaci pluginu se na stránce správy autentizátorů přidá podstránka pro konfiguraci 2FA.

Administrátoři musí zaškrtnout možnost „Vynutit dvoufaktorové ověřování (2FA) pro všechny uživatele“ a zároveň vybrat dostupný typ autentizátoru k navázání. Pokud nejsou k dispozici žádné autentizátory, je třeba nejprve vytvořit nový autentizátor na stránce správy ověřování. Viz: [Ověřování](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Přihlášení uživatele

Jakmile je v aplikaci povoleno 2FA, uživatelé se při přihlašování heslem dostanou do procesu ověřování 2FA.

Pokud uživatel dosud nenavázal žádný ze specifikovaných autentizátorů, bude vyzván k jeho navázání. Po úspěšném navázání může vstoupit do aplikace.

![](https://static-docs.nocobase.com/202502282110829.png)

Pokud uživatel již navázal jeden ze specifikovaných autentizátorů, bude vyzván k ověření své identity pomocí navázaného autentizátoru. Po úspěšném ověření může vstoupit do aplikace.

![](https://static-docs.nocobase.com/202502282110148.png)

Po úspěšném přihlášení mohou uživatelé na stránce správy ověřování ve svém osobním centru navázat další autentizátory.

![](https://static-docs.nocobase.com/202502282110024.png)