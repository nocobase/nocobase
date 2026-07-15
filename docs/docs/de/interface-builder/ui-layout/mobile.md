---
title: "Mobil-Layout"
description: "Einführung in Navigation, Seitengestaltung, Desktop-Vorschau, Unterseiten, Routen und Berechtigungen des NocoBase Mobil-Layouts."
keywords: "Mobil-Layout,mobile Seite,untere Navigation,mobile Vorschau,mobile Route,UI Editor,NocoBase"
---

# Mobil-Layout

In NocoBase dient das **Mobil-Layout** dazu, eine eigenständige mobile Navigation und mobile Seiten zu erstellen. Es ist standardmäßig unter `/mobile` erreichbar, verwendet eine untere Tab-Leiste als Hauptnavigation und eignet sich besonders für Dateneingaben, Abfragen, Freigaben und Aufgabenbearbeitung auf dem Smartphone.

Mobil-Layout und Desktop-Layout greifen auf dieselben Datenquellen und Geschäftsdaten zu. Menüs, Routen und Seiteninhalte werden jedoch getrennt konfiguriert. Dadurch können Sie Seiten passend für die mobile Nutzung neu ordnen, ohne an die Struktur der Desktop-Seiten gebunden zu sein.

<!-- Benötigt wird ein Screenshot einer vollständigen Seite im Mobil-Layout auf einem echten Gerät -->

## Mobil-Layout öffnen und in der Vorschau prüfen

Nach der Aktivierung des Plugins „UI Layout“ können Sie im Einstellungscenter auf „Mobil“ klicken oder `/mobile` direkt aufrufen.

Erstellen Sie die Seiten am besten im Desktop-Browser. Dort sehen Sie einen mobilen Vorschaubereich und eine obere Werkzeugleiste mit diesen Funktionen:

- „UI Editor“ aktiviert oder deaktiviert die Oberflächengestaltung.
- „Tablet-Vorschau“ prüft die Darstellung auf breiteren Mobilgeräten.
- „Mobil-Vorschau“ setzt den Vorschaubereich auf die Größe eines Smartphones zurück.
- „QR-Code“ öffnet die aktuelle mobile Adresse auf einem Smartphone.

<!-- Benötigt wird ein Screenshot der mobilen Vorschau im Desktop-Browser mit UI Editor, Tablet-Vorschau, Mobil-Vorschau und QR-Code -->

Prüfen Sie die fertige Seite anschließend über den QR-Code auf einem echten Gerät. Achten Sie dabei besonders auf Navigation, Scrollen, Formulareingaben, eingeblendete Seiten und Sicherheitsabstände.

## Mobile Navigation erstellen

Das Mobil-Layout verwendet eine untere Tab-Leiste als Hauptnavigation. Derzeit unterstützt diese Navigation hauptsächlich Seiten und Links.

### Eine Seite hinzufügen

1. Öffnen Sie den „UI Editor“.
2. Klicken Sie rechts neben der unteren Tab-Leiste auf die Schaltfläche zum Hinzufügen.
3. Wählen Sie „Seite“.
4. Geben Sie einen Seitentitel ein und wählen Sie ein Symbol.
5. Öffnen Sie nach dem Speichern die neue Seite und fügen Sie den Seiteninhalt hinzu.

<!-- Benötigt wird ein Video, das das Hinzufügen einer mobilen Seite zur unteren Tab-Leiste zeigt -->

### Einen Link hinzufügen

Wenn Sie zu einer internen oder externen Adresse wechseln möchten, wählen Sie „Link“ und konfigurieren Sie Titel, Symbol und URL.

Der Link kann im aktuellen oder in einem neuen Fenster geöffnet werden. Das genaue Verhalten hängt von der Link-Konfiguration ab.

<!-- Benötigt wird ein Screenshot der Konfiguration zum Hinzufügen eines mobilen Links -->

### Navigation anpassen

In der Oberflächengestaltung können Sie die Tabs in der unteren Leiste per Drag & Drop neu anordnen. Für jeden Tab können Sie außerdem Titel und Symbol bearbeiten, Verknüpfungsregeln konfigurieren, die UID kopieren oder den Tab löschen.

Um mobile Routen zentral anzuzeigen, einzublenden, auszublenden oder zu löschen, öffnen Sie „Einstellungscenter / Routen / Mobile Routen“.

<!-- Benötigt wird ein Screenshot des Konfigurationsmenüs der unteren Tabs und der Sortierung per Drag & Drop -->

## Eine mobile Seite erstellen

Erstellen und öffnen Sie zuerst eine mobile Seite und fügen Sie dann Blöcke hinzu. Der Seiteninhalt wird grundsätzlich nach demselben Prinzip wie im Desktop-Layout aufgebaut: Mit [Blöcken](../blocks/index.md), [Feldern](../fields/index.md) und [Aktionen](../actions/index.md) organisieren Sie die benötigten Geschäftsinhalte. Die mobile Navigation und die Interaktion einiger Komponenten werden jedoch für kleine Bildschirme angepasst.

### Seiteninhalt hinzufügen

1. Öffnen Sie die mobile Seite, die Sie gestalten möchten.
2. Prüfen Sie, ob der „UI Editor“ aktiviert ist.
3. Klicken Sie auf der Seite auf „Block hinzufügen“.
4. Wählen Sie eine Tabelle, ein Formular, eine Detailansicht, einen Filter oder einen anderen Block.
5. Konfigurieren Sie anschließend Felder, Aktionen und Blockeinstellungen.

<!-- Benötigt wird ein Video, das das Öffnen einer mobilen Seite und das Hinzufügen eines Blocks zeigt -->

### Seiten-Tabs verwenden

