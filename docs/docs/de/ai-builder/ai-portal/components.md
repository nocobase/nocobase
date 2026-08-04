---
title: "Standardkomponenten und Erweiterungen"
description: "Die shadcn/ui-Komponentenbasis des AI Portals und sein Erweiterungsmechanismus – ein Verzeichnis je Erweiterung, automatisch erkannt und eingehängt."
keywords: "AI Portal,shadcn/ui,Komponenten,Erweiterungen,AppExtension,Registry,Tailwind CSS"
---

# Standardkomponenten und Erweiterungen

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie gemäß dem [Schnellstart Aufbau mit AI Portal](./index.md) Ihr erstes Portal zum Laufen gebracht haben.

:::

Die Oberfläche eines Portals besteht aus zwei Teilen: `src/components/ui` liefert die Basiskomponenten, `src/extensions` enthält die Geschäftsmodule. Diese Seite beschreibt, wie Sie beide verwenden.

## Komponentenbasis

Unter `src/components/ui` liegen über 60 [shadcn/ui](https://ui.shadcn.com/)-Komponenten – Buttons, Formulare, Dialoge, Drawer, Tabellen, Diagramme, also alle gängigen. Der Stil wird in `components.json` konfiguriert, die Icons stammen von lucide.

Anders als beim Einbinden einer Komponentenbibliothek **gehört der Quellcode dieser Komponenten Ihrem Projekt**. Er liegt in Ihrem Repository, Sie können ihn beliebig ändern, und Aktualisierungen von upstream überschreiben ihn nicht.

Genau deshalb sollten Sie Anpassungen über Komposition vornehmen statt direkt am Original:

```tsx
// Empfohlen: eine Ebene darum legen, damit die Basiskomponente austauschbar bleibt
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

`src/components/ui/button.tsx` direkt zu ändern funktioniert ebenfalls, macht es aber später schwerer, Bugfixes von upstream zu übernehmen. Wenn Sie eine Basiskomponente tatsächlich ändern müssen, vergleichen Sie zuerst mit der upstream-Version und führen Sie gezielt zusammen, statt Ihre lokalen Änderungen pauschal zu überschreiben.

:::warning Hinweis

Binden Sie kein Ant Design und keine auf Ant Design basierenden NocoBase-Client-Komponenten in ein Portal ein. Das Styling-System des Portals ist Tailwind CSS plus shadcn/ui; eine Vermischung führt zu Stilkonflikten. Diese Konvention steht bereits in der `AGENTS.md` der Vorlage.

:::

## Erweiterungsmechanismus

Geschäftsfunktionen werden als Erweiterungen unter `src/extensions/` geschrieben, ein Verzeichnis je Funktionsmodul:

```text
src/extensions/
├── nocobase-acl/               Berechtigungskomponenten
├── nocobase-ai/                KI-Dialogfähigkeiten
├── nocobase-route-surfaces/    Seite, Drawer und Modal als drei Routenträger
└── nocobase-users-example/     Beispiel für die Benutzerverwaltung
```

In jedem Verzeichnis liegt eine `extension.tsx`, die standardmäßig eine `AppExtension` exportiert. Die Vorlage durchsucht und lädt sie automatisch – **ins Verzeichnis legen genügt, Registrierungscode muss nicht angefasst werden**.

## AppExtension

Eine Erweiterung kann Folgendes bereitstellen:

| Feld | Beschreibung |
| --- | --- |
| `id` | Kennung der Erweiterung, erforderlich |
| `priority` | Ladereihenfolge, kleinere Zahlen zuerst, standardmäßig 100 |
| `resources` | Refine-Ressourcendefinitionen, bestimmen Navigationsmenü und Routenzuordnung |
| `routes` | Routenelemente, die unter den Routenbaum für angemeldete Nutzer gehängt werden |
| `Provider` | Ein Provider, der die gesamte Anwendung umschließt |
| `AuthRuntimeProvider` | Provider für die Authentifizierungslaufzeit, bereits vor der Anmeldung aktiv |
| `UserMenuItems` | Einträge, die dem Benutzermenü hinzugefügt werden |
| `authAdapters` | Adapter für Authentifizierungsverfahren |
| `dev` | Ressourcen und Routen, die nur im Entwicklungsmodus gelten |

Eine minimale Erweiterung sieht so aus:

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Nimmt an der Berechtigungsprüfung für NocoBase-Datentabellen teil
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Integrierte Erweiterungen

Die Vorlage bringt vier Erweiterungen mit. Sie sind direkt einsetzbar und zugleich die beste Referenz, wenn Sie neuen Code schreiben:

**`nocobase-users-example`** – ein vollständiges CRUD-Modul auf Basis der NocoBase-Standardtabelle `users`, mit Liste, Anlegen, Bearbeiten und Detailansicht. Verweisen Sie die KI darauf, wenn Sie eine neue Seite bauen.

**`nocobase-acl`** – Berechtigungskomponenten: `CanAccess`, `AclPage`, `AclRegion`, `AclField` und `RoleSwitcher`.

**`nocobase-route-surfaces`** – drei Routenträger: ganze Seite, Drawer und Modal. Derselbe Inhalt lässt sich als eigenständige Seite öffnen oder in einer Listenseite als Drawer einblenden, wobei der Routenzustand korrekt synchron bleibt.

**`nocobase-ai`** – bindet die KI-Dialogfähigkeiten von NocoBase ins Frontend ein, inklusive Dialogfenster, Streaming, Gesprächsverlauf und Seitenkontext. Damit bauen Sie einen KI-Assistenten in Ihr eigenes Portal ein.

## Regeln für Importe

Beim Schreiben einer Erweiterung gelten zwei Pfadkonventionen:

- Für alles aus der Host-Anwendung den Alias `@/` verwenden, etwa `@/components/ui/button`
- Relative Importe innerhalb der Erweiterung dürfen nicht über deren eigenes Verzeichnis hinausreichen

So bleibt jede Erweiterung in sich geschlossen und Sie können das gesamte Verzeichnis in ein anderes Portal kopieren und dort weiterverwenden.

## Installierbare offizielle Erweiterungen

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Neben den vier integrierten wird NocoBase eine Reihe offizieller Erweiterungen bereitstellen, die Sie bei Bedarf installieren können. Nach der Installation landet der Quellcode unter `src/extensions/` und wird wie eine integrierte Erweiterung zu projekteigenem Code, den Sie ändern und mit der Anwendung committen können.

## Internationalisierung

Die Texte liegen unter `src/locales/`, die Vorlage bringt Chinesisch und Englisch mit. Auch eine Erweiterung kann ein eigenes Sprachpaket haben – legen Sie im Erweiterungsverzeichnis ein `locales/` an und importieren Sie es in `extension.tsx`.

## Verwandte Links

- [Schnellstart Aufbau mit AI Portal](./index.md) – bringen Sie Ihren ersten von der KI geschriebenen Frontend-Einstieg zum Laufen
- [Projektstruktur und Technologie-Stack](./project-structure.md) – die vollständigen Verzeichniskonventionen und gängigen Befehle
- [Aufbau mit einem AI Agent](./agent-workflow.md) – die KI beim Schreiben eines neuen Moduls einer integrierten Erweiterung folgen lassen
