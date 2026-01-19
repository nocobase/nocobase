:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Úložný engine: Lokální úložiště

Nahrané soubory se uloží do lokálního adresáře na pevném disku serveru. Tento způsob je vhodný pro scénáře s menším celkovým objemem nahraných souborů spravovaných systémem nebo pro experimentální účely.

## Konfigurační parametry

![Příklad konfigurace enginu pro ukládání souborů](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Tip}
Tato sekce představuje pouze parametry specifické pro lokální úložný engine. Pro obecné parametry se prosím podívejte na [Obecné parametry enginu](./index.md#引擎通用参数).
:::

### Cesta

Vyjadřuje jak relativní cestu pro ukládání souborů na serveru, tak i URL přístupovou cestu. Například „`user/avatar`“ (bez úvodních a koncových lomítek „`/`“) představuje:

1. Relativní cesta na serveru, kam se ukládají nahrané soubory: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Předpona URL adresy pro přístup k souborům: `http://localhost:13000/storage/uploads/user/avatar`.