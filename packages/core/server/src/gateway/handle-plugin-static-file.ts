import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs';

const cwd = process.cwd();
const NODE_MODULES = path.join(cwd, 'node_modules');

const PREFIX = '/api/plugins/client/';

const isMatchClientStaticUrl = (url: string) => {
  return url.startsWith(PREFIX);
};

/**
 * get package name from url
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => @nocobase/plugin-acl
 * /api/plugins/client/my-plugin/README.md => my-plugin
 */
const getPackageName = (url: string) => {
  const urlArr = url.split('/');
  return urlArr[4].startsWith('@') ? `${urlArr[4]}/${urlArr[5]}` : urlArr[4];
};

/**
 * get plugin client static file real path
 *
 * @example
 * /api/plugins/client/@nocobase/plugin-acl/index.js => /node_modules/@nocobase/plugin-acl/dist/client/index.js
 * /api/plugins/client/my-plugin/README.md => /node_modules/my-plugin/dist/client/README.md
 */
const getRealPath = (packageName: string, url: string) => {
  const ext = path.extname(url);
  const filePath = url.replace(`${PREFIX}${packageName}/`, '');
  if (ext.toLowerCase() === '.md') {
    return path.join(NODE_MODULES, packageName, filePath);
  } else {
    return path.join(NODE_MODULES, packageName, 'dist', 'client', filePath);
  }
};

export async function handlePluginStaticFile(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (isMatchClientStaticUrl(req.url)) {
    // TODO: check packageName in plugins
    const packageName = getPackageName(req.url);

    const realPath = getRealPath(packageName, req.url);

    try {
      // get file stats
      const stats = await fs.promises.stat(realPath);

      const ifModifiedSince = req.headers['if-modified-since'];

      const lastModified = stats.mtime.toUTCString();

      // check cache headers
      if (ifModifiedSince === lastModified) {
        res.statusCode = 304;
        return true;
      }

      const relativePath = path.relative(cwd, realPath);

      res.writeHead(200, {
        'Content-Length': stats.size,
      });

      const readStream = fs.createReadStream(relativePath);
      readStream.pipe(res);
    } catch (e) {
      res.writeHead(404);
      res.end();
    }

    return true;
  }

  return false;
}
