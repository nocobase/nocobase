---
title: "Scan-Eingabe"
description: "Feldeinstellungen: Aktivieren Sie die Scan-Eingabe für Textfelder in Formularen und unterstützen Sie das Schreiben von Feldwerten über QR-Codes oder Barcodes."
keywords: "Scan-Eingabe,QR-Code,Barcode,Feldeinstellungen,Interface Builder,NocoBase"
---

# Scan-Eingabe

## Einführung

Die Scan-Eingabe wird für Textfelder in bearbeitbaren Formularen verwendet. Nach dem Aktivieren erscheint rechts neben dem Eingabefeld eine Scan-Schaltfläche. Benutzer können QR-Codes oder Barcodes scannen oder ein Bild aus dem Album zur Erkennung auswählen und das Erkennungsergebnis in das aktuelle Feld schreiben.

Sie eignet sich typischerweise für Inhalte wie Gerätenummern, Asset-Codes, Bestellnummern oder Sendungsnummern, die sich nicht gut manuell eingeben lassen.

## Unterstützte Felder

Die Scan-Eingabe wird hauptsächlich für textbasierte Felder verwendet, zum Beispiel:

- Einzeiliger Text
- Mobiltelefonnummer
- E-Mail
- URL
- UUID
- Nano ID

Wenn das Feld schreibgeschützt ist, sich im Lesemodus befindet oder selbst keine bearbeitbare Eingabe unterstützt, wird die Konfiguration für die Scan-Eingabe nicht angezeigt.

## Konfiguration

Wählen Sie das entsprechende Feld in einem Formularblock aus, öffnen Sie das Feldkonfigurationsmenü und suchen Sie nach `Scan-Eingabe-Einstellungen`.

Dazu gehören:

- `Scan-Eingabe aktivieren`: Nach dem Aktivieren wird rechts im Eingabefeld eine Scan-Schaltfläche angezeigt
- `Manuelle Eingabe deaktivieren`: Nach dem Aktivieren können Benutzer den Feldwert nur per Scan schreiben und das Eingabefeld nicht manuell bearbeiten

Wenn `Scan-Eingabe aktivieren` ausgeschaltet wird, wird auch `Manuelle Eingabe deaktivieren` unwirksam.

## Verwendung

Nachdem der Benutzer auf die Scan-Schaltfläche rechts neben dem Feld geklickt hat, kann er mit der Kamera einen QR-Code oder Barcode erkennen. Beim Scannen im Browser muss die Seite Zugriff auf die Kamera erhalten. In mobilen Umgebungen mit nativer Scan-Funktion wird bevorzugt die native mobile Scan-Funktion verwendet.

Wenn die Kamera nicht direkt verwendet werden soll, kann der Benutzer auch auf `Album` klicken und ein Bild zur Erkennung auswählen.
