:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Filtry stránky a propojení

Blok filtru (Filter Block) slouží k jednotnému zadávání podmínek filtrování na úrovni stránky a jejich sloučení do dotazů grafů, čímž zajišťuje konzistentní filtrování a propojení více grafů.

## Přehled funkcí
- Přidejte na stránku „blok filtru“, který poskytne jednotný vstup pro filtrování pro všechny grafy na aktuální stránce.
- Použijte tlačítka „Filtrovat“, „Resetovat“ a „Sbalit“ k aplikaci, vymazání a sbalení.
- Pokud filtr vybere pole spojená s grafem, jejich hodnoty se automaticky sloučí do dotazu grafu a spustí obnovení.
- Filtry mohou také definovat vlastní pole a registrovat je v kontextových proměnných, takže je lze odkazovat v grafech, tabulkách, formulářích a dalších datových blocích.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Více informací o používání filtrů stránky a propojení s grafy nebo jinými datovými bloky naleznete v dokumentaci k [filtrům stránky](https://www.nocobase.com/docs/page-filters).

## Použití hodnot filtrů stránky v dotazech grafů
- Režim Builder (doporučeno)
  - Automatické sloučení: Pokud se shoduje zdroj dat a kolekce, nemusíte v dotazu grafu psát další proměnné; filtry stránky se sloučí pomocí `$and`.
  - Ruční výběr: Můžete také aktivně vybrat hodnoty z „vlastních polí“ bloku filtru v podmínkách filtrování grafu.

- Režim SQL (pomocí injekce proměnných)
  - V příkazu SQL použijte „Vybrat proměnnou“ k vložení hodnot z „vlastních polí“ bloku filtru.