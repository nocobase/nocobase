:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Lokální úložiště

Nahrané soubory se ukládají do lokálního adresáře na serveru. To je vhodné pro menší nebo experimentální scénáře, kde je celkový objem souborů spravovaných systémem relativně malý.

## Konfigurační parametry

![Příklad konfigurace enginu pro ukládání souborů](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tip}
Tato sekce popisuje pouze specifické parametry lokálního úložiště. Obecné parametry naleznete v části [Obecné parametry enginu](./index.md#引擎通用参数).
:::

### Cesta

Cesta vyjadřuje jak relativní cestu souboru uloženého na serveru, tak i URL cestu pro přístup. Například „`user/avatar`“ (bez úvodního a koncového „`/`“) představuje:

1. Relativní cestu nahraného souboru uloženého na serveru: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefix URL adresy pro přístup k souboru: `http://localhost:13000/storage/uploads/user/avatar`.