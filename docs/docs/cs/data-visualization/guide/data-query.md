:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Dotazování dat

Konfigurační panel grafu je rozdělen do tří hlavních částí: Dotazování dat, Možnosti grafu a Interaktivní události, doplněné o tlačítka Zrušit, Náhled a Uložit ve spodní části.

Nejprve se podíváme na panel „Dotazování dat“, abychom pochopili dva režimy dotazování (Builder/SQL) a jejich běžné funkce.

## Struktura panelu
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tip: Pro snazší konfiguraci aktuálního obsahu můžete nejprve sbalit ostatní panely.

Nahoře se nachází panel akcí:
- Režim: Builder (grafické rozhraní, jednoduché a pohodlné) / SQL (ručně psané příkazy, flexibilnější).
- Spustit dotaz: Kliknutím spustíte požadavek na dotazování dat.
- Zobrazit výsledek: Otevře panel s výsledky dat, kde můžete přepínat mezi zobrazením Tabulka/JSON. Dalším kliknutím panel sbalíte.

Shora dolů následují:
- Zdroj dat a kolekce: Povinné. Vyberte zdroj dat a datovou kolekci.
- Míry (Measures): Povinné. Číselná pole, která se mají zobrazit.
- Dimenze (Dimensions): Seskupení podle polí (např. datum, kategorie, region).
- Filtr: Nastavte podmínky filtru (např. =, ≠, >, <, obsahuje, rozsah). Lze kombinovat více podmínek.
- Řazení: Vyberte pole pro řazení a pořadí (vzestupně/sestupně).
- Stránkování: Ovládání rozsahu dat a pořadí vrácených záznamů.

## Režim Builder

### Výběr zdroje dat a kolekce
- V panelu „Dotazování dat“ nastavte režim na „Builder“.
- Vyberte zdroj dat a kolekci. Pokud kolekce není volitelná nebo je prázdná, nejprve zkontrolujte oprávnění a zda byla vytvořena.

### Konfigurace měr (Measures)
- Vyberte jedno nebo více číselných polí a nastavte agregaci: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Běžné scénáře použití: `Count` pro počítání záznamů, `Sum` pro výpočet celkové částky.

### Konfigurace dimenzí (Dimensions)
- Vyberte jedno nebo více polí jako dimenze pro seskupení.
- Pole typu datum a čas lze formátovat (např. `YYYY-MM`, `YYYY-MM-DD`), což usnadňuje seskupování podle měsíce nebo dne.

### Filtr, řazení a stránkování
- Filtr: Přidejte podmínky (např. =, ≠, obsahuje, rozsah). Lze kombinovat více podmínek.
- Řazení: Vyberte pole a pořadí řazení (vzestupně/sestupně).
- Stránkování: Nastavte `Limit` a `Offset` pro řízení počtu vrácených řádků. Při ladění se doporučuje nejprve nastavit menší `Limit`.

### Spuštění dotazu a zobrazení výsledku
- Klikněte na „Spustit dotaz“ pro provedení. Po návratu přepněte v „Zobrazit výsledek“ mezi `Tabulka / JSON` a zkontrolujte sloupce a hodnoty.
- Před mapováním polí grafu zde nejprve potvrďte názvy a typy sloupců, abyste předešli prázdnému grafu nebo chybám později.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Následné mapování polí

Později, při konfiguraci „Možností grafu“, provedete mapování polí na základě polí z vybraného zdroje dat a kolekce.

## Režim SQL

### Psaní dotazu
- Přepněte do režimu „SQL“, zadejte dotazovací příkaz a klikněte na „Spustit dotaz“.
- Příklad (celková částka objednávky podle data):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Spuštění dotazu a zobrazení výsledku

- Klikněte na „Spustit dotaz“ pro provedení. Po návratu přepněte v „Zobrazit výsledek“ mezi `Tabulka / JSON` a zkontrolujte sloupce a hodnoty.
- Před mapováním polí grafu zde nejprve potvrďte názvy a typy sloupců, abyste předešli prázdnému grafu nebo chybám později.

### Následné mapování polí

Později, při konfiguraci „Možností grafu“, provedete mapování polí na základě sloupců z výsledku dotazu.

> [!TIP]
> Další informace o režimu SQL naleznete v části Pokročilé použití — Dotazování dat v režimu SQL.