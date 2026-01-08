'use strict';

const express = require('express');
const ProjectService = require('../services/ProjectService');

const router = express.Router();

/* --------------------------- Create Project -------------------------- */

router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const config = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'Invalid project configuration' });
    }

    const project = await ProjectService.createProject(userId, config);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({ error: 'Project creation failed' });
  }
});

/* --------------------------- Project Status --------------------------- */

router.get('/:rprojectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await ProjectService.getProjectStatus(projectId, userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Project status error:', error.message);
    res.status(500).json({ error: 'Failed to get project status' });
  }
});

/* --------------------------- Download Project ------------------------- */

router.get('/:projectId/download', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await ProjectService.getProjectForDownload(projectId, userId);

    if (!project || !project.filePath) {
      return res.status(404).json({ error: 'Project not available for download' });
    }

    res.download(project.filePath);
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
