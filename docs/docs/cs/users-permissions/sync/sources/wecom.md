---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Synchronizace uživatelských dat z WeChat Work

## Úvod

**Plugin WeChat Work** umožňuje synchronizovat uživatelská a oddělení data z WeChat Work.

## Vytvoření a konfigurace vlastní aplikace WeChat Work

Nejprve je potřeba vytvořit vlastní aplikaci v administraci WeChat Work a získat **ID podniku** (Corp ID), **ID agenta** (AgentId) a **tajný klíč** (Secret).

Viz [Ověření uživatele – WeChat Work](/auth-verification/auth-wecom/).

## Přidání zdroje dat pro synchronizaci v NocoBase

Přejděte na Uživatelé a oprávnění – Synchronizace – Přidat a vyplňte získané informace.

![](https://static-docs.nocobase.com/202412041251867.png)

## Konfigurace synchronizace kontaktů

V administraci WeChat Work přejděte na Zabezpečení a správa – Nástroje pro správu a klikněte na Synchronizace kontaktů.

![](https://static-docs.nocobase.com/202412041249958.png)

Nastavte podle obrázku a zadejte důvěryhodnou IP adresu podniku.

![](https://static-docs.nocobase.com/202412041250776.png)

Nyní můžete přistoupit k synchronizaci uživatelských dat.

## Nastavení serveru pro příjem událostí

Pokud si přejete, aby se změny uživatelských a oddělení dat na straně WeChat Work včas synchronizovaly s aplikací NocoBase, můžete provést další nastavení.

Po vyplnění předchozích konfiguračních informací můžete zkopírovat URL adresu pro zpětné volání (callback) notifikací kontaktů.

![](https://static-docs.nocobase.com/202412041256547.png)

Vyplňte ji do nastavení WeChat Work, získejte Token a EncodingAESKey a dokončete konfiguraci zdroje dat pro synchronizaci uživatelů NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)