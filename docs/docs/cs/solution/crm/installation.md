:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/solution/crm/installation).
:::

# Jak nainstalovat

> Aktuální verze využívá pro nasazení formu **zálohování a obnovy**. V budoucích verzích můžeme přejít na formu **přírůstkové migrace**, aby bylo snazší integrovat řešení do vašich stávajících systémů.

Abychom vám umožnili rychle a hladce nasadit řešení CRM 2.0 do vašeho vlastního prostředí NocoBase, nabízíme dva způsoby obnovy. Vyberte si ten, který nejlépe odpovídá vaší verzi uživatele a technickému zázemí.

Než začnete, ujistěte se, že:

- Již máte základní běžící prostředí NocoBase. Ohledně instalace hlavního systému se prosím podívejte na podrobnější [oficiální instalační dokumentaci](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Verze NocoBase je **v2.1.0-beta.2 a vyšší**.
- Již jste si stáhli příslušné soubory systému CRM:
  - **Záložní soubor**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) – vhodný pro Metodu 1
  - **SQL soubor**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) – vhodný pro Metodu 2

**Důležité upozornění**:
- Toto řešení je vytvořeno na databázi **PostgreSQL 16**, ujistěte se, že vaše prostředí používá PostgreSQL 16.
- **DB_UNDERSCORED nesmí být true**: Zkontrolujte prosím svůj soubor `docker-compose.yml` a ujistěte se, že proměnná prostředí `DB_UNDERSCORED` není nastavena na `true`, jinak dojde ke konfliktu se zálohou řešení a obnova selže.

---

## Metoda 1: Obnova pomocí Správce záloh (doporučeno pro uživatele verzí Pro/Enterprise)

Tento způsob využívá vestavěný plugin NocoBase "[Správce záloh](https://docs-cn.nocobase.com/handbook/backups)" (verze Pro/Enterprise) pro obnovu jedním kliknutím, což je nejjednodušší operace. Má však určité požadavky na prostředí a verzi uživatele.

### Klíčové vlastnosti

* **Výhody**:
  1. **Pohodlné ovládání**: Vše lze dokončit v rozhraní UI, lze kompletně obnovit všechny konfigurace včetně pluginů.
  2. **Kompletní obnova**: **Umožňuje obnovit všechny systémové soubory**, včetně souborů šablon tisku, souborů nahraných prostřednictvím polí typu soubor v kolekcích atd., což zajišťuje plnou integritu funkcí.
* **Omezení**:
  1. **Pouze pro verze Pro/Enterprise**: "Správce záloh" je plugin na podnikové úrovni, který je dostupný pouze uživatelům verzí Pro/Enterprise.
  2. **Přísné požadavky na prostředí**: Vyžaduje, aby vaše databázové prostředí (verze, nastavení citlivosti na velikost písmen atd.) bylo vysoce kompatibilní s prostředím, ve kterém jsme zálohu vytvořili.
  3. **Závislost na pluginech**: Pokud řešení obsahuje komerční pluginy, které ve vašem lokálním prostředí chybí, obnova selže.

### Postup

**Krok 1: 【Důrazně doporučeno】 Spusťte aplikaci pomocí obrazu `full`**

Abyste se vyhnuli selhání obnovy kvůli chybějícímu databázovému klientovi, důrazně doporučujeme používat Docker obraz ve verzi `full`. Obsahuje všechny potřebné doprovodné programy, takže nemusíte provádět žádnou další konfiguraci.

Příklad příkazu pro stažení obrazu:

```bash
docker pull nocobase/nocobase:beta-full
```

Poté pomocí tohoto obrazu spusťte svou službu NocoBase.

> **Poznámka**: Pokud nepoužijete obraz `full`, možná budete muset uvnitř kontejneru ručně nainstalovat databázového klienta `pg_dump`, což je zdlouhavý a nestabilní proces.

**Krok 2: Zapněte plugin "Správce záloh"**

1. Přihlaste se do svého systému NocoBase.
2. Přejděte do **`Správa pluginů`**.
3. Najděte a povolte plugin **`Správce záloh`**.

**Krok 3: Obnova z lokálního záložního souboru**

