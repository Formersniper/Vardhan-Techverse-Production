import { useEffect, useState } from 'react';
import { getActiveCompanyLogo, MASTER_DEFAULT_LOGO_URL } from '@/lib/brand';

export function useActiveLogo(): string {
  const [logoUrl, setLogoUrl] = useState<string>(MASTER_DEFAULT_LOGO_URL);

  useEffect(() => {
    let isMounted = true;

    const refreshLogo = () => {
      getActiveCompanyLogo().then((url) => {
        if (isMounted && url) {
          setLogoUrl(url);
        }
      });
    };

    refreshLogo();

    if (typeof window !== 'undefined') {
      window.addEventListener('vt_brand_updated', refreshLogo);
      window.addEventListener('storage', refreshLogo);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('vt_brand_updated', refreshLogo);
        window.removeEventListener('storage', refreshLogo);
      }
    };
  }, []);

  return logoUrl;
}
