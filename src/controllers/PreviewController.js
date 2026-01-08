'use strict';

const express = require('express');
const path = require('path');

const ProjectService = require('../services/ProjectService');
const ProjectAssembler = require('../services/ProjectAssembler');

const router = express.Router();

/* --------------------------- Project Preview -------------------------- */

router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await ProjectService.getProjectStatus(projectId, userId);

    if (!project || project.status !== 'completed') {
      return res.status(404).json({ error: 'Project not available for preview' });
    }

    const previewPath = ProjectAssembler.getPreviewPath(projectId);

    if (!previewPath) {
      return res.status(404).json({ error: 'Preview expired or unavailable' });
    }

    const indexFile = path.join(previewPath, 'index.html');
    res.sendFile(indexFile);
  } catch (error) {
    console.error('Preview error:', error.message);
    res.status(500).json({ error: 'Failed to load preview' });
  }
});

module.exports = router;
