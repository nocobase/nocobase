---
title: "Проксирование статических ресурсов через Nginx"
description: "Используйте Nginx как proxy для статических ресурсов NocoBase, чтобы улучшить производительность и стабильность в продакшене."
keywords: "Nginx,proxy статических ресурсов,reverse proxy,развертывание в продакшене,NocoBase"
---

# Nginx

Если вам сейчас нужно настроить production-proxy для приложения NocoBase, лучше начать со страницы [Reverse proxy в продакшене](../../../nocobase-cli/production/reverse-proxy/index.md), а затем перейти к странице [Nginx](../../../nocobase-cli/production/reverse-proxy/nginx.md).

Этот более старый раздел в основном служил точкой входа для proxy статических ресурсов. Текущая документация была переорганизована вокруг `nb proxy nginx` и теперь единообразно описывает генерацию конфигурации, локальный или Docker-запуск, а также маршруты `uploads`, `dist`, `api`, `ws` и SPA.
