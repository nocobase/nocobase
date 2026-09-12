# NocoBase schneller deployen

Viele Anwender empfinden die Zugriffsgeschwindigkeit von NocoBase nach dem Deployment als nicht zufriedenstellend. Meist liegt das an Netzwerk, Server-Konfiguration oder Architektur. Bevor wir Optimierungen vorstellen, hier eine Referenz, wie schnell NocoBase normalerweise lädt - um unnötige Sorgen zu vermeiden.

### Referenzgeschwindigkeit von NocoBase

Folgende Werte wurden in der Demo-Umgebung gemessen:

- Erstaufruf der Anwendung über die URL ca. 2 Sekunden
- Seitenwechsel innerhalb der App 50-300 Millisekunden

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

Nun teilen wir einfache, wirkungsvolle Optimierungen, die Sie ohne Codeänderung umsetzen können:

## I. Netzwerk und Infrastruktur

### 1. HTTP-Protokollversion: HTTP/2 nutzen

【Voraussetzungen】

- **HTTPS erforderlich**: Wichtig! Praktisch alle modernen Browser unterstützen HTTP/2 nur über HTTPS - SSL-Zertifikat zuerst einrichten.
- **Server**: HTTP/2-fähige Server-Software wie Nginx 1.9.5+ oder Apache 2.4.17+.
- **TLS-Version**: Empfohlen TLS 1.2 oder höher (TLS 1.3 ist optimal); ältere SSL-Versionen unterstützen kein HTTP/2.

【Hinweis】

HTTP/1.1 limitiert parallele Requests (üblich 6-8 gleichzeitige Verbindungen) - vergleichbar mit Schlange stehen.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 setzt auf Multiplexing und beschleunigt das Laden vieler Ressourcen erheblich; HTTP/3 brilliert in instabilen Netzen.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【Empfehlung】

- Aktivieren Sie HTTP/2 auf Ihrem Webserver. Bei Nginx, Caddy etc. ist die Konfiguration einfach.
- In Nginx genügt der `http2`-Parameter im listen:

```nginx
listen 443 ssl http2;
```

【Verifikation】

In den DevTools des Browsers im Tab „Netzwerk" rechtsklicken und „Protocol" einblenden:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

In unseren Tests stieg die Geschwindigkeit um etwa 10 %, mit vielen Blöcken und Ressourcen ist der Effekt größer.

### 2. Bandbreite: mehr ist mehr, flexibel abrechnen

【Hinweis】

Wie eine Autobahn: Mehr Bandbreite, schnellere Übertragung. NocoBase lädt beim Erststart viele Frontend-Ressourcen - zu wenig Bandbreite wird zum Engpass.

【Empfehlung】

- Wählen Sie ausreichend Bandbreite (bei vielen Anwendern empfohlen über 50 Mbit/s).
- Nutzen Sie nach Möglichkeit „Pay per Traffic" - viele Cloud-Anbieter bieten diesen flexiblen Modus, der zu Spitzenzeiten mehr Bandbreite erlaubt und sonst Kosten spart.

### 3. Latenz und Server-Standort

【Hinweis】

Latenz ist die Wartezeit der Datenübertragung. Selbst bei viel Bandbreite verlangsamt ein weit entfernter Server jede Anfrage.

【Empfehlung】

- Server möglichst nah an der Nutzergruppe platzieren.
- Bei globaler Nutzergruppe können Global Acceleration Services (z. B. Alibaba Cloud Global Accelerator, AWS Global Accelerator) das Routing optimieren.

【Verifikation】

Mit `ping` die Latenz unterschiedlicher Standorte testen.
Dies ist die wirkungsvollste Maßnahme - 1 bis 3-fache Beschleunigung je nach Region.
12 Zeitzonen, 13 Sekunden:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

2 Zeitzonen, 8 Sekunden:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Eigene Region, ca. 3 Sekunden:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Deployment-Architektur

### 4. Server-Deployment und Reverse-Proxy

【Voraussetzungen】

- **Server-Rechte**: root oder sudo erforderlich, um Dienste wie Nginx zu konfigurieren.
- **Grundkenntnisse**: Ein wenig Server-Wissen ist nötig - wir liefern konkrete Beispiele.
- **Port-Zugriff**: Firewall muss Port 80 (HTTP) und 443 (HTTPS) erlauben.

【Hinweis】

Die richtige Deployment-Variante hilft dem Server, Anfragen effizient zu bearbeiten.

【Optionen】

**Ohne Reverse-Proxy (nicht empfohlen):**

