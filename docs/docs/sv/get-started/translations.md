:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/get-started/translations).
:::

# Bidra med översättningar

Standardspråket i NocoBase är engelska. För närvarande stöder huvudapplikationen engelska, italienska, nederländska, förenklad kinesiska och japanska. Vi bjuder uppriktigt in er att bidra med översättningar för fler språk, så att användare över hela världen kan få en ännu smidigare NocoBase-upplevelse.

---

## I. Systemlokalisering

### 1. Översättning av systemgränssnitt och plugin

#### 1.1 Översättningens omfattning
Detta gäller endast lokalisering av NocoBase systemgränssnitt och plugin, och omfattar inte annat anpassat innehåll (som datatabeller eller Markdown-block).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Översikt av lokaliseringsinnehåll
NocoBase använder Git för att hantera sitt lokaliseringsinnehåll. Det primära lagringsstället (repository) är:
https://github.com/nocobase/nocobase/tree/main/locales

Varje språk representeras av en JSON-fil namngiven efter dess språkkod (t.ex. de-DE.json, fr-FR.json). Filstrukturen är organiserad efter plugin-moduler och använder nyckel-värdepar för att lagra översättningar. Till exempel:

```json
{
  // Klient-plugin
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...andra nyckel-värdepar
  },
  "@nocobase/plugin-acl": {
    // Nyckel-värdepar för detta plugin
  }
  // ...andra plugin-moduler
}
```

Vid översättning, vänligen konvertera det gradvis till en struktur som liknar följande:

```json
{
  // Klient-plugin
  "@nocobase/client": {
    "(Fields only)": "(Endast fält - översatt)",
    "12 hour": "12 timmar",
    "24 hour": "24 timmar"
    // ...andra nyckel-värdepar
  },
  "@nocobase/plugin-acl": {
    // Nyckel-värdepar för detta plugin
  }
  // ...andra plugin-moduler
}
```

#### 1.3 Testning och synkronisering av översättning
- När ni har slutfört er översättning, vänligen testa och verifiera att all text visas korrekt.
Vi har även släppt ett plugin för översättningsverifiering – sök efter `Locale tester` i plugin-marknaden.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Efter installationen kopierar ni JSON-innehållet från motsvarande lokaliseringsfil i git-lagret, klistrar in det och klickar på OK för att verifiera att översättningen fungerar.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- När det har skickats in kommer systemskript automatiskt att synkronisera lokaliseringsinnehållet till kodlagret.

#### 1.4 Lokaliseringsplugin för NocoBase 2.0

> **Observera:** Detta avsnitt är under utveckling. Lokaliseringspluginet för NocoBase 2.0 skiljer sig något från 1.x-versionen. Detaljer kommer att tillhandahållas i en framtida uppdatering.

<!-- TODO: Lägg till detaljer om skillnader i lokaliseringsplugin för 2.0 -->

## II. Dokumentationslokalisering (NocoBase 2.0)

Dokumentationen för NocoBase 2.0 hanteras i en ny struktur. Källfilerna för dokumentationen finns i NocoBase huvudlager:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Dokumentationsstruktur

