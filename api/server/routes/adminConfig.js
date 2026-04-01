const express = require('express');
const { checkAdmin, requireJwtAuth } = require('~/server/middleware');
const { loadCustomConfig } = require('~/server/services/Config');
const {
    listAdminConfigs,
    getAdminConfig,
    upsertAdminConfig,
    patchAdminConfigFields,
    deleteAdminConfigFields,
    deleteAdminConfig,
    toggleAdminConfig,
} = require('~/models/AdminConfig');

const router = express.Router();
router.use(requireJwtAuth);
router.use(checkAdmin);

/**
 * GET /api/admin/config
 * List all admin config overrides.
 */
router.get('/', async (req, res) => {
    try {
        const configs = await listAdminConfigs();
        res.status(200).json({ configs });
    } catch (error) {
        res.status(500).json({ message: 'Error listing admin configs' });
    }
});

/**
 * GET /api/admin/config/base
 * Return the parsed YAML config (read-only base).
 */
router.get('/base', async (req, res) => {
    try {
        const config = (await loadCustomConfig(false)) ?? {};
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error loading base config' });
    }
});

/**
 * GET /api/admin/config/:principalType/:principalId
 * Get a single admin config.
 */
router.get('/:principalType/:principalId', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const config = await getAdminConfig(principalType, principalId);
        if (!config) {
            return res.status(404).json({ message: 'Admin config not found' });
        }
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: 'Error getting admin config' });
    }
});

/**
 * PUT /api/admin/config/:principalType/:principalId
 * Upsert a full admin config (replace overrides).
 */
router.put('/:principalType/:principalId', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const { overrides, priority } = req.body;
        if (!overrides || typeof overrides !== 'object') {
            return res.status(400).json({ message: 'overrides must be an object' });
        }
        const config = await upsertAdminConfig(principalType, principalId, { overrides, priority });
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: 'Error upserting admin config' });
    }
});

/**
 * PATCH /api/admin/config/:principalType/:principalId/fields
 * Patch a single section in overrides.
 */
router.patch('/:principalType/:principalId/fields', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const { section, value } = req.body;
        if (!section || typeof section !== 'string') {
            return res.status(400).json({ message: 'section is required and must be a string' });
        }
        const config = await patchAdminConfigFields(principalType, principalId, { section, value });
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: 'Error patching admin config fields' });
    }
});

/**
 * DELETE /api/admin/config/:principalType/:principalId/fields
 * Delete a section (or specific field) from overrides.
 */
router.delete('/:principalType/:principalId/fields', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const { section, field } = req.body;
        if (!section || typeof section !== 'string') {
            return res.status(400).json({ message: 'section is required and must be a string' });
        }
        const config = await deleteAdminConfigFields(principalType, principalId, { section, field });
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting admin config fields' });
    }
});

/**
 * DELETE /api/admin/config/:principalType/:principalId
 * Delete an entire admin config document.
 */
router.delete('/:principalType/:principalId', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const success = await deleteAdminConfig(principalType, principalId);
        res.status(200).json({ success });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting admin config' });
    }
});

/**
 * PATCH /api/admin/config/:principalType/:principalId/active
 * Toggle isActive flag.
 */
router.patch('/:principalType/:principalId/active', async (req, res) => {
    try {
        const { principalType, principalId } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean' });
        }
        const config = await toggleAdminConfig(principalType, principalId, isActive);
        if (!config) {
            return res.status(404).json({ message: 'Admin config not found' });
        }
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling admin config' });
    }
});

module.exports = router;
