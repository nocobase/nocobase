---
pkg: '@nocobase/plugin-ai'
title: 'Mit Lina und lokalem HY-MT1.5-1.8B Lokalisierungseinträge übersetzen'
description: 'HY-MT1.5 GGUF mit llama-server bereitstellen und für Lina konfigurieren, um NocoBase-Lokalisierungseinträge stapelweise zu übersetzen.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Mit Lina und lokalem HY-MT1.5-1.8B Lokalisierungseinträge übersetzen

Diese Anleitung beschreibt eine Praxis für Lokalisierungsübersetzung: Ein kleines spezialisiertes Übersetzungsmodell wird lokal bereitgestellt, als OpenAI-kompatibler Dienst veröffentlicht und für Lina konfiguriert, um NocoBase-Lokalisierungseinträge stapelweise zu übersetzen.

## Überblick

Diese Anleitung verwendet:

- Modell: `tencent/HY-MT1.5-1.8B-GGUF`
- Inferenzdienst: `llama-server`
- Integration: OpenAI-compatible API
- AI-Mitarbeiter: Lina
- Einstiegspunkt: Localization Management

:::info{title=Hinweis}
HY-MT1.5-1.8B ist ein kleines spezialisiertes Übersetzungsmodell. Es eignet sich besser für kurze Einträge, UI-Texte und Batch-Übersetzung als allgemeine Chatmodelle.
:::

## Voraussetzungen

- Das Plugin **Lokalisierungsverwaltung** ist aktiviert.
- Die Zielsprache ist aktiviert.
- Lokalisierungseinträge wurden synchronisiert.
- Die lokale Maschine oder der Server kann `llama-server` ausführen.
- Der NocoBase-Dienst kann die HTTP-Adresse von `llama-server` erreichen.

## HY-MT GGUF bereitstellen

### llama.cpp installieren

Unter macOS können Sie Homebrew verwenden:

```bash
brew install llama.cpp
```

Sie können auch ein vorgefertigtes Binary verwenden oder llama.cpp aus dem Quellcode bauen. Wichtig ist, dass `llama-server` verfügbar ist.

### OpenAI-kompatiblen Dienst starten

Starten Sie den Dienst mit dem GGUF-Modell von Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Parameter | Beschreibung |
| --- | --- |
| `-hf` | Modell von Hugging Face laden. |
| `--host` | Adresse, an der der Dienst lauscht. |
| `--port` | HTTP-Port des Dienstes. |
| `-c` | Kontextlänge. Lokalisierungseinträge sind meist kurz, daher reicht `2048` normalerweise aus. |
| `-np` | Anzahl paralleler Slots. Nach Maschinenleistung anpassen. |

## Modelldienst testen

Prüfen Sie nach dem Start den Dienstzustand:

```bash
curl http://127.0.0.1:8000/health
```

Testen Sie anschließend die Übersetzung über die OpenAI-kompatible API:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

Wenn Sie mit einer lokalen Modelldatei starten, ändern Sie `model` auf den tatsächlichen Modellnamen des Dienstes.

## LLM-Dienst in NocoBase konfigurieren

Gehen Sie zu `System Settings -> AI Employees -> LLM service` und fügen Sie einen LLM-Dienst hinzu.

| Einstellung | Beispiel |
| --- | --- |
| Anbieter | OpenAI (completions) |
| Titel | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Wenn `llama-server` keine Authentifizierung nutzt, verwenden Sie z. B. `dummy`. |
| Aktivierte Modelle | `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M` |

Verwenden Sie nach der Konfiguration `Test flight`, um das Modell zu prüfen.

:::info{title=Hinweis}
Wenn NocoBase in Docker läuft, zeigt `127.0.0.1` auf den Container selbst. Verwenden Sie Host-IP, Container-Netzwerkadresse oder `host.docker.internal`.
:::

## Dediziertes Modell für Lina konfigurieren

Öffnen Sie Lina unter `System Settings -> AI Employees -> AI employees` und wechseln Sie zu `Model settings`.

1. Aktivieren Sie `Enable dedicated model configuration`.
2. Wählen Sie das lokale HY-MT-Modell unter `Models`.
3. Speichern Sie die Konfiguration.

Danach verwendet Lina dieses Modell für Lokalisierungsübersetzungen und verhindert den Wechsel auf allgemeine Chatmodelle.

## Übersetzungsparallelität konfigurieren

