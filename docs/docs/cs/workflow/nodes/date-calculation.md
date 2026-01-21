---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Výpočet data

## Úvod

Uzel pro výpočet data poskytuje devět výpočetních funkcí, mezi které patří přidání časového období, odečtení časového období, formátovaný výstup časového řetězce a převod jednotek trvání. Každá funkce má specifické typy vstupních a výstupních hodnot a může také přijímat výsledky z jiných uzlů jako proměnné parametry. Využívá výpočetní pipeline k propojení výsledků nakonfigurovaných funkcí, aby nakonec získal očekávaný výstup.

## Vytvoření uzlu

V konfiguračním rozhraní pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „Výpočet data“:

![日期计算节点_创建节点](https://static-docs.nocobase.com/[图片].png)

## Konfigurace uzlu

![日期计算节点_节点配置](https://static-docs.nocobase.com/20240817184423.png)

### Vstupní hodnota

Vstupní hodnota může být proměnná nebo datová konstanta. Proměnná může být data, která spustila tento pracovní postup, nebo výsledek předchozího uzlu v tomto pracovním postupu. Pro konstantu můžete vybrat libovolné datum.

### Typ vstupní hodnoty

Označuje typ vstupní hodnoty. Existují dvě možné hodnoty.

*   Typ data: Znamená, že vstupní hodnota může být nakonec převedena na typ data a času, například číselné časové razítko nebo řetězec reprezentující čas.
*   Číselný typ: Jelikož typ vstupní hodnoty ovlivňuje výběr následujících kroků časového výpočtu, je nutné správně zvolit typ vstupní hodnoty.

### Kroky výpočtu

Každý výpočetní krok se skládá z výpočetní funkce a její konfigurace parametrů. Využívá se zde pipeline design, kde výsledek výpočtu předchozí funkce slouží jako vstupní hodnota pro výpočet další funkce. Tímto způsobem lze provést řadu časových výpočtů a převodů.

Po každém výpočetním kroku je typ výstupu také pevně daný a ovlivní funkce dostupné pro další výpočetní krok. Výpočet může pokračovat pouze v případě, že se typy shodují. V opačném případě bude výsledek daného kroku konečným výstupem uzlu.

## Výpočetní funkce

### Přidat časové období

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Množství k přidání, které může být číslo nebo vestavěná proměnná z uzlu.
    -   Časová jednotka.
-   Typ výstupní hodnoty: Datum
-   Příklad: Pokud je vstupní hodnota `2024-7-15 00:00:00`, množství je `1` a jednotka je „den“, pak je výsledek výpočtu `2024-7-16 00:00:00`.

### Odečíst časové období

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Množství k odečtení, které může být číslo nebo vestavěná proměnná z uzlu.
    -   Časová jednotka.
-   Typ výstupní hodnoty: Datum
-   Příklad: Pokud je vstupní hodnota `2024-7-15 00:00:00`, množství je `1` a jednotka je „den“, pak je výsledek výpočtu `2024-7-14 00:00:00`.

### Vypočítat rozdíl s jiným časem

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Datum, se kterým se má vypočítat rozdíl, může být datová konstanta nebo proměnná z kontextu pracovního postupu.
    -   Časová jednotka.
    -   Zda vzít absolutní hodnotu.
    -   Operace zaokrouhlování: Možnosti zahrnují zachování desetinných míst, zaokrouhlení, zaokrouhlení nahoru a zaokrouhlení dolů.
-   Typ výstupní hodnoty: Číslo
-   Příklad: Pokud je vstupní hodnota `2024-7-15 00:00:00`, objekt pro porovnání je `2024-7-16 06:00:00`, jednotka je „den“, absolutní hodnota není použita a desetinná místa jsou zachována, pak je výsledek výpočtu `-1.25`.

:::info{title=Tip}
Pokud jsou absolutní hodnota a zaokrouhlování konfigurovány současně, nejprve se vezme absolutní hodnota a poté se aplikuje zaokrouhlení.
:::

### Získat hodnotu času v konkrétní jednotce

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Časová jednotka.
-   Typ výstupní hodnoty: Číslo
-   Příklad: Pokud je vstupní hodnota `2024-7-15 00:00:00` a jednotka je „den“, pak je výsledek výpočtu `15`.

### Nastavit datum na začátek konkrétní jednotky

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Časová jednotka.
-   Typ výstupní hodnoty: Datum
-   Příklad: Pokud je vstupní hodnota `2024-7-15 14:26:30` a jednotka je „den“, pak je výsledek výpočtu `2024-7-15 00:00:00`.

### Nastavit datum na konec konkrétní jednotky

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Časová jednotka.
-   Typ výstupní hodnoty: Datum
-   Příklad: Pokud je vstupní hodnota `2024-7-15 14:26:30` a jednotka je „den“, pak je výsledek výpočtu `2024-7-15 23:59:59`.

### Zkontrolovat přestupný rok

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Bez parametrů
-   Typ výstupní hodnoty: Boolean
-   Příklad: Pokud je vstupní hodnota `2024-7-15 14:26:30`, pak je výsledek výpočtu `true`.

### Formátovat jako řetězec

-   Přijímá typ vstupní hodnoty: Datum
-   Parametry
    -   Formát, viz [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
-   Typ výstupní hodnoty: Řetězec
-   Příklad: Pokud je vstupní hodnota `2024-7-15 14:26:30` a formát je `the time is YYYY/MM/DD HH:mm:ss`, pak je výsledek výpočtu `the time is 2024/07/15 14:26:30`.

### Převést jednotku

-   Přijímá typ vstupní hodnoty: Číslo
-   Parametry
    -   Časová jednotka před převodem.
    -   Časová jednotka po převodu.
    -   Operace zaokrouhlování, možnosti zahrnují zachování desetinných míst, zaokrouhlení, zaokrouhlení nahoru a zaokrouhlení dolů.
-   Typ výstupní hodnoty: Číslo
-   Příklad: Pokud je vstupní hodnota `2`, jednotka před převodem je „týden“, jednotka po převodu je „den“ a desetinná místa nejsou zachována, pak je výsledek výpočtu `14`.

## Příklad

![日期计算节点_示例](https://static-docs.nocobase.com/20240817184137.png)

Předpokládejme, že probíhá propagační akce a chceme přidat datum ukončení propagační akce do pole produktu při každém jeho vytvoření. Toto datum ukončení je 23:59:59 posledního dne týdne následujícího po datu vytvoření produktu. Můžeme tedy vytvořit dvě časové funkce a nechat je běžet v pipeline:

-   Vypočítat čas pro následující týden
-   Resetovat výsledek na 23:59:59 posledního dne daného týdne

Tímto způsobem získáme požadovanou časovou hodnotu a předáme ji dalšímu uzlu, například uzlu pro úpravu kolekce, aby se datum ukončení propagační akce přidalo do kolekce.