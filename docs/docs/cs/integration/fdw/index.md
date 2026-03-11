:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/integration/fdw/index).
:::

# Připojení externích datových tabulek (FDW)

## Úvod

Tato funkce umožňuje připojení ke vzdáleným datovým tabulkám na základě technologie Foreign Data Wrapper (FDW) dané databáze. V současné době jsou podporovány databáze MySQL a PostgreSQL.

:::info{title="Připojení zdrojů dat vs. připojení externích datových tabulek"}
- **Připojení zdrojů dat** označuje navázání spojení s konkrétní databází nebo službou API, přičemž můžete plně využívat funkce databáze nebo služby poskytované rozhraním API.
- **Připojení externích datových tabulek** označuje získávání dat zvenčí a jejich mapování pro lokální použití. V databázové terminologii se to nazývá FDW (Foreign Data Wrapper). Jde o databázovou technologii, která se zaměřuje na používání vzdálených tabulek jako lokálních a umožňuje připojit vždy pouze jednu tabulku najednou. Vzhledem k tomu, že se jedná o vzdálený přístup, existují při jeho používání různá omezení a limity.

Obě metody lze také kombinovat. První jmenovaná slouží k navázání spojení se zdrojem dat, zatímco druhá se používá pro přístup napříč zdroji dat. Například je připojen určitý zdroj dat PostgreSQL a konkrétní tabulka v tomto zdroji je externí datová tabulka vytvořená na základě FDW.
:::

### MySQL

MySQL využívá engine `federated`, který je nutné aktivovat. Podporuje připojení ke vzdáleným databázím MySQL a databázím kompatibilním s tímto protokolem, jako je MariaDB. Podrobnosti naleznete v dokumentaci k [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

V PostgreSQL lze použít různé typy rozšíření `fdw` pro podporu různých typů vzdálených dat. Aktuálně podporovaná rozšíření zahrnují:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Připojení ke vzdálené databázi PostgreSQL v rámci PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Připojení ke vzdálené databázi MySQL v rámci PostgreSQL.
- Ostatní typy rozšíření fdw naleznete v [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Pro integraci do NocoBase je nutné v kódu implementovat odpovídající rozhraní.

## Požadavky

- Pokud je hlavní databází NocoBase MySQL, musíte aktivovat `federated`. Viz [Jak povolit engine federated v MySQL](./enable-federated).

Poté nainstalujte a aktivujte plugin prostřednictvím správce pluginů.

![Instalace a aktivace pluginu](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Uživatelská příručka

V části „Správce kolekcí > Vytvořit kolekci“ vyberte v rozbalovací nabídce možnost „Připojit k externím datům“.

![Připojit externí data](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

V rozbalovací nabídce „Databázový server“ vyberte existující databázovou službu nebo zvolte „Vytvořit databázový server“.

![Databázová služba](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Vytvoření databázového serveru:

![Vytvořit databázovou službu](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Po výběru databázového serveru zvolte v rozbalovací nabídce „Vzdálená tabulka“ datovou tabulku, kterou chcete připojit.

![Vyberte datovou tabulku, kterou chcete připojit](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Konfigurace informací o polích:

![Konfigurovat informace o polích](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Pokud dojde ke změnám ve struktuře vzdálené tabulky, můžete také použít možnost „Synchronizovat ze vzdálené tabulky“.

![Synchronizovat ze vzdálené tabulky](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Synchronizace vzdálené tabulky:

![Synchronizace vzdálené tabulky](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Nakonec se tabulka zobrazí v rozhraní:

![Zobrazení v rozhraní](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)