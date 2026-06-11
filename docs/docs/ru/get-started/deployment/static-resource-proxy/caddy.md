---
title: "Проксирование статических ресурсов через Caddy"
description: "Используйте Caddy как proxy для статических ресурсов NocoBase, чтобы упростить HTTPS и входную конфигурацию в продакшене."
keywords: "Caddy,proxy статических ресурсов,reverse proxy,автоматический HTTPS,продакшен,NocoBase"
---

# Caddy

Если вам сейчас нужно настроить production-proxy для приложения NocoBase, лучше начать со страницы [Reverse proxy в продакшене](../../../nocobase-cli/production/reverse-proxy/index.md), а затем перейти к странице [Caddy](../../../nocobase-cli/production/reverse-proxy/caddy.md).

Этот более старый раздел в основном служил точкой входа для proxy статических ресурсов. Текущая документация была переорганизована вокруг `nb proxy caddy` и теперь единообразно описывает генерацию конфигурации, локальный или Docker-запуск, HTTPS-вход и маршруты `uploads`, `dist`, `api`, `ws` и SPA.
