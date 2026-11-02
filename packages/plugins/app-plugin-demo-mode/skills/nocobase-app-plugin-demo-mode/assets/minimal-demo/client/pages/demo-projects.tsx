import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

/** The owning application supplies its PageContainer and the exampleDemo locale keys. */
export default function DemoProjects(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [tasks, setTasks] =
    useState<{ id: string; title: string; state: string }[]>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .request<{ data: { id: string; title: string; state: string }[] }>({
        path: '/demoProjects/tasks',
      })
      .then(({ data }) => {
        if (active) setTasks(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [api]);
  if (failed) return <p>{t('exampleDemo.failed')}</p>;
  if (!tasks) return <p>{t('exampleDemo.loading')}</p>;
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          {task.title} — {t(`exampleDemo.${task.state}`)}
        </li>
      ))}
    </ul>
  );
}