1. Po povolení pluginu obnovte stránku.
2. V levém menu přejděte na **`Správa systému`** -> **`Správce záloh`**.
3. Klikněte na tlačítko **`Obnovit z lokální zálohy`** v pravém horním rohu.
4. Přetáhněte stažený záložní soubor do oblasti pro nahrávání.
5. Klikněte na **`Odeslat`** a trpělivě počkejte, až systém dokončí obnovu; tento proces může trvat od několika desítek sekund až po několik minut.

### Poznámky

* **Kompatibilita databáze**: Toto je nejdůležitější bod této metody. **Verze, znaková sada a nastavení citlivosti na velikost písmen** vaší databáze PostgreSQL musí odpovídat zdrojovému souboru zálohy. Zejména název `schema` musí být shodný.
* **Shoda komerčních pluginů**: Ujistěte se, že vlastníte a máte zapnuté všechny komerční pluginy vyžadované řešením, jinak bude obnova přerušena.

---

## Metoda 2: Přímý import SQL souboru (univerzální, vhodnější pro komunitní verzi)

Tento způsob obnovuje data přímou operací s databází, čímž obchází plugin "Správce záloh", a proto nemá žádná omezení pro verze Pro/Enterprise.

### Klíčové vlastnosti

* **Výhody**:
  1. **Bez omezení verzí**: Vhodné pro všechny uživatele NocoBase, včetně komunitní verze.
  2. **Vysoká kompatibilita**: Nezávisí na nástroji `dump` uvnitř aplikace; pokud se lze připojit k databázi, lze operaci provést.
  3. **Vysoká tolerance chyb**: Pokud řešení obsahuje komerční pluginy, které nemáte, související funkce nebudou povoleny, ale neovlivní to běžné používání ostatních funkcí a aplikaci lze úspěšně spustit.
* **Omezení**:
  1. **Vyžaduje schopnost práce s databází**: Vyžaduje, aby uživatel měl základní schopnosti práce s databází, například jak spustit `.sql` soubor.
  2. **Ztráta systémových souborů**: **Tato metoda způsobí ztrátu všech systémových souborů**, včetně souborů šablon tisku, souborů nahraných prostřednictvím polí typu soubor v kolekcích atd.

### Postup

**Krok 1: Připravte čistou databázi**

Připravte si zcela novou, prázdnou databázi pro data, která se chystáte importovat.

**Krok 2: Importujte `.sql` soubor do databáze**

Získejte stažený databázový soubor (obvykle ve formátu `.sql`) a importujte jeho obsah do databáze, kterou jste si připravili v předchozím kroku. Existuje několik způsobů provedení v závislosti na vašem prostředí:

* **Varianta A: Přes příkazový řádek serveru (příklad s Dockerem)**
  Pokud k instalaci NocoBase a databáze používáte Docker, můžete `.sql` soubor nahrát na server a poté k provedení importu použít příkaz `docker exec`. Předpokládejme, že váš kontejner PostgreSQL se jmenuje `my-nocobase-db` a název souboru je `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Zkopírujte sql soubor do kontejneru
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Vstupte do kontejneru a proveďte příkaz pro import
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Varianta B: Přes vzdáleného databázového klienta (Navicat atd.)**
  Pokud má vaše databáze otevřený port, můžete k připojení k databázi použít jakéhokoli grafického databázového klienta (jako Navicat, DBeaver, pgAdmin atd.) a poté:
  1. Klikněte pravým tlačítkem na cílovou databázi.
  2. Vyberte "Spustit SQL soubor" nebo "Provést SQL skript".
  3. Vyberte stažený `.sql` soubor a spusťte jej.

**Krok 3: Připojte databázi a spusťte aplikaci**

Nakonfigurujte spouštěcí parametry NocoBase (jako proměnné prostředí `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` atd.) tak, aby směřovaly na databázi, do které jste právě importovali data. Poté normálně spusťte službu NocoBase.

### Poznámky

* **Oprávnění k databázi**: Tato metoda vyžaduje, abyste měli účet a heslo s oprávněním přímo manipulovat s databází.
* **Stav pluginů**: Po úspěšném importu sice data komerčních pluginů obsažených v systému existují, ale pokud nemáte lokálně nainstalovány a povoleny odpovídající pluginy, související funkce nebudou zobrazeny ani použitelné, což však nezpůsobí pád aplikace.

---

## Shrnutí a porovnání

| Vlastnost | Metoda 1: Správce záloh | Metoda 2: Přímý import SQL |
| :-------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------