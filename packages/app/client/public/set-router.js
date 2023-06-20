var match = location.pathname.match(/^\/apps\/([^/]*)\//);
window.routerBase = match ? match[0] : "/";