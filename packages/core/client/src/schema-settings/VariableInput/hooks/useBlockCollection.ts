import { useDataBlockPropsV2 } from '../../../application';

export const useBlockCollection = () => {
  const { collection, resource } = useDataBlockPropsV2<any>() || {};
  const name: string = collection || resource;

  return { name };
};