Die Parallelität der Lokalisierungsübersetzung wird über `AI_LOCALIZATION_CONCURRENCY` gesteuert:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

- Standard: `10`
- Minimum: `1`
- Maximum: `20`
- Werte außerhalb des Bereichs verwenden den Standardwert.

Die beste Parallelität hängt von CPU, GPU, Speicher, Quantisierung und `llama-server -np` ab. Beginnen Sie niedrig und erhöhen Sie nur, wenn die Ausführung stabil ist.

## Lokalisierungsübersetzung ausführen

Gehen Sie zu `System Management -> Localization Management`.

1. Zur Zielsprache wechseln.
2. Auf `Synchronize` klicken, um Einträge zu synchronisieren.
3. Linas Avatar anklicken.
4. Nach Bedarf auswählen:
   - `Incremental translation`: übersetzt Einträge, die noch keine Übersetzung haben.
   - `Selected translation`: übersetzt die in der Tabelle ausgewählten Einträge.
   - `Full translation`: übersetzt alle Einträge der aktuellen Sprache.
5. Anzahl, Anbieter und Modell im Bestätigungsdialog prüfen.
6. Bei inkrementeller oder vollständiger Übersetzung den Übersetzungsumfang auswählen:
   - `All`
   - `Built-in entries`: System- und Plugin-Einträge.
   - `Custom entries`: Routennamen, Sammlungs- und Feldnamen sowie UI-Inhalte.
7. Referenzübersetzungssprachen bei Bedarf anpassen. Inkrementelle und vollständige Übersetzung konfigurieren Referenzsprachen separat für integrierte und benutzerdefinierte Einträge; die Übersetzung ausgewählter Einträge zeigt nur eine allgemeine Referenzsprachen-Konfiguration.
8. Bestätigen, um die asynchrone Aufgabe zu erstellen.
9. Nach Abschluss Übersetzungen prüfen und veröffentlichen.

Starten Sie mit `Selected translation` für einige Einträge, um Stil und Geschwindigkeit zu prüfen.

## Wie Lina Übersetzungsanfragen erstellt

Lina erstellt Anfragen aus Einträgen und Referenzübersetzungen. Für kurze Einträge werden vorhandene Referenzen genutzt, um Konsistenz zu verbessern:

- Integrierte Einträge verwenden standardmäßig chinesische Übersetzungen als Referenz und Japanisch als Fallback-Referenz.
- Benutzerdefinierte Einträge verwenden standardmäßig die Systemsprache als Referenz und Chinesisch als Fallback-Referenz.
- Benutzer können Standardsprache und Fallback-Sprache im Bestätigungsdialog der Aufgabe anpassen.
- Das System verwendet zuerst die Referenzübersetzung in der Standardsprache. Wenn sie nicht vorhanden ist, versucht es die Fallback-Sprache.
- Übersetzungsergebnisse werden in die Zielsprache geschrieben, aber nicht automatisch veröffentlicht.

Die Prompt-Semantik ähnelt:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Fehlerbehebung

- Wenn nach dem Erstellen einer Aufgabe kein Fortschritt sichtbar ist, prüfen Sie, ob `llama-server` Anfragen erhalten hat. Senken Sie bei langen Wartezeiten `AI_LOCALIZATION_CONCURRENCY`, `llama-server -np` und `llama-server -c`.
- Wenn das Modell Erklärungen statt Übersetzungen zurückgibt, testen Sie denselben Prompt mit `curl` und reduzieren Sie ggf. Sampling-Parameter wie Temperature.
- Wenn NocoBase den Dienst nicht erreicht, prüfen Sie `/v1` in der Base URL, Netzwerk, Firewall, Containeradresse und ob `llama-server` läuft.

## Prüfung vor Veröffentlichung

Nach der AI-Übersetzung vor der Veröffentlichung prüfen:

- Nach Modul filtern und kurze Einträge wie Menüs, Buttons, Feldnamen und Status prüfen.
- Variablen, Platzhalter, HTML-Tags und Formatierungssymbole prüfen.
- Wichtige Geschäftsterminologie auf Konsistenz prüfen.
- Wenn integrierte Übersetzungen überschrieben wurden, erneut synchronisieren und `Reset system built-in entry translations` auswählen. Für Beiträge siehe [Translation Contribution](/get-started/translations).
- Zuerst in einer Testumgebung veröffentlichen, dann nach Produktion synchronisieren.

## Referenzen

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [llama-server documentation](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina](/ai-employees/built-in/lina)
