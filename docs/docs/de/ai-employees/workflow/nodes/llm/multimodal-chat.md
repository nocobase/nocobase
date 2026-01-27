---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Multimodale Konversation

## Bilder

Wenn das Modell dies unterstützt, kann der LLM-Knoten Bilder an das Modell senden. Dabei müssen Sie über eine Variable ein Anhangsfeld oder einen verknüpften Datensatz einer Dateisammlung auswählen. Wenn Sie einen Datensatz einer Dateisammlung auswählen, können Sie diesen auf Objektebene oder das URL-Feld auswählen.

![](https://static-docs.nocobase.com/202503041034858.png)

Für das Sendeformat von Bildern stehen Ihnen zwei Optionen zur Verfügung:

- **Per URL senden** – Alle Bilder, außer lokal gespeicherte, werden als URLs gesendet. Lokal gespeicherte Bilder werden vor dem Senden in das Base64-Format konvertiert.
- **Per Base64 senden** – Alle Bilder, ob lokal oder in der Cloud gespeichert, werden im Base64-Format gesendet. Dies ist nützlich, wenn die Bild-URL vom Online-LLM-Dienst nicht direkt zugänglich ist.

![](https://static-docs.nocobase.com/202503041200638.png)