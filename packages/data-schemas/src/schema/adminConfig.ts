import { Schema, Document } from 'mongoose';

export interface IAdminConfig extends Document {
  principalType: string;
  principalId: string;
  principalModel: string;
  priority: number;
  overrides: Record<string, unknown>;
  isActive: boolean;
  configVersion: number;
  tenantId?: string;
}

const adminConfigSchema = new Schema<IAdminConfig>(
  {
    principalType: {
      type: String,
      required: true,
      index: true,
    },
    principalId: {
      type: String,
      required: true,
      index: true,
    },
    principalModel: {
      type: String,
      default: 'Role',
    },
    priority: {
      type: Number,
      default: 0,
    },
    overrides: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    configVersion: {
      type: Number,
      default: 1,
    },
    tenantId: {
      type: String,
    },
  },
  { timestamps: true },
);

adminConfigSchema.index({ principalType: 1, principalId: 1 }, { unique: true });

export default adminConfigSchema;
