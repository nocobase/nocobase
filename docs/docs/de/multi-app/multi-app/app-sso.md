---
pkg: '@nocobase/plugin-app-supervisor'
title: 'App-SSO'
description: 'App-SSO in Multi-App: automatische Anmeldung in Sub-Apps über die Haupt-App oder den App-Wechsler, mit Zuordnung nach Benutzername und automatischer Benutzerregistrierung.'
keywords: 'Multi-App,App-SSO,automatische Anmeldung,App-Wechsler,Sub-App,NocoBase'
---

# App-SSO

App-SSO vereinfacht den Anmeldeablauf, wenn Benutzer in einer Multi-App-Umgebung Sub-Apps öffnen.

Nach der Aktivierung versucht das System, Benutzer beim Öffnen einer Sub-App über den Einstieg der Haupt-App oder beim Wechsel zwischen Sub-Apps automatisch als aktuellen Benutzer in der Ziel-Sub-App anzumelden. Benutzer müssen Benutzername und Passwort nicht in jeder Sub-App erneut eingeben.

## Einsatzszenarien

App-SSO eignet sich für folgende Szenarien:

- Die Haupt-App dient als einheitlicher Einstieg, und Benutzer öffnen von dort verschiedene Business-Sub-Apps
- Ein System ist in mehrere Business-Sub-Apps aufgeteilt, aber die Anmeldung soll durchgängig wirken
- Benutzer müssen häufig zwischen mehreren Sub-Apps wechseln
- Benutzerkonten werden zwischen Sub-Apps über denselben Benutzernamen zugeordnet

## App-SSO aktivieren

Öffnen Sie „App Supervisor“, erstellen oder bearbeiten Sie eine Sub-App und aktivieren Sie unter „Authentifizierungskonfiguration“ die Option „App-SSO“.

Danach kann diese Sub-App über den Haupt-App-Einstieg oder den App-Wechsler eine automatische Anmeldung auslösen.

> Nach Änderungen an der Authentifizierungskonfiguration muss die Sub-App normalerweise neu gestartet werden, damit die Änderung wirksam wird.

![](https://static-docs.nocobase.com/202605271406542.png)

## Automatische Benutzerregistrierung

Wenn der entsprechende Benutzer in der Ziel-Sub-App nicht existiert, können Sie „Automatisch registrieren, wenn Benutzer nicht existiert“ aktivieren.

Nach der Aktivierung erstellt das System beim ersten Zugriff über App-SSO einen Basisbenutzer in der Sub-App anhand der Benutzerinformationen aus der Haupt-App.

Die Benutzerzuordnung basiert hauptsächlich auf dem Benutzernamen. Das bedeutet:

- Wenn der Benutzername in Haupt-App und Sub-App gleich ist, wird der entsprechende Sub-App-Benutzer angemeldet
- Wenn der Benutzername in der Sub-App nicht existiert, wird der Benutzer nur bei aktivierter automatischer Registrierung erstellt
- Wenn automatische Registrierung nicht aktiviert ist, muss der Administrator den Benutzer vorher in der Sub-App erstellen

Rollen und Berechtigungen nach der Erstellung werden durch die Benutzer- und Berechtigungskonfiguration der Sub-App bestimmt.

## Einstiege, die automatische Anmeldung auslösen

App-SSO wird hauptsächlich ausgelöst durch:

- Öffnen einer Sub-App über den Anwendungseinstieg der Haupt-App
- Öffnen einer Sub-App über den App-Wechsler oben links
- Wechsel von einer Sub-App zu einer anderen

Der direkte Besuch der Anmeldeseite oder der eigenen Adresse einer Sub-App erzwingt nicht den Anmeldestatus der Haupt-App. So bleiben eigene Anmeldeverfahren der Sub-App erhalten, und Sub-App-Konten können bei Bedarf separat verwaltet werden.

## Häufige Fragen

### Nach der Aktivierung erfolgt weiterhin keine automatische Anmeldung?

Prüfen Sie Folgendes:

- Ob App-SSO für die Sub-App aktiviert ist
- Ob die Sub-App neu gestartet wurde, damit die Authentifizierungskonfiguration wirksam ist
- Ob der Benutzer über den Einstieg der Haupt-App oder den App-Wechsler eingetreten ist
- Ob in der Sub-App ein Benutzer mit demselben Benutzernamen existiert
- Wenn der Benutzer nicht existiert, ob automatische Registrierung aktiviert ist

### Warum erfolgt beim direkten Zugriff auf eine Sub-App keine automatische Anmeldung?

Das ist erwartetes Verhalten. Beim direkten Zugriff kann die Sub-App ihre eigene Anmeldemethode verwenden müssen, daher wird der Anmeldestatus der Haupt-App nicht erzwungen.
