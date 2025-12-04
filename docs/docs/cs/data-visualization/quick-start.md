:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rychlý start

Pojďme si od začátku nakonfigurovat graf. Projdeme si základní a nezbytné funkce, zatímco volitelné možnosti probereme v dalších kapitolách.

Předpoklady:
- Máte nastavený zdroj dat a kolekci (tabulku) a disponujete oprávněním pro čtení.

## Přidat blok grafu

V návrháři stránek klikněte na „Přidat blok“, vyberte „Graf“ a přidejte blok grafu.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Po přidání klikněte v pravém horním rohu bloku na „Konfigurovat“.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Vpravo se otevře konfigurační panel grafu. Obsahuje tři části: Dotaz na data, Možnosti grafu a Události.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Konfigurace dotazu na data
V panelu „Dotaz na data“ můžete konfigurovat zdroj dat, filtry dotazů a související možnosti.

- Nejprve vyberte zdroj dat a kolekci
  - V panelu „Dotaz na data“ vyberte zdroj dat a kolekci jako základ pro dotazování.
  - Pokud kolekce není volitelná nebo je prázdná, nejprve zkontrolujte, zda existuje a zda má váš uživatel příslušná oprávnění.

- Konfigurujte míry (Measures)
  - Vyberte jedno nebo více číselných polí jako míry.
  - Pro každou míru nastavte agregaci: Součet / Počet / Průměr / Maximum / Minimum.

- Konfigurujte dimenze (Dimensions)
  - Vyberte jedno nebo více polí jako dimenze pro seskupování (datum, kategorie, region atd.).
  - U polí data/času můžete nastavit formát (například `YYYY-MM`, `YYYY-MM-DD`), aby bylo zobrazení konzistentní.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Další možnosti, jako je filtrování, řazení a stránkování, jsou volitelné.

## Spuštění dotazu a zobrazení dat

- Klikněte na „Spustit dotaz“, aby se načetla data a vykreslil se náhled grafu (přímo na levé straně stránky).
- Můžete kliknout na „Zobrazit data“ pro náhled vrácených datových výsledků; podporováno je přepínání mezi formáty Tabulka a JSON. Opětovným kliknutím náhled dat skryjete.
- Pokud je výsledek prázdný nebo neodpovídá očekávání, vraťte se do panelu dotazů a zkontrolujte oprávnění kolekce, mapování polí pro míry/dimenze a datové typy.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Konfigurace možností grafu

V panelu „Možnosti grafu“ můžete vybrat typ grafu a konfigurovat jeho možnosti.

- Nejprve vyberte typ grafu (čárový/plošný, sloupcový/pruhový, koláčový/prstencový, bodový atd.).
- Dokončete mapování klíčových polí:
  - Čárový/plošný/sloupcový/pruhový: `xField` (dimenze), `yField` (míra), `seriesField` (řada, volitelné)
  - Koláčový/prstencový: `Category` (kategorická dimenze), `Value` (míra)
  - Bodový: `xField`, `yField` (dvě míry nebo dimenze)
  - Další nastavení grafů naleznete v dokumentaci ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Po kliknutí na „Spustit dotaz“ se mapování polí automaticky vyplní. Pokud změníte dimenze/míry, prosím, znovu zkontrolujte mapování.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Náhled a uložení
Změny konfigurace se automaticky aktualizují v reálném čase v náhledu na levé straně stránky, kde si můžete graf prohlédnout. Mějte však na paměti, že veškeré úpravy nebudou skutečně uloženy, dokud nekliknete na tlačítko „Uložit“.

Můžete také použít tlačítka ve spodní části:

- Náhled: Změny konfigurace automaticky obnovují náhled v reálném čase. Můžete také kliknout na tlačítko „Náhled“ ve spodní části pro ruční spuštění obnovení.
- Zrušit: Pokud si nepřejete aktuální změny konfigurace, můžete kliknout na tlačítko „Zrušit“ ve spodní části nebo obnovit stránku. Tím se zruší aktuální úpravy a vrátíte se k naposledy uloženému stavu.
- Uložit: Kliknutím na „Uložit“ skutečně uložíte aktuální konfiguraci dotazů a grafů do databáze, čímž se stane platnou pro všechny uživatele.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Běžné tipy

- Minimální funkční konfigurace: Vyberte kolekci + alespoň jednu míru; doporučuje se přidat dimenze pro snazší seskupené zobrazení.
- U dimenzí data se doporučuje nastavit vhodný formát (například pro měsíční statistiky zvolte `YYYY-MM`), aby se předešlo nespojité nebo nepřehledné ose X.
- Pokud je dotaz prázdný nebo se graf nezobrazuje:
  - Zkontrolujte kolekci/oprávnění a mapování polí;
  - V „Zobrazit data“ ověřte, zda názvy sloupců a typy odpovídají mapování grafu.
- Náhled je dočasný stav: Slouží pouze k ověření a úpravám. Oficiálně se projeví až po kliknutí na „Uložit“.