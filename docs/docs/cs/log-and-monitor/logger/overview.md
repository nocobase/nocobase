:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/log-and-monitor/logger/overview).
:::

# Serverové protokoly, auditní záznamy a historie záznamů

## Serverové protokoly

### Systémové protokoly

> Viz [Systémové protokoly](./index.md#systémové-protokoly)

- Zaznamenávají informace o běhu aplikačního systému, sledují řetězce provádění kódu a dohledávají výjimky nebo chyby při běhu.
- Protokoly jsou kategorizovány podle úrovní závažnosti a funkčních modulů.
- Výstup probíhá přes terminál nebo jsou ukládány jako soubory.
- Slouží především k diagnostice a řešení chyb systému během provozu.

### Protokoly požadavků

> Viz [Protokoly požadavků](./index.md#protokoly-požadavků)

- Zaznamenávají podrobnosti o požadavcích a odpovědích HTTP API se zaměřením na ID požadavku, cestu API (Path), hlavičky, stavový kód odpovědi a dobu trvání.
- Výstup probíhá přes terminál nebo jsou ukládány jako soubory.
- Slouží především ke sledování volání API a výkonu provádění.

## Auditní záznamy

> Viz [Auditní záznamy](/security/audit-logger/index.md)

- Zaznamenávají akce uživatelů (nebo API) se systémovými zdroji, se zaměřením na typ zdroje, cílový objekt, typ operace, informace o uživateli a stav operace.
- Pro lepší sledování konkrétního obsahu a výsledků uživatelských operací jsou parametry požadavků a odpovědi ukládány jako metadata. Tato část se částečně překrývá s protokoly požadavků, ale není s nimi totožná – například protokoly požadavků obvykle neobsahují celá těla požadavků.
- Parametry požadavků a odpovědi **nejsou ekvivalentem** snímků dat (snapshots). Mohou prozradit, k jakým změnám došlo na základě parametrů a logiky kódu, ale neumožňují přesně zjistit stav záznamu v databázi před úpravou. Proto je nelze použít pro správu verzí nebo obnovu dat po chybných operacích.
- Jsou ukládány ve formě souborů i databázových tabulek.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historie záznamů

> Viz [Historie záznamů](/record-history/index.md)

- Zaznamenává historii změn obsahu dat.
- Sleduje především typ zdroje, objekt zdroje, typ operace, změněná pole a hodnoty před změnou a po ní.
- Lze využít pro porovnávání dat.
- Jsou ukládány v databázových tabulkách.

![](https://static-docs.nocobase.com/202511011338499.png)