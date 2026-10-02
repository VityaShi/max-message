import { useCallback, useState } from 'react';
import type { Credentials } from 'shared/types/greenApi';
import { validateCredentials } from './validateCredentials';

export type UseAuthResult = {
  submit: (idInstance: string, apiTokenInstance: string) => Credentials | null;
  error: string | null;
  clear: () => void;
};

export function useAuth(): UseAuthResult {
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    (idInstance: string, apiTokenInstance: string): Credentials | null => {
      const result = validateCredentials(idInstance, apiTokenInstance);
      if (!result.ok) {
        setError(result.error);
        return null;
      }
      setError(null);
      return result.credentials;
    },
    [],
  );

  const clear = useCallback(() => setError(null), []);

  return { submit, error, clear };
}