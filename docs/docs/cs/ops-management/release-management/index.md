:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Správa vydání

## Úvod

V reálných aplikacích se pro zajištění bezpečnosti dat a stability aplikace obvykle nasazuje více prostředí, jako je vývojové prostředí, předprodukční prostředí a produkční prostředí. Tento dokument uvádí příklady dvou běžných no-code vývojových procesů a podrobně vysvětluje, jak implementovat správu vydání v NocoBase.

## Instalace

Pro správu vydání jsou nezbytné tři pluginy. Ujistěte se, že máte aktivovány všechny následující pluginy.

### Proměnné prostředí

- Vestavěný plugin, ve výchozím nastavení nainstalovaný a aktivovaný.
- Poskytuje centralizovanou konfiguraci a správu proměnných prostředí a klíčů, používaných pro ukládání citlivých dat, opakovaně použitelná konfigurační data, izolaci konfigurace prostředí atd. ([Zobrazit dokumentaci](#)).

### Správce záloh

- Dostupné pouze ve verzi Professional a vyšších ([Zjistěte více](https://www.nocobase.com/en/commercial)).
- Podporuje zálohování a obnovu, včetně plánovaných záloh, čímž zajišťuje bezpečnost dat a rychlé zotavení. ([Zobrazit dokumentaci](../backup-manager/index.mdx)).

### Správce migrací

- Dostupné pouze ve verzi Professional a vyšších ([Zjistěte více](https://www.nocobase.com/en/commercial)).
- Používá se k migraci konfigurací aplikace z jednoho aplikačního prostředí do druhého ([Zobrazit dokumentaci](../migration-manager/index.md)).

## Běžné no-code vývojové procesy

### Jediné vývojové prostředí, jednosměrné vydání

Tento přístup je vhodný pro jednoduché vývojové procesy. Existuje jedno vývojové prostředí, jedno předprodukční prostředí a jedno produkční prostředí. Změny proudí z vývojového prostředí do předprodukčního prostředí a nakonec jsou nasazeny do produkčního prostředí. V tomto procesu může konfigurace upravovat pouze vývojové prostředí – ani předprodukční, ani produkční prostředí úpravy nepovolují.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Při konfiguraci pravidel migrace vyberte pro vestavěné tabulky v jádře a pluginech pravidlo **„Přepsat“** (Overwrite), pokud je to potřeba; u ostatních můžete ponechat výchozí nastavení, pokud nemáte žádné speciální požadavky.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Více vývojových prostředí, sloučené vydání

Tento přístup je vhodný pro spolupráci více osob nebo pro komplexní projekty. Několik paralelních vývojových prostředí lze používat nezávisle a všechny změny jsou sloučeny do jednoho předprodukčního prostředí pro testování a ověření před nasazením do produkce. V tomto procesu může konfigurace upravovat pouze vývojové prostředí – ani předprodukční, ani produkční prostředí úpravy nepovolují.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Při konfiguraci pravidel migrace vyberte pro vestavěné tabulky v jádře a pluginech pravidlo **„Vložit nebo aktualizovat“** (Insert or Update), pokud je to potřeba; u ostatních můžete ponechat výchozí nastavení, pokud nemáte žádné speciální požadavky.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Vrácení zpět

Před provedením migrace systém automaticky vytvoří zálohu aktuální aplikace. Pokud migrace selže nebo výsledky neodpovídají očekávání, můžete provést vrácení zpět a obnovu pomocí [Správce záloh](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)