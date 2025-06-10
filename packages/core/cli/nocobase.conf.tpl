log_format apm '"$time_local" client=$remote_addr '
               'method=$request_method request="$request" '
               'request_length=$request_length '
               'status=$status bytes_sent=$bytes_sent '
               'body_bytes_sent=$body_bytes_sent '
               'referer=$http_referer '
               'user_agent="$http_user_agent" '
               'upstream_addr=$upstream_addr '
               'upstream_status=$upstream_status '
               'request_time=$request_time '
               'upstream_response_time=$upstream_response_time '
               'upstream_connect_time=$upstream_connect_time '
               'upstream_header_time=$upstream_header_time';

server {
    listen 80;
    server_name _;
    root {{cwd}}/node_modules/@nocobase/app/dist/client;
    index index.html;
    client_max_body_size 0;
    access_log /var/log/nginx/nocobase.log apm;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location {{publicPath}}storage/uploads/ {
        alias {{cwd}}/storage/uploads/;
        add_header Cache-Control "public";
        access_log off;
        autoindex off;
    }

    location {{publicPath}}static/plugins/ {
        alias {{cwd}}/node_modules/;
        expires 365d;
        add_header Cache-Control "public";
        access_log off;
        autoindex off;

        location ~ ^/static/plugins/@([^/]+)/([^/]+)/dist/client/(.*)$ {
            allow all;
        }

        location ~ ^/static/plugins/([^/]+)/dist/client/(.*)$ {
            allow all;
        }

        location ~ ^/static/plugins/(.*)$ {
            deny all;
        }
    }

    location {{publicPath}} {
        alias {{cwd}}/node_modules/@nocobase/app/dist/client/;
        try_files $uri $uri/ /index.html;
        add_header Last-Modified $date_gmt;
        add_header Cache-Control 'no-store, no-cache';
        add_header X-Robots-Tag "noindex, nofollow";
        if_modified_since off;
        expires off;
        etag off;
        location ~* \.(js|css)$ {
            expires 365d;
            add_header Cache-Control "public";
        }
    }

    {{otherLocation}}

    location ^~ {{publicPath}}api/ {
        proxy_pass http://127.0.0.1:{{apiPort}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        add_header Cache-Control 'no-cache, no-store';
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    location {{publicPath}}ws {
      proxy_pass http://127.0.0.1:{{apiPort}}{{publicPath}}ws;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $host;
    }
}
