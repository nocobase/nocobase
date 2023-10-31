import DumiPreviewerActions from 'dumi/theme-default/slots/PreviewerActions';
import React, { useRef, useEffect, useState } from 'react';
import { Spin } from 'antd'

import { IPreviewerProps } from 'dumi';

const indexHtml = `<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
`

const mainTsx = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`

const packageJson = `
{
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
  },
  "devDependencies": {
    "flat": "^5.0.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "less": "^4.2.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}
`

const tsConfigJson = `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "composite": true,
    "strict": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowSyntheticDefaultImports": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "src",
    "vite.config.ts"
  ]
}
`

const viteConfigTs = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`

const sandboxTask = `
{
  "setupTasks": [
    {
      "name": "Install Dependencies",
      "command": "yarn install"
    }
  ],
  "tasks": {
    "dev": {
      "name": "dev",
      "command": "yarn dev",
      "runAtStart": true,
      "preview": {
        "port": 5173
      }
    },
    "build": {
      "name": "build",
      "command": "yarn build",
      "runAtStart": false
    },
    "preview": {
      "name": "preview",
      "command": "yarn preview",
      "runAtStart": false
    }
  }
}
`

function getCSBData(opts: IPreviewerProps, ext: string) {

  const files: Record<
    string,
    {
      content: string;
      isBinary: boolean;
    }
  > = {};
  const deps: Record<string, string> = {};
  const entryFileName = `index${ext}`;

  Object.entries(opts.asset.dependencies).forEach(([name, { type, value }]) => {
    if (type === 'NPM') {
      // generate dependencies
      deps[name] = value;
    } else {
      // append other imported local files
      files[name === entryFileName ? `src/App${ext}` : name] = {
        content: value,
        isBinary: false,
      };
    }
  });

  // append package.json
  let pkg = JSON.parse(packageJson)
  try {
    for (let key in deps) {
      if (!pkg['devDependencies'][key]) {
        pkg.dependencies[key] = deps[key]
      }
    }
  } catch (e) {
    console.log(e)
  }
  files['package.json'] = {
    content: JSON.stringify(
      {
        name: opts.title,
        ...pkg,
      },
      null,
      2,
    ),
    isBinary: false,
  };

  files['index.html'] = { content: indexHtml, isBinary: false };
  files['src/main.tsx'] = { content: mainTsx, isBinary: false };
  files['package.json'] = { content: JSON.stringify(pkg, null, 2), isBinary: false };
  files['.codesandbox/task.json'] = { content: sandboxTask, isBinary: false };
  files['tsconfig.json'] = { content: tsConfigJson, isBinary: false };
  files['vite.config.ts'] = { content: viteConfigTs, isBinary: false };

  return { files };
}


export function openCodeSandbox(opts: IPreviewerProps) {
  const isTSX = Boolean(opts.asset.dependencies?.['index.tsx']);
  const ext = isTSX ? '.tsx' : '.jsx';
  return fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(getCSBData(opts, ext))
  })
    .then(x => x.json())
    .then(data => {
      window.open(`https://codesandbox.io/p/sandbox/${data.sandbox_id}?file=/src/App${ext}`);
    });
}


const PreviewerActions: typeof DumiPreviewerActions = (props) => {
  const div = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (div.current) {
      const element = div.current.querySelector('.dumi-default-previewer-action-btn');
      element?.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        setLoading(true);
        openCodeSandbox(props).finally(() => {
          setLoading(false);
        });
      })
    }
  }, [div])

  return <Spin spinning={loading}><div ref={div}><DumiPreviewerActions {...props} disabledActions={['STACKBLITZ']} /></div></Spin>
};

export default PreviewerActions;
