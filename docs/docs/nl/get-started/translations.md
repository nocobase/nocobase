:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/get-started/translations) voor nauwkeurige informatie.
:::

# Bijdragen aan vertalingen

De standaardtaal van NocoBase is Engels. Momenteel ondersteunt de hoofapplicatie Engels, Italiaans, Nederlands, Vereenvoudigd Chinees en Japans. We nodigen u van harte uit om bij te dragen aan vertalingen voor andere talen, zodat gebruikers wereldwijd kunnen genieten van een nog toegankelijkere NocoBase-ervaring.

---

## I. Systeemlokalisatie

### 1. Vertaling van de systeeminterface en plugins

#### 1.1 Vertalingsbereik
Dit geldt alleen voor de lokalisatie van de NocoBase-systeeminterface en plugins, en omvat geen andere aangepaste inhoud (zoals datatabellen of Markdown-blokken).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Overzicht van lokalisatie-inhoud
NocoBase gebruikt Git om de lokalisatie-inhoud te beheren. De primaire repository is:
https://github.com/nocobase/nocobase/tree/main/locales

Elke taal wordt vertegenwoordigd door een JSON-bestand dat is vernoemd naar de taalcode (bijv. de-DE.json, fr-FR.json). De bestandsstructuur is georganiseerd per plugin-module en gebruikt sleutel-waardeparen om vertalingen op te slaan. Bijvoorbeeld:

```json
{
  // Client plugin
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...andere sleutel-waardeparen
  },
  "@nocobase/plugin-acl": {
    // Sleutel-waardeparen voor deze plugin
  }
  // ...andere plugin-modules
}
```

Vertaal deze stapsgewijs naar een structuur zoals de volgende:

```json
{
  // Client plugin
  "@nocobase/client": {
    "(Fields only)": "(Alleen velden - vertaald)",
    "12 hour": "12 uur",
    "24 hour": "24 uur"
    // ...andere sleutel-waardeparen
  },
  "@nocobase/plugin-acl": {
    // Sleutel-waardeparen voor deze plugin
  }
  // ...andere plugin-modules
}
```

#### 1.3 Vertaling testen en synchroniseren
- Test en verifieer na het voltooien van uw vertaling of alle teksten correct worden weergegeven.
We hebben ook een plugin voor vertalingsvalidatie uitgebracht - zoek naar `Locale tester` in de plugin marketplace.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Kopieer na installatie de JSON-inhoud uit het bijbehorende lokalisatiebestand in de git-repository, plak deze erin en klik op OK om te controleren of de vertaalde inhoud werkt.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Na indiening zullen systeemscripts de lokalisatie-inhoud automatisch synchroniseren met de code-repository.

#### 1.4 NocoBase 2.0 lokalisatie-plugin

> **Let op:** Dit gedeelte is in ontwikkeling. De lokalisatie-plugin voor NocoBase 2.0 vertoont enkele verschillen met de 1.x-versie. Details worden in een toekomstige update verstrekt.

<!-- TODO: Details toevoegen over de verschillen in de 2.0 lokalisatie-plugin -->

## II. Documentatielokalisatie (NocoBase 2.0)

De documentatie voor NocoBase 2.0 wordt beheerd in een nieuwe structuur. De bronbestanden van de documentatie bevinden zich in de hoofdrepository van NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Documentatiestructuur