- Nachteil: einfach, aber bei vielen parallelen Anfragen oder statischen Dateien wenig performant. Nur für Entwicklung/Test.
- Empfehlung: vermeiden.

> Siehe „[Installationsdokumentation](https://docs.nocobase.com/cn/get-started/quickstart)"

Ohne Reverse-Proxy: Startseite ca. 6,1 Sekunden
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Mit Nginx / Caddy als Reverse-Proxy (sehr empfohlen):**

- Vorteil: Reverse-Proxies behandeln viele Verbindungen, liefern statische Dateien, lasten Anfragen aus und konfigurieren HTTP/2 einfach.
- Empfehlung: Im Produktivbetrieb (Quellcode / create-nocobase-app / Docker-Image) Nginx oder Caddy als Reverse-Proxy nutzen.

> Siehe „[Deployment-Dokumentation](https://docs.nocobase.com/cn/get-started/deployment/production)"

Mit Nginx-Proxy: Startseite ca. 3-4 Sekunden
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Cluster-Deployment mit Load Balancer (für hohe Last und Verfügbarkeit):**

- Vorteil: Mehrere Instanzen erhöhen Stabilität und Parallelität deutlich.
- Details siehe **[Cluster-Modus](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. CDN für statische Ressourcen

【Voraussetzungen】

- **Domain**: registrierte Domain mit DNS-Verwaltung.
- **SSL-Zertifikat**: meistens nötig (z. B. Let's Encrypt).
- **CDN-Anbieter**: passend zur Zielregion (in China ein CDN mit ICP-Lizenz).

【Hinweis】

Ein CDN cached statische Ressourcen weltweit; Anwender beziehen Inhalte vom nächsten Knoten - das senkt die Latenz drastisch.

Außerdem entlastet ein CDN den Anwendungsserver erheblich. Ohne CDN treffen alle Requests (JavaScript, CSS, Bilder ...) Ihren Server, was Bandbreite, Performance und Stabilität gefährden kann. Ein CDN entkoppelt diese Anfragen.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【Empfehlung】

- Konfigurieren Sie den Server so, dass statische Assets über ein CDN ausgeliefert werden.
- Wählen Sie nach Region:

  - Weltweit: Cloudflare, Akamai, AWS CloudFront
  - Festland-China: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration

Beispielkonfiguration:

```nginx
# Statische Ressourcen an CDN-Domain weiterleiten
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Für kleinere Projekte reicht oft das kostenlose Cloudflare-CDN:

1. Cloudflare-Account anlegen und Domain hinzufügen.
2. DNS auf Cloudflare-Server umstellen.
3. Im Dashboard passende Cache-Stufe einstellen.

**Hinweis**: Auch wenn Ihre Nutzer alle in einer Region sind, lohnt sich ein CDN - es entlastet Ihren Server und stabilisiert das System, besonders bei hohem Traffic.

## III. Optimierung statischer Ressourcen

### 6. Server-Komprimierung und Caching

【Voraussetzungen】

- **CPU-Ressourcen**: Komprimierung erhöht die CPU-Last - der Server sollte ausreichend leistungsstark sein.
- **Nginx-Module**: Gzip ist meist eingebaut, Brotli erfordert ggf. zusätzliche Module.
- **Konfigurationsrechte**: Sie müssen Server-Konfigurationen ändern können.

【Hinweis】

Komprimierung und sinnvolle Cache-Strategien reduzieren Datenvolumen und Wiederholungs-Requests deutlich.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【Empfehlung】

- Einfachster Weg: Gratis-CDN von Cloudflare nutzen, das automatisch Gzip aktiviert.
- Gzip oder Brotli in Nginx aktivieren:

```nginx
# Gzip aktivieren
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Brotli für noch effizientere Komprimierung (falls verfügbar)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

- Cache-Header für statische Ressourcen setzen:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. SSL/TLS verwenden und optimieren

【Voraussetzungen】

- **SSL-Zertifikat**: gültig (z. B. Let's Encrypt).
- **Konfigurationsrechte**: SSL-Konfigurationen ändern dürfen.
- **DNS**: zuverlässige Resolver für OCSP Stapling.

【Hinweis】

Sicherheit zuerst, doch falsch konfiguriertes HTTPS bremst. Folgende Tipps machen es schneller.

【Empfehlung】

- TLS 1.3 nutzen, das aktuell schnellste:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- OCSP Stapling aktivieren, um Zertifikatsprüfung zu beschleunigen:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Session-Wiederverwendung reduziert Handshake-Zeiten:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Effekt im internationalen Szenario】
**Hinweis**: Folgende Werte stammen aus internationalen Tests (12 Zeitzonen) - geografische Latenz lässt sich nicht eliminieren, aber spürbar reduzieren:

Mit Http2 + CDN-Cache + Gzip + Brotli:
Vorher (international), 13 Sekunden:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Nachher (international), 8 Sekunden:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Auch über große Entfernungen verkürzen die Maßnahmen die Ladezeit um ca. 40 % und verbessern die Nutzererfahrung deutlich.

## IV. Monitoring und Fehleranalyse

### 8. Performance-Monitoring und Grundanalyse

【Voraussetzungen】

- **Erreichbarkeit**: Online-Tools setzen voraus, dass Ihre Seite öffentlich zugänglich ist.
- **Grundkenntnisse**: Ein Verständnis der Performance-Metriken hilft - wir erklären die wichtigsten.

【Hinweis】

Ohne Engpassanalyse ist Optimierung unpräzise. Wir empfehlen kostenlose Tools.

【Empfehlung】

**Kostenlose Tools zur Analyse:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Wichtige Metriken:**

- Page Load Time
- Server Response Time
- DNS Resolution Time
- SSL Handshake Time

**Häufige Probleme:**

- DNS langsam? Anderer DNS-Anbieter oder DNS-Prefetching.
- SSL-Handshake langsam? SSL-Konfiguration optimieren, Session-Reuse aktivieren.
- Server langsam? Ressourcen prüfen, ggf. upgraden.
- Statische Assets langsam? CDN und Cache-Strategie nutzen.

## Schnell-Checkliste für Deployment-Optimierung

Diese Checkliste hilft beim schnellen Review:

1. **HTTP-Version**

   - [ ]  HTTPS aktiviert (Voraussetzung für HTTP/2)
   - [ ]  HTTP/2 aktiviert
   - [ ]  HTTP/3 (sofern möglich)
2. **Bandbreite**

   - [ ]  Ausreichend (mind. 10 Mbit/s, besser 50 Mbit/s+)
   - [ ]  Pay-per-Traffic statt fester Bandbreite
3. **Server-Standort**

   - [ ]  Nahe der Nutzergruppe
   - [ ]  Global-Acceleration für globale Anwender
4. **Architektur**

   - [ ]  Nginx/Caddy als Reverse-Proxy, statische Assets von API getrennt
   - [ ]  Bei Bedarf Multi-Instance + Load Balancer
5. **CDN**

   - [ ]  Statische Ressourcen über CDN
   - [ ]  Sinnvolle Cache-Strategie
   - [ ]  HTTP/2 oder HTTP/3 im CDN
6. **Komprimierung & Cache**

   - [ ]  Gzip oder Brotli aktiviert
   - [ ]  Browser-Cache-Header gesetzt
7. **SSL/TLS**

   - [ ]  TLS 1.3 für schnelleren Handshake
   - [ ]  OCSP Stapling
   - [ ]  SSL-Session-Reuse konfiguriert
8. **Monitoring**

   - [ ]  Regelmäßige Performance-Tests
   - [ ]  Schlüsselmetriken überwachen
   - [ ]  Probleme gezielt optimieren

## FAQ

【Frage】Mein Server steht im Ausland, Nutzer aus China haben langsamen Zugriff. Was tun?

【Antwort】Am besten einen Cloud-Server in der entsprechenden Region wählen. Falls nicht möglich:

1. Inländisches CDN für statische Ressourcen.
2. Global-Acceleration zur Routenoptimierung.
3. Alle Komprimierungs- und Cache-Optimierungen aktivieren.

【Frage】Warum lädt NocoBase beim ersten Mal langsam, danach schnell?

【Antwort】Das ist normal - beim Erststart werden viele Ressourcen geladen. In unserer Demo dauert er ca. 3 Sekunden.

Anschließend dauert der Aufruf der App 1-2 Sekunden, Seitenwechsel 50-300 Millisekunden.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Bei langen Ladezeiten lässt sich weiter optimieren:

1. HTTP/2 sicherstellen.
2. CDN nutzen.
3. Gzip/Brotli aktivieren.
4. Bandbreite prüfen.

【Frage】Ich nutze Shared Hosting und kann Nginx nicht ändern. Was tun?

【Antwort】Optionen sind eingeschränkt, aber:

1. CDN (z. B. Cloudflare) testen.
2. Anwendungsparameter optimieren.
3. Sofern möglich, auf einen VPS upgraden.

---

Mit diesen einfachen, praxisnahen Tipps beschleunigen Sie NocoBase deutlich und bieten Anwendern eine flüssigere Erfahrung. Viele Optimierungen lassen sich in wenigen Stunden umsetzen - ganz ohne Code-Änderung.
