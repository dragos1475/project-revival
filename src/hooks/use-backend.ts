import { useEffect, useSyncExternalStore } from "react";
import type { BackendName } from "@/lib/config";
import { getBackendState, resolveBackend, subscribeBackends } from "@/api/status";

export function useBackend(name: BackendName) {
  useEffect(() => {
    void resolveBackend(name);
  }, [name]);
  return useSyncExternalStore(subscribeBackends, () => getBackendState(name));
}
