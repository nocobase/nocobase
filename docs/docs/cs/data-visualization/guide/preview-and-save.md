:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Náhled a uložení

*   **Náhled**: Dočasně zobrazí změny z konfiguračního panelu v grafu na stránce pro ověření výsledku.
*   **Uložit**: Trvale uloží změny z konfiguračního panelu do databáze.

## Vstupní body

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

-   Ve vizuálním (základním) režimu se všechny změny ve výchozím nastavení automaticky aplikují do náhledu.
-   V režimech SQL a Custom můžete po úpravách kliknout na tlačítko **Náhled** vpravo pro aplikování změn do náhledu.
-   Jednotné tlačítko „Náhled“ je k dispozici ve spodní části celého konfiguračního panelu.

## Chování náhledu

-   Dočasně zobrazí konfiguraci na stránce, aniž by ji zapsal do databáze. Po obnovení stránky nebo zrušení operace se výsledek náhledu neuchová.
-   Vestavěná funkce *debounce*: Při vícenásobném spuštění obnovení v krátkém čase se provede pouze to poslední, aby se zabránilo častým požadavkům.
-   Opětovné kliknutí na „Náhled“ přepíše předchozí výsledek náhledu.

## Chybová hlášení

-   Chyby dotazu nebo selhání validace: Zobrazí se v oblasti „Zobrazit data“.
-   Chyby konfigurace grafu (chybějící základní mapování, výjimky z Custom JS): Zobrazí se v oblasti grafu nebo v konzoli, přičemž stránka zůstane funkční.
-   Nejprve v „Zobrazit data“ potvrďte názvy sloupců a datové typy, a teprve poté proveďte mapování polí nebo napište Custom kód. Tímto způsobem efektivně snížíte počet chyb.

## Uložit a Zrušit

-   **Uložit**: Zapíše aktuální změny do konfigurace bloku a okamžitě je aplikuje na stránku.
-   **Zrušit**: Zahodí aktuální neuložené změny a vrátí se k poslednímu uloženému stavu.
-   Rozsah uložení:
    -   Dotaz na data: Parametry Builderu; v režimu SQL se uloží také text SQL.
    -   Možnosti grafu: Základní typ, mapování polí a vlastnosti; text Custom JS.
    -   Interaktivní události: Text JS události a logika vazby.
-   Po uložení se blok projeví pro všechny návštěvníky (v závislosti na nastavení oprávnění stránky).

## Doporučený postup

-   Konfigurujte dotaz na data → Spusťte dotaz → Zobrazte data pro potvrzení názvů sloupců a typů → Konfigurujte možnosti grafu pro mapování klíčových polí → Proveďte náhled pro ověření → Uložte pro aplikování změn.