import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function useUserContext() {
  const { data: session } = useSession();
  const [additionalInfo, setAdditionalInfo] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('userAdditionalInfo') ?? '';
  });

  useEffect(() => {
    localStorage.setItem('userAdditionalInfo', additionalInfo);
  }, [additionalInfo]);

  return {
    userContext: {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
      additionalInfo,
    },
    setAdditionalInfo,
  };
}
