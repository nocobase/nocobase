---
pkg: "@nocobase/plugin-collection-fdw"
---

:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Připojení externích datových tabulek (FDW)

## Úvod

Jedná se o plugin, který umožňuje připojení k vzdáleným datovým tabulkám pomocí funkce Foreign Data Wrapper (FDW) databáze. V současné době podporuje databáze MySQL a PostgreSQL.

:::info{title="Připojení zdrojů dat vs. Připojení externích datových tabulek"}
- **Připojení zdrojů dat** znamená navázání spojení s konkrétní databází nebo službou API, přičemž můžete plně využívat funkce databáze nebo služby poskytované API;
- **Připojení externích datových tabulek** znamená získávání dat z externích zdrojů a jejich mapování pro lokální použití. V databázovém kontextu se tato technologie nazývá FDW (Foreign Data Wrapper) a zaměřuje se na používání vzdálených tabulek jako lokálních tabulek. Připojení probíhá vždy po jedné tabulce. Vzhledem k tomu, že se jedná o vzdálený přístup, existují při používání různá omezení a limity.

Oba přístupy lze také kombinovat. První slouží k navázání spojení se zdrojem dat, zatímco druhý se používá pro přístup napříč zdroji dat. Například, pokud je připojen určitý zdroj dat PostgreSQL, může tento zdroj dat obsahovat tabulku, která je externí datovou tabulkou vytvořenou na základě FDW.
:::

### MySQL

MySQL využívá engine `federated`, který je nutné aktivovat, a podporuje připojení ke vzdáleným databázím MySQL a databázím kompatibilním s protokolem, jako je MariaDB. Podrobnější informace naleznete v dokumentaci [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

V PostgreSQL lze k podpoře různých typů vzdálených dat použít různé typy rozšíření `fdw`. Mezi aktuálně podporovaná rozšíření patří:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Připojení ke vzdálené databázi PostgreSQL v rámci PostgreSQL.
- [mysql_fdw(ve vývoji)](https://github.com/EnterpriseDB/mysql_fdw): Připojení ke vzdálené databázi MySQL v rámci PostgreSQL.
- Pro ostatní typy rozšíření fdw se podívejte na [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Pro integraci s NocoBase je nutné implementovat odpovídající adaptační rozhraní v kódu.

## Instalace

Předpoklady

- Pokud je hlavní databáze NocoBase MySQL, je nutné aktivovat `federated`. Viz [Jak povolit engine federated v MySQL](./enable-federated.md)

Poté nainstalujte a aktivujte plugin prostřednictvím správce pluginů.

![Nainstalujte a aktivujte plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Uživatelská příručka

V rozbalovací nabídce „Správa kolekcí > Vytvořit kolekci“ vyberte „Připojit externí data“.

![Připojit externí data](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

V rozbalovací nabídce „Databázová služba“ vyberte existující databázovou službu, nebo „Vytvořit databázovou službu“.

![Databázová služba](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Vytvořit databázovou službu

![Vytvořit databázovou službu](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Po výběru databázové služby v rozbalovací nabídce „Vzdálená tabulka“ vyberte datovou tabulku, kterou chcete připojit.

![Vyberte datovou tabulku, kterou chcete připojit](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurace informací o polích

![Konfigurace informací o polích](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Pokud dojde ke změnám ve struktuře vzdálené tabulky, můžete také „Synchronizovat ze vzdálené tabulky“.

![Synchronizovat ze vzdálené tabulky](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronizace vzdálené tabulky

![Synchronizace vzdálené tabulky](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Nakonec se zobrazí v rozhraní.

![Zobrazení v rozhraní](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)