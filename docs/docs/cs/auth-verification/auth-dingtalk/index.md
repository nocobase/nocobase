---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Autentizace: DingTalk

## Úvod

Plugin Autentizace: DingTalk umožňuje uživatelům přihlásit se do NocoBase pomocí jejich účtů DingTalk.

## Aktivace pluginu

![](https://static-docs.nocobase.com/202406120929356.png)

## Požádejte o oprávnění API v konzoli pro vývojáře DingTalk

Pro vytvoření aplikace se podívejte na <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Otevřená platforma DingTalk – Implementace přihlášení na webové stránky třetích stran</a>.

Přejděte do konzole pro správu aplikací a povolte „Informace o osobním telefonním čísle“ a „Oprávnění ke čtení osobních informací z adresáře“.

![](https://static-docs.nocobase.com/202406120006620.png)

## Získejte přihlašovací údaje z konzole pro vývojáře DingTalk

Zkopírujte Client ID a Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Přidejte autentizaci DingTalk v NocoBase

Přejděte na stránku správy pluginů pro uživatelskou autentizaci.

![](https://static-docs.nocobase.com/202406112348051.png)

Přidat – DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Konfigurace

![](https://static-docs.nocobase.com/202406120016896.png)

- Automatická registrace, pokud uživatel neexistuje – Zda se má automaticky vytvořit nový uživatel, pokud se pomocí telefonního čísla nenajde žádný existující uživatel.
- Client ID a Client Secret – Vyplňte informace zkopírované v předchozím kroku.
- Redirect URL – URL zpětného volání, zkopírujte ji a pokračujte dalším krokem.

## Nakonfigurujte URL zpětného volání v konzoli pro vývojáře DingTalk

Vložte zkopírovanou URL zpětného volání do konzole pro vývojáře DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Přihlášení

Navštivte přihlašovací stránku a klikněte na tlačítko pod přihlašovacím formulářem pro zahájení přihlášení třetí stranou.

![](https://static-docs.nocobase.com/202406120014539.png)