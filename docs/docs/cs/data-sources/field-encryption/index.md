---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Šifrování

## Úvod

Některá citlivá obchodní data, jako jsou telefonní čísla zákazníků, e-mailové adresy nebo čísla karet, lze šifrovat. Po zašifrování jsou tato data uložena do databáze ve formě šifrovaného textu (ciphertextu).

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Způsob šifrování

:::warning
Plugin automaticky vygeneruje `aplikační klíč`, který je uložen v adresáři `/storage/apps/main/encryption-field-keys`.

Soubor `aplikačního klíče` je pojmenován podle ID klíče s příponou `.key`. Prosíme, neměňte název souboru.

Uchovávejte soubor `aplikačního klíče` v bezpečí. Pokud jej ztratíte, zašifrovaná data nebude možné dešifrovat.

Pokud je plugin povolen pro podaplikaci, klíč se ve výchozím nastavení ukládá do adresáře `/storage/apps/${název_podaplikace}/encryption-field-keys`.
:::

### Jak to funguje

Používá se šifrování obálkou (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proces vytváření klíčů
1. Při prvním vytvoření šifrovaného pole systém automaticky vygeneruje 32bitový `aplikační klíč` a uloží jej do výchozího úložiště v kódování Base64.
2. Pokaždé, když vytvoříte nové šifrované pole, vygeneruje se pro něj náhodný 32bitový `klíč pole`. Ten je poté zašifrován pomocí `aplikačního klíče` a náhodně vygenerovaného 16bitového `šifrovacího vektoru pole` (pomocí šifrovacího algoritmu `AES`) a uložen do pole `options` v tabulce `fields`.

### Proces šifrování pole
1. Pokaždé, když zapisujete data do šifrovaného pole, nejprve se z pole `options` v tabulce `fields` načte zašifrovaný `klíč pole` a `šifrovací vektor pole`.
2. Zašifrovaný `klíč pole` se dešifruje pomocí `aplikačního klíče` a `šifrovacího vektoru pole`. Následně se data zašifrují pomocí `klíče pole` a náhodně vygenerovaného 16bitového `šifrovacího vektoru dat` (pomocí šifrovacího algoritmu `AES`).
3. Data se podepíší pomocí dešifrovaného `klíče pole` (algoritmus `HMAC-SHA256`) a převedou se na řetězec v kódování Base64 (výsledný `datový podpis` se následně používá pro vyhledávání dat).
4. 16bitový `šifrovací vektor dat` a zašifrovaný `šifrovaný text dat` se binárně spojí a převedou na řetězec v kódování Base64.
5. Řetězec `datového podpisu` kódovaný v Base64 a spojený řetězec `šifrovaného textu dat` kódovaný v Base64 se spojí oddělovačem `.`.
6. Výsledný spojený řetězec se uloží do databáze.

## Proměnné prostředí

Pokud chcete zadat vlastní `aplikační klíč`, nastavte proměnnou prostředí `ENCRYPTION_FIELD_KEY_PATH`. Plugin načte soubor z této cesty jako `aplikační klíč`.

**Požadavky na formát souboru `aplikačního klíče`:**
1. Přípona souboru musí být `.key`.
2. Název souboru bude použit jako ID klíče; doporučuje se použít UUID pro zajištění jedinečnosti.
3. Obsah souboru musí být 32bitová binární data kódovaná v Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Konfigurace pole

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Dopad šifrování na filtrování

Šifrovaná pole podporují pouze následující operace: rovná se, nerovná se, existuje, neexistuje.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Pracovní postup filtrování dat:
1. Načtěte `klíč pole` šifrovaného pole a dešifrujte jej pomocí `aplikačního klíče`.
2. Pomocí `klíče pole` podepište uživatelem zadaný vyhledávací text (algoritmus `HMAC-SHA256`).
3. Spojte podpis s oddělovačem `.` a proveďte dotaz na shodu prefixu v databázi pro šifrované pole.

## Rotace klíčů

:::warning
Před použitím příkazu `nocobase key-rotation` se ujistěte, že aplikace načetla tento plugin.
:::

Pokud migrujete aplikaci do nového prostředí a nechcete nadále používat stejný klíč jako ve starém prostředí, můžete `aplikační klíč` nahradit pomocí příkazu `nocobase key-rotation`.

Spuštění příkazu pro rotaci klíčů vyžaduje zadání `aplikačního klíče` starého prostředí. Po spuštění příkazu se vygeneruje nový `aplikační klíč`, který nahradí starý. Nový `aplikační klíč` se uloží do výchozího adresáře v kódování Base64.

```bash
# --key-path určuje soubor aplikačního klíče starého prostředí, který odpovídá zašifrovaným datům v databázi.
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Pokud nahrazujete `aplikační klíč` podaplikace, je třeba přidat parametr `--app-name` a zadat `název` podaplikace.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```