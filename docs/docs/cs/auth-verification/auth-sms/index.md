---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# SMS ověřování

## Úvod

Plugin pro SMS ověřování umožňuje uživatelům registrovat se a přihlašovat do NocoBase prostřednictvím SMS.

> Je nutné jej používat ve spojení s funkcí SMS ověřovacího kódu, kterou poskytuje [`@nocobase/plugin-verification` plugin](/auth-verification/verification/).

## Přidání SMS ověřování

Přejděte na stránku správy pluginů pro uživatelské ověřování.

![](https://static-docs.nocobase.com/202502282112517.png)

Přidat - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Nastavení nové verze

:::info{title=Tip}
Nová konfigurace byla zavedena ve verzi `1.6.0-alpha.30` a stabilní podpora je plánována od verze `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verifikátor:** Pro odesílání SMS ověřovacích kódů přiřaďte SMS verifikátor. Pokud nemáte k dispozici žádný verifikátor, musíte nejprve přejít na stránku správy ověřování a vytvořit SMS verifikátor.
Viz také:

- [Ověřování](../verification/index.md)
- [Ověřování: SMS](../verification/sms/index.md)

**Automatická registrace, pokud uživatel neexistuje (Sign up automatically when the user does not exist):** Pokud je tato možnost zaškrtnuta a telefonní číslo uživatele neexistuje, bude zaregistrován nový uživatel s telefonním číslem jako přezdívkou.

## Nastavení starší verze

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

Funkce SMS přihlašovacího ověřování bude pro odesílání SMS zpráv používat nakonfigurovaného a výchozího poskytovatele (Provider) SMS ověřovacích kódů.

**Automatická registrace, pokud uživatel neexistuje (Sign up automatically when the user does not exist):** Pokud je tato možnost zaškrtnuta a telefonní číslo uživatele neexistuje, bude zaregistrován nový uživatel s telefonním číslem jako přezdívkou.

## Přihlášení

Pro použití navštivte přihlašovací stránku.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)