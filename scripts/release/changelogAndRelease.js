const execa = require('execa');
const fs = require('fs/promises');
const path = require('path');
const { Command } = require('commander');
const program = new Command();

program.option('-f, --from [from]').option('-t, --to [to]').option('-v, --ver [ver]').option('--test');
program.parse(process.argv);

const header = {
  en: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`,
  cn: `# 更新日志

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
并且本项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。
`,
};

function parsePRBody(body, language) {
  const regExp = new RegExp(`${language}[ ]?\\|[ ]?([^\\|]*)\\|`, 'g');
  const match = [...body.matchAll(regExp)];
  if (!match.length) {
    return {
      description: '',
      docTitle: '',
      docLink: '',
    };
  }
  const description = match[0]?.[1].trim() || '';
  const docLink = match[1]?.[1].trim();
  if (!docLink || docLink.startsWith('<!--')) {
    return {
      description,
      docTitle: '',
      docLink: '',
    };
  }
  const docMatch = docLink.match(/\[(.*)\]\((.*)\)/);
  return {
    description,
    docTitle: docMatch[1],
    docLink: docMatch[2],
  };
}

// pkgType: oss, pro
async function getPackageJson(pkg, pkgType) {
  let dir;
  if (pkgType === 'oss') {
    dir = pkg.includes('plugin-') ? `plugins/@nocobase/${pkg}` : `core/${pkg}`;
  } else {
    dir = `pro-plugins/@nocobase/${pkg}`;
  }
  try {
    const pkgJSON = await fs.readFile(path.join(__dirname, '../../packages', dir, 'package.json'), 'utf8');
    return JSON.parse(pkgJSON);
  } catch (error) {
    console.error(`Get package.json for ${pkg} failed, error: ${error.message}`);
    return {};
  }
}

async function parsePackage(files, pkgType, pkg) {
  if (!pkg) {
    const maxChanges = { pkg: '', changes: 0 };
    for (const file of files) {
      const { path, additions, deletions } = file;
      const match = path.match(/(?:@nocobase|core)\/([^\/]+)/);
      const name = match && match[1];
      if (!name) {
        continue;
      }
      const changes = additions + deletions;
      if (changes > maxChanges.changes) {
        maxChanges.pkg = name;
        maxChanges.changes = changes;
      }
    }
    pkg = maxChanges.pkg;
  }
  if (!pkg) {
    return { displayName: '', cnDisplayName: '' };
  }
  const pkgJSON = await getPackageJson(pkg, pkgType);
  const { displayName, 'displayName.zh-CN': cnDisplayName, name } = pkgJSON;
  return { displayName, cnDisplayName, name };
}

async function parsePR(number, pkgType, cwd, pkg, retries = 10) {
  let { ver = 'beta' } = program.opts();
  // gh pr view 5112 --json author,body,files
  let res;
  try {
    const { stdout } = await execa('gh', ['pr', 'view', number, '--json', 'author,body,files,baseRefName'], { cwd });
    res = stdout;
  } catch (error) {
    console.error(`Get PR #${number} failed, error: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying... ${retries}`);
      retries -= 1;
      return parsePR(number, pkgType, cwd, pkg, retries);
    }
    return { number };
  }
  const { author, body, files, baseRefName } = JSON.parse(res);
  if (ver === 'alpha' && baseRefName !== 'next') {
    return { number };
  }
  const typeRegExp = /\[x\] ([^(\\\r)]+)/;
  const typeMatch = body.match(typeRegExp);
  const prType = typeMatch ? typeMatch[1] : '';
  if (!prType) {
    return { number };
  }
  const { description, docTitle, docLink } = parsePRBody(body, 'English');
  const { description: cnDescription, docTitle: cnDocTitle, docLink: cnDocLink } = parsePRBody(body, 'Chinese');
  const { displayName, cnDisplayName, name } = await parsePackage(files, pkgType, pkg);
  const pkgName = name?.split('/').pop();
  const changelog = {
    prType,
    number,
    author: author.login,
    moduleType: name?.includes('plugin-') ? 'plugin' : 'core',
    module: name,
    en: {
      module: displayName || pkgName,
      description,
      docTitle,
      docLink,
    },
    cn: {
      module: cnDisplayName || pkgName,
      description: cnDescription,
      docTitle: cnDocTitle,
      docLink: cnDocLink,
    },
  };
  return changelog;
}

async function getPRList(from, to, cwd) {
  // git log v1.3.9-beta..HEAD --pretty=format:"%s"
  const { stdout: logs } = await execa('git', ['log', `${from}..${to}`, '--pretty=format:%s'], { cwd });
  const prs = [];
  for (const log of logs.split('\n')) {
    const match = log.match(/\(#(\d+)\)/);
    if (match) {
      prs.push(match[1]);
    }
  }
  return prs;
}

function arrangeChangelogs(changelogs) {
  const result = {
    'New feature': {
      core: {},
      plugin: {},
    },
    Improvement: {
      core: {},
      plugin: {},
    },
    'Bug fix': {
      core: {},
      plugin: {},
    },
  };
  for (const changelog of changelogs) {
    const { prType, module, moduleType } = changelog;
    if (!result[prType]?.[moduleType]) {
      continue;
    }
    if (!result[prType][moduleType][module]) {
      result[prType][moduleType][module] = [];
    }
    result[prType][moduleType][module].push(changelog);
  }
  return result;
}

async function collect() {
  let { from, to, ver = 'beta' } = program.opts();
  if (!from || !to) {
    // git tag -l --sort=version:refname | grep "v*-ver" | tail -2
    const tagPattern = `v*-${ver}`;
    const { stdout: tags } = await execa(`git tag -l --sort=version:refname | grep "${tagPattern}" | tail -2`, {
      shell: true,
    });
    [from, to] = tags.split('\n');
  }
  console.log(`From: ${from}, To: ${to}`);
  const changelogs = [];
  const get = async (changelogs, pkgType, cwd, pkg) => {
    const prs = await getPRList(from, to, cwd);
    await Promise.all(
      prs.map(async (pr) => {
        console.log(`Parsing PR #${pr}`);
        const changelog = await parsePR(pr, pkgType, cwd, pkg);
        if (pkgType !== 'oss') {
          changelog.pro = true;
        }
        changelogs.push(changelog);
      }),
    );
  };
  console.log('===nocobase/nocobase===');
  await get(changelogs, 'oss');
  console.log('===nocobase/pro-plugins===');
  try {
    await get(changelogs, 'pro', path.join(__dirname, '../../packages/pro-plugins/'));
  } catch (error) {
    console.error(`Generate changelog for pro-plugins failed, error: ${error.message}`);
  }
  if (process.env.PRO_PLUGIN_REPOS) {
    const repos = JSON.parse(process.env.PRO_PLUGIN_REPOS);
    for (const repo of repos) {
      console.log(`===nocobase/${repo}===`);
      try {
        await get(changelogs, 'pro', path.join(__dirname, '../../packages/pro-plugins/@nocobase', repo), repo);
      } catch (error) {
        console.error(`Generate changelog for ${repo} failed, error: ${error.message}`);
      }
    }
  }
  return { changelogs: arrangeChangelogs(changelogs), from, to };
}

async function generateChangelog() {
  const { changelogs, from, to } = await collect();
  const prTypeLocale = {
    'New feature': {
      en: '🎉 New Features',
      cn: '🎉 新特性',
    },
    Improvement: {
      en: '🚀 Improvements',
      cn: '🚀 优化',
    },
    'Bug fix': {
      en: '🐛 Bug Fixes',
      cn: '🐛 修复',
    },
  };
  const moduleTypeLocale = {
    core: {
      en: 'Core',
      cn: '内核',
    },
    plugin: {
      en: 'Plugins',
      cn: '插件',
    },
  };
  const referenceLocale = {
    en: 'Reference: ',
    cn: '参考文档：',
  };

  const generate = (changelogs, lang) => {
    let result = '';
    for (const [prType, moduleTypes] of Object.entries(changelogs)) {
      const prTypeResults = [];
      for (const [moduleType, modules] of Object.entries(moduleTypes)) {
        const moduleTypeResults = [];
        for (const [_, moduleChangelogs] of Object.entries(modules)) {
          const moduleResults = [];
          const lists = [];
          for (const changelog of moduleChangelogs) {
            const { number, author, pro } = changelog;
            const { description, docTitle, docLink } = changelog[lang];
            if (!description) {
              console.warn(`PR #${number} has no ${lang} changelog`);
              continue;
            }
            const pr = pro ? '' : ` ([#${number}](https://github.com/nocobase/nocobase/pull/${number}))`;
            const doc = docTitle && docLink ? `${referenceLocale[lang]}[${docTitle}](${docLink})` : '';
            lists.push(`${description}${pr} by @${author}\n${doc}`);
          }
          if (!lists.length) {
            continue;
          }
          if (lists.length > 1) {
            moduleResults.push(`\n  - ${lists.join('\n  - ')}\n`);
          } else {
            moduleResults.push(` ${lists[0]}\n`);
          }
          if (moduleResults.length) {
            const moduleName = moduleChangelogs[0][lang].module;
            moduleTypeResults.push(`- **[${moduleName}]**${moduleResults.join('')}`);
          }
        }
        if (moduleTypeResults.length) {
          const moduleTypeTitle = moduleTypeLocale[moduleType][lang];
          prTypeResults.push(`${moduleTypeResults.join('')}`);
        }
      }
      if (prTypeResults.length) {
        const prTypeTitle = prTypeLocale[prType][lang];
        result += `### ${prTypeTitle}\n\n`;
        result += prTypeResults.join('');
      }
    }
    return result;
  };

  const cn = generate(changelogs, 'cn');
  const en = generate(changelogs, 'en');
  return { cn, en, from, to };
}

async function writeChangelog(cn, en, from, to) {
  const date = new Date().toISOString().split('T')[0];
  const title = `## [${to}](https://github.com/nocobase/nocobase/compare/${from}...${to}) - ${date}`;
  const write = async (lang) => {
    const file = lang === 'cn' ? 'CHANGELOG.zh-CN.md' : 'CHANGELOG.md';
    const oldChangelog = await fs.readFile(path.join(__dirname, `../../${file}`), 'utf8');
    if (oldChangelog.includes(`## [${to}]`)) {
      return;
    }
    const fromIndex = oldChangelog.indexOf(`## [`);
    const newChangelog = `${header[lang]}\n${title}\n\n${lang === 'cn' ? cn : en}${oldChangelog.slice(fromIndex)}`;
    await fs.writeFile(path.join(__dirname, `../../${file}`), newChangelog);
  };
  write('cn');
  write('en');
}

async function createRelease(cn, en, to) {
  let { ver = 'beta' } = program.opts();
  // gh release create -t title -n note
  if (ver === 'alpha') {
    await execa('gh', ['release', 'create', to, '-t', to, '-n', `${en}\n---\n${cn}`, '-p']);
    return;
  }
  await execa('gh', ['release', 'create', to, '-t', to, '-n', `${en}\n---\n${cn}`]);
}

async function writeChangelogAndCreateRelease() {
  let { ver = 'beta', test } = program.opts();
  const { cn, en, from, to } = await generateChangelog();
  if (!cn && !en) {
    throw new Error('No changelog generated');
  }
  if (test) {
    console.log(en);
    console.log(cn);
    return;
  }
  if (ver === 'beta') {
    await writeChangelog(cn, en, from, to);
  }
  await createRelease(cn, en, to);
}

writeChangelogAndCreateRelease();
