:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Editor motivů

> Funkce motivů je aktuálně implementována na základě Ant Design 5.x. Doporučujeme, abyste si před čtením tohoto dokumentu přečetli o konceptech [přizpůsobení motivů](https://ant.design/docs/react/customize-theme).

## Úvod

**Plugin** Editor motivů slouží k úpravě stylů celé front-endové stránky. Aktuálně umožňuje upravovat globální [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) a [AliasToken]. Dále podporuje [přepínání](https://ant.design/docs/react/customize-theme#use-preset-algorithms) na `Tmavý režim` a `Kompaktní režim`. V budoucnu může být přidána podpora pro přizpůsobení motivů na [úrovni komponent](https://ant.design/docs/react/customize-theme#component-level-customization).

## Návod k použití

### Povolení **pluginu** Editor motivů

Nejprve aktualizujte NocoBase na nejnovější verzi (v0.11.1 nebo vyšší). Poté na stránce správy **pluginů** vyhledejte kartu `Editor motivů`. Klikněte na tlačítko `Povolit` v pravém dolním rohu karty a počkejte na obnovení stránky.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Přechod na stránku konfigurace motivů

Po povolení **pluginu** klikněte na tlačítko nastavení v levém dolním rohu karty, čímž se dostanete na stránku pro úpravu motivů. Standardně jsou k dispozici čtyři možnosti motivů: `Výchozí motiv`, `Tmavý motiv`, `Kompaktní motiv` a `Kompaktní tmavý motiv`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Přidání nového motivu

Klikněte na tlačítko `Přidat nový motiv` a vyberte `Vytvořit zcela nový motiv`. Na pravé straně stránky se objeví Editor motivů, který vám umožní upravovat možnosti jako `Barvy`, `Velikosti`, `Styly` a další. Po dokončení úprav zadejte název motivu a klikněte na Uložit, čímž dokončíte přidání nového motivu.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Použití nového motivu

Přesuňte myš do pravého horního rohu stránky, kde uvidíte přepínač motivů. Kliknutím na něj můžete přepnout na jiné motivy, například na ten, který jste právě přidali.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Úprava existujícího motivu

Klikněte na tlačítko `Upravit` v levém dolním rohu karty. Na pravé straně stránky se objeví Editor motivů (stejný jako při přidávání nového motivu). Po dokončení úprav klikněte na Uložit, čímž dokončíte změnu motivu.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Nastavení motivů volitelných uživatelem

Nově přidané motivy jsou standardně uživatelům k dispozici pro přepínání. Pokud nechcete, aby uživatelé mohli přepnout na určitý motiv, vypněte přepínač `Volitelné uživatelem` v pravém dolním rohu karty motivu. Tím zabráníte uživatelům v přepnutí na tento motiv.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Nastavení jako výchozí motiv

V počátečním stavu je výchozím motivem `Výchozí motiv`. Pokud potřebujete nastavit konkrétní motiv jako výchozí, zapněte přepínač `Výchozí motiv` v pravém dolním rohu karty daného motivu. Tím zajistíte, že uživatelé při prvním otevření stránky uvidí právě tento motiv. Upozornění: Výchozí motiv nelze smazat.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Smazání motivu

Klikněte na tlačítko `Smazat` pod kartou a poté potvrďte v zobrazeném dialogovém okně pro smazání motivu.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)