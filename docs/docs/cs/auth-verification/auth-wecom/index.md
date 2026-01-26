---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Autentizace: WeCom

## Úvod

**Plugin WeCom** umožňuje uživatelům přihlásit se do NocoBase pomocí svých účtů WeCom.

## Aktivace pluginu

![](https://static-docs.nocobase.com/202406272056962.png)

## Vytvoření a konfigurace vlastní aplikace WeCom

Přejděte do administračního rozhraní WeCom a vytvořte vlastní aplikaci.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Klikněte na aplikaci pro vstup na její stránku s detaily, sjeďte dolů a klikněte na „Autorizované přihlášení WeCom“.

![](https://static-docs.nocobase.com/202406272104655.png)

Nastavte autorizovanou doménu zpětného volání na doménu vaší aplikace NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Vraťte se na stránku s detaily aplikace a klikněte na „Webová autorizace a JS-SDK“.

![](https://static-docs.nocobase.com/202406272107063.png)

Nastavte a ověřte doménu zpětného volání pro funkci webové autorizace OAuth2.0 aplikace.

![](https://static-docs.nocobase.com/202406272107899.png)

Na stránce s detaily aplikace klikněte na „Důvěryhodná IP adresa společnosti“.

![](https://static-docs.nocobase.com/202406272108834.png)

Nakonfigurujte IP adresu aplikace NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Získání pověření z administračního rozhraní WeCom

V administračním rozhraní WeCom, v sekci „Moje společnost“, zkopírujte „ID společnosti“.

![](https://static-docs.nocobase.com/202406272111637.png)

V administračním rozhraní WeCom, v sekci „Správa aplikací“, přejděte na stránku s detaily aplikace vytvořené v předchozím kroku a zkopírujte AgentId a Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Přidání autentizace WeCom v NocoBase

Přejděte na stránku správy pluginů pro uživatelskou autentizaci.

![](https://static-docs.nocobase.com/202406272115044.png)

Přidat - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Konfigurace

![](https://static-docs.nocobase.com/202412041459250.png)

| Možnost                                                                                               | Popis                                                                                                                                                                                   | Požadovaná verze |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | Když se telefonní číslo neshoduje s existujícím uživatelem, zda se má automaticky vytvořit nový uživatel.                                                                                            | -                   |
| Company ID                                                                                            | ID společnosti, získané z administračního rozhraní WeCom.                                                                                                                                            | -                   |
| AgentId                                                                                               | Získáno z konfigurace vlastní aplikace v administračním rozhraní WeCom.                                                                                                          | -                   |
| Secret                                                                                                | Získáno z konfigurace vlastní aplikace v administračním rozhraní WeCom.                                                                                                          | -                   |
| Origin                                                                                                | Aktuální doména aplikace.                                                                                                                                                               | -                   |
| Workbench application redirect link                                                                   | Cesta k aplikaci, na kterou se přesměruje po úspěšném přihlášení.                                                                                                                                 | `v1.4.0`            |
| Automatic login                                                                                       | Automatické přihlášení při otevření odkazu aplikace v prohlížeči WeCom. Pokud je nakonfigurováno více autentizátorů WeCom, pouze jeden může mít tuto možnost povolenou.                          | `v1.4.0`            |
| Workbench application homepage link                                                                   | Odkaz na domovskou stránku aplikace Workbench.                                                                                                                                                          | -                   |

## Konfigurace domovské stránky aplikace WeCom

:::info
Pro verze `v1.4.0` a vyšší, je-li povolena možnost „Automatické přihlášení“, lze odkaz na domovskou stránku aplikace zjednodušit na: `https://<url>/<path>`, například `https://example.nocobase.com/admin`.

Můžete také nakonfigurovat samostatné odkazy pro mobilní a desktopové zařízení, například `https://example.nocobase.com/m` a `https://example.nocobase.com/admin`.
:::

Přejděte do administračního rozhraní WeCom a vložte zkopírovaný odkaz na domovskou stránku aplikace Workbench do pole adresy domovské stránky odpovídající aplikace.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Přihlášení

Navštivte přihlašovací stránku a klikněte na tlačítko pod přihlašovacím formulářem pro zahájení přihlášení třetí stranou.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Vzhledem k omezením oprávnění WeCom pro citlivé informace, jako jsou telefonní čísla, lze autorizaci dokončit pouze v klientovi WeCom. Při prvním přihlášení pomocí WeCom postupujte podle níže uvedených kroků k dokončení počáteční autorizace přihlášení v klientovi WeCom.
:::

## První přihlášení

Z klienta WeCom přejděte do Workbench, sjeďte dolů a klikněte na aplikaci pro vstup na domovskou stránku, kterou jste dříve nakonfigurovali. Tím se dokončí počáteční autorizace. Poté se můžete pomocí WeCom přihlásit do vaší aplikace NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />