import type { AppNoticeData } from '@nocobase/app-plugin-skills-example/server/tokens';
import type { ApiClient } from '@nocobase/app-client';

export type LoadSkillsExampleNotice = () => Promise<AppNoticeData>;

/**
 * Takes the client rather than creating one, so the request goes through the Application's own API client and follows
 * whatever `api.baseURL` it is configured with.
 */
export async function loadSkillsExampleNotice(
  api: ApiClient,
): Promise<AppNoticeData> {
  const { data } = await api.request<{ data: AppNoticeData }>({
    path: 'skillsExample/notice',
  });
  return data;
}
