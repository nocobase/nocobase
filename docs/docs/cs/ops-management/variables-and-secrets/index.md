---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Proměnné a citlivé údaje

## Úvod

Centralizovaná konfigurace a správa proměnných prostředí a citlivých údajů pro ukládání citlivých dat, opětovné použití konfiguračních dat a izolaci konfigurace prostředí.

## Rozdíly oproti `.env`

| **Vlastnost**               | **Soubor `.env`**                                                                                    | **Dynamicky konfigurované proměnné prostředí a citlivé údaje**                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Umístění úložiště**      | Ukládá se v souboru `.env` v kořenovém adresáři projektu                                            | Ukládá se v tabulce `environmentVariables` v databázi                                                                                                      |
| **Metoda načítání**        | Načítá se do `process.env` pomocí nástrojů jako `dotenv` při spuštění aplikace                     | Dynamicky se načítá a při spuštění aplikace se načítá do `app.environment`                                                                                   |
| **Metoda úpravy**   | Vyžaduje přímou úpravu souboru a pro projevení změn je nutné restartovat aplikaci | Podporuje úpravy za běhu, změny se projeví ihned po opětovném načtení konfigurace aplikace                                                    |
| **Izolace prostředí** | Každé prostředí (vývoj, testování, produkce) vyžaduje samostatnou údržbu souborů `.env`  | Každé prostředí (vývoj, testování, produkce) vyžaduje samostatnou údržbu dat v tabulce `environmentVariables`                                   |
| **Použitelné scénáře**  | Vhodné pro pevné statické konfigurace, jako jsou informace o hlavní databázi pro aplikaci    | Vhodné pro dynamické konfigurace, které vyžadují časté úpravy nebo jsou vázány na obchodní logiku, jako jsou externí databáze, informace o úložišti souborů atd. |

## Instalace

Jedná se o vestavěný plugin, takže není nutná samostatná instalace.

## Použití

### Opětovné použití konfiguračních dat

Například, pokud více míst v pracovním postupu vyžaduje e-mailové uzly a všechna potřebují konfiguraci SMTP, pak lze společnou konfiguraci SMTP uložit do proměnných prostředí.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Ukládání citlivých dat

Ukládání konfiguračních informací pro různé externí databáze, klíčů k cloudovému úložišti souborů a podobných dat.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Izolace konfigurace prostředí

V různých prostředích, jako je vývoj, testování a produkce, se používají nezávislé strategie správy konfigurace, aby se zajistilo, že se konfigurace a data jednotlivých prostředí vzájemně neruší. Každé prostředí má svá vlastní nezávislá nastavení, proměnné a zdroje, což zabraňuje konfliktům mezi vývojovým, testovacím a produkčním prostředím a zároveň zajišťuje, že systém funguje podle očekávání v každém prostředí.

Například, konfigurace pro službu úložiště souborů se může lišit mezi vývojovým a produkčním prostředím, jak je uvedeno níže:

Vývojové prostředí

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Produkční prostředí

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Správa proměnných prostředí

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Přidání proměnných prostředí

- Podporuje přidávání jednotlivě i hromadně
- Podporuje ukládání v prostém textu i šifrovaně

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Přidání jednotlivě

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Hromadné přidání

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Důležité poznámky

### Restartování aplikace

Po úpravě nebo odstranění proměnných prostředí se nahoře zobrazí výzva k restartování aplikace. Změny proměnných prostředí se projeví až po restartování aplikace.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Šifrované úložiště

Šifrovaná data pro proměnné prostředí používají symetrické šifrování AES. PRIVATE KEY pro šifrování a dešifrování je uložen v úložišti. Uchovávejte jej prosím v bezpečí; v případě ztráty nebo přepsání nelze šifrovaná data dešifrovat.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Aktuálně podporované pluginy pro proměnné prostředí

### Akce: Vlastní požadavek

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autentizace: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autentizace: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autentizace: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autentizace: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autentizace: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autentizace: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Zdroj dat: Externí MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Zdroj dat: Externí MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Zdroj dat: Externí Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Zdroj dat: Externí PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Zdroj dat: Externí SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Zdroj dat: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Zdroj dat: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Úložiště souborů: Lokální

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Úložiště souborů: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Úložiště souborů: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Úložiště souborů: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Úložiště souborů: S3 Pro

Nepřizpůsobeno

### Mapa: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Mapa: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Nastavení e-mailu

Nepřizpůsobeno

### Oznámení: E-mail

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Veřejné formuláře

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Systémová nastavení

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Ověření: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Ověření: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Pracovní postup

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)