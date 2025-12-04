:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Protokoly serveru, protokoly auditu a historie záznamů

## Serverové protokoly

### Systémové protokoly

> Viz [Systémové protokoly](#)

- Zaznamenávají informace o běhu aplikačního systému, sledují řetězce provádění kódu a pomáhají dohledávat výjimky nebo chyby při běhu.
- Protokoly jsou rozděleny podle úrovní závažnosti a kategorizovány podle funkčních modulů.
- Jsou vypisovány do terminálu nebo ukládány ve formě souborů.
- Slouží primárně k diagnostice a řešení problémů se systémem, které se objeví během jeho provozu.

### Protokoly požadavků

> Viz [Protokoly požadavků](#)

- Zaznamenávají detaily HTTP API požadavků a odpovědí, se zaměřením na ID požadavku, cestu API, hlavičky, stavový kód odpovědi a dobu trvání.
- Jsou vypisovány do terminálu nebo ukládány ve formě souborů.
- Slouží primárně ke sledování volání API a jejich výkonu.

## Protokoly auditu

> Viz [Protokoly auditu](../security/audit-logger/index.md)

- Zaznamenávají akce uživatelů (nebo API) s prostředky systému, se zaměřením na typ prostředku, cílový objekt, typ operace, informace o uživateli a stav operace.
- Aby bylo možné lépe sledovat, co uživatelé udělali a jaké výsledky byly vytvořeny, parametry požadavků a odpovědi jsou ukládány jako metadata. Tato část informací se částečně překrývá s protokoly požadavků, ale není zcela identická – například protokoly požadavků obvykle neobsahují kompletní těla požadavků.
- Parametry požadavků a odpovědi **nejsou ekvivalentní** snímkům dat. Mohou odhalit, jaké operace proběhly, ale ne přesná data před úpravou, a proto je nelze použít pro správu verzí nebo obnovu dat po chybných operacích.
- Ukládány jako soubory i databázové tabulky.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historie záznamů

> Viz [Historie záznamů](/record-history/index.md)

- Zaznamenává **historii změn** obsahu dat.
- Sleduje typ prostředku, objekt prostředku, typ operace, změněná pole a hodnoty před a po změně.
- Lze použít pro **porovnávání dat a audit**.
- Ukládány v databázových tabulkách.

![](https://static-docs.nocobase.com/202511011338499.png)