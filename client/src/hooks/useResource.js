import { useCallback, useEffect, useRef, useState } from 'react';

/** Load data with loading / error / refresh states. */
export function useResource(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, refreshing: false });
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async (isRefresh = false) => {
    setState((s) => ({ ...s, loading: !isRefresh || s.data === null, refreshing: isRefresh, error: null }));
    try {
      const data = await loaderRef.current();
      if (mounted.current) setState({ data, loading: false, error: null, refreshing: false });
      return data;
    } catch (error) {
      if (mounted.current) setState((s) => ({ ...s, loading: false, refreshing: false, error }));
      return undefined;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    run(false);
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: () => run(false), refresh: () => run(true) };
}

/** Wrap a mutation so buttons can disable while it is in flight. */
export function useAction(fn) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (...args) => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error, clearError: () => setError(null) };
}
