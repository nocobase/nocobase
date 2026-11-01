import { useEffect, useState } from 'react';

export function usePhone(): boolean {
  const query = '(max-width: 767px)';
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setPhone(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return phone;
}
