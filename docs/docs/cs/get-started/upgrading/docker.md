:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Upgrade instalace Dockeru

:::warning Příprava před upgradem

- Nezapomeňte si nejprve zálohovat databázi.

:::

## 1. Přejděte do adresáře, kde se nachází soubor docker-compose.yml

Například

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Aktualizujte číslo verze image

:::tip O číslech verzí

- Verze s aliasem, jako jsou `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, obvykle není třeba měnit.
- Číselné verze, jako jsou `1.7.14`, `1.7.14-full`, je třeba změnit na cílové číslo verze.
- Podporovány jsou pouze upgrady; downgrady nejsou podporovány!!!
- V produkčním prostředí doporučujeme nastavit konkrétní číselnou verzi, abyste předešli neúmyslným automatickým upgradům. [Zobrazit všechny verze](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Doporučujeme použít image z Alibaba Cloud (pro stabilnější síť v Číně)
    image: nocobase/nocobase:1.7.14-full
    # Můžete také použít verzi s aliasem (může se automaticky aktualizovat, v produkčním prostředí používejte s opatrností)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (v Číně může být pomalý/selhat)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Restartujte kontejner

```bash
# Stáhněte nejnovější image
docker compose pull app

# Znovu vytvořte kontejner
docker compose up -d app

# Zkontrolujte stav procesu aplikace
docker compose logs -f app
```

## 4. Upgrade pluginů třetích stran

Viz [Instalace a upgrade pluginů](../install-upgrade-plugins.mdx)

## 5. Pokyny pro vrácení zpět (rollback)

NocoBase nepodporuje downgrade. Pokud potřebujete provést vrácení zpět, obnovte zálohu databáze z doby před upgradem a změňte verzi image zpět na původní verzi.

## 6. Často kladené otázky (FAQ)

**Q: Pomalé nebo neúspěšné stahování image**

O: To je často způsobeno problémy se sítí. Můžete zkusit nakonfigurovat Docker mirror pro urychlení stahování nebo to jednoduše zkusit později.

**Q: Verze se nezměnila**

O: Potvrďte, že jste změnili `image` na nové číslo verze a úspěšně jste spustili `docker compose pull app` a `up -d app`.

**Q: Selhalo stahování nebo aktualizace komerčního pluginu**

O: U komerčních pluginů prosím ověřte licenční klíč v systému a poté restartujte Docker kontejner. Podrobnosti naleznete v [Průvodci aktivací komerční licence NocoBase](https://www.nocobase.com/blog/nocobase-commercial-license-activation-guide).