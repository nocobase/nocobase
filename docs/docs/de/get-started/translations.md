:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/get-started/translations).
:::

# Beitrag zur Übersetzung

Die Standardsprache von NocoBase ist Englisch. Derzeit unterstützt die Hauptanwendung Englisch, Italienisch, Niederländisch, vereinfachtes Chinesisch und Japanisch. Wir laden Sie herzlich ein, Übersetzungen für weitere Sprachen beizutragen, damit Benutzer weltweit eine noch komfortablere NocoBase-Erfahrung genießen können.

---

## I. System-Lokalisierung

### 1. Systemoberfläche und Plugin-Übersetzung

#### 1.1 Übersetzungsumfang
Dies gilt nur für die Lokalisierung der NocoBase-Systemoberfläche und der Plugins und umfasst keine anderen benutzerdefinierten Inhalte (wie Datentabellen oder Markdown-Blöcke).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Übersicht der Lokalisierungsinhalte
NocoBase verwendet Git zur Verwaltung der Lokalisierungsinhalte. Das Haupt-Repository ist:
https://github.com/nocobase/nocobase/tree/main/locales

Jede Sprache wird durch eine JSON-Datei repräsentiert, die nach ihrem Sprachcode benannt ist (z. B. de-DE.json, fr-FR.json). Die Dateistruktur ist nach Plugin-Modulen organisiert und verwendet Schlüssel-Wert-Paare zum Speichern der Übersetzungen. Beispiel:

```json
{
  // Client-Plugin
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...weitere Schlüssel-Wert-Paare
  },
  "@nocobase/plugin-acl": {
    // Schlüssel-Wert-Paare für dieses Plugin
  }
  // ...weitere Plugin-Module
}
```

Bitte wandeln Sie die Struktur bei der Übersetzung schrittweise in eine Form wie die folgende um:

```json
{
  // Client-Plugin
  "@nocobase/client": {
    "(Fields only)": "(Nur Felder - übersetzt)",
    "12 hour": "12 Stunden",
    "24 hour": "24 Stunden"
    // ...weitere Schlüssel-Wert-Paare
  },
  "@nocobase/plugin-acl": {
    // Schlüssel-Wert-Paare für dieses Plugin
  }
  // ...weitere Plugin-Module
}
```

#### 1.3 Testen und Synchronisieren der Übersetzung
- Testen und verifizieren Sie nach Abschluss Ihrer Übersetzung, ob alle Texte korrekt angezeigt werden.
Wir haben auch ein Plugin zur Validierung der Übersetzung veröffentlicht – suchen Sie im Plugin-Marktplatz nach `Locale tester`.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Kopieren Sie nach der Installation den JSON-Inhalt aus der entsprechenden Lokalisierungsdatei im Git-Repository, fügen Sie ihn dort ein und klicken Sie auf OK, um zu prüfen, ob die Übersetzung wirksam ist.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Nach der Übermittlung synchronisieren Systemskripte die Lokalisierungsinhalte automatisch mit dem Code-Repository.

#### 1.4 NocoBase 2.0 Lokalisierungs-Plugin

> **Hinweis:** Dieser Abschnitt befindet sich in der Entwicklung. Das Lokalisierungs-Plugin für NocoBase 2.0 weist einige Unterschiede zur Version 1.x auf. Details werden in einem zukünftigen Update bereitgestellt.

<!-- TODO: Details zu den Unterschieden des 2.0 Lokalisierungs-Plugins hinzufügen -->

## II. Dokumentations-Lokalisierung (NocoBase 2.0)

Die Dokumentation für NocoBase 2.0 wird in einer neuen Struktur verwaltet. Die Quelldateien der Dokumentation befinden sich im NocoBase-Haupt-Repository:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Dokumentationsstruktur

