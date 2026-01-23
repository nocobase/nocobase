:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Tok událostí

## Úvod

Pokud chcete spustit vlastní akce při změně formuláře, můžete k tomu využít tok událostí. Kromě formulářů lze tok událostí použít také k nastavení vlastních operací pro stránky, bloky, tlačítka a pole.

## Jak používat

Níže si na jednoduchém příkladu ukážeme, jak nakonfigurovat tok událostí. Pojďme vytvořit propojení mezi dvěma tabulkami tak, aby se po kliknutí na řádek v levé tabulce automaticky filtrovala data v pravé tabulce.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Postup konfigurace je následující:

1.  Klikněte na ikonu „blesku“ v pravém horním rohu bloku levé tabulky, čímž otevřete konfigurační rozhraní toku událostí.
    ![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2.  Klikněte na „Přidat tok událostí (Add event flow)“ a jako „Spouštěcí událost (Trigger event)“ vyberte „Kliknutí na řádek (Row click)“. To znamená, že se tok spustí po kliknutí na řádek tabulky.
    ![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3.  „Spouštěcí podmínka (Trigger condition)“ slouží k nastavení podmínek. Tok událostí se spustí pouze tehdy, když jsou tyto podmínky splněny. Zde nemusíme nic konfigurovat; tok událostí se spustí při každém kliknutí na řádek.
    ![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4.  Najeďte myší na „Přidat krok (Add step)“ a můžete přidat kroky operací. Vybereme „Nastavit rozsah dat (Set data scope)“, abychom nastavili rozsah dat pro pravou tabulku.
    ![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5.  Zkopírujte UID pravé tabulky a vložte jej do vstupního pole „UID cílového bloku (Target block UID)“. Níže se okamžitě zobrazí rozhraní pro konfiguraci podmínek, kde můžete nastavit rozsah dat pro pravou tabulku.
    ![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6.  Pojďme nakonfigurovat podmínku, jak je znázorněno níže:
    ![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7.  Po nastavení rozsahu dat je potřeba blok obnovit, aby se zobrazily filtrované výsledky. Nyní nakonfigurujeme obnovení bloku pravé tabulky. Přidejte krok „Obnovit cílové bloky (Refresh target blocks)“ a zadejte UID pravé tabulky.
    ![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
    ![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8.  Nakonec klikněte na tlačítko Uložit v pravém dolním rohu a konfigurace je hotová.

## Typy událostí

### Před vykreslením (Before render)

Univerzální událost, kterou lze použít na stránkách, v blocích, tlačítkách nebo polích. V rámci této události můžete provádět inicializační úkoly, například nastavit různé rozsahy dat na základě různých podmínek.

### Kliknutí na řádek (Row click)

Událost specifická pro blok tabulky. Spustí se po kliknutí na řádek tabulky. Po spuštění přidá do kontextu záznam „Clicked row record“, který lze použít jako proměnnou v podmínkách a krocích.

### Změna hodnot formuláře (Form values change)

Událost specifická pro blok formuláře. Spustí se, když se změní hodnoty polí formuláře. Hodnoty formuláře můžete získat pomocí proměnné „Current form“ v podmínkách a krocích.

### Kliknutí (Click)

Událost specifická pro tlačítko. Spustí se po kliknutí na tlačítko.

## Typy kroků

### Vlastní proměnná (Custom variable)

Slouží k definování vlastní proměnné a jejímu následnému použití v kontextu.

#### Rozsah platnosti

Vlastní proměnné mají rozsah platnosti. Například proměnná definovaná v toku událostí bloku může být použita pouze v rámci tohoto bloku. Pokud chcete, aby byla proměnná dostupná ve všech blocích na aktuální stránce, musíte ji nakonfigurovat v toku událostí stránky.

#### Proměnná formuláře (Form variable)

Použijte hodnoty z bloku formuláře jako proměnnou. Konfigurace je následující:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

-   Variable title: Název proměnné
-   Variable identifier: Identifikátor proměnné
-   Form UID: UID formuláře

#### Další proměnné

Další typy proměnných budou podporovány v budoucnu. Zůstaňte naladěni.

### Nastavit rozsah dat (Set data scope)

Nastavte rozsah dat pro cílový blok. Konfigurace je následující:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

-   Target block UID: UID cílového bloku
-   Condition: Podmínka filtru

### Obnovit cílové bloky (Refresh target blocks)

Obnovte cílové bloky. Lze konfigurovat více bloků. Konfigurace je následující:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

-   Target block UID: UID cílového bloku

### Přejít na URL (Navigate to URL)

Přejděte na URL adresu. Konfigurace je následující:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

-   URL: Cílová URL, podporuje proměnné
-   Search parameters: Parametry dotazu v URL
-   Open in new window: Pokud je zaškrtnuto, otevře URL v nové záložce prohlížeče.

### Zobrazit zprávu (Show message)

Globálně zobrazí informace o zpětné vazbě operace.

#### Kdy použít

-   Může poskytovat zpětnou vazbu o úspěchu, varování a chybách.
-   Zobrazí se uprostřed nahoře a automaticky zmizí, což je lehký způsob upozornění, který nepřerušuje uživatelské operace.

#### Konfigurace

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

-   Message type: Typ zprávy
-   Message content: Obsah zprávy
-   Duration: Doba zobrazení (v sekundách)

### Zobrazit oznámení (Show notification)

Globálně zobrazí upozornění.

#### Kdy použít

Zobrazí upozornění v jednom ze čtyř rohů systému. Často se používá v následujících případech:

-   Složitější obsah oznámení.
-   Interaktivní oznámení, která uživatelům poskytují další kroky.
-   Systémem iniciovaná oznámení.

#### Konfigurace

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

-   Notification type: Typ oznámení
-   Notification title: Název oznámení
-   Notification description: Popis oznámení
-   Placement: Pozice, možnosti: vlevo nahoře, vpravo nahoře, vlevo dole, vpravo dole

### Spustit JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Spustí JavaScript kód.