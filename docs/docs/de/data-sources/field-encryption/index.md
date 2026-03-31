---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Verschlüsselung

## Einführung

Bestimmte vertrauliche Geschäftsdaten, wie z.B. Kunden-Mobiltelefonnummern, E-Mail-Adressen oder Kartennummern, können verschlüsselt werden. Nach der Verschlüsselung werden diese Daten als Chiffretext in der Datenbank gespeichert.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Verschlüsselung

:::warning
Das Plugin generiert automatisch einen `Anwendungsschlüssel`, der im Verzeichnis `/storage/apps/main/encryption-field-keys` gespeichert wird.

Die Datei des `Anwendungsschlüssels` trägt den Schlüssel-ID als Namen und hat die Dateiendung `.key`. Bitte ändern Sie den Dateinamen nicht eigenmächtig.

Bitte bewahren Sie die Datei des `Anwendungsschlüssels` sicher auf. Geht die Datei des `Anwendungsschlüssels` verloren, können die verschlüsselten Daten nicht mehr entschlüsselt werden.

Wenn das Plugin von einer Sub-Anwendung aktiviert wird, wird der Schlüssel standardmäßig im Verzeichnis `/storage/apps/${Name der Sub-Anwendung}/encryption-field-keys` gespeichert.
:::

### Funktionsweise

Es wird die Umschlag-Verschlüsselung (Envelope Encryption) verwendet.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Schlüsselgenerierungsprozess
1.  Wenn ein verschlüsseltes Feld zum ersten Mal erstellt wird, generiert das System automatisch einen 32-Bit `Anwendungsschlüssel`, der Base64-kodiert im Standardspeicherverzeichnis abgelegt wird.
2.  Bei jeder Erstellung eines neuen verschlüsselten Feldes wird ein zufälliger 32-Bit `Feldschlüssel` für dieses Feld generiert. Dieser wird dann mit dem `Anwendungsschlüssel` und einem zufällig generierten 16-Bit `Feld-Verschlüsselungsvektor` (`AES`-Verschlüsselungsalgorithmus) verschlüsselt und im `options`-Feld der `fields`-Tabelle gespeichert.

### Feld-Verschlüsselungsprozess
1.  Jedes Mal, wenn Daten in ein verschlüsseltes Feld geschrieben werden, werden zuerst der verschlüsselte `Feldschlüssel` und der `Feld-Verschlüsselungsvektor` aus dem `options`-Feld der `fields`-Tabelle abgerufen.
2.  Der verschlüsselte `Feldschlüssel` wird mithilfe des `Anwendungsschlüssels` und des `Feld-Verschlüsselungsvektors` entschlüsselt. Anschließend werden die Daten mit dem `Feldschlüssel` und einem zufällig generierten 16-Bit `Daten-Verschlüsselungsvektor` (`AES`-Verschlüsselungsalgorithmus) verschlüsselt.
3.  Die Daten werden mit dem entschlüsselten `Feldschlüssel` signiert (`HMAC-SHA256`-Hash-Algorithmus) und Base64-kodiert in einen String umgewandelt. (Die resultierende `Datensignatur` wird später für die Datensuche verwendet.)
4.  Der 16-Bit `Daten-Verschlüsselungsvektor` und der verschlüsselte `Daten-Chiffretext` werden binär zusammengefügt und anschließend Base64-kodiert in einen String umgewandelt.
5.  Der Base64-kodierte String der `Datensignatur` und der Base64-kodierte String des zusammengefügten `Daten-Chiffretexts` werden durch einen Punkt (`.`) getrennt zusammengefügt.
6.  Der endgültig zusammengefügte String wird in der Datenbank gespeichert.

## Umgebungsvariablen

Wenn Sie einen benutzerdefinierten `Anwendungsschlüssel` festlegen möchten, können Sie die Umgebungsvariable `ENCRYPTION_FIELD_KEY_PATH` verwenden. Das Plugin lädt dann die Datei unter diesem Pfad als `Anwendungsschlüssel`.

Anforderungen an die Datei des `Anwendungsschlüssels`:
1.  Die Dateiendung muss `.key` sein.
2.  Der Dateiname wird als Schlüssel-ID verwendet; die Verwendung einer UUID wird empfohlen, um die Eindeutigkeit zu gewährleisten.
3.  Der Dateiinhalt muss 32 Bytes Base64-kodierter Binärdaten sein.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Feldkonfiguration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Auswirkungen der Verschlüsselung auf die Filterung

Verschlüsselte Felder unterstützen nur folgende Operatoren: gleich, ungleich, existiert, existiert nicht.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Filterungsprozess:
1.  Den verschlüsselten `Feldschlüssel` des Feldes abrufen und diesen mit dem `Anwendungsschlüssel` entschlüsseln.
2.  Den `Feldschlüssel` verwenden, um die Benutzereingabe zu signieren (`HMAC-SHA256`-Hash-Algorithmus).
3.  Den signierten Suchtext mit einem `.`-Trennzeichen zusammenfügen und in der Datenbank eine Präfix-Suchanfrage auf dem verschlüsselten Feld durchführen.

## Schlüsselrotation

:::warning
Bevor Sie den Befehl `nocobase key-rotation` verwenden, stellen Sie sicher, dass das Plugin geladen ist.
:::

Wenn eine Anwendung in eine neue Umgebung migriert wird und Sie den gleichen Schlüssel wie in der alten Umgebung nicht weiterverwenden möchten, können Sie den Befehl `nocobase key-rotation` verwenden, um den `Anwendungsschlüssel` zu ersetzen.

Für die Ausführung des Schlüsselrotationsbefehls muss der `Anwendungsschlüssel` der alten Umgebung angegeben werden. Nach der Ausführung wird ein neuer `Anwendungsschlüssel` generiert und Base64-kodiert im Standardverzeichnis gespeichert, der den alten Schlüssel ersetzt.

```bash
# --key-path gibt die Datei des Anwendungsschlüssels der alten Umgebung an, die den verschlüsselten Daten in der Datenbank entspricht.
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Um den `Anwendungsschlüssel` einer Sub-Anwendung zu rotieren, müssen Sie den Parameter `--app-name` hinzufügen und den `Namen` der Sub-Anwendung angeben.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```