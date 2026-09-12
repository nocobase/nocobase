---
title: "Feldvalidierung"
description: "Regeln für die Feldvalidierung: Konfigurations- und Validierungsregeln auf Basis von Joi, einschließlich Mindest-/Maximallänge, Pflichtfeldern und mehr für Zeichenketten, Zahlen, Datumsangaben und andere Datentypen."
keywords: "Feldvalidierung,Feldprüfung,Joi,Validierungsregeln,Konfigurationsregeln,NocoBase"
---

# Feldvalidierung
Um die Genauigkeit, Sicherheit und Konsistenz der Daten zu gewährleisten, bietet NocoBase eine Feldvalidierungsfunktion. Diese Funktion besteht hauptsächlich aus zwei Teilen: Konfigurationsregeln und Validierungsregeln.

## Konfigurationsregeln
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Die Systemfelder von NocoBase integrieren die Regeln von [Joi](https://joi.dev/api/). Die Unterstützung ist wie folgt:

### Zeichenkettentyp
Zu den NocoBase-Feldtypen, die dem Joi-Zeichenkettentyp entsprechen, gehören: einzeiliger Text, mehrzeiliger Text, Telefonnummer, E-Mail, URL, Passwort und UUID.
#### Allgemeine Regeln
- Mindestlänge
- Maximallänge
- Länge
- Regulärer Ausdruck
- Pflichtfeld

#### E-Mail
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Zahlentyp
Zu den NocoBase-Feldtypen, die dem Joi-Zahlentyp entsprechen, gehören: Ganzzahl, Zahl und Prozentsatz.
#### Allgemeine Regeln
- Größer als
- Kleiner als
- Maximalwert
- Mindestwert
- Ganzzahliges Vielfaches

#### Ganzzahl
Zusätzlich zu den allgemeinen Regeln unterstützen Ganzzahlfelder auch die [Ganzzahlvalidierung](https://joi.dev/api/?v=17.13.3#numberinteger) und die [Validierung unsicherer Ganzzahlen](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Zahl und Prozentsatz
Zusätzlich zu den allgemeinen Regeln unterstützen Zahlen- und Prozentsatzfelder auch die [Genauigkeitsvalidierung](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Datumstyp
Zu den NocoBase-Feldtypen, die dem Joi-Datumstyp entsprechen, gehören: Datum (mit Zeitzone), Datum (ohne Zeitzone), nur Datum und Unix-Zeitstempel.

Unterstützte Validierungsregeln:
- Größer als
- Kleiner als
- Maximalwert
- Mindestwert
- Validierung des Zeitstempelformats
- Pflichtfeld

### Beziehungsfelder
Beziehungsfelder unterstützen nur die Pflichtfeldvalidierung. Beachten Sie, dass die Pflichtfeldvalidierung von Beziehungsfeldern derzeit nicht in Unterformularen oder Untertabellen angewendet werden kann.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Anwendung von Validierungsregeln
Nachdem Feldregeln konfiguriert wurden, werden beim Hinzufügen oder Ändern von Daten die entsprechenden Validierungsregeln ausgelöst.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Wenn das Feld in einem Formular verwendet wird, werden die Feldvalidierungsregeln auch in den Validierungseinstellungen des Feldes angezeigt. Diese Regeln erscheinen unter „Serverseitige Feldvalidierungsregeln“ und werden hier nur lesbar angezeigt. Wenn Sie diese Regeln ändern möchten, müssen Sie zu „Datenquelle / Tabellenkonfiguration“ zurückkehren und das Feld bearbeiten.

Unter „Clientseitige Validierungsregeln“ können Sie dem Feld des aktuellen Formulars weiterhin zusätzliche Regeln hinzufügen. Diese Regeln wirken sich nur auf die Komponente des aktuellen Feldes aus. Die letztendlich wirksamen Validierungsregeln setzen sich aus den „Serverseitigen Feldvalidierungsregeln“ und den „Clientseitigen Validierungsregeln“ zusammen.

Die Validierungsregeln gelten auch für Untertabellen- und Unterformular-Komponenten:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Beachten Sie, dass die Pflichtfeldvalidierung von Beziehungsfeldern in Unterformularen oder Untertabellen derzeit nicht wirksam ist.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Unterschiede zwischen serverseitigen Feldvalidierungsregeln und clientseitigen Validierungsregeln
Serverseitige Feldvalidierungsregeln und clientseitige Validierungsregeln werden an unterschiedlichen Stellen konfiguriert und haben unterschiedliche Geltungsbereiche.

### Unterschiede bei der Konfiguration
- **Serverseitige Feldvalidierungsregeln**: Feldregeln werden unter „Datenquelle / Tabellenkonfiguration“ festgelegt. Diese Regeln bilden die grundlegenden Regeln des Feldes.
- **Clientseitige Validierungsregeln**: Zusätzliche Regeln werden in den Einstellungen des Formularfeldes hinzugefügt. Diese Regeln wirken sich nur auf die Komponente des aktuellen Feldes aus.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Unterschiede beim Auslösezeitpunkt der Validierung
- **Serverseitige Feldvalidierungsregeln**: Wenn das Feld in einem Formular verwendet wird, wird eine clientseitige Validierung ausgelöst. Vor dem Schreiben der Daten wird ebenfalls eine Validierung durchgeführt. Diese Regeln gelten auch für das Hinzufügen oder Ändern von Daten über Workflows, Datenimporte und andere Szenarien.
- **Clientseitige Validierungsregeln**: Die clientseitige Validierung wird nur für das Feld des aktuellen Formulars ausgelöst.
- **Regelanzeige**: Serverseitige Feldvalidierungsregeln werden als geerbte Regeln schreibgeschützt angezeigt. Clientseitige Validierungsregeln werden separat angezeigt und können hier bearbeitet werden.
- **Fehlermeldungen**: Clientseitige Validierungsregeln unterstützen benutzerdefinierte Fehlermeldungen. Serverseitige Feldvalidierungsregeln unterstützen derzeit keine benutzerdefinierten Fehlermeldungen.