Auch auf einer mobilen Seite können Sie Tabs aktivieren. Inhalte, die unter demselben Navigationseintrag liegen, aber weitgehend unabhängig voneinander sind, lassen sich auf verschiedene Tabs verteilen.

1. Öffnen Sie die Seiteneinstellungen und aktivieren Sie „Tabs aktivieren“. Alternativ können Sie die Seite unter „Einstellungscenter / Routen / Mobile Routen“ bearbeiten und „Seiten-Tabs aktivieren“ auswählen.
2. Öffnen Sie den „UI Editor“.
3. Klicken Sie rechts neben der Tab-Leiste der Seite auf „Tab hinzufügen“.
4. Fügen Sie den Tab hinzu und konfigurieren Sie anschließend seinen Namen und Inhalt.

Wenn die mobile Seite nur wenig Inhalt enthält, genügt eine einzelne Seite. Zusätzliche Tabs sind dann nicht nötig.

<!-- Benötigt wird ein Screenshot, der das Aktivieren von Seiten-Tabs, das Hinzufügen eines neuen Tabs und die Position der Schaltfläche zum Hinzufügen zeigt -->

### Mobile Interaktionen häufig verwendeter Komponenten

Häufig verwendete Komponenten passen ihre Anordnung und Interaktion an das Mobil-Layout an. So werden mehrspaltige Inhalte besser für das vertikale Lesen angeordnet, Auswahl- und Datums-/Zeitfelder verwenden mobile Auswahlansichten, und Filter, verknüpfte Datensätze sowie Unterseiten erhalten eine für Touch-Bedienung geeignete Oberfläche.

Tabellen bleiben im Mobil-Layout Tabellen. Spalten außerhalb des sichtbaren Bereichs können horizontal angezeigt werden. Ob weitere Blöcke ein eigenes mobiles Verhalten bieten, hängt von der Unterstützung des jeweiligen Blocks ab.

## Seiten und Unterseiten

Inhalte, die über Aktionen zum Anzeigen, Bearbeiten oder Auswählen verknüpfter Datensätze geöffnet werden, erscheinen als mobile Unterseiten. Jede Unterseite bietet eine Schaltfläche, um zur vorherigen Seite zurückzukehren.

Beim Öffnen einer tieferen Unterseite wird die untere Tab-Leiste vorübergehend ausgeblendet, damit mehr Platz für den aktuellen Inhalt zur Verfügung steht. Beim Schließen der Unterseite oder beim Zurückkehren zur vorherigen Ebene wird die Tab-Leiste wieder angezeigt.

Beim Wechsel zwischen den unteren Tabs bleibt der Zustand bereits geöffneter Seiten normalerweise erhalten. So können Sie zwischen mehreren mobilen Aufgaben wechseln, ohne den aktuellen Stand zu verlieren.

<!-- Benötigt wird ein Video, das das Öffnen einer Unterseite, das Ausblenden der unteren Tab-Leiste und die Rückkehr zeigt -->

## Routen und Berechtigungen verwalten

Mobile Routen können zentral im [Routen-Manager](../../routes/index.md) verwaltet werden. Unter „Einstellungscenter / Routen / Mobile Routen“ können Sie Seiten und Links hinzufügen, bearbeiten, löschen, einblenden oder ausblenden und Seiten-Tabs konfigurieren.

Die Zugriffsrechte für mobile Routen werden getrennt von den Desktop-Routen konfiguriert. Öffnen Sie in den Rollenberechtigungen den Bereich „Mobile Routen“ und wählen Sie die Seiten aus, auf die die aktuelle Rolle zugreifen darf. Weitere Informationen finden Sie unter [Berechtigungskonfiguration](../../users-permissions/acl/permissions.md).

<!-- Benötigt wird ein Screenshot der Verwaltungsseite „Einstellungscenter / Routen / Mobile Routen“ -->

<!-- Benötigt wird ein Screenshot der Seite „Mobile Routen“ in den Rollenberechtigungen -->

## Zusammenhang mit dem Desktop-Layout

Desktop-Layout und Mobil-Layout können auf Grundlage derselben Collection unterschiedliche Seiten bereitstellen. So kann das Desktop-Layout etwa eine Tabelle mit vielen Feldern für die Datenbearbeitung verwenden, während das Mobil-Layout eine einfachere Liste oder ein Formular für Eingaben vor Ort bietet.

Die Seiten der beiden Layouts werden nicht automatisch synchronisiert. Änderungen an Desktop-Seiten, -Menüs oder -Routen wirken sich nicht auf die mobile Konfiguration aus. Umgekehrt haben Änderungen am Mobil-Layout keine Auswirkungen auf das Desktop-Layout.

:::tip Empfehlung

Wenn Sie Desktop-Seiten nur gelegentlich per Smartphone anzeigen möchten, verwenden Sie zunächst das responsive Verhalten des [Desktop-Layouts](./desktop.md). Ein separates Mobil-Layout benötigen Sie nur für eine eigenständige mobile Navigation und eigene mobile Seitenabläufe.

:::

## Verwandte Links

- [UI-Layout im Überblick](./index.md) — Einsatzbereiche von Desktop- und Mobil-Layout kennenlernen
- [Desktop-Layout](./desktop.md) — das Standardlayout für Desktop und die responsive Ansicht verwenden
- [Blöcke](../blocks/index.md) — Geschäftsinhalte auf mobilen Seiten hinzufügen
- [Felder](../fields/index.md) — mobile Formulare und Felder für die Datenanzeige konfigurieren
- [Aktionen](../actions/index.md) — Aktionsschaltflächen auf mobilen Seiten konfigurieren
- [Routen-Manager](../../routes/index.md) — mobile Seiten, Links und Tabs verwalten
- [Berechtigungskonfiguration](../../users-permissions/acl/permissions.md) — steuern, auf welche mobilen Routen eine Rolle zugreifen darf
