---
versions:
  - label: Latest (Stabile Version)
    features: Stabile Funktionen, umfassend getestet, nur Fehlerbehebungen.
    audience: Für Benutzer, die eine stabile Erfahrung wünschen, und für den Einsatz in Produktionsumgebungen.
    stability: ★★★★★
    production_recommendation: Empfohlen
  - label: Beta (Testversion)
    features: Enthält kommende neue Funktionen, die vorab getestet wurden, aber noch kleinere Probleme aufweisen können.
    audience: Für Benutzer, die neue Funktionen frühzeitig testen und Feedback geben möchten.
    stability: ★★★★☆
    production_recommendation: Mit Vorsicht verwenden
  - label: Alpha (Entwicklungsversion)
    features: Version in Entwicklung, mit den neuesten Funktionen, die jedoch unvollständig oder instabil sein können.
    audience: Für technische Benutzer und Mitwirkende, die an der neuesten Entwicklung interessiert sind.
    stability: ★★☆☆☆
    production_recommendation: Mit Vorsicht verwenden

install_methods:
  - label: Docker-Installation (Empfohlen)
    features: Keine Code-Kenntnisse erforderlich, einfache Installation, ideal für einen schnellen Einstieg.
    scenarios: Für No-Code-Benutzer und alle, die schnell auf einem Server bereitstellen möchten.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Neuestes Image herunterladen und Container neu starten
  - label: create-nocobase-app Installation
    features: Unabhängige Anwendungs-Codebasis, unterstützt Plugin-Erweiterungen und UI-Anpassungen.
    scenarios: Für Frontend-/Full-Stack-Entwickler, Teamprojekte, Low-Code-Entwicklung.
    technical_requirement: ★★★☆☆
    upgrade_method: Abhängigkeiten mit yarn aktualisieren
  - label: Git-Quellcode-Installation
    features: Direkter Zugriff auf den neuesten Quellcode, ideal für Beiträge und Debugging.
    scenarios: Für technische Entwickler und Benutzer, die unveröffentlichte Versionen testen möchten.
    technical_requirement: ★★★★★
    upgrade_method: Updates über den Git-Workflow synchronisieren
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Installationsmethoden und Versionsvergleich

Sie können NocoBase auf verschiedene Arten installieren.

## Versionsvergleich

| Merkmal | **Latest (Stabile Version)** | **Beta (Testversion)** | **Alpha (Entwicklungsversion)** |
|------|------------------------|----------------------|-----------------------|
| **Merkmale** | Stabile Funktionen, umfassend getestet, nur Fehlerbehebungen. | Enthält kommende neue Funktionen, vorab getestet, kann aber noch kleinere Probleme aufweisen. | Version in Entwicklung, neueste Funktionen, aber potenziell unvollständig oder instabil. |
| **Zielgruppe** | Benutzer, die eine stabile Erfahrung wünschen, und Produktionsumgebungen. | Benutzer, die neue Funktionen frühzeitig testen und Feedback geben möchten. | Technische Benutzer und Mitwirkende, die an der neuesten Entwicklung interessiert sind. |
| **Stabilität** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Empfehlung für Produktionseinsatz** | Empfohlen | Mit Vorsicht verwenden | Mit Vorsicht verwenden |

## Vergleich der Installationsmethoden

| Merkmal | **Docker-Installation (Empfohlen)** | **create-nocobase-app Installation** | **Git-Quellcode-Installation** |
|------|--------------------------|------------------------------|------------------|
| **Merkmale** | Keine Code-Kenntnisse erforderlich, einfache Installation, ideal für einen schnellen Einstieg. | Unabhängige Anwendungs-Codebasis, unterstützt Plugin-Erweiterungen und UI-Anpassungen. | Direkter Zugriff auf den neuesten Quellcode, ideal für Beiträge und Debugging. |
| **Anwendungsbereiche** | No-Code-Benutzer, schnelle Bereitstellung auf einem Server. | Frontend-/Full-Stack-Entwickler, Teamprojekte, Low-Code-Entwicklung. | Technische Entwickler, Benutzer, die unveröffentlichte Versionen testen möchten. |
| **Technische Anforderungen** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Upgrade-Methode** | Neuestes Image herunterladen und Container neu starten | Abhängigkeiten mit yarn aktualisieren | Updates über den Git-Workflow synchronisieren |
| **Anleitungen** | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Bereitstellung</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Bereitstellung</code>](#) | [<code>Installation</code>](#) [<code>Upgrade</code>](#) [<code>Bereitstellung</code>](#) |