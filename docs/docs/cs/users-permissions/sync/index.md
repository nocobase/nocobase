---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Synchronizace uživatelských dat

## Úvod

Tato funkce Vám umožňuje registrovat a spravovat zdroje synchronizace uživatelských dat. Ve výchozím nastavení je k dispozici HTTP API, ale další zdroje dat lze rozšířit pomocí pluginů. Standardně podporuje synchronizaci dat do kolekcí **Uživatelé** a **Oddělení**, s možností rozšířit synchronizaci na další cílové zdroje pomocí pluginů.

## Správa zdrojů dat a synchronizace dat

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Pokud nemáte nainstalované žádné pluginy, které poskytují zdroje synchronizace uživatelských dat, můžete uživatelská data synchronizovat pomocí HTTP API. Viz [Zdroj dat - HTTP API](./sources/api.md).
:::

## Přidání zdroje dat

Jakmile nainstalujete plugin, který poskytuje zdroj synchronizace uživatelských dat, můžete přidat odpovídající zdroj dat. Pouze povolené zdroje dat zobrazí tlačítka „Synchronizovat“ a „Úloha“.

> Příklad: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Synchronizace dat

Klikněte na tlačítko **Synchronizovat** pro zahájení synchronizace dat.

![](https://static-docs.nocobase.com/202412041055022.png)

Klikněte na tlačítko **Úloha** pro zobrazení stavu synchronizace. Po úspěšné synchronizaci si můžete data prohlédnout v seznamech Uživatelé a Oddělení.

![](https://static-docs.nocobase.com/202412041202337.png)

U neúspěšných synchronizačních úloh můžete kliknout na **Opakovat**.

![](https://static-docs.nocobase.com/202412041058337.png)

V případě selhání synchronizace můžete problém řešit pomocí systémových protokolů. Kromě toho jsou původní záznamy synchronizace dat uloženy v adresáři `user-data-sync` v adresáři aplikačních protokolů.

![](https://static-docs.nocobase.com/202412041205655.png)