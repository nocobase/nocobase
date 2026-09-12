---
pkg: "@nocobase/plugin-field-encryption"
title: "Feldverschlüsselung"
description: "Verschlüsselt und speichert vertrauliche Geschäftsdaten (Telefonnummern, E-Mail-Adressen, Kartennummern usw.) als Chiffretext in der Datenbank, um sensible Informationen zu schützen."
keywords: "Feldverschlüsselung,Encryption,sensible Daten,Chiffretextspeicherung,NocoBase"
---
# Verschlüsselung

## Einführung

Private Geschäftsdaten wie die Telefonnummer, E-Mail-Adresse oder Kartennummer von Kunden können verschlüsselt und anschließend als Chiffretext in der Datenbank gespeichert werden.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Verschlüsselungsmethode

:::warning
Das Plugin generiert automatisch einen `应用密钥`. Dieser Schlüssel wird im Verzeichnis `/storage/apps/main/encryption-field-keys` gespeichert.

Der Dateiname von `应用密钥` ist die Schlüssel-ID, und die Dateierweiterung lautet `.key`. Ändern Sie den Dateinamen nicht willkürlich.

Bewahren Sie die Datei `应用密钥` sorgfältig auf. Wenn die Datei `应用密钥` verloren geht, können verschlüsselte Daten nicht entschlüsselt werden.

Wenn das Plugin in einer Unteranwendung aktiviert ist, lautet das Standardverzeichnis für die Schlüssel `/storage/apps/${子应用name}/encryption-field-keys`.
:::

### Funktionsweise

Es wird Umschlagverschlüsselung verwendet.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Ablauf der Schlüsselerstellung
1. Beim ersten Erstellen eines verschlüsselten Felds generiert das System automatisch einen 32-Bit-`应用密钥` und speichert ihn Base64-kodiert im Standardspeicherverzeichnis.
2. Bei jedem Erstellen eines neuen verschlüsselten Felds wird für dieses Feld ein zufälliger 32-Bit-`字段密钥` generiert. Dieser wird dann mit `应用密钥` und einem zufällig generierten 16-Bit-`字段加密向量` verschlüsselt (Verschlüsselungsalgorithmus `AES`) und anschließend im Feld `options` der Tabelle `fields` gespeichert.

### Ablauf der Feldverschlüsselung
1. Bei jedem Schreiben von Daten in ein verschlüsseltes Feld werden zunächst der verschlüsselte `字段密钥` und `字段加密向量` aus dem Feld `options` der Tabelle `fields` abgerufen.
2. Der verschlüsselte `字段密钥` wird mit `应用密钥` und `字段加密向量` entschlüsselt. Anschließend werden die Daten mit `字段密钥` und einem zufällig generierten 16-Bit-`数据加密向量` verschlüsselt (Verschlüsselungsalgorithmus `AES`).
3. Die Daten werden mit dem entschlüsselten `字段密钥` signiert (Hash-Algorithmus `HMAC-SHA256`) und Base64-kodiert in eine Zeichenfolge umgewandelt (der erzeugte `数据签名` wird später für die Datensuche verwendet).
4. Der 16-Bit-`数据加密向量` und der verschlüsselte `数据密文` werden binär zusammengefügt und Base64-kodiert in eine Zeichenfolge umgewandelt.
5. Die Base64-kodierte Zeichenfolge von `数据签名` und die Base64-kodierte Zeichenfolge des zusammengefügten `数据密文` werden durch '.' getrennt zusammengefügt.
6. Die endgültig zusammengesetzte Zeichenfolge wird in der Datenbank gespeichert.


## Umgebungsvariablen

Wenn Sie `应用密钥` festlegen möchten, können Sie die Umgebungsvariable `ENCRYPTION_FIELD_KEY_PATH` verwenden. Das Plugin lädt die Datei unter diesem Pfad als `应用密钥`.

Anforderungen an das Dateiformat von `应用密钥`:
1. Die Dateierweiterung muss `.key` sein.
2. Der Dateiname wird als Schlüssel-ID verwendet; für die Eindeutigkeit wird die Verwendung einer UUID empfohlen.
3. Der Dateiinhalt besteht aus Base64-kodierten 32-Bit-Binärdaten.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Feldkonfiguration

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Auswirkungen der Verschlüsselung auf Filter

Verschlüsselte Felder unterstützen nur: gleich, ungleich, vorhanden und nicht vorhanden.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Methode zur Datenfilterung:
1. Den `字段密钥` des verschlüsselten Felds abrufen und den `字段密钥` mit `应用密钥` entschlüsseln.
2. Den vom Benutzer eingegebenen Suchtext mit `字段密钥` signieren (Hash-Algorithmus `HMAC-SHA256`).
3. Den signierten Suchtext mit dem Trennzeichen `.` zusammenfügen und in der Datenbank eine Präfixsuche im verschlüsselten Feld durchführen.

## Schlüsselrotation

:::warning
Vergewissern Sie sich vor der Verwendung des Schlüsselrotationsbefehls `nocobase key-rotation`, dass die Anwendung dieses Plugin geladen hat.
:::

Wenn die Anwendung in eine neue Umgebung migriert wurde und nicht weiterhin denselben Schlüssel wie in der alten Umgebung verwenden soll, können Sie den Befehl `nocobase key-rotation` verwenden, um `应用密钥` zu ersetzen.

Für die Ausführung des Schlüsselrotationsbefehls muss der Anwendungsschlüssel der alten Umgebung angegeben werden. Nach der Ausführung wird ein neuer Anwendungsschlüssel generiert und der alte Schlüssel ersetzt. Der neue Anwendungsschlüssel wird Base64-kodiert im Standardspeicherverzeichnis gespeichert.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Wenn `应用密钥` einer Unteranwendung ersetzt wird, muss der Parameter `--app-name` hinzugefügt werden, um `name` der Unteranwendung anzugeben.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
