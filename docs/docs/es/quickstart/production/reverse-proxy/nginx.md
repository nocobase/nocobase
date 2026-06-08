# Nginx

Para los env de NocoBase gestionados por la CLI, la ruta recomendada es `nb env proxy nginx`. Si la app no está gestionada por la CLI, mantén un bloque `server` normal y apunta `proxy_pass` a la dirección interna real de NocoBase.
