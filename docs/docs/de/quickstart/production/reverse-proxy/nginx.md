# Nginx

Wenn deine NocoBase-App bereits über `http://127.0.0.1:13000` erreichbar ist, besteht der nächste Schritt normalerweise darin, davor noch eine Nginx-Schicht zu setzen. Das bringt meist zwei direkte Vorteile: Nach außen gibst du nur die Standardports `80/443` frei, und später lassen sich HTTPS, Zertifikate und Caching einfacher ergänzen.

## Minimale lauffähige Konfiguration

Lege auf dem Server zuerst eine Konfigurationsdatei an, zum Beispiel `/etc/nginx/conf.d/nocobase.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Dabei gilt:

- Ersetze `server_name` durch deine Domain
- Ersetze `127.0.0.1:13000` durch die tatsächliche Adresse, auf der NocoBase lauscht
- `client_max_body_size` kannst du je nach Upload-Bedarf weiter erhöhen

## Konfiguration prüfen und neu laden

```bash
nginx -t
systemctl reload nginx
```

Wenn du Nginx nicht mit `systemd` verwaltest, verwende stattdessen deinen eigenen Reload-Workflow.

## Wie du danach darauf zugreifst

Wenn DNS bereits auf diesen Server zeigt, rufe Folgendes auf:

```text
http://your-domain.com
```

Dann leitet Nginx die Anfrage an NocoBase weiter.

## Was ist mit HTTPS

Wenn du zusätzlich HTTPS brauchst, gibt es normalerweise zwei gängige Wege:

- Du konfigurierst die Zertifikate weiter direkt in Nginx
- Du wechselst direkt zu [Caddy](./caddy.md), damit Zertifikate automatisch beantragt und erneuert werden

## Wohin du als Nächstes gehen kannst

- Wenn deine App noch nicht läuft, lies zuerst [Installation mit Docker Compose](../../installation/docker-compose.md)
- Wenn du noch Ports oder Schlüssel prüfen musst, lies weiter unter [App-Umgebungsvariablen](../../installation/env.md)
