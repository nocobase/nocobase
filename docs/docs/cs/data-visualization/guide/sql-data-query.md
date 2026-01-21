:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Dotazování dat v režimu SQL

V panelu „Dotazování dat“ přepněte do režimu SQL, napište a spusťte dotaz, a přímo použijte vrácené výsledky pro mapování a vykreslování grafů.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Psaní SQL dotazů
- V panelu „Dotazování dat“ vyberte režim „SQL“.
- Zadejte SQL dotaz a klikněte na „Spustit dotaz“.
- Podporovány jsou komplexní SQL příkazy, včetně JOIN přes více tabulek a VIEW.

Příklad: Součet částek objednávek podle měsíce
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Zobrazení výsledků
- Kliknutím na „Zobrazit data“ otevřete panel náhledu datových výsledků.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Data podporují stránkování; můžete přepínat mezi zobrazením „Tabulka“ a „JSON“ pro kontrolu názvů sloupců a jejich typů.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mapování polí
- V konfiguraci „Možnosti grafu“ dokončete mapování polí na základě sloupců výsledků dotazu.
- Ve výchozím nastavení se první sloupec automaticky použije jako dimenze (osa X nebo kategorie) a druhý sloupec jako míra (osa Y nebo hodnota). Proto věnujte pozornost pořadí polí v SQL dotazu:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- pole dimenze v prvním sloupci
  SUM(total_amount) AS total -- pole míry poté
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Použití kontextových proměnných
Kliknutím na tlačítko „x“ v pravém horním rohu SQL editoru můžete vybrat kontextové proměnné.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Po potvrzení se výraz proměnné vloží na pozici kurzoru v SQL textu (nebo nahradí vybraný text).

Například `{{ ctx.user.createdAt }}`. Dbejte na to, abyste nepřidávali další uvozovky.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Další příklady
Další příklady použití naleznete v [demo aplikaci](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

**Doporučení:**
- Stabilizujte názvy sloupců před mapováním do grafů, abyste předešli pozdějším chybám.
- Během ladění nastavte `LIMIT` pro snížení počtu vrácených řádků a zrychlení náhledu.

## Náhled, uložení a vrácení změn
- Kliknutím na „Spustit dotaz“ se vyžádají data a aktualizuje se náhled grafu.
- Kliknutím na „Uložit“ se aktuální SQL text a související konfigurace uloží do databáze.
- Kliknutím na „Zrušit“ se vrátíte k naposledy uloženému stavu a zahodíte aktuální neuložené změny.