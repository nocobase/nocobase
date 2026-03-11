:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/solution/ticket-system/installation).
:::

# Jak nainstalovat

> Současná verze využívá pro nasazení formu **zálohování a obnovy**. V budoucích verzích můžeme přejít na formu **přírůstkové migrace**, aby bylo snazší integrovat řešení do vašich stávajících systémů.

Abychom vám umožnili rychle a hladce nasadit řešení tiketů do vašeho vlastního prostředí NocoBase, nabízíme dva způsoby obnovy. Vyberte si ten, který nejlépe vyhovuje vaší verzi uživatele a technickému zázemí.

Než začnete, ujistěte se, že:

- Již máte základní provozní prostředí NocoBase. Ohledně instalace hlavního systému se prosím podívejte na podrobnou [oficiální instalační dokumentaci](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- Verze NocoBase je **2.0.0-beta.5 a vyšší**
- Již jste si stáhli příslušné soubory systému tiketů:
  - **Soubor zálohy**: [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) – vhodný pro metodu jedna
  - **SQL soubor**: [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) – vhodný pro metodu dvě

**Důležité upozornění**:
- Toto řešení je vytvořeno na databázi **PostgreSQL 16**, ujistěte se, že vaše prostředí používá PostgreSQL 16.
- **DB_UNDERSCORED nesmí být true**: Zkontrolujte prosím svůj soubor `docker-compose.yml` a ujistěte se, že proměnná prostředí `DB_UNDERSCORED` není nastavena na `true`, jinak dojde ke konfliktu se zálohou řešení a selhání obnovy.

---

## Metoda jedna: Obnova pomocí Správce záloh (doporučeno pro uživatele verzí Professional/Enterprise)

Tento způsob využívá k obnově jedním kliknutím vestavěný plugin NocoBase „[Správce záloh](https://docs-cn.nocobase.com/handbook/backups)“ (verze Professional/Enterprise), což je nejjednodušší operace. Má však určité požadavky na prostředí a verzi uživatele.

### Klíčové vlastnosti

* **Výhody**:
  1. **Pohodlné ovládání**: Lze dokončit v uživatelském rozhraní (UI), přičemž lze kompletně obnovit všechny konfigurace včetně pluginů.
  2. **Kompletní obnova**: **Dokáže obnovit všechny systémové soubory**, včetně souborů šablon tisku, souborů nahraných v polích typu soubor v tabulkách atd., což zajišťuje úplnou funkčnost.
* **Omezení**:
  1. **Omezeno na verze Professional/Enterprise**: „Správce záloh“ je plugin na podnikové úrovni, který je k dispozici pouze uživatelům verzí Professional/Enterprise.
  2. **Přísné požadavky na prostředí**: Vyžaduje, aby vaše databázové prostředí (verze, nastavení citlivosti na velikost písmen atd.) bylo vysoce kompatibilní s prostředím, ve kterém jsme zálohu vytvořili.
  3. **Závislost na pluginech**: Pokud řešení obsahuje komerční pluginy, které ve vašem lokálním prostředí nemáte, obnova selže.

### Provozní kroky

**Krok 1: [Důrazně doporučeno] Spusťte aplikaci pomocí obrazu `full`**

Aby se předešlo selhání obnovy kvůli chybějícím databázovým klientům, důrazně doporučujeme použít verzi Docker obrazu `full`. Obsahuje všechny potřebné doprovodné programy, takže nemusíte provádět žádnou další konfiguraci.

Příklad příkazu pro stažení obrazu:

```bash
docker pull nocobase/nocobase:beta-full
```

Poté použijte tento obraz ke spuštění vaší služby NocoBase.

> **Poznámka**: Pokud nepoužijete obraz `full`, možná budete muset v kontejneru ručně nainstalovat databázového klienta `pg_dump`, což je proces zdlouhavý a nestabilní.

**Krok 2: Zapněte plugin „Správce záloh“**

1. Přihlaste se do svého systému NocoBase.
2. Přejděte do **`Správa pluginů`**.
3. Najděte a povolte plugin **`Správce záloh`**.

**Krok 3: Obnova z lokálního souboru zálohy**

1. Po povolení pluginu obnovte stránku.
2. V levém menu přejděte na **`Správa systému`** -> **`Správce záloh`**.
3. Klikněte na tlačítko **`Obnovit z lokální zálohy`** v pravém horním rohu.
4. Přetáhněte stažený soubor zálohy do oblasti pro nahrávání.
5. Klikněte na **`Odeslat`** a trpělivě počkejte, až systém dokončí obnovu. Tento proces může trvat od několika sekund do několika minut.

### Poznámky

* **Kompatibilita databáze**: Toto je nejdůležitější bod této metody. **Verze, znaková sada a nastavení citlivosti na velikost písmen** vaší databáze PostgreSQL musí odpovídat zdrojovému souboru zálohy. Zejména název `schema` musí být shodný.
* **Shoda komerčních pluginů**: Ujistěte se, že již vlastníte a máte zapnuté všechny komerční pluginy vyžadované řešením, jinak bude obnova přerušena.

---

## Metoda dvě: Přímý import SQL souboru (univerzální, vhodnější pro komunitní verzi)

Tento způsob obnovuje data přímou operací s databází, čímž obchází plugin „Správce záloh“, a proto nemá žádná omezení pro verze Professional/Enterprise.

### Klíčové vlastnosti

* **Výhody**:
  1. **Bez omezení verze**: Vhodné pro všechny uživatele NocoBase, včetně komunitní verze.
  2. **Vysoká kompatibilita**: Nezávisí na nástroji `dump` v aplikaci; funguje, dokud se lze připojit k databázi.
  3. **Vysoká odolnost proti chybám**: Pokud řešení obsahuje komerční pluginy, které nemáte, související funkce nebudou povoleny, ale neovlivní to běžné používání ostatních funkcí a aplikace se úspěšně spustí.
* **Omezení**:
  1. **Vyžaduje znalost práce s databází**: Vyžaduje, aby uživatel měl základní dovednosti pro práci s databází, například jak spustit soubor `.sql`.
  2. **Ztráta systémových souborů**: **Tímto způsobem dojde ke ztrátě všech systémových souborů**, včetně souborů šablon tisku, souborů nahraných v polích typu soubor v tabulkách atd.

### Provozní kroky

**Krok 1: Příprava čisté databáze**

Připravte si zcela novou, prázdnou databázi pro data, která se chystáte importovat.

**Krok 2: Import souboru `.sql` do databáze**

Získejte stažený databázový soubor (obvykle ve formátu `.sql`) a importujte jeho obsah do databáze připravené v předchozím kroku. Existuje několik způsobů provedení v závislosti na vašem prostředí:

* **Možnost A: Přes příkazový řádek serveru (příklad s Dockerem)**
  Pokud k instalaci NocoBase a databáze používáte Docker, můžete soubor `.sql` nahrát na server a poté k provedení importu použít příkaz `docker exec`. Předpokládejme, že váš kontejner PostgreSQL se jmenuje `my-nocobase-db` a soubor se jmenuje `ticket_system.sql`:

  ```bash
  # Zkopírujte sql soubor do kontejneru
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Vstupte do kontejneru a proveďte příkaz pro import
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Možnost B: Přes vzdáleného databázového klienta**
  Pokud má vaše databáze otevřený port, můžete k připojení k databázi použít jakéhokoli grafického databázového klienta (jako DBeaver, Navicat, pgAdmin atd.), otevřít nové okno dotazu, vložit do něj celý obsah souboru `.sql` a spustit jej.

**Krok 3: Připojení k databázi a spuštění aplikace**

Nakonfigurujte spouštěcí parametry NocoBase (například proměnné prostředí `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` atd.) tak, aby ukazovaly na databázi, do které jste právě importovali data. Poté normálně spusťte službu NocoBase.

### Poznámky

* **Oprávnění k databázi**: Tato metoda vyžaduje, abyste měli účet a heslo s oprávněním přímo manipulovat s databází.
* **Stav pluginů**: Po úspěšném importu sice data komerčních pluginů v systému existují, ale pokud nemáte lokálně nainstalované a povolené odpovídající pluginy, související funkce se nebudou zobrazovat ani nebudou použitelné, což však nezpůsobí pád aplikace.

---

## Souhrn a porovnání

| Vlastnost | Metoda jedna: Správce záloh | Metoda dvě: Přímý import SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Vhodní uživatelé** | Uživatelé verzí **Professional/Enterprise** | **Všichni uživatelé** (včetně komunitní verze) |
| **Jednoduchost ovládání** | ⭐⭐⭐⭐⭐ (Velmi jednoduché, UI operace) | ⭐⭐⭐ (Vyžaduje základní znalost databází) |
| **Požadavky na prostředí** | **Přísné**, databáze, verze systému atd. musí být vysoce kompatibilní | **Obecné**, vyžaduje kompatibilitu databáze |
| **Závislost na pluginech** | **Silná závislost**, při obnově se kontrolují pluginy, chybějící plugin způsobí **selhání obnovy**. | **Funkce silně závisí na pluginech**. Data lze importovat nezávisle, systém má základní funkce. Pokud však chybí odpovídající pluginy, související funkce budou **zcela nepoužitelné**. |
| **Systémové soubory** | **Plně zachovány** (šablony tisku, nahrané soubory atd.) | **Budou ztraceny** (šablony tisku, nahrané soubory atd.) |
| **Doporučený scénář** | Podnikoví uživatelé s kontrolovaným a konzistentním prostředím, kteří potřebují plnou funkčnost | Chybějící některé pluginy, snaha o vysokou kompatibilitu a flexibilitu, uživatelé jiných než Pro/Enterprise verzí, akceptují absenci funkcí souborů |

Doufáme, že vám tento návod pomůže úspěšně nasadit systém tiketů. Pokud během procesu narazíte na jakékoli problémy, neváhejte nás kontaktovat!