const { logger } = require('@librechat/data-schemas');
const { AdminConfig } = require('~/db/models');

/**
 * List all admin config overrides.
 * @returns {Promise<Array>}
 */
const listAdminConfigs = async () => {
    try {
        return await AdminConfig.find().sort({ priority: -1 }).lean();
    } catch (error) {
        logger.error('[listAdminConfigs] Error', error);
        throw new Error('Error listing admin configs');
    }
};

/**
 * Get a single admin config by principal.
 * @param {string} principalType
 * @param {string} principalId
 * @returns {Promise<Object|null>}
 */
const getAdminConfig = async (principalType, principalId) => {
    try {
        return await AdminConfig.findOne({ principalType, principalId }).lean();
    } catch (error) {
        logger.error('[getAdminConfig] Error', error);
        throw new Error('Error getting admin config');
    }
};

/**
 * Upsert an admin config (full replace of overrides).
 * @param {string} principalType
 * @param {string} principalId
 * @param {{ overrides: object, priority?: number }} data
 * @returns {Promise<Object>}
 */
const upsertAdminConfig = async (principalType, principalId, data) => {
    try {
        const update = {
            overrides: data.overrides,
            ...(data.priority !== undefined && { priority: data.priority }),
        };
        return await AdminConfig.findOneAndUpdate(
            { principalType, principalId },
            { $set: update, $setOnInsert: { principalType, principalId, principalModel: 'Role' } },
            { upsert: true, new: true, lean: true },
        );
    } catch (error) {
        logger.error('[upsertAdminConfig] Error', error);
        throw new Error('Error upserting admin config');
    }
};

/**
 * Patch a single section in overrides (deep-merge at section level).
 * @param {string} principalType
 * @param {string} principalId
 * @param {{ section: string, value: unknown }} data
 * @returns {Promise<Object>}
 */
const patchAdminConfigFields = async (principalType, principalId, { section, value }) => {
    try {
        return await AdminConfig.findOneAndUpdate(
            { principalType, principalId },
            {
                $set: { [`overrides.${section}`]: value },
                $setOnInsert: { principalType, principalId, principalModel: 'Role' },
            },
            { upsert: true, new: true, lean: true },
        );
    } catch (error) {
        logger.error('[patchAdminConfigFields] Error', error);
        throw new Error('Error patching admin config fields');
    }
};

/**
 * Delete a section (or specific field) from overrides.
 * @param {string} principalType
 * @param {string} principalId
 * @param {{ section: string, field?: string }} data
 * @returns {Promise<Object|null>}
 */
const deleteAdminConfigFields = async (principalType, principalId, { section, field }) => {
    try {
        const path = field ? `overrides.${section}.${field}` : `overrides.${section}`;
        return await AdminConfig.findOneAndUpdate(
            { principalType, principalId },
            { $unset: { [path]: '' } },
            { new: true, lean: true },
        );
    } catch (error) {
        logger.error('[deleteAdminConfigFields] Error', error);
        throw new Error('Error deleting admin config fields');
    }
};

/**
 * Delete an entire admin config document.
 * @param {string} principalType
 * @param {string} principalId
 * @returns {Promise<boolean>}
 */
const deleteAdminConfig = async (principalType, principalId) => {
    try {
        const result = await AdminConfig.deleteOne({ principalType, principalId });
        return result.deletedCount > 0;
    } catch (error) {
        logger.error('[deleteAdminConfig] Error', error);
        throw new Error('Error deleting admin config');
    }
};

/**
 * Toggle isActive flag on an admin config.
 * @param {string} principalType
 * @param {string} principalId
 * @param {boolean} isActive
 * @returns {Promise<Object|null>}
 */
const toggleAdminConfig = async (principalType, principalId, isActive) => {
    try {
        return await AdminConfig.findOneAndUpdate(
            { principalType, principalId },
            { $set: { isActive } },
            { new: true, lean: true },
        );
    } catch (error) {
        logger.error('[toggleAdminConfig] Error', error);
        throw new Error('Error toggling admin config');
    }
};

module.exports = {
    listAdminConfigs,
    getAdminConfig,
    upsertAdminConfig,
    patchAdminConfigFields,
    deleteAdminConfigFields,
    deleteAdminConfig,
    toggleAdminConfig,
};