Dokumentationen använder [Rspress](https://rspress.dev/) som statisk webbplatsgenerator och stöder 22 språk. Strukturen är organiserad enligt följande:

```
docs/
├── docs/
│   ├── en/                    # Engelska (källspråk)
│   ├── cn/                    # Förenklad kinesiska
│   ├── ja/                    # Japanska
│   ├── ko/                    # Koreanska
│   ├── de/                    # Tyska
│   ├── fr/                    # Franska
│   ├── es/                    # Spanska
│   ├── pt/                    # Portugisiska
│   ├── ru/                    # Ryska
│   ├── it/                    # Italienska
│   ├── tr/                    # Turkiska
│   ├── uk/                    # Ukrainska
│   ├── vi/                    # Vietnamesiska
│   ├── id/                    # Indonesiska
│   ├── th/                    # Thailändska
│   ├── pl/                    # Polska
│   ├── nl/                    # Nederländska
│   ├── cs/                    # Tjeckiska
│   ├── ar/                    # Arabiska
│   ├── he/                    # Hebreiska
│   ├── hi/                    # Hindi
│   ├── sv/                    # Svenska
│   └── public/                # Delade resurser (bilder etc.)
├── theme/                     # Anpassat tema
├── rspress.config.ts          # Rspress-konfiguration
└── package.json
```

### 2.2 Arbetsflöde för översättning

1. **Synkronisera med engelsk källa**: Alla översättningar bör baseras på den engelska dokumentationen (`docs/en/`). När den engelska dokumentationen uppdateras bör översättningarna uppdateras därefter.

2. **Grenstrategi (Branch strategy)**:
   - Använd grenen `develop` eller `next` som referens för det senaste engelska innehållet
   - Skapa er översättningsgren från målgrenen

3. **Filstruktur**: Varje språkkatalog bör spegla den engelska katalogstrukturen. Till exempel:
   ```
   docs/en/get-started/index.md    →    docs/sv/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/sv/api/acl/acl.md
   ```

### 2.3 Bidra med översättningar

1. Forka lagret: https://github.com/nocobase/nocobase
2. Klona er fork och checka ut grenen `develop` eller `next`
3. Navigera till katalogen `docs/docs/`
4. Hitta språkkatalogen ni vill bidra till (t.ex. `sv/` för svenska)
5. Översätt markdown-filerna och behåll samma filstruktur som den engelska versionen
6. Testa era ändringar lokalt:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Skicka en Pull Request till huvudlagret

### 2.4 Riktlinjer för översättning

- **Håll formateringen konsekvent**: Behåll samma markdown-struktur, rubriker, kodblock och länkar som i källan
- **Behåll frontmatter**: Lämna eventuell YAML-frontmatter högst upp i filerna oförändrad, såvida den inte innehåller översättningsbart innehåll
- **Bildreferenser**: Använd samma bildsökvägar från `docs/public/` – bilder delas mellan alla språk
- **Interna länkar**: Uppdatera interna länkar så att de pekar på rätt språksökväg
- **Kodexempel**: Generellt sett bör kodexempel inte översättas, men kommentarer i koden kan översättas

### 2.5 Navigeringskonfiguration

Navigeringsstrukturen för varje språk definieras i filerna `_nav.json` och `_meta.json` i varje språkkatalog. När ni lägger till nya sidor eller avsnitt, se till att uppdatera dessa konfigurationsfiler.

## III. Webbplatslokalisering

Webbplatsens sidor och allt innehåll lagras i:
https://github.com/nocobase/website

### 3.1 Komma igång och referensresurser

När ni lägger till ett nytt språk, vänligen se de befintliga språksidorna:
- Engelska: https://github.com/nocobase/website/tree/main/src/pages/en
- Kinesiska: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japanska: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagram över webbplatslokalisering](https://static-docs.nocobase.com/20250319121600.png)

Globala stiländringar finns på:
- Engelska: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Kinesiska: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japanska: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagram över global stil](https://static-docs.nocobase.com/20250319121501.png)

Webbplatsens globala komponentlokalisering finns på:
https://github.com/nocobase/website/tree/main/src/components

![Diagram över webbplatskomponenter](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Innehållsstruktur och lokaliseringsmetod

Vi använder en blandad metod för innehållshantering. Innehåll och resurser för engelska, kinesiska och japanska synkroniseras regelbundet från CMS-systemet och skrivs över, medan andra språk kan redigeras direkt i lokala filer. Lokalt innehåll lagras i katalogen `content`, organiserat enligt följande:

```
/content
  /articles        # Bloggartiklar
    /article-slug
      index.md     # Engelskt innehåll (standard)
      index.cn.md  # Kinesiskt innehåll
      index.ja.md  # Japanskt innehåll
      metadata.json # Metadata och andra lokaliseringsegenskaper
  /tutorials       # Guider
  /releases        # Versionsinformation
  /pages           # Vissa statiska sidor
  /categories      # Kategoriinformation
    /article-categories.json  # Lista över artikelkategorier
    /category-slug            # Detaljer för enskild kategori
      /category.json
  /tags            # Tagg-information
    /article-tags.json        # Lista över artikeltaggar
    /release-tags.json        # Lista över versionstaggar
    /tag-slug                 # Detaljer för enskild tagg
      /tag.json
  /help-center     # Innehåll för hjälpcenter
    /help-center-tree.json    # Navigeringsstruktur för hjälpcenter
  ....
```

### 3.3 Riktlinjer för innehållsöversättning

- Om översättning av Markdown-innehåll

1. Skapa en ny språkfil baserad på standardfilen (t.ex. `index.md` till `index.sv.md`)
2. Lägg till lokaliserade egenskaper i motsvarande fält i JSON-filen
3. Behåll konsekvens i filstruktur, länkar och bildreferenser

- Översättning av JSON-innehåll
Mycket metadata för innehåll lagras i JSON-filer, som vanligtvis innehåller flerspråkiga fält:

```json
{
  "id": 123,
  "title": "English Title",       // Engelsk titel (standard)
  "title_cn": "中文标题",          // Kinesisk titel
  "title_ja": "日本語タイトル",    // Japansk titel
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL-sökväg (översätts vanligtvis inte)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Översättningsnoteringar:**

1. **Namngivningskonvention för fält**: Översättningsfält använder vanligtvis formatet `{ursprungligt_fält}_{språkkod}`
   - Till exempel: title_sv (svensk titel), description_sv (svensk beskrivning)

2. **När ni lägger till ett nytt språk**:
   - Lägg till en motsvarande version med språksuffix för varje fält som behöver översättas
   - Ändra inte de ursprungliga fältvärdena (som title, description etc.), eftersom de fungerar som innehåll för standardspråket (engelska)

3. **CMS-synkroniseringsmekanism**:
   - CMS-systemet uppdaterar regelbundet innehåll på engelska, kinesiska och japanska
   - Systemet kommer endast att uppdatera/skriva över innehåll för dessa tre språk (vissa egenskaper i JSON) och kommer **inte att ta bort** språkfält som lagts till av andra bidragsgivare
   - Till exempel: om ni har lagt till en svensk översättning (title_sv), kommer CMS-synkroniseringen inte att påverka detta fält


### 3.4 Konfigurera stöd för ett nytt språk

För att lägga till stöd för ett nytt språk behöver ni ändra konfigurationen `SUPPORTED_LANGUAGES` i filen `src/utils/index.ts`:

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
  // Exempel på att lägga till ett nytt språk:
  sv: {
    code: 'sv',
    locale: 'sv-SE',
    name: 'Swedish'
  }
};
```

### 3.5 Layoutfiler och stilar

Varje språk behöver motsvarande layoutfiler:

1. Skapa en ny layoutfil (t.ex. för svenska, skapa `src/layouts/BaseSV.astro`)
2. Ni kan kopiera en befintlig layoutfil (som `BaseEN.astro`) och översätta den
3. Layoutfilen innehåller översättningar för globala element som navigeringsmenyer, sidfötter etc.
4. Se till att uppdatera konfigurationen för språkväljaren så att den växlar korrekt till det nyligen tillagda språket

### 3.6 Skapa språkspecifika sidkataloger

Skapa oberoende sidkataloger för det nya språket:

1. Skapa en mapp namngiven med språkkoden i katalogen `src` (t.ex. `src/sv/`)
2. Kopiera sidstrukturen från andra språkkataloger (t.ex. `src/en/`)
3. Uppdatera sidinnehållet genom att översätta titlar, beskrivningar och text till målspråket
4. Se till att sidorna använder rätt layoutkomponent (t.ex. `.layout: '@/layouts/BaseSV.astro'`)

### 3.7 Komponentlokalisering

Vissa gemensamma komponenter behöver också översättas:

1. Kontrollera komponenter i katalogen `src/components/`
2. Var särskilt uppmärksam på komponenter med fast text (som navigeringsfält, sidfötter etc.)
3. Komponenter kan använda villkorlig rendering för att visa innehåll på olika språk:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/sv') && <p>Svenskt innehåll</p>}
```

### 3.8 Testning och verifiering

Efter att ha slutfört översättningen, genomför noggranna tester:

1. Kör webbplatsen lokalt (vanligtvis med `yarn dev`)
2. Kontrollera hur alla sidor visas på det nya språket
3. Verifiera att språkväxlingsfunktionen fungerar korrekt
4. Se till att alla länkar pekar på rätt språkversion av sidorna
5. Kontrollera responsiva layouter för att säkerställa att översatt text inte förstör sidans design

## IV. Hur ni börjar översätta

Om ni vill bidra med en ny språköversättning till NocoBase, vänligen följ dessa steg:

| Komponent | Lagringsställe (Repository) | Gren | Anteckningar |
|-----------|------------|--------|-------|
| Systemgränssnitt | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON-lokaliseringsfiler |
| Dokumentation (2.0) | https://github.com/nocobase/nocobase | develop / next | Katalogen `docs/docs/<lang>/` |
| Webbplats | https://github.com/nocobase/website | main | Se avsnitt III |

Efter att ni har slutfört er översättning, vänligen skicka en Pull Request till NocoBase. De nya språken kommer att visas i systemkonfigurationen, vilket gör att ni kan välja vilka språk som ska visas.

![Diagram över aktiverade språk](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x Dokumentation

För översättningsguiden för NocoBase 1.x, vänligen se:

https://docs.nocobase.com/welcome/community/translations