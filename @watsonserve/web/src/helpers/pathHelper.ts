import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function pathToList(path: string) {
  if ('/' === path) return ['/'];

  if (path.endsWith('/')) {
    path = path.substring(0, path.length - 1);
  }
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  return ['/'].concat(path.split('/'));
}

export function useJmpPath() {
  const navigate = useNavigate();

  return useCallback((path: string) => {
    navigate(`/home${path}`);
  }, [navigate]);
}
