:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/get-started/translations).
:::

# Příspěvek k překladu

Výchozím jazykem NocoBase je angličtina. V současné době hlavní aplikace podporuje angličtinu, italštinu, nizozemštinu, zjednodušenou čínštinu a japonštinu. Srdečně vás zveme k přispění překlady do dalších jazyků, aby si uživatelé po celém světě mohli užít ještě pohodlnější práci s NocoBase.

---

## I. Systémová lokalizace

### 1. Překlad systémového rozhraní a pluginů

#### 1.1 Rozsah překladu
Vztahuje se pouze na lokalizaci systémového rozhraní a pluginů NocoBase, nezahrnuje jiný vlastní obsah (jako jsou datové tabulky nebo Markdown bloky).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Přehled lokalizačního obsahu
NocoBase používá ke správě lokalizačního obsahu Git. Hlavní repozitář je:
https://github.com/nocobase/nocobase/tree/main/locales

Každý jazyk je reprezentován souborem JSON pojmenovaným podle kódu jazyka (např. de-DE.json, fr-FR.json). Struktura souboru je organizována podle modulů pluginů a k ukládání překladů používá páry klíč-hodnota. Například:

```json
{
  // Klientský plugin
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...další páry klíč-hodnota
  },
  "@nocobase/plugin-acl": {
    // Páry klíč-hodnota pro tento plugin
  }
  // ...další moduly pluginů
}
```

Při překladu jej prosím postupně převeďte na strukturu podobnou následující:

```json
{
  // Klientský plugin
  "@nocobase/client": {
    "(Fields only)": "(Pouze pole - přeloženo)",
    "12 hour": "12 hodin",
    "24 hour": "24 hodin"
    // ...další páry klíč-hodnota
  },
  "@nocobase/plugin-acl": {
    // Páry klíč-hodnota pro tento plugin
  }
  // ...další moduly pluginů
}
```

#### 1.3 Testování a synchronizace překladu
- Po dokončení překladu otestujte a ověřte, zda se všechny texty zobrazují správně.
Vydali jsme také plugin pro ověřování překladů – v obchodě s pluginy vyhledejte `Locale tester`.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Po instalaci zkopírujte obsah JSON z příslušného lokalizačního souboru v git repozitáři, vložte jej dovnitř a kliknutím na OK ověřte, zda je obsah překladu funkční.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Po odeslání systémové skripty automaticky synchronizují lokalizační obsah do repozitáře kódu.

#### 1.4 Lokalizační plugin NocoBase 2.0

> **Poznámka:** Tato část je ve vývoji. Lokalizační plugin pro NocoBase 2.0 se v některých ohledech liší od verze 1.x. Podrobnosti budou poskytnuty v budoucí aktualizaci.

<!-- TODO: Přidat podrobnosti o rozdílech lokalizačního pluginu 2.0 -->

## II. Lokalizace dokumentace (NocoBase 2.0)

Dokumentace pro NocoBase 2.0 je spravována v nové struktuře. Zdrojové soubory dokumentace se nacházejí v hlavním repozitáři NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Struktura dokumentace