Die Dokumentation verwendet [Rspress](https://rspress.dev/) als statischen Website-Generator und unterstützt 8 Sprachen. Die Struktur ist wie folgt organisiert:

```
docs/
├── docs/
│   ├── en/                    # Englisch (Quellsprache)
│   ├── cn/                    # Vereinfachtes Chinesisch
│   ├── ja/                    # Japanisch
│   ├── de/                    # Deutsch
│   ├── fr/                    # Französisch
│   ├── es/                    # Spanisch
│   ├── pt/                    # Portugiesisch
│   ├── ru/                    # Russisch
│   └── public/                # Gemeinsame Ressourcen (Bilder etc.)
├── theme/                     # Benutzerdefiniertes Theme
├── rspress.config.ts          # Rspress-Konfiguration
└── package.json
```

### 2.2 Übersetzungs-Workflow

1. **Synchronisation mit der englischen Quelle**: Alle Übersetzungen sollten auf der englischen Dokumentation basieren (`docs/en/`). Wenn die englische Dokumentation aktualisiert wird, sollten die Übersetzungen entsprechend angepasst werden.

2. **Branch-Strategie**:
   - Verwenden Sie den `develop`- oder `next`-Branch als Referenz für die neuesten englischen Inhalte
   - Erstellen Sie Ihren Übersetzungs-Branch vom Ziel-Branch aus

3. **Dateistruktur**: Jedes Sprachverzeichnis sollte die englische Verzeichnisstruktur widerspiegeln. Beispiel:
   ```
   docs/en/get-started/index.md    →    docs/de/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/de/api/acl/acl.md
   ```

### 2.3 Übersetzungen beitragen

1. Forken Sie das Repository: https://github.com/nocobase/nocobase
2. Klonen Sie Ihren Fork und checken Sie den `develop`- oder `next`-Branch aus
3. Navigieren Sie zum Verzeichnis `docs/docs/`
4. Suchen Sie das Sprachverzeichnis, zu dem Sie beitragen möchten (z. B. `de/` für Deutsch)
5. Übersetzen Sie die Markdown-Dateien und behalten Sie dabei die gleiche Dateistruktur wie in der englischen Version bei
6. Testen Sie Ihre Änderungen lokal:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Senden Sie einen Pull Request an das Haupt-Repository

### 2.4 Übersetzungsrichtlinien

- **Formatierung konsistent halten**: Behalten Sie die gleiche Markdown-Struktur, Überschriften, Codeblöcke und Links wie in der Quelle bei
- **Frontmatter beibehalten**: Lassen Sie jegliches YAML-Frontmatter am Anfang der Dateien unverändert, es sei denn, es enthält übersetzbare Inhalte
- **Bildreferenzen**: Verwenden Sie dieselben Bildpfade aus `docs/public/` – Bilder werden von allen Sprachen gemeinsam genutzt
- **Interne Links**: Aktualisieren Sie interne Links, um auf den korrekten Sprachpfad zu verweisen
- **Code-Beispiele**: Im Allgemeinen sollten Code-Beispiele nicht übersetzt werden, Kommentare im Code können jedoch übersetzt werden

### 2.5 Navigationskonfiguration

Die Navigationsstruktur für jede Sprache ist in den Dateien `_nav.json` und `_meta.json` in jedem Sprachverzeichnis definiert. Wenn Sie neue Seiten oder Abschnitte hinzufügen, stellen Sie sicher, dass Sie diese Konfigurationsdateien aktualisieren.

## III. Website-Lokalisierung

Die Website-Seiten und alle Inhalte sind gespeichert unter:
https://github.com/nocobase/website

### 3.1 Erste Schritte und Referenzressourcen

Wenn Sie eine neue Sprache hinzufügen, orientieren Sie sich bitte an den bestehenden Sprachseiten:
- Englisch: https://github.com/nocobase/website/tree/main/src/pages/en
- Chinesisch: https://github.com/nocobase/website/tree/main/src/pages/cn
- Japanisch: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagramm Website-Lokalisierung](https://static-docs.nocobase.com/20250319121600.png)

Globale Stiländerungen befinden sich unter:
- Englisch: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Chinesisch: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Japanisch: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagramm Globaler Stil](https://static-docs.nocobase.com/20250319121501.png)

Die Lokalisierung der globalen Komponenten der Website ist verfügbar unter:
https://github.com/nocobase/website/tree/main/src/components

![Diagramm Website-Komponenten](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Inhaltsstruktur und Lokalisierungsmethode

Wir verwenden einen gemischten Ansatz für das Inhaltsmanagement. Inhalte und Ressourcen in Englisch, Chinesisch und Japanisch werden regelmäßig vom CMS-System synchronisiert und überschrieben, während andere Sprachen direkt in lokalen Dateien bearbeitet werden können. Lokale Inhalte werden im Verzeichnis `content` gespeichert und sind wie folgt organisiert:

```
/content
  /articles        # Blog-Artikel
    /article-slug
      index.md     # Englischer Inhalt (Standard)
      index.cn.md  # Chinesischer Inhalt
      index.ja.md  # Japanischer Inhalt
      metadata.json # Metadaten und andere Lokalisierungseigenschaften
  /tutorials       # Tutorials
  /releases        # Release-Informationen
  /pages           # Einige statische Seiten
  /categories      # Kategorie-Informationen
    /article-categories.json  # Liste der Artikelkategorien
    /category-slug            # Details zu einzelnen Kategorien
      /category.json
  /tags            # Tag-Informationen
    /article-tags.json        # Liste der Artikel-Tags
    /release-tags.json        # Liste der Release-Tags
    /tag-slug                 # Details zu einzelnen Tags
      /tag.json
  /help-center     # Inhalte des Hilfe-Centers
    /help-center-tree.json    # Navigationsstruktur des Hilfe-Centers
  ....
```

### 3.3 Richtlinien zur Inhaltsübersetzung

- Über die Übersetzung von Markdown-Inhalten

1. Erstellen Sie eine neue Sprachdatei basierend auf der Standarddatei (z. B. `index.md` zu `index.de.md`)
2. Fügen Sie lokalisierte Eigenschaften in den entsprechenden Feldern der JSON-Datei hinzu
3. Behalten Sie die Konsistenz in Dateistruktur, Links und Bildreferenzen bei

- JSON-Inhaltsübersetzung
Viele Inhaltsmetadaten werden in JSON-Dateien gespeichert, die normalerweise mehrsprachige Felder enthalten:

```json
{
  "id": 123,
  "title": "English Title",       // Englischer Titel (Standard)
  "title_cn": "中文标题",          // Chinesischer Titel
  "title_ja": "日本語タイトル",    // Japanischer Titel
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL-Pfad (normalerweise nicht übersetzt)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Hinweise zur Übersetzung:**

1. **Feldnamenskonvention**: Übersetzungsfelder verwenden normalerweise das Format `{ursprüngliches_Feld}_{Sprachcode}`
   - Beispiel: title_fr (französischer Titel), description_de (deutscher Beschreibungstext)

2. **Beim Hinzufügen einer neuen Sprache**:
   - Fügen Sie für jedes Feld, das eine Übersetzung benötigt, eine entsprechende Version mit Sprachsuffix hinzu
   - Ändern Sie nicht die ursprünglichen Feldwerte (wie title, description etc.), da diese als Inhalt der Standardsprache (Englisch) dienen

3. **CMS-Synchronisationsmechanismus**:
   - Das CMS-System aktualisiert regelmäßig englische, chinesische und japanische Inhalte
   - Das System wird nur Inhalte für diese drei Sprachen aktualisieren/überschreiben (bestimmte Eigenschaften im JSON) und **löscht keine** Sprachfelder, die von anderen Mitwirkenden hinzugefügt wurden
   - Beispiel: Wenn Sie eine französische Übersetzung (title_fr) hinzugefügt haben, wird die CMS-Synchronisation dieses Feld nicht beeinflussen


### 3.4 Unterstützung für eine neue Sprache konfigurieren

Um die Unterstützung für eine neue Sprache hinzuzufügen, müssen Sie die Konfiguration `SUPPORTED_LANGUAGES` in der Datei `src/utils/index.ts` ändern:

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
  // Beispiel für das Hinzufügen einer neuen Sprache:
  de: {
    code: 'de',
    locale: 'de-DE',
    name: 'German'
  }
};
```

### 3.5 Layout-Dateien und Stile

Jede Sprache benötigt entsprechende Layout-Dateien:

1. Erstellen Sie eine neue Layout-Datei (z. B. für Deutsch `src/layouts/BaseDE.astro`)
2. Sie können eine vorhandene Layout-Datei kopieren (wie `BaseEN.astro`) und übersetzen
3. Die Layout-Datei enthält Übersetzungen für globale Elemente wie Navigationsmenüs, Fußzeilen usw.
4. Stellen Sie sicher, dass Sie die Konfiguration des Sprachumschalters aktualisieren, um korrekt zur neu hinzugefügten Sprache zu wechseln

### 3.6 Sprachspezifische Seitenverzeichnisse erstellen

Erstellen Sie unabhängige Seitenverzeichnisse für die neue Sprache:

1. Erstellen Sie im Verzeichnis `src` einen Ordner, der nach dem Sprachcode benannt ist (z. B. `src/de/`)
2. Kopieren Sie die Seitenstruktur aus anderen Sprachverzeichnissen (z. B. `src/en/`)
3. Aktualisieren Sie den Seiteninhalt und übersetzen Sie Titel, Beschreibungen und Texte in die Zielsprache
4. Stellen Sie sicher, dass die Seiten die richtige Layout-Komponente verwenden (z. B. `.layout: '@/layouts/BaseDE.astro'`)

### 3.7 Komponenten-Lokalisierung

Einige allgemeine Komponenten müssen ebenfalls übersetzt werden:

1. Überprüfen Sie die Komponenten im Verzeichnis `src/components/`
2. Achten Sie besonders auf Komponenten mit festem Text (wie Navigationsleisten, Fußzeilen usw.)
3. Komponenten können bedingtes Rendering verwenden, um Inhalte in verschiedenen Sprachen anzuzeigen:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/de') && <p>Deutscher Inhalt</p>}
```

### 3.8 Testen und Validierung

Führen Sie nach Abschluss der Übersetzung gründliche Tests durch:

1. Führen Sie die Website lokal aus (normalerweise mit `yarn dev`)
2. Prüfen Sie, wie alle Seiten in der neuen Sprache angezeigt werden
3. Überprüfen Sie, ob die Funktion des Sprachumschalters ordnungsgemäß funktioniert
4. Stellen Sie sicher, dass alle Links auf die korrekten Sprachversionen der Seiten verweisen
5. Überprüfen Sie responsive Layouts, um sicherzustellen, dass übersetzte Texte das Seitendesign nicht beeinträchtigen

## IV. Wie Sie mit der Übersetzung beginnen

Wenn Sie eine neue Sprachübersetzung zu NocoBase beitragen möchten, folgen Sie bitte diesen Schritten:

| Komponente | Repository | Branch | Anmerkungen |
|------------|------------|--------|-------------|
| Systemoberfläche | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON-Lokalisierungsdateien |
| Dokumentation (2.0) | https://github.com/nocobase/nocobase | develop / next | Verzeichnis `docs/docs/<lang>/` |
| Website | https://github.com/nocobase/website | main | Siehe Abschnitt III |

Senden Sie nach Abschluss Ihrer Übersetzung einen Pull Request an NocoBase. Die neuen Sprachen erscheinen in der Systemkonfiguration, sodass Sie auswählen können, welche Sprachen angezeigt werden sollen.

![Diagramm Aktivierte Sprachen](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x Dokumentation

Informationen zum Übersetzungsleitfaden für NocoBase 1.x finden Sie unter:

https://docs-cn.nocobase.com/welcome/community/translations
