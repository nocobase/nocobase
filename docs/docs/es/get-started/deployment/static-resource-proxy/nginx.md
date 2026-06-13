---
title: "Proxy de recursos estáticos con Nginx"
description: "Utiliza Nginx como proxy de recursos estáticos de NocoBase para mejorar el rendimiento y la estabilidad en producción."
keywords: "Nginx,proxy de recursos estáticos,reverse proxy,despliegue en producción,NocoBase"
---

# Nginx

Si hoy quieres configurar el proxy de producción para una aplicación NocoBase, lo mejor es empezar por [Reverse proxy en producción](../../../nocobase-cli/production/reverse-proxy/index.md) y después por la página [Nginx](../../../nocobase-cli/production/reverse-proxy/nginx.md).

Esta sección antigua servía principalmente como punto de entrada para el proxy de recursos estáticos. La documentación actual se reorganizó alrededor de `nb proxy nginx`, que cubre de forma unificada la generación de configuración, la ejecución local o con Docker, y las rutas `uploads`, `dist`, `api`, `ws` y SPA.
