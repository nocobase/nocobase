import type { ReactElement } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { SkillDetailsDrawer } from '../../components/skill-details-drawer.js';
import type { ManagedSkillSummary } from '../../skills-management-service.js';

export default function SkillDetailPage(): ReactElement {
  const { skillName = '' } = useParams<'skillName'>();
  const skills = useOutletContext<ManagedSkillSummary[]>();
  return (
    <SkillDetailsDrawer
      key={skillName}
      skillName={skillName}
      summary={skills.find((skill) => skill.name === skillName)}
    />
  );
}
