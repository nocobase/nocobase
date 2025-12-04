---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Správce migrací

## Úvod

Správce migrací slouží k přenosu konfigurací aplikace z jednoho aplikačního prostředí do druhého. Zaměřuje se především na migraci „konfigurací aplikace“. Pokud potřebujete kompletní migraci dat, doporučujeme použít [Správce záloh](../backup-manager/index.mdx) pro zálohování a obnovu celé aplikace.

## Instalace

Správce migrací závisí na pluginu [Správce záloh](../backup-manager/index.mdx). Ujistěte se, že je tento plugin již nainstalován a aktivován.

## Proces a principy

Správce migrací přenáší tabulky a data z primární databáze na základě definovaných migračních pravidel, a to z jedné instance aplikace do druhé. Je důležité si uvědomit, že nemigruje data z externích databází ani z podaplikací.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Migrační pravidla

### Vestavěná pravidla

Správce migrací dokáže migrovat všechny tabulky v primární databázi a podporuje následujících pět vestavěných pravidel:

-   **Pouze struktura (Schema-only):** Migruje pouze strukturu (schéma) tabulek – data se nevkládají ani neaktualizují.
-   **Přepsat (vymazat a znovu vložit):** Vymaže všechny existující záznamy z cílové databázové tabulky a poté vloží nová data.
-   **Vložit nebo aktualizovat (Upsert):** Zkontroluje, zda každý záznam existuje (podle primárního klíče). Pokud ano, aktualizuje jej; pokud ne, vloží jej.
-   **Vložit a ignorovat duplikáty (Insert-ignore):** Vloží nové záznamy, ale pokud záznam již existuje (podle primárního klíče), vložení se ignoruje (žádné aktualizace se neprovedou).
-   **Přeskočit:** Úplně přeskočí zpracování tabulky (žádné změny struktury, žádná migrace dat).

**Poznámky:**

-   Pravidla „Přepsat“, „Vložit nebo aktualizovat“ a „Vložit a ignorovat duplikáty“ synchronizují také změny struktury tabulky.
-   Pokud tabulka používá automaticky inkrementované ID jako primární klíč, nebo pokud nemá primární klíč, nelze na ni aplikovat pravidla „Vložit nebo aktualizovat“ ani „Vložit a ignorovat duplikáty“.
-   Pravidla „Vložit nebo aktualizovat“ a „Vložit a ignorovat duplikáty“ se spoléhají na primární klíč k určení, zda záznam již existuje.

### Detailní návrh

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Konfigurační rozhraní

Konfigurace migračních pravidel

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Povolení nezávislých pravidel

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Výběr nezávislých pravidel a tabulek, které mají být zpracovány podle aktuálních nezávislých pravidel

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Migrační soubory

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Vytvoření nové migrace

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Spuštění migrace

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Kontrola proměnných prostředí aplikace (více se dozvíte o [proměnných prostředí](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Pokud některé chybí, zobrazí se vyskakovací okno, které uživatele vyzve k zadání požadovaných nových proměnných prostředí, a poté bude možné pokračovat.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Logy migrace

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Vrácení zpět (Rollback)

Před spuštěním jakékoli migrace se aktuální aplikace automaticky zálohuje. Pokud migrace selže nebo výsledky neodpovídají očekávání, můžete provést vrácení zpět (rollback) pomocí [Správce záloh](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)