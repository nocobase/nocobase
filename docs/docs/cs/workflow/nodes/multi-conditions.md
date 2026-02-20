:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vícepodmínkové větvení <Badge>v2.0.0+</Badge>

## Úvod

Podobně jako příkazy `switch / case` nebo `if / else if` v programovacích jazycích. Systém postupně vyhodnocuje nakonfigurované podmínky. Jakmile je splněna některá podmínka, provede se pracovní postup v odpovídající větvi a přeskočí se vyhodnocování dalších podmínek. Pokud nejsou splněny žádné podmínky, provede se větev „Jinak“.

## Vytvořit uzel

V rozhraní pro konfiguraci pracovního postupu klikněte na tlačítko plus („+“) v pracovním postupu a přidejte uzel „Vícepodmínkové větvení“:

![Vytvořit uzel vícepodmínkového větvení](https://static-docs.nocobase.com/20251123222134.png)

## Správa větví

### Výchozí větve

Po vytvoření uzel standardně obsahuje dvě větve:

1.  **Větev podmínky**: Zde můžete konfigurovat konkrétní podmínky vyhodnocení.
2.  **Větev Jinak**: Do této větve se vstoupí, pokud nejsou splněny žádné podmínky; není třeba zde konfigurovat žádné podmínky.

Kliknutím na tlačítko „Přidat větev“ pod uzlem můžete přidat další větve podmínek.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Přidat větev

Po kliknutí na „Přidat větev“ se nová větev připojí před větev „Jinak“.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Smazat větev

Pokud existuje více větví podmínek, kliknutím na ikonu koše vpravo od větve ji můžete smazat. Pokud zbývá pouze jedna větev podmínky, nelze ji smazat.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Poznámka}
Smazáním větve se zároveň smažou všechny uzly v ní obsažené; postupujte prosím opatrně.

Větev „Jinak“ je vestavěná větev a nelze ji smazat.
:::

## Konfigurace uzlu

### Konfigurace podmínky

Kliknutím na název podmínky v horní části větve můžete upravit konkrétní detaily podmínky:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Popisek podmínky

Podporuje vlastní popisky. Po vyplnění se popisek zobrazí jako název podmínky ve vývojovém diagramu. Pokud není nakonfigurován (nebo je ponechán prázdný), zobrazí se standardně jako „Podmínka 1“, „Podmínka 2“ atd., v pořadí.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Výpočetní engine

V současné době jsou podporovány tři enginy:

-   **Základní**: Používá jednoduchá logická porovnání (např. rovná se, obsahuje atd.) a kombinace „A“/„NEBO“ k určení výsledků.
-   **Math.js**: Podporuje výpočet výrazů pomocí syntaxe [Math.js](https://mathjs.org/).
-   **Formula.js**: Podporuje výpočet výrazů pomocí syntaxe [Formula.js](https://formulajs.info/) (podobně jako vzorce v Excelu).

Všechny tři režimy podporují použití proměnných kontextu pracovního postupu jako parametrů.

### Když nejsou splněny žádné podmínky

V panelu konfigurace uzlu můžete nastavit následnou akci, pokud nejsou splněny žádné podmínky:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Ukončit pracovní postup s chybou (výchozí)**: Označí stav pracovního postupu jako chybný a ukončí proces.
*   **Pokračovat v provádění následných uzlů**: Po dokončení aktuálního uzlu pokračuje v provádění následných uzlů v pracovním postupu.

:::info{title=Poznámka}
Bez ohledu na zvolený způsob zpracování, pokud nejsou splněny žádné podmínky, pracovní postup nejprve vstoupí do větve „Jinak“ a provede uzly v ní obsažené.
:::

## Historie provádění

V historii provádění pracovního postupu uzel vícepodmínkového větvení identifikuje výsledek každé podmínky pomocí různých barev:

-   **Zelená**: Podmínka splněna; vstoupilo se do této větve.
-   **Červená**: Podmínka nesplněna (nebo chyba výpočtu); tato větev byla přeskočena.
-   **Modrá**: Vyhodnocení nebylo provedeno (přeskočeno, protože předchozí podmínka již byla splněna).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Pokud chyba konfigurace způsobí výjimku při výpočtu podmínky, kromě zobrazení červené barvy se po najetí myší na název podmínky zobrazí konkrétní chybová zpráva:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Když dojde k výjimce při výpočtu podmínky, uzel vícepodmínkového větvení skončí se stavem „Chyba“ a nebude pokračovat v provádění následných uzlů.