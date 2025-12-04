:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Srovnání hlavních a externích databází

Rozdíly mezi hlavními a externími databázemi v NocoBase se projevují především ve čtyřech oblastech: podpora typů databází, podpora typů kolekcí, podpora typů polí a možnosti zálohování a migrace.

## 1. Podpora typů databází

Více podrobností naleznete v části: [Správce zdrojů dat](https://docs.nocobase.com/data-sources/data-source-manager)

### Typy databází

| Typ databáze | Podporováno hlavní databází | Podporováno externí databází |
|-------------|-----------------------------|------------------------------|
| PostgreSQL  | ✅                           | ✅                           |
| MySQL       | ✅                           | ✅                           |
| MariaDB     | ✅                           | ✅                           |
| KingbaseES  | ✅                           | ✅                           |
| MSSQL       | ❌                           | ✅                           |
| Oracle      | ❌                           | ✅                           |

### Správa kolekcí

| Správa kolekcí | Podporováno hlavní databází | Podporováno externí databází |
|----------------|-----------------------------|------------------------------|
| Základní správa | ✅                           | ✅                           |
| Vizuální správa | ✅                           | ❌                           |

## 2. Podpora typů kolekcí

Více podrobností naleznete v části: [Kolekce](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Typ kolekce       | Hlavní databáze | Externí databáze | Popis                                                  |
|-------------------|-----------------|------------------|--------------------------------------------------------|
| Běžná             | ✅               | ✅               | Základní kolekce                                       |
| Pohled            | ✅               | ✅               | Pohled zdroje dat                                      |
| Dědičná           | ✅               | ❌               | Podporuje dědičnost datového modelu, pouze pro hlavní zdroj dat |
| Souborová         | ✅               | ❌               | Podporuje nahrávání souborů, pouze pro hlavní zdroj dat |
| Komentářová       | ✅               | ❌               | Vestavěný systém komentářů, pouze pro hlavní zdroj dat |
| Kalendářová       | ✅               | ❌               | Kolekce pro kalendářové pohledy                        |
| Výrazová          | ✅               | ❌               | Podporuje výpočty pomocí vzorců                        |
| Stromová          | ✅               | ❌               | Pro modelování dat stromové struktury                  |
| SQL               | ✅               | ❌               | Kolekce definovaná pomocí SQL                          |
| Externí připojení | ✅               | ❌               | Kolekce pro připojení k externím zdrojům dat, omezená funkčnost |

## 3. Podpora typů polí

Více podrobností naleznete v části: [Pole kolekcí](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Základní typy

| Typ pole            | Hlavní databáze | Externí databáze |
|---------------------|-----------------|------------------|
| Jednořádkový text   | ✅               | ✅               |
| Víceřádkový text    | ✅               | ✅               |
| Telefonní číslo     | ✅               | ✅               |
| E-mail              | ✅               | ✅               |
| URL                 | ✅               | ✅               |
| Celé číslo          | ✅               | ✅               |
| Číslo               | ✅               | ✅               |
| Procenta            | ✅               | ✅               |
| Heslo               | ✅               | ✅               |
| Barva               | ✅               | ✅               |
| Ikona               | ✅               | ✅               |

### Typy výběru

| Typ pole                          | Hlavní databáze | Externí databáze |
|-----------------------------------|-----------------|------------------|
| Zaškrtávací políčko               | ✅               | ✅               |
| Rozbalovací nabídka (jednoduchý výběr) | ✅               | ✅               |
| Rozbalovací nabídka (vícenásobný výběr) | ✅               | ✅               |
| Přepínač                          | ✅               | ✅               |
| Skupina zaškrtávacích políček     | ✅               | ✅               |
| Region Číny                       | ✅               | ❌               |

### Multimediální typy

| Typ pole                  | Hlavní databáze | Externí databáze |
|---------------------------|-----------------|------------------|
| Média                     | ✅               | ✅               |
| Markdown                  | ✅               | ✅               |
| Markdown (Vditor)         | ✅               | ✅               |
| Rich Text                 | ✅               | ✅               |
| Příloha (asociace)        | ✅               | ❌               |
| Příloha (URL)             | ✅               | ✅               |

### Typy data a času

| Typ pole                        | Hlavní databáze | Externí databáze |
|---------------------------------|-----------------|------------------|
| Datum a čas (s časovou zónou)   | ✅               | ✅               |
| Datum a čas (bez časové zóny)   | ✅               | ✅               |
| Unix timestamp                  | ✅               | ✅               |
| Datum (bez času)                | ✅               | ✅               |
| Čas                             | ✅               | ✅               |

### Geometrické typy

| Typ pole | Hlavní databáze | Externí databáze |
|----------|-----------------|------------------|
| Bod      | ✅               | ✅               |
| Čára     | ✅               | ✅               |
| Kruh     | ✅               | ✅               |
| Polygon  | ✅               | ✅               |

### Pokročilé typy

| Typ pole              | Hlavní databáze | Externí databáze |
|-----------------------|-----------------|------------------|
| UUID                  | ✅               | ✅               |
| Nano ID               | ✅               | ✅               |
| Řazení                | ✅               | ✅               |
| Vzorec                | ✅               | ✅               |
| Sekvence              | ✅               | ✅               |
| JSON                  | ✅               | ✅               |
| Selektor kolekcí      | ✅               | ❌               |
| Šifrování             | ✅               | ✅               |

### Systémová informační pole

| Typ pole            | Hlavní databáze | Externí databáze |
|---------------------|-----------------|------------------|
| Datum vytvoření     | ✅               | ✅               |
| Datum poslední úpravy | ✅               | ✅               |
| Vytvořil            | ✅               | ❌               |
| Naposledy upravil   | ✅               | ❌               |
| OID tabulky         | ✅               | ❌               |

### Typy asociací

| Typ pole             | Hlavní databáze | Externí databáze |
|----------------------|-----------------|------------------|
| Jedna k jedné        | ✅               | ✅               |
| Jedna k mnoha        | ✅               | ✅               |
| Mnoho k jedné        | ✅               | ✅               |
| Mnoho k mnoha        | ✅               | ✅               |
| Mnoho k mnoha (pole) | ✅               | ✅               |

:::info
Pole příloh závisí na souborových kolekcích, které jsou podporovány pouze hlavními databázemi. Z tohoto důvodu externí databáze v současné době nepodporují pole příloh.
:::

## 4. Srovnání podpory zálohování a migrace

| Funkce                | Hlavní databáze | Externí databáze      |
|-----------------------|-----------------|-----------------------|
| Zálohování a obnova   | ✅               | ❌ (Spravováno uživatelem) |
| Správa migrace        | ✅               | ❌ (Spravováno uživatelem) |

:::info
NocoBase poskytuje možnosti zálohování, obnovy a migrace struktury pro hlavní databáze. U externích databází musí být tyto operace provedeny nezávisle uživateli podle jejich vlastního databázového prostředí. NocoBase neposkytuje vestavěnou podporu.
:::

## Souhrnné srovnání

| Srovnávací položka        | Hlavní databáze                               | Externí databáze                                  |
|---------------------------|-----------------------------------------------|---------------------------------------------------|
| Typy databází             | PostgreSQL, MySQL, MariaDB, KingbaseES        | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Podpora typů kolekcí      | Všechny typy kolekcí                          | Pouze běžné kolekce a pohledy                     |
| Podpora typů polí         | Všechny typy polí                             | Všechny typy polí kromě polí příloh              |
| Zálohování a migrace      | Vestavěná podpora                             | Spravováno uživatelem                             |

## Doporučení

- **Pokud používáte NocoBase k budování zcela nového obchodního systému**, použijte prosím **hlavní databázi**. To vám umožní využívat kompletní funkcionalitu NocoBase.
- **Pokud používáte NocoBase k připojení k databázím jiných systémů pro základní operace CRUD (vytváření, čtení, aktualizace, mazání)**, pak použijte **externí databáze**.