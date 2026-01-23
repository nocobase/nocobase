---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Správce zdrojů dat

## Úvod

NocoBase poskytuje plugin Správce zdrojů dat, který slouží ke správě zdrojů dat a jejich kolekcí. Tento plugin pouze poskytuje rozhraní pro správu všech zdrojů dat a sám o sobě neumožňuje připojení k nim. Je nutné jej používat ve spojení s různými pluginy pro zdroje dat. Aktuálně podporované zdroje dat pro připojení zahrnují:

- [Hlavní databáze](/data-sources/data-source-main): Hlavní databáze NocoBase, podporující relační databáze jako MySQL, PostgreSQL a MariaDB.
- [Externí MySQL](/data-sources/data-source-external-mysql): Používá externí databázi MySQL jako zdroj dat.
- [Externí MariaDB](/data-sources/data-source-external-mariadb): Používá externí databázi MariaDB jako zdroj dat.
- [Externí PostgreSQL](/data-sources/data-source-external-postgres): Používá externí databázi PostgreSQL jako zdroj dat.
- [Externí MSSQL](/data-sources/data-source-external-mssql): Používá externí databázi MSSQL (SQL Server) jako zdroj dat.
- [Externí Oracle](/data-sources/data-source-external-oracle): Používá externí databázi Oracle jako zdroj dat.

Kromě toho lze pomocí pluginů rozšířit podporu o další typy, ať už se jedná o běžné databáze, nebo platformy poskytující API (SDK).

## Instalace

Jedná se o vestavěný plugin, který nevyžaduje samostatnou instalaci.

## Pokyny k použití

Při inicializaci a instalaci aplikace je ve výchozím nastavení poskytován zdroj dat pro ukládání dat NocoBase, označovaný jako hlavní databáze. Více informací naleznete v dokumentaci k [Hlavní databázi](/data-sources/data-source-main/).

### Externí zdroje dat

Jako zdroje dat jsou podporovány externí databáze. Více informací naleznete v dokumentaci [Externí databáze / Úvod](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Podpora synchronizace vlastních databázových tabulek

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Můžete také přistupovat k datům ze zdrojů HTTP API. Více informací naleznete v dokumentaci k [REST API zdroji dat](/data-sources/data-source-rest-api/).