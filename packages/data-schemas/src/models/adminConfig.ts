import adminConfigSchema from '~/schema/adminConfig';
import type { IAdminConfig } from '~/schema/adminConfig';

/**
 * Creates or returns the AdminConfig model using the provided mongoose instance and schema
 */
export function createAdminConfigModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AdminConfig || mongoose.model<IAdminConfig>('AdminConfig', adminConfigSchema);
}
