import { useBlockRequestContext } from '../../../block-provider/BlockProvider';

export const useBlockCollection = () => {
  const ctx = useBlockRequestContext();
  const name: string = ctx.props?.collection || ctx.props?.resource;
  const parentName: string = ctx.__parent?.props?.collection || ctx.__parent?.props?.resource;

  return { name, parentName };
};
