import { useEffect, useState } from 'react';

export default function usePanelCodeInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const code = typeof window !== 'undefined' ? sessionStorage.getItem('panelCode') : null;
    if (!code) return;
    (async () => {
      try {
        const res = await fetch('/api/auth/access');
        const data = await res.json();
        const found = data.find(item => item.code === code);
        setInfo(found || null);
      } catch (err) {
        setInfo(null);
      }
    })();
  }, []);

  return info;
}
