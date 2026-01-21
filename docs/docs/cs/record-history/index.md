---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Historie záznamů

## Úvod

Plugin **Historie záznamů** slouží ke sledování změn dat. Automaticky ukládá snímky a záznamy rozdílů operací **vytvoření**, **úpravy** a **smazání**, což uživatelům pomáhá rychle zpětně dohledat změny dat a auditovat provedené operace.

![](https://static-docs.nocobase.com/202511011338499.png)

## Povolení Historie záznamů

### Přidání kolekcí a polí

Nejprve přejděte na stránku nastavení pluginu Historie záznamů a přidejte kolekce a pole, pro které chcete sledovat historii. Pro zvýšení efektivity záznamu a zamezení redundance dat doporučujeme konfigurovat pouze nezbytné kolekce a pole. Pole jako **jedinečné ID**, **datum vytvoření**, **datum aktualizace**, **vytvořil** a **aktualizoval** obvykle není potřeba zaznamenávat.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Synchronizace snímků historických dat

- Záznamy vytvořené před povolením historie se začnou zaznamenávat až poté, co první aktualizace vygeneruje snímek. Z tohoto důvodu první aktualizace nebo smazání nezanechá žádnou historii.
- Pokud potřebujete zachovat historii stávajících dat, můžete provést jednorázovou synchronizaci snímků.
- Velikost snímku na kolekci se vypočítá jako: počet záznamů × počet sledovaných polí.
- U velkých datových sad doporučujeme filtrovat podle rozsahu dat a synchronizovat pouze důležité záznamy.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Klikněte na tlačítko **„Synchronizovat snímky historie“**, nakonfigurujte pole a rozsah dat a spusťte synchronizaci.

![](https://static-docs.nocobase.com/202511011320958.png)

Úloha synchronizace bude zařazena do fronty a spuštěna na pozadí. Seznam můžete obnovit a zkontrolovat její stav dokončení.

## Používání bloku Historie záznamů

### Přidání bloku

Vyberte **blok Historie záznamů** a zvolte kolekci, čímž přidáte odpovídající blok historie pro danou kolekci.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Pokud přidáváte blok historie do vyskakovacího okna s detaily záznamu, můžete vybrat **„Aktuální záznam“** pro zobrazení historie specifické pro tento záznam.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Úprava šablon popisu

Klikněte na **„Upravit šablonu“** v nastavení bloku, abyste mohli konfigurovat text popisu pro záznamy operací.

![](https://static-docs.nocobase.com/202511011340406.png)

V současné době můžete konfigurovat samostatné šablony popisu pro operace **vytvoření**, **aktualizace** a **smazání**. Pro operace aktualizace můžete také konfigurovat šablonu popisu pro změny polí, a to buď jako jednotnou šablonu pro všechna pole, nebo pro konkrétní pole jednotlivě.

![](https://static-docs.nocobase.com/202511011346400.png)

Při konfiguraci textu můžete použít proměnné.

![](https://static-docs.nocobase.com/202511011347163.png)

Po dokončení konfigurace můžete zvolit, zda se šablona použije pro **Všechny bloky historie záznamů aktuální kolekce** nebo **Pouze tento blok historie záznamů**.

![](https://static-docs.nocobase.com/202511011348885.png)