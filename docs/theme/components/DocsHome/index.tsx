import { Link } from '@rspress/core/theme-original';
import { useLang } from '@rspress/core/runtime';
import { useState } from 'react';
import { transformHref, useLangPrefix } from '../../utils';
import './index.scss';

type Group = {
  title?: string;
  details?: string;
  items?: { title: string; details?: string; link?: string }[];
};

function CopyText({
  text,
  code = false,
  cn,
}: {
  text: string;
  code?: boolean;
  cn: boolean;
}) {
  const [status, setStatus] = useState('');
  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(field);
        const focused = document.activeElement as HTMLElement | null;
        try {
          field.select();
          if (!document.execCommand('copy'))
            throw new Error('Copy unavailable');
        } finally {
          field.remove();
          focused?.focus();
        }
      }
      setStatus(cn ? '已复制' : 'Copied');
    } catch {
      setStatus(cn ? '请选中文字复制' : 'Select the text to copy');
    }
  }
  return (
    <div className='dh-codebox'>
      <div className='dh-codebar'>
        <span>
          {code
            ? cn
              ? '⌘ 本地终端'
              : '⌘ Terminal'
            : cn
              ? '发送给 Agent'
              : 'Send to your Agent'}
        </span>
        <button onClick={copy}>{cn ? '复制' : 'Copy'}</button>
        <span className='dh-copy-status' role='status'>
          {status}
        </span>
      </div>
      {code ? <pre>{text}</pre> : <p>{text}</p>}
    </div>
  );
}

export function DocsHome({ groups }: { groups: Group[] }) {
  const cn = useLang() === 'cn';
  const prefix = useLangPrefix();
  const link = (path: string) => transformHref(path, prefix);
  const steps = cn
    ? [
        {
          title: '安装 Skills',
          detail:
            '在本地终端安装，让 Agent 知道如何创建和部署 NocoBase 3 应用。',
          text: "npx skills@latest add nocobase/skills-v3 --skill '*' -g",
          note: '按提示选择你使用的 Agent，安装后新开一个会话加载 Skills。',
          href: '/get-started/create-app-with-agent',
          label: '查看创建指南',
        },
        {
          title: '安装 NocoBase App',
          detail: '准备一个空目录，在其中打开 Agent，告诉它你想创建应用。',
          text: '帮我创建一个 NocoBase 3 App，启动本地开发环境，并告诉我访问地址和登录方式。',
          note: '应用启动后，在应用目录继续对话，描述你的业务需求，边预览边调整。',
          href: '/get-started/create-app',
          label: '查看安装说明',
        },
        {
          title: '部署 NocoBase App',
          detail:
            '本地试用满意后，继续在应用项目中对话，把代码和应用交付到线上。',
          text: '帮我把代码推送到项目的 Git 远程仓库，并将应用部署到 ssh user@ip 的 /app/my-app 目录。部署后验证访问，告诉我线上地址。',
          note: '将 user@ip 和 /app/my-app 换成实际的 SSH 地址和安装目录，有域名也一起告诉 Agent。',
          href: '/deployment/with-agent',
          label: '查看部署指南',
        },
      ]
    : [
        {
          title: 'Install Skills',
          detail:
            'Give your Agent the instructions to create and deploy a NocoBase 3 application.',
          text: "npx skills@latest add nocobase/skills-v3 --skill '*' -g",
          note: 'Select your Agent during installation, then start a new session to load the Skills.',
          href: '/get-started/create-app-with-agent',
          label: 'Creation guide',
        },
        {
          title: 'Install NocoBase App',
          detail:
            'Open your Agent in an empty directory and ask it to create your application.',
          text: 'Create a NocoBase 3 App, start the local development environment, and tell me the access URL and how to sign in.',
          note: 'Continue in the application directory. Describe your business needs, preview the result, and refine it together.',
          href: '/get-started/create-app',
          label: 'Installation guide',
        },
        {
          title: 'Deploy NocoBase App',
          detail:
            'When the local result is ready, continue the conversation to deliver your application.',
          text: 'Push the code to the project’s Git remote and deploy the application to /app/my-app on ssh user@ip. Verify access and give me the public URL.',
          note: 'Replace user@ip and /app/my-app with your SSH destination and install directory. Include your domain if you have one.',
          href: '/deployment/with-agent',
          label: 'Deployment guide',
        },
      ];
  return (
    <main className='docs-home'>
      <section className='dh-start'>
        <div className='dh-start-inner'>
          <header className='dh-hero'>
            <div className='dh-eyebrow'>
              <strong>NocoBase 3</strong>
              <span> / </span>
              {cn ? '快速开始' : 'Quick start'}
            </div>
            <h1>
              {cn
                ? '从一句话，开始你的应用。'
                : 'Start your application with a conversation.'}
            </h1>
            <div className='dh-hero-bottom'>
              <p>
                {cn
                  ? '先装好 Skills，接下来用对话创建应用、开发功能和部署上线。'
                  : 'Install Skills, then create, develop, and deploy your application with your Agent.'}
              </p>
              <small>
                {cn ? '本地环境：' : 'Local tools: '}Node.js 24+ · pnpm 11
                <br />
                {cn
                  ? '支持 Skills 的 Coding Agent，如 Claude Code、Codex'
                  : 'A Skills-compatible Coding Agent, such as Claude Code or Codex'}
              </small>
            </div>
          </header>
          <div className='dh-steps'>
            {steps.map((step, i) => (
              <article className='dh-step' key={step.title}>
                <h2>
                  <span className='dh-number'>0{i + 1}</span>
                  {step.title}
                </h2>
                <p className='dh-step-detail'>{step.detail}</p>
                <CopyText text={step.text} code={i === 0} cn={cn} />
                <p className='dh-note'>{step.note}</p>
                <Link className='dh-text-link' href={link(step.href)}>
                  {step.label} <span aria-hidden='true'>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      {groups.slice(1).map((group, index) => (
        <section
          className={`dh-section ${index === 0 ? 'dh-agent' : ''}`}
          key={group.title}
        >
          <header className='dh-section-heading'>
            <div className='dh-eyebrow'>
              {index === 0
                ? cn
                  ? '和 Agent 一起开发'
                  : 'Develop with your Agent'
                : cn
                  ? '按需查阅'
                  : 'Explore the documentation'}
            </div>
            <h2>{group.title}</h2>
            <p>{group.details}</p>
          </header>
          <div className='dh-cards'>
            {group.items?.map((item) => (
              <Link
                className='dh-card'
                href={link(item.link ?? '/')}
                key={item.title}
              >
                <span className='dh-card-icon' aria-hidden='true'>
                  ↗
                </span>
                <h3>{item.title}</h3>
                <p>{item.details}</p>
                <span className='dh-card-footer'>
                  {cn ? '阅读文档' : 'Read the guide'}
                  <span aria-hidden='true'>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <footer className='dh-footer'>
        <span>NocoBase 3 · {cn ? '文档' : 'Documentation'}</span>
        <span>
          {cn
            ? '创建、开发、部署，和 Agent 一起完成。'
            : 'Create, develop, and deploy with your Agent.'}
        </span>
      </footer>
    </main>
  );
}
