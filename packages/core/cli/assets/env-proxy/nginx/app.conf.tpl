# Rendered by `nb env proxy`.
# Context:
# publicBasePath={{publicBasePath}}
# apiBasePath={{apiBasePath}}
# wsPath={{wsPath}}
# v2PublicPath={{v2PublicPath}}
# backendUrl={{backendUrl}}
# snippetsDir={{snippetsDir}}
# uploadsDir={{uploadsDir}}
# distRootDir={{distRootDir}}
# entryDir={{entryDir}}
# publicDir={{publicDir}}

server {
    listen 80;
    server_name _;

    # Add custom directives or locations above the managed block as needed.

{{managedConfigBlock}}

    # Add custom directives or locations below the managed block as needed.
}
