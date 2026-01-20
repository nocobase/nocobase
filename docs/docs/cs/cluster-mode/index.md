:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Klastrový režim

## Úvod

Od verze v1.6.0 NocoBase podporuje spouštění aplikací v klastrovém režimu. Když aplikace běží v klastrovém režimu, může zlepšit svůj výkon při zpracování souběžných přístupů pomocí více instancí a vícejádrového režimu.

## Systémová architektura

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Aplikační klastr**: Klastr složený z více instancí aplikace NocoBase. Může být nasazen na více serverech nebo spuštěn jako více procesů v vícejádrovém režimu na jednom serveru.
*   **Databáze**: Ukládá data aplikace. Může být jednouzlová nebo distribuovaná databáze.
*   **Sdílené úložiště**: Slouží k ukládání souborů a dat aplikace a podporuje čtení i zápis z více instancí.
*   **Middleware**: Zahrnuje komponenty jako cache, synchronizační signály, frontu zpráv a distribuované zámky, které podporují komunikaci a koordinaci v rámci aplikačního klastru.
*   **Vyrovnávač zátěže**: Odpovídá za distribuci klientských požadavků na různé instance v aplikačním klastru a provádí kontroly stavu a převzetí služeb při selhání.

## Více informací

Tento dokument představuje pouze základní koncepty a komponenty klastrového režimu NocoBase. Konkrétní detaily nasazení a další možnosti konfigurace naleznete v následujících dokumentech:

- Nasazení
  - [Příprava](./preparations)
  - [Nasazení v Kubernetes](./kubernetes)
  - [Provozní postupy](./operations)
- Pokročilé
  - [Rozdělení služeb](./services-splitting)
- [Vývojářská reference](./development)