import {
  expect,
  open,
  test,
  unique,
  url,
  type Api,
} from './support/fixtures.ts';

interface Project {
  id: string;
  name: string;
}

interface Doc {
  id: string;
  title: string;
  version: number;
  content: string;
}

async function studioProject(api: Api): Promise<Project> {
  const projects = await api.get<Project[]>('projects');
  const project = projects.find((item) => item.name === 'Studio Platform');
  if (!project) throw new Error('The demo project Studio Platform is missing.');
  return project;
}

test.describe('knowledge', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(
      "localStorage.setItem('nocobase.locale', 'zh-CN')",
    );
  });
  test('the unified directory includes projects and shared system documents', async ({
    page,
  }) => {
    await open(page, '/knowledge');
    await expect(
      page.getByRole('heading', { name: '知识库', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Studio Platform/ }).first(),
    ).toBeVisible();
    await expect(page.getByText('跨项目共享', { exact: true })).toBeVisible();
    const system = page.getByRole('region', { name: '系统知识', exact: true });
    await system.getByRole('button', { name: /系统知识/ }).click();
    const tree = system.getByRole('tree');
    await tree.getByRole('button', { name: 'Team conventions' }).click();
    await expect(page).toHaveURL(/doc=/);
    await expect(
      page
        .getByRole('article')
        .getByRole('heading', { name: 'Team conventions', level: 1 }),
    ).toBeVisible();
  });

  test('a project document is edited, and its history lists and compares both versions', async ({
    page,
    api,
  }) => {
    const project = await studioProject(api);
    const title = `发布流程 ${unique()}`;
    const doc = await api.post<Doc>('knowledge/docs', {
      scope: 'project',
      scopeId: project.id,
      title,
      summary: '如何发布。',
      content: '# 发布流程\n\n先合并，再打标签。',
    });

    await open(page, `/projects/${project.id}/knowledge?doc=${doc.id}`);
    const panel = page.getByRole('tabpanel', { name: '知识库' });
    const article = panel.getByRole('article');
    await expect(
      article.getByRole('heading', { name: title, level: 1 }),
    ).toBeVisible();
    await expect(article).toContainText('v1 · Alex Turner');

    await article.getByRole('button', { name: '编辑', exact: true }).click();
    await article
      .getByRole('textbox', { name: '内容' })
      .fill('# 发布流程\n\n先合并，再打标签，最后部署到预发环境。');
    await article
      .getByRole('textbox', { name: '修改说明' })
      .fill('补充部署步骤');
    await article.getByRole('button', { name: '保存' }).click();

    // The editor shows a live preview, so the text is checked once it has closed.
    await expect(article.getByRole('textbox', { name: '内容' })).toBeHidden();
    await expect(
      article.getByText('先合并，再打标签，最后部署到预发环境。'),
    ).toBeVisible();
    await expect(article).toContainText('v2 · Alex Turner');
    expect((await api.get<Doc>(`knowledge/docs/${doc.id}`)).version).toBe(2);

    await article.getByRole('button', { name: '历史' }).click();
    const versions = article
      .getByTestId('knowledge-history')
      .getByRole('listitem');
    await expect(versions).toHaveCount(2);
    await expect(versions.first()).toContainText('补充部署步骤');
    await expect(versions.first()).toContainText('当前');
    await expect(article.getByRole('combobox', { name: '对比' })).toContainText(
      'v1',
    );
    await expect(article.getByRole('figure')).toContainText(
      '最后部署到预发环境',
    );
  });

  test("an agent's proposed change is accepted from the project's knowledge", async ({
    page,
    api,
  }) => {
    const project = await studioProject(api);
    const before = await api.get<
      { id: string; docId: string; docTitle: string }[]
    >(`knowledge/proposals?scope=project&scopeId=${project.id}&status=pending`);
    const matching = before.filter(
      (item) => item.docTitle === 'Development environment',
    );
    expect(matching, 'exactly one pending development proposal').toHaveLength(
      1,
    );
    const pending = matching[0]!;

    await open(page, `/projects/${project.id}/knowledge`);
    const panel = page.getByRole('tabpanel', { name: '知识库' });
    await panel.getByTestId('knowledge-waiting').click();
    await panel
      .getByRole('button', { name: '修改 Development environment' })
      .click();
    await expect(page).toHaveURL(
      (address) => address.searchParams.get('proposal') === pending.id,
    );
    const proposal = panel.getByRole('article');
    await proposal.getByRole('tab', { name: '改动' }).click();
    await expect(
      proposal.getByRole('figure', { name: /提议的修改/ }),
    ).toContainText('playwright install chromium');
    await proposal
      .getByRole('textbox', { name: '意见（可选）' })
      .fill('谢谢补充。');
    const accepted = page.waitForResponse(
      (response) =>
        response.url() ===
          url(`/api/knowledge/proposals/${pending.id}/accept`) &&
        response.request().method() === 'POST',
    );
    await proposal.getByRole('button', { name: '接受' }).click();
    expect((await accepted).status()).toBe(200);

    await expect(page).toHaveURL(
      (address) =>
        address.searchParams.get('proposals') === 'pending' &&
        !address.searchParams.has('proposal'),
    );
    await expect(
      panel.getByRole('button', { name: '修改 Development environment' }),
    ).toBeHidden();
    await expect
      .poll(async () => {
        const doc = await api.get<Doc>(`knowledge/docs/${pending.docId}`);
        return { version: doc.version, content: doc.content };
      })
      .toEqual({
        version: 2,
        content: expect.stringContaining('playwright install chromium'),
      });
  });
});
