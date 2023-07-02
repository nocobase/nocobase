import { useCurrentRoles } from '@nocobase/client';

export const useCurrentRolesProps = () => {
  const options = useCurrentRoles();

  return {
    options,
  };
};