Dokumentace používá [Rspress](https://rspress.dev/) jako generátor statických stránek a podporuje 22 jazyků. Struktura je organizována následovně:

```
docs/
├── docs/
│   ├── en/                    # Angličtina (zdrojový jazyk)
│   ├── cn/                    # Zjednodušená čínština
│   ├── ja/                    # Japonština
│   ├── ko/                    # Korejština
│   ├── de/                    # Němčina
│   ├── fr/                    # Francouzština
│   ├── es/                    # Španělština
│   ├── pt/                    # Portugalština
│   ├── ru/                    # Ruština
│   ├── it/                    # Italština
│   ├── tr/                    # Turečtina
│   ├── uk/                    # Ukrajinština
│   ├── vi/                    # Vietnamština
│   ├── id/                    # Indonéština
│   ├── th/                    # Thajština
│   ├── pl/                    # Polština
│   ├── nl/                    # Nizozemština
│   ├── cs/                    # Čeština
│   ├── ar/                    # Arabština
│   ├── he/                    # Hebrejština
│   ├── hi/                    # Hindština
│   ├── sv/                    # Švédština
│   └── public/                # Sdílená aktiva (obrázky atd.)
├── theme/                     # Vlastní šablona
├── rspress.config.ts          # Konfigurace Rspress
└── package.json
```

### 2.2 Pracovní postup překladu

1. **Synchronizace s anglickým zdrojem**: Všechny překlady by měly vycházet z anglické dokumentace (`docs/en/`). Při aktualizaci anglické dokumentace by měly být odpovídajícím způsobem aktualizovány i překlady.

2. **Strategie větví**:
   - Jako referenci pro nejnovější anglický obsah použijte větev `develop` nebo `next`
   - Vytvořte svou překladovou větev z cílové větve

3. **Struktura souborů**: Adresář každého jazyka by měl zrcadlit strukturu anglického adresáře. Například:
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 Jak přispět k překladům

1. Forkněte repozitář: https://github.com/nocobase/nocobase
2. Naklonujte svůj fork a přepněte se do větve `develop` nebo `next`
3. Přejděte do adresáře `docs/docs/`
4. Najděte adresář jazyka, do kterého chcete přispět (např. `ja/` pro japonštinu)
5. Přeložte soubory markdown při zachování stejné struktury souborů jako v anglické verzi
6. Otestujte své změny lokálně:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Odešlete Pull Request do hlavního repozitáře

### 2.4 Pokyny pro překlad

- **Zachovejte konzistentní formátování**: Udržujte stejnou strukturu markdown, nadpisy, bloky kódu a odkazy jako ve zdroji
- **Zachovejte frontmatter**: Ponechte jakýkoli YAML frontmatter v horní části souborů beze změny, pokud neobsahuje obsah k překladu
- **Odkazy na obrázky**: Používejte stejné cesty k obrázkům z `docs/public/` – obrázky jsou sdíleny mezi všemi jazyky
- **Interní odkazy**: Aktualizujte interní odkazy tak, aby ukazovaly na správnou jazykovou cestu
- **Příklady kódu**: Obecně by se příklady kódu neměly překládat, ale komentáře v kódu přeložit lze

### 2.5 Konfigurace navigace

Navigační struktura pro každý jazyk je definována v souborech `_nav.json` a `_meta.json` v adresáři každého jazyka. Při přidávání nových stránek nebo sekcí nezapomeňte tyto konfigurační soubory aktualizovat.

## III. Lokalizace webu

Stránky webu a veškerý obsah jsou uloženy v:
https://github.com/nocobase/website

### 3.1 Začínáme a referenční zdroje

Při přidávání nového jazyka se prosím podívejte na existující jazykové stránky:
- Angličtina: https://github.com/nocobase/website/tree/main/src/pages/en
- Čínština: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japonština: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagram lokalizace webu](https://static-docs.nocobase.com/20250319121600.png)

Globální úpravy stylů se nacházejí v:
- Angličtina: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Čínština: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japonština: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagram globálních stylů](https://static-docs.nocobase.com/20250319121501.png)

Lokalizace globálních komponent webu je k dispozici na:
https://github.com/nocobase/website/tree/main/src/components

![Diagram komponent webu](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Struktura obsahu a metoda lokalizace

Používáme smíšený přístup ke správě obsahu. Obsah a zdroje v angličtině, čínštině a japonštině jsou pravidelně synchronizovány z CMS systému a přepisovány, zatímco ostatní jazyky lze upravovat přímo v lokálních souborech. Lokální obsah je uložen v adresáři `content` a organizován následovně:

```
/content
  /articles        # Články blogu
    /article-slug
      index.md     # Anglický obsah (výchozí)
      index.cn.md  # Čínský obsah
      index.ja.md  # Japonský obsah
      metadata.json # Metadata a další lokalizační vlastnosti
  /tutorials       # Tutoriály
  /releases        # Informace o vydání
  /pages           # Některé statické stránky
  /categories      # Informace o kategoriích
    /article-categories.json  # Seznam kategorií článků
    /category-slug            # Podrobnosti o jednotlivé kategorii
      /category.json
  /tags            # Informace o štítcích
    /article-tags.json        # Seznam štítků článků
    /release-tags.json        # Seznam štítků vydání
    /tag-slug                 # Podrobnosti o jednotlivém štítku
      /tag.json
  /help-center     # Obsah centra nápovědy
    /help-center-tree.json    # Navigační struktura centra nápovědy
  ....
```

### 3.3 Pokyny pro překlad obsahu

- O překladu obsahu v Markdown

1. Vytvořte nový jazykový soubor na základě výchozího souboru (např. `index.md` na `index.fr.md`)
2. Přidejte lokalizované vlastnosti do příslušných polí v souboru JSON
3. Zachovejte konzistenci struktury souborů, odkazů a odkazů na obrázky

- Překlad obsahu v JSON
Mnoho metadat obsahu je uloženo v souborech JSON, které obvykle obsahují vícejazyčná pole:

```json
{
  "id": 123,
  "title": "English Title",       // Anglický název (výchozí)
  "title_cn": "中文标题",          // Čínský název
  "title_ja": "日本語タイトル",    // Japonský název
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL cesta (obvykle se nepřekládá)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Poznámky k překladu:**

1. **Konvence pojmenování polí**: Překladová pole obvykle používají formát `{původní_pole}_{kód_jazyka}`
   - Například: title_fr (francouzský název), description_de (německý popis)

2. **Při přidávání nového jazyka**:
   - Přidejte verzi s příslušnou jazykovou příponou pro každé pole, které vyžaduje překlad
   - Neměňte původní hodnoty polí (jako title, description atd.), protože slouží jako obsah pro výchozí jazyk (angličtinu)

3. **Mechanismus synchronizace CMS**:
   - Systém CMS pravidelně aktualizuje anglický, čínský a japonský obsah
   - Systém bude aktualizovat/přepisovat pouze obsah pro tyto tři jazyky (některé vlastnosti v JSON) a **neodstraní** jazyková pole přidaná jinými přispěvateli
   - Například: pokud jste přidali francouzský překlad (title_fr), synchronizace CMS toto pole neovlivní


### 3.4 Konfigurace podpory pro nový jazyk

Chcete-li přidat podporu pro nový jazyk, musíte upravit konfiguraci `SUPPORTED_LANGUAGES` v souboru `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Příklad přidání nového jazyka:
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 Soubory rozvržení a styly

Každý jazyk potřebuje odpovídající soubory rozvržení:

1. Vytvořte nový soubor rozvržení (např. pro francouzštinu vytvořte `src/layouts/BaseFR.astro`)
2. Můžete zkopírovat existující soubor rozvržení (například `BaseEN.astro`) a přeložit jej
3. Soubor rozvržení obsahuje překlady globálních prvků, jako jsou navigační menu, zápatí atd.
4. Nezapomeňte aktualizovat konfiguraci přepínače jazyků, aby správně přepínal na nově přidaný jazyk

### 3.6 Vytváření adresářů jazykových stránek

Vytvořte nezávislé adresáře stránek pro nový jazyk:

1. V adresáři `src` vytvořte složku pojmenovanou kódem jazyka (např. `src/fr/`)
2. Zkopírujte strukturu stránek z jiných jazykových adresářů (např. `src/en/`)
3. Aktualizujte obsah stránek, přeložte názvy, popisy a text do cílového jazyka
4. Zajistěte, aby stránky používaly správnou komponentu rozvržení (např. `.layout: '@/layouts/BaseFR.astro'`)

### 3.7 Lokalizace komponent

Některé běžné komponenty také vyžadují překlad:

1. Zkontrolujte komponenty v adresáři `src/components/`
2. Zvláštní pozornost věnujte komponentám s pevným textem (jako jsou navigační lišty, zápatí atd.)
3. Komponenty mohou používat podmíněné vykreslování k zobrazení obsahu v různých jazycích:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 Testování a ověřování

Po dokončení překladu proveďte důkladné testování:

1. Spusťte web lokálně (obvykle pomocí `yarn dev`)
2. Zkontrolujte, jak se všechny stránky zobrazují v novém jazyce
3. Ověřte, zda funkce přepínání jazyků funguje správně
4. Ujistěte se, že všechny odkazy směřují na stránky se správnou jazykovou verzí
5. Zkontrolujte responzivní rozvržení, abyste se ujistili, že přeložený text nenarušuje design stránky

## IV. Jak začít s překladem

Pokud chcete přispět novým překladem do NocoBase, postupujte podle těchto kroků:

| Komponenta | Repozitář | Větev | Poznámky |
|------------|-----------|-------|----------|
| Systémové rozhraní | https://github.com/nocobase/nocobase/tree/main/locales | main | Lokalizační soubory JSON |
| Dokumentace (2.0) | https://github.com/nocobase/nocobase | develop / next | Adresář `docs/docs/<lang>/` |
| Web | https://github.com/nocobase/website | main | Viz sekce III |

Po dokončení překladu odešlete do NocoBase Pull Request. Nové jazyky se objeví v konfiguraci systému, což vám umožní vybrat, které jazyky se mají zobrazovat.

![Diagram povolených jazyků](https://static-docs.nocobase.com/20250319123452.png)

## Dokumentace NocoBase 1.x

Průvodce překladem NocoBase 1.x naleznete na:

https://docs-cn.nocobase.com/welcome/community/translations