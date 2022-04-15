import { useRef, useEffect } from 'react';

interface IRecycleTarget {
  onMount: () => void;
  onUnmount: () => void;
}

export const useAttach = <T extends IRecycleTarget>(target: T): T => {
  const oldTargetRef = useRef<IRecycleTarget>(null);
  useEffect(() => {
    if (oldTargetRef.current && target !== oldTargetRef.current) {
      oldTargetRef.current.onUnmount();
    }
    oldTargetRef.current = target;
    target.onMount();
    return () => {
      target.onUnmount();
    };
  }, [target]);
  return target;
};