De documentatie gebruikt [Rspress](https://rspress.dev/) als statische site-generator en ondersteunt 22 talen. De structuur is als volgt georganiseerd:

```
docs/
├── docs/
│   ├── en/                    # Engels (brontaal)
│   ├── cn/                    # Vereenvoudigd Chinees
│   ├── ja/                    # Japans
│   ├── ko/                    # Koreaans
│   ├── de/                    # Duits
│   ├── fr/                    # Frans
│   ├── es/                    # Spaans
│   ├── pt/                    # Portugees
│   ├── ru/                    # Russisch
│   ├── it/                    # Italiaans
│   ├── tr/                    # Turks
│   ├── uk/                    # Oekraïens
│   ├── vi/                    # Vietnamees
│   ├── id/                    # Indonesisch
│   ├── th/                    # Thais
│   ├── pl/                    # Pools
│   ├── nl/                    # Nederlands
│   ├── cs/                    # Tsjechisch
│   ├── ar/                    # Arabisch
│   ├── he/                    # Hebreeuws
│   ├── hi/                    # Hindi
│   ├── sv/                    # Zweeds
│   └── public/                # Gedeelde bestanden (afbeeldingen, enz.)
├── theme/                     # Aangepast thema
├── rspress.config.ts          # Rspress-configuratie
└── package.json
```

### 2.2 Workflow voor vertaling

1. **Synchroniseer met de Engelse bron**: Alle vertalingen moeten gebaseerd zijn op de Engelse documentatie (`docs/en/`). Wanneer de Engelse documentatie wordt bijgewerkt, moeten de vertalingen dienovereenkomstig worden bijgewerkt.

2. **Branch-strategie**:
   - Gebruik de `develop`- of `next`-branch als referentie voor de nieuwste Engelse inhoud
   - Maak uw vertalingsbranch aan vanuit de doelbranch

3. **Bestandsstructuur**: Elke taalmap moet de Engelse mapstructuur spiegelen. Bijvoorbeeld:
   ```
   docs/en/get-started/index.md    →    docs/ja/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ja/api/acl/acl.md
   ```

### 2.3 Bijdragen aan vertalingen

1. Fork de repository: https://github.com/nocobase/nocobase
2. Kloon uw fork en check de `develop`- of `next`-branch uit
3. Navigeer naar de map `docs/docs/`
4. Zoek de taalmap waaraan u wilt bijdragen (bijv. `ja/` voor Japans)
5. Vertaal de markdown-bestanden en behoud dezelfde bestandsstructuur als de Engelse versie
6. Test uw wijzigingen lokaal:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Dien een Pull Request in bij de hoofdrepository

### 2.4 Richtlijnen voor vertaling

- **Houd de opmaak consistent**: Behoud dezelfde markdown-structuur, koppen, codeblokken en links als de bron
- **Behoud frontmatter**: Laat de YAML-frontmatter bovenaan bestanden ongewijzigd, tenzij deze vertaalbare inhoud bevat
- **Afbeeldingsverwijzingen**: Gebruik dezelfde afbeeldingspaden uit `docs/public/` - afbeeldingen worden gedeeld over alle talen
- **Interne links**: Werk interne links bij zodat ze naar het juiste taalpad verwijzen
- **Codevoorbeelden**: Over het algemeen moeten codevoorbeelden niet worden vertaald, maar commentaar in de code kan wel worden vertaald

### 2.5 Navigatieconfiguratie

De navigatiestructuur voor elke taal is gedefinieerd in de bestanden `_nav.json` en `_meta.json` binnen elke taalmap. Zorg ervoor dat u deze configuratiebestanden bijwerkt wanneer u nieuwe pagina's of secties toevoegt.

## III. Websitelokalisatie

De websitepagina's en alle inhoud zijn opgeslagen in:
https://github.com/nocobase/website

### 3.1 Aan de slag en referentiebronnen

Raadpleeg bij het toevoegen van een nieuwe taal de bestaande taalpagina's:
- Engels: https://github.com/nocobase/website/tree/main/src/pages/en
- Chinees: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japans: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagram websitelokalisatie](https://static-docs.nocobase.com/20250319121600.png)

Globale stijlwijzigingen bevinden zich op:
- Engels: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chinees: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japans: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagram globale stijl](https://static-docs.nocobase.com/20250319121501.png)

De lokalisatie van de globale componenten van de website is beschikbaar op:
https://github.com/nocobase/website/tree/main/src/components

![Diagram websitecomponenten](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Inhoudsstructuur en lokalisatiemethode

We gebruiken een gemengde aanpak voor inhoudsbeheer. De inhoud en bronnen voor Engels, Chinees en Japans worden regelmatig gesynchroniseerd vanuit het CMS-systeem en overschreven, terwijl andere talen rechtstreeks in lokale bestanden kunnen worden bewerkt. Lokale inhoud wordt opgeslagen in de map `content`, als volgt georganiseerd:

```
/content
  /articles        # Blogartikelen
    /article-slug
      index.md     # Engelse inhoud (standaard)
      index.cn.md  # Chinese inhoud
      index.ja.md  # Japanse inhoud
      metadata.json # Metadata en andere lokalisatie-eigenschappen
  /tutorials       # Tutorials
  /releases        # Release-informatie
  /pages           # Enkele statische pagina's
  /categories      # Categorie-informatie
    /article-categories.json  # Lijst met artikelcategorieën
    /category-slug            # Details van individuele categorie
      /category.json
  /tags            # Tag-informatie
    /article-tags.json        # Lijst met artikeltags
    /release-tags.json        # Lijst met release-tags
    /tag-slug                 # Details van individuele tag
      /tag.json
  /help-center     # Inhoud helpcentrum
    /help-center-tree.json    # Navigatiestructuur helpcentrum
  ....
```

### 3.3 Richtlijnen voor inhoudsvertaling

- Over de vertaling van Markdown-inhoud

1. Maak een nieuw taalbestand aan op basis van het standaardbestand (bijv. `index.md` naar `index.fr.md`)
2. Voeg gelokaliseerde eigenschappen toe in de bijbehorende velden in het JSON-bestand
3. Behoud consistentie in bestandsstructuur, links en afbeeldingsverwijzingen

- Vertaling van JSON-inhoud
Veel metadata van de inhoud zijn opgeslagen in JSON-bestanden, die doorgaans meertalige velden bevatten:

```json
{
  "id": 123,
  "title": "English Title",       // Engelse titel (standaard)
  "title_cn": "中文标题",          // Chinese titel
  "title_ja": "日本語タイトル",    // Japanse titel
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL-pad (meestal niet vertaald)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Opmerkingen bij de vertaling:**

1. **Naamgevingsconventie voor velden**: Vertaalvelden gebruiken doorgaans het formaat `{oorspronkelijk_veld}_{taalcode}`
   - Bijvoorbeeld: title_fr (Franse titel), description_de (Duitse beschrijving)

2. **Bij het toevoegen van een nieuwe taal**:
   - Voeg een versie met het bijbehorende taalsuffix toe voor elk veld dat vertaling behoeft
   - Wijzig de oorspronkelijke veldwaarden (zoals title, description, etc.) niet, aangezien deze dienen als inhoud voor de standaardtaal (Engels)

3. **CMS-synchronisatiemechanisme**:
   - Het CMS-systeem werkt periodiek de Engelse, Chinese en Japanse inhoud bij
   - Het systeem zal alleen de inhoud voor deze drie talen bijwerken/overschrijven (sommige eigenschappen in de JSON) en zal taalvelden die door andere bijdragers zijn toegevoegd **niet verwijderen**
   - Bijvoorbeeld: als u een Franse vertaling (title_fr) hebt toegevoegd, zal de CMS-synchronisatie dit veld niet beïnvloeden


### 3.4 Ondersteuning voor een nieuwe taal configureren

Om ondersteuning voor een nieuwe taal toe te voegen, moet u de configuratie `SUPPORTED_LANGUAGES` in het bestand `src/utils/index.ts` wijzigen:

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
  // Voorbeeld van het toevoegen van een nieuwe taal:
  fr: {
    code: 'fr',
    locale: 'fr-FR',
    name: 'French'
  }
};
```

### 3.5 Layoutbestanden en stijlen

Elke taal heeft bijbehorende layoutbestanden nodig:

1. Maak een nieuw layoutbestand aan (bijv. voor het Frans: `src/layouts/BaseFR.astro`)
2. U kunt een bestaand layoutbestand kopiëren (zoals `BaseEN.astro`) en dit vertalen
3. Het layoutbestand bevat vertalingen voor globale elementen zoals navigatiemenu's, footers, enz.
4. Zorg ervoor dat u de configuratie van de taalschakelaar bijwerkt om correct naar de nieuw toegevoegde taal te schakelen

### 3.6 Pagina-mappen voor talen aanmaken

Maak onafhankelijke pagina-mappen aan voor de nieuwe taal:

1. Maak een map aan met de taalcode in de map `src` (bijv. `src/fr/`)
2. Kopieer de paginastructuur uit andere taalmappen (bijv. `src/en/`)
3. Werk de pagina-inhoud bij door titels, beschrijvingen en tekst te vertalen naar de doeltaal
4. Zorg ervoor dat pagina's de juiste layout-component gebruiken (bijv. `.layout: '@/layouts/BaseFR.astro'`)

### 3.7 Lokalisatie van componenten

Sommige algemene componenten moeten ook worden vertaald:

1. Controleer componenten in de map `src/components/`
2. Let vooral op componenten met vaste tekst (zoals navigatiebalken, footers, enz.)
3. Componenten kunnen conditionele rendering gebruiken om inhoud in verschillende talen weer te geven:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 Testen en validatie

Voer na het voltooien van de vertaling een grondige test uit:

1. Draai de website lokaal (meestal met `yarn dev`)
2. Controleer hoe alle pagina's in de nieuwe taal worden weergegeven
3. Verifieer of de taalschakelfunctie correct werkt
4. Zorg ervoor dat alle links naar de juiste taalversie van de pagina's verwijzen
5. Controleer responsieve layouts om er zeker van te zijn dat vertaalde tekst het ontwerp van de pagina niet verstoort

## IV. Hoe u kunt beginnen met vertalen

Als u wilt bijdragen aan een nieuwe taalvertaling voor NocoBase, volg dan deze stappen:

| Component | Repository | Branch | Opmerkingen |
|-----------|------------|--------|-------------|
| Systeeminterface | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON-lokalisatiebestanden |
| Documentatie (2.0) | https://github.com/nocobase/nocobase | develop / next | `docs/docs/<lang>/` map |
| Website | https://github.com/nocobase/website | main | Zie sectie III |

Dien na het voltooien van uw vertaling een Pull Request in bij NocoBase. De nieuwe talen verschijnen in de systeemconfiguratie, zodat u kunt selecteren welke talen u wilt weergeven.

![Diagram ingeschakelde talen](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x documentatie

Raadpleeg voor de vertalingsgids van NocoBase 1.x:

https://docs.nocobase.com/welcome/community/translations