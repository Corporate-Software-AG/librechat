import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';

type AdminConfigResponse = Awaited<ReturnType<typeof dataService.patchAdminConfigFields>>;
type AdminConfigDeleteResponse = Awaited<ReturnType<typeof dataService.deleteAdminConfig>>;

export const usePatchAdminConfigFields = (): UseMutationResult<
  AdminConfigResponse,
  unknown,
  { principalType: string; principalId: string; section: string; value: unknown }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, section, value }) =>
      dataService.patchAdminConfigFields(principalType, principalId, { section, value }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminConfigs]);
        queryClient.invalidateQueries([QueryKeys.adminBaseConfig]);
        queryClient.invalidateQueries([QueryKeys.adminConfig]);
      },
    },
  );
};

export const useUpsertAdminConfig = (): UseMutationResult<
  AdminConfigResponse,
  unknown,
  {
    principalType: string;
    principalId: string;
    overrides: Record<string, unknown>;
    priority?: number;
  }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, overrides, priority }) =>
      dataService.upsertAdminConfig(principalType, principalId, { overrides, priority }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminConfigs]);
        queryClient.invalidateQueries([QueryKeys.adminBaseConfig]);
        queryClient.invalidateQueries([QueryKeys.adminConfig]);
      },
    },
  );
};

export const useDeleteAdminConfigFields = (): UseMutationResult<
  AdminConfigResponse,
  unknown,
  { principalType: string; principalId: string; section: string; field?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, section, field }) =>
      dataService.deleteAdminConfigFields(principalType, principalId, { section, field }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminConfigs]);
        queryClient.invalidateQueries([QueryKeys.adminBaseConfig]);
        queryClient.invalidateQueries([QueryKeys.adminConfig]);
      },
    },
  );
};

export const useDeleteAdminConfig = (): UseMutationResult<
  AdminConfigDeleteResponse,
  unknown,
  { principalType: string; principalId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId }) =>
      dataService.deleteAdminConfig(principalType, principalId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminConfigs]);
        queryClient.invalidateQueries([QueryKeys.adminBaseConfig]);
      },
    },
  );
};

export const useToggleAdminConfig = (): UseMutationResult<
  AdminConfigResponse,
  unknown,
  { principalType: string; principalId: string; isActive: boolean }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ principalType, principalId, isActive }) =>
      dataService.toggleAdminConfig(principalType, principalId, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.adminConfigs]);
        queryClient.invalidateQueries([QueryKeys.adminBaseConfig]);
      },
    },
  );
};
