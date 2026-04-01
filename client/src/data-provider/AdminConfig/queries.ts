import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, QueryObserverResult } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';

type AdminConfigListResponse = Awaited<ReturnType<typeof dataService.getAdminConfigs>>;

export const useGetAdminConfigs = (
  config?: UseQueryOptions<AdminConfigListResponse>,
): QueryObserverResult<AdminConfigListResponse> => {
  return useQuery<AdminConfigListResponse>(
    [QueryKeys.adminConfigs],
    () => dataService.getAdminConfigs(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
    },
  );
};

export const useGetAdminBaseConfig = (
  config?: UseQueryOptions<Record<string, unknown>>,
): QueryObserverResult<Record<string, unknown>> => {
  return useQuery<Record<string, unknown>>(
    [QueryKeys.adminBaseConfig],
    () => dataService.getAdminBaseConfig(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
    },
  );
};
