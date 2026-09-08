import { QueryClient } from "@tanstack/react-query";

/**
 * Shared singleton QueryClient instance across the application.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Invalidates all mine-dependent query caches across dashboards and routes.
 * Triggered automatically when the user changes the active mine in the top selector
 * or when offline records are reconciled.
 */
export function invalidateMineQueries(mineId?: string) {
  const keys = [
    "telemetry",
    "data-logs",
    "muster",
    "risk-score",
    "risk-analysis-current",
    "dashboard-summary",
    "underground-stations",
    "mine-inspections",
    "contractor-production",
    "telangana-mines-list",
    "worker-issues",
    "worker-leaves",
  ];

  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
    if (mineId) {
      queryClient.invalidateQueries({ queryKey: [key, mineId] });
    }
  });
}
