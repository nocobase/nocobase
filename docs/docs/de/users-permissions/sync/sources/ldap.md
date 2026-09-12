---
pkg: '@nocobase/plugin-auth-ldap'
title: "Benutzerdaten aus LDAP synchronisieren"
description: "Einen vorhandenen LDAP-Authentifikator wiederverwenden, um LDAP-Benutzer und -Abteilungen mit NocoBase zu synchronisieren."
keywords: "LDAP,Benutzersynchronisation,Abteilungssynchronisation,Bind DN,Search DN,NocoBase"
---

# Benutzerdaten aus LDAP synchronisieren

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Einführung

Das Plugin **Authentifizierung: LDAP** kann einen vorhandenen LDAP-Authentifikator als Quelle für die Benutzerdatensynchronisation verwenden. Verbindung, Bind DN, Search DN, Suchbereich und Attributzuordnung werden wiederverwendet. Benutzer und optional die Abteilungshierarchie werden in NocoBase geschrieben.

## Voraussetzungen

1. Installieren und aktivieren Sie **Authentifizierung: LDAP** und **Benutzerdatensynchronisation**.
2. Erstellen und testen Sie einen LDAP-Authentifikator. Siehe [Authentifizierung: LDAP](/auth-verification/auth-ldap/).
3. Ordnen Sie im Authentifikator die benötigten Felder zu, etwa Benutzername oder E-Mail, Anzeigename und Telefonnummer.

## LDAP-Synchronisationsquelle hinzufügen

Öffnen Sie **Benutzer & Berechtigungen > Synchronisieren**, klicken Sie auf **Hinzufügen** und wählen Sie **LDAP**.

| Feld | Beschreibung |
| --- | --- |
| Quellenname | Eindeutiger Name der Synchronisationsquelle. |
| Aktiviert | Erlaubt manuelle und geplante LDAP-Synchronisationsaufgaben. |
| LDAP-Authentifikator | Vorhandener Authentifikator, dessen Verbindung und Attributzuordnung verwendet werden. |
| Synchronisationsfilter | LDAP-Filter für Benutzer. Standard: `(&(objectCategory=person)(objectClass=user))`. |
| Größenlimit | Maximale Anzahl der Einträge pro Suche; leer verwendet das Serverlimit. |
| Seitengröße | Seitengröße für paginierte LDAP-Suchen. |
| Abteilungen synchronisieren | Synchronisiert zusätzlich die LDAP-Organisationsstruktur als NocoBase-Abteilungen. |
| Abteilungs-Search-DN | Bei aktivierter Abteilungssynchronisation erforderlich, z. B. `ou=departments,dc=example,dc=com`. |

:::info
Die Quelle verwendet Bind DN und Bind-Passwort des ausgewählten Authentifikators und speichert keine zweite Kopie der Zugangsdaten.
:::

## Benutzer synchronisieren

Speichern und aktivieren Sie die Quelle und klicken Sie auf **Synchronisieren**. Unter **Aufgabe** können Sie das Ergebnis prüfen und fehlgeschlagene Aufgaben wiederholen.

Die Benutzerzuordnung richtet sich nach **Dieses Feld zum Binden des Benutzers verwenden** im LDAP-Authentifikator. Ändern Sie dieses Feld und die Attributzuordnung nach der ersten Synchronisation nicht, um doppelte Benutzer zu vermeiden.

## Abteilungen synchronisieren

Aktivieren Sie **Abteilungen synchronisieren** und geben Sie die **Abteilungs-Search-DN** ein. Das Plugin sucht Organisationseinheiten darunter, erhält deren Hierarchie und ordnet Benutzer anhand ihres Distinguished Name einer Abteilung zu.

## Synchronisierte Felder

### Benutzerfelder

| LDAP-Attribut oder Einstellung | NocoBase-Feld oder Zweck |
| --- | --- |
| Anmeldekonto-Attribut | Eindeutige Quellkennung und der als Bind-Feld ausgewählte Benutzername oder die E-Mail. Es wird meist aus `{{account}}` im Suchfilter abgeleitet, z. B. `uid`, `sAMAccountName` oder `mail`. Fehlt es, wird der Benutzer übersprungen. |
| Zuordnung zu `username` | Benutzername. |
| Zuordnung zu `nickname` | Anzeigename. |
| Zuordnung zu `email` | E-Mail-Adresse. |
| Zuordnung zu `phone` | Telefonnummer. |
| `distinguishedName`, ersatzweise Eintrags-DN | Nächste synchronisierte Abteilung im DN-Pfad; sie wird als Hauptabteilung gesetzt. |

Bei mehrwertigen LDAP-Attributen wird nur der erste Wert synchronisiert. Nicht zugeordnete Attribute werden nicht synchronisiert.

### Abteilungsfelder

| LDAP-Attribut oder Struktur | NocoBase-Feld oder Zweck |
| --- | --- |
| `objectGUID` | Eindeutige Quellkennung. Organisationseinheiten ohne dieses Attribut werden übersprungen. |
| `ou`, `cn`, `name` | Der erste nicht leere Wert wird als Abteilungsname verwendet. |
| `distinguishedName`, ersatzweise Eintrags-DN | Abteilung und übergeordnete Abteilung zur Bildung der Hierarchie. |

Standardmäßig werden Objekte der Klassen `organizationalUnit` und `container` gesucht. Mehrere Benutzerabteilungen aus `memberOf` sowie Abteilungsverantwortliche werden derzeit nicht synchronisiert.

## Fehlerbehebung

- Prüfen Sie bei fehlenden Benutzern Search DN, Suchbereich, Bind-DN-Berechtigungen und Synchronisationsfilter.
- Konfigurieren Sie bei abgeschnittenen Ergebnissen die Seitengröße und prüfen Sie das Größenlimit des LDAP-Servers.
- Prüfen Sie bei fehlenden Abteilungen, ob die Abteilungssynchronisation aktiviert ist und die Abteilungs-Search-DN alle Organisationseinheiten umfasst.
- Prüfen Sie Aufgabendetails und Anwendungsprotokolle auf Verbindungs-, Bind- und Suchfehler.
