'use strict';

const { v4: uuidv4 } = require('uuid');
const redisClient = require('./RedisClient');
const { projectQueue } = require('./QueueService');
const ProjectAssembler = require('./ProjectAssembler');
const CodeAgent = require('../agents/CodeAgent');

const PROJECT_PREFIX = 'project:';
const PROJECT_TTL = 60 * 60 * 24;

class ProjectService {
  /* ------------------------- Create Project ------------------------- */
  static async createProject(userId, config) {
    const projectId = uuidv4();

    const project = {
      id: projectId,
      userId,
      status: 'queued',
      config,
      createdAt: Date.now()
    };

    await redisClient.setEx(
      `${PROJECT_PREFIX}${projectId}`,
      PROJECT_TTL,
      JSON.stringify(project)
    );

    await projectQueue.add('generate', { projectId });

    return project;
  }

  /* ------------------------ Process Project ------------------------- */
  static async processProject(projectId) {
    const raw = await redisClient.get(`${PROJECT_PREFIX}${projectId}`);
    if (!raw) return;

    const project = JSON.parse(raw);

    project.status = 'processing';
    await redisClient.setEx(
      `${PROJECT_PREFIX}${projectId}`,
      PROJECT_TTL,
      JSON.stringify(project)
    );

    try {
      const files = await CodeAgent.generate(project.config);

      await ProjectAssembler.assemble(projectId, files);
      await ProjectAssembler.buildPreview(projectId);
      const zipPath = await ProjectAssembler.zipProject(projectId);

      project.status = 'completed';
      project.filePath = zipPath;
      project.completedAt = Date.now();

      await redisClient.setEx(
        `${PROJECT_PREFIX}${projectId}`,
        PROJECT_TTL,
        JSON.stringify(project)
      );
    } catch (error) {
      project.status = 'failed';
      project.error = error.message;

      await redisClient.setEx(
        `${PROJECT_PREFIX}${projectId}`,
        PROJECT_TTL,
        JSON.stringify(project)
      );

      throw error;
    }
  }

  /* ------------------------ Get Project Status ----------------------- */
  static async getProjectStatus(projectId, userId) {
    const raw = await redisClient.get(`${PROJECT_PREFIX}${projectId}`);
    if (!raw) return null;

    const project = JSON.parse(raw);
    if (project.userId !== userId) return null;

    return project;
  }

  /* ---------------------- Get Project Download ---------------------- */
  static async getProjectForDownload(projectId, userId) {
    const project = await this.getProjectStatus(projectId, userId);

    if (!project || project.status !== 'completed') {
      return null;
    }

    return project;
  }
}

module.exports = ProjectService;
