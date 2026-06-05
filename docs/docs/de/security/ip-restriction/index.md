---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# IP-Beschränkungen

## Einführung

NocoBase unterstützt Administratoren dabei, Whitelists oder Blacklists für Benutzer-IPs einzurichten. Dies dient dazu, unautorisierte externe Netzwerkverbindungen zu beschränken oder bekannte bösartige IP-Adressen zu blockieren und somit Sicherheitsrisiken zu reduzieren. Zudem können Administratoren Zugriffsverweigerungs-Logs abfragen, um riskante IPs zu identifizieren.

## Konfigurationsregeln

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### IP-Filtermodi

- Blacklist: Wenn die Zugriffs-IP eines Benutzers mit einer IP in der Liste übereinstimmt, wird das System den Zugriff **verweigern**; nicht übereinstimmende IPs sind standardmäßig **erlaubt**.
- Whitelist: Wenn die Zugriffs-IP eines Benutzers mit einer IP in der Liste übereinstimmt, wird das System den Zugriff **erlauben**; nicht übereinstimmende IPs sind standardmäßig **verboten**.

### IP-Liste

Dient zur Definition von IP-Adressen, denen der Zugriff auf das System erlaubt oder verweigert wird. Ihre spezifische Funktion hängt vom gewählten IP-Filtermodus ab. Sie können IP-Adressen oder CIDR-Netzwerksegmente eingeben, wobei mehrere Adressen durch Kommas oder Zeilenumbrüche getrennt werden.

## Logs abfragen

Nachdem einem Benutzer der Zugriff verweigert wurde, wird die Zugriffs-IP in die System-Logs geschrieben. Die entsprechenden Log-Dateien können zur Analyse heruntergeladen werden.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Log-Beispiel:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Konfigurationsempfehlungen

### Empfehlungen für den Blacklist-Modus

- Fügen Sie bekannte bösartige IP-Adressen hinzu, um potenzielle Netzwerkangriffe zu verhindern.
- Überprüfen und aktualisieren Sie die Blacklist regelmäßig, um ungültige oder nicht mehr zu blockierende IP-Adressen zu entfernen.

### Empfehlungen für den Whitelist-Modus

- Fügen Sie vertrauenswürdige interne Netzwerk-IP-Adressen (z. B. Büronetzwerksegmente) hinzu, um einen sicheren Zugriff auf Kernsysteme zu gewährleisten.
- Vermeiden Sie es, dynamisch zugewiesene IP-Adressen in die Whitelist aufzunehmen, um Zugriffsunterbrechungen zu vermeiden.

### Allgemeine Empfehlungen

- Verwenden Sie CIDR-Netzwerksegmente, um die Konfiguration zu vereinfachen, z. B. 192.168.0.0/24 anstelle einzeln hinzugefügter IP-Adressen.
- Sichern Sie die IP-Listen-Konfigurationen regelmäßig, um bei Fehlbedienungen oder Systemausfällen eine schnelle Wiederherstellung zu ermöglichen.
- Überwachen Sie die Zugriffs-Logs regelmäßig, um ungewöhnliche IPs zu identifizieren und die Blacklist oder Whitelist zeitnah anzupassen.