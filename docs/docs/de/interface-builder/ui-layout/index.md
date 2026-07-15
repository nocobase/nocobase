---
title: "UI-Layout"
description: "Überblick über die UI-Layouts von NocoBase mit den Eigenschaften, Einsatzbereichen und Zusammenhängen von Desktop- und Mobil-Layout."
keywords: "UI-Layout,Desktop-Layout,Mobil-Layout,responsives Layout,mobile Seiten,NocoBase"
---

# UI-Layout

NocoBase bietet ein Desktop-Layout und ein Mobil-Layout. In beiden Layouts können Sie mit der Oberflächengestaltung Seiten erstellen und darin Blöcke, Felder und Aktionen konfigurieren.

Das Desktop-Layout ist die Standardauswahl und eignet sich für die tägliche Verwaltung und Datenverarbeitung am Computer. Wenn Sie eine eigenständige mobile Navigation und eigene mobile Seiten benötigen, können Sie zusätzlich das Mobil-Layout einrichten.

<!-- Benötigt wird ein Screenshot, der Desktop-Layout und Mobil-Layout im direkten Vergleich zeigt -->

## Desktop-Layout

Das [Desktop-Layout](./desktop.md) ist standardmäßig unter `/admin` erreichbar. Es besteht aus einer oberen Navigation, einer seitlichen Navigation und dem Seiteninhalt. Es eignet sich für typische Anwendungsfälle wie Tabellenverwaltung, Formulareingabe und Datenanzeige.

Das Desktop-Layout passt sich auch an schmale Bildschirme an. Wird eine Seite auf einem schmaleren Bildschirm angezeigt, werden Navigation, Abstände und häufig verwendete Komponenten für den verfügbaren Platz optimiert. Dabei werden weiterhin die ursprünglichen Desktop-Menüs und -Seiten verwendet.

<!-- Benötigt wird ein Screenshot einer vollständigen Seite im Desktop-Layout -->

## Mobil-Layout

Das [Mobil-Layout](./mobile.md) ist standardmäßig unter `/mobile` erreichbar. Es organisiert die Hauptnavigation über eine untere Tab-Leiste und bietet eigenständige mobile Seiten, Links und Seiten-Tabs.

Das Mobil-Layout eignet sich für Abläufe, die häufig auf dem Smartphone ausgeführt werden, etwa Erfassungen vor Ort, mobile Freigaben, Aufgabenbearbeitung und Datenabfragen. Sie können die Seiten im Desktop-Browser erstellen und in der Vorschau prüfen und das Ergebnis anschließend über einen QR-Code auf einem echten Gerät kontrollieren.

<!-- Benötigt wird ein Screenshot einer vollständigen Seite im Mobil-Layout -->

## Das passende Layout wählen

Verwenden Sie standardmäßig das Desktop-Layout.

| Ich möchte ... | Empfohlenes Layout |
| --- | --- |
| Hauptsächlich am Computer arbeiten und gelegentlich per Smartphone zugreifen | [Desktop-Layout](./desktop.md) |
| Navigation, Seiten und Bedienabläufe speziell für Smartphones gestalten | [Mobil-Layout](./mobile.md) |
| Eine vollständige Nutzung am Computer und auf Mobilgeräten anbieten | Desktop-Layout und Mobil-Layout getrennt einrichten |

## Zusammenhang der Konfigurationen

Desktop-Layout und Mobil-Layout verwenden dieselben Datenquellen, Collections und Geschäftsdaten. Auf Grundlage derselben Collection können Sie daher in beiden Layouts jeweils passende Seiten für unterschiedliche Geräte erstellen.

Menüs, Routen und Seitenkonfigurationen werden getrennt verwaltet. Änderungen an einer Desktop-Seite aktualisieren die mobile Seite nicht automatisch, und Änderungen an der mobilen Navigation haben keine Auswirkungen auf die Desktop-Navigation. Auch die [Zugriffsrechte für Routen](../../users-permissions/acl/permissions.md) müssen für beide Layouts getrennt konfiguriert werden.

## Verwandte Links

- [Desktop-Layout](./desktop.md) — Desktop-Seiten erstellen und das responsive Verhalten auf schmalen Bildschirmen kennenlernen
- [Mobil-Layout](./mobile.md) — eine eigenständige mobile Navigation und mobile Seiten erstellen
- [Routen-Manager](../../routes/index.md) — Seiten, Links und Menüs für Desktop- und Mobil-Layout verwalten
- [Berechtigungskonfiguration](../../users-permissions/acl/permissions.md) — festlegen, auf welche Menüs und Seiten verschiedene Rollen zugreifen dürfen
