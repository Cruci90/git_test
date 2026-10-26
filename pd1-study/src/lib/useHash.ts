import { useEffect, useState } from 'react';

export function useHash(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [hash, setHash] = useState(read);
  useEffect(() => {
    const on = () => setHash(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}
