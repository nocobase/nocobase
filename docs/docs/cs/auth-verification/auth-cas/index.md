---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Autentizace: CAS

## Úvod

Plugin Autentizace: CAS dodržuje standard protokolu CAS (Central Authentication Service) a umožňuje uživatelům přihlásit se do NocoBase pomocí účtů poskytovaných poskytovateli identit třetích stran (IdP).

## Instalace

## Uživatelská příručka

### Aktivace pluginu

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Přidání CAS autentizace

Navštivte stránku správy uživatelské autentizace

http://localhost:13000/admin/settings/auth/authenticators

Přidejte metodu CAS autentizace

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Nakonfigurujte CAS a aktivujte ji

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Navštivte přihlašovací stránku

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)