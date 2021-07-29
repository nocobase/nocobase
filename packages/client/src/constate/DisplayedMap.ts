import { useMap } from 'ahooks';
import constate from 'constate';

const [DisplayedMapProvider, useDisplayedMapContext] = constate(() => {
  const [map, { set, remove, get }] = useMap([]);
  return { map, set, remove, get, has: (key: any) => !!get(key) };
});

export { DisplayedMapProvider, useDisplayedMapContext };
