import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

/** Runs an async producer when deps change. Keeps the previous data while reloading
 *  and ignores results from superseded runs. */
export function useAsync<T>(producer: () => Promise<T> | null, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true });
  const token = useRef(0);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const mine = ++token.current;
    const promise = producer();
    if (!promise) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: undefined }));
    promise.then(
      (data) => mine === token.current && setState({ data, error: undefined, loading: false }),
      (error) => mine === token.current && setState((s) => ({ data: s.data, error, loading: false })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
