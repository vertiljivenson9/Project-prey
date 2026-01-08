'use strict';

const { Queue, Worker } = require('bullmq');
const redisClient = require('./RedisClient');

/* ----------------------------- Queue Config ---------------------------- */

const projectQueue = new Queue('project-generation', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 5,
    removeOnFail: 5,
    backoff: {
      type: 'exponential',
      delay: 3000
    }
  }
});

/* ----------------------------- Queue Worker ---------------------------- */

const worker = new Worker(
  'project-generation',
  async (job) => {
    const { projectId } = job.data;
    const ProjectService = require('./ProjectService');
    await ProjectService.processProject(projectId);
  },
  {
    connection: redisClient,
    concurrency: 1
  }
);

worker.on('completed', (job) => {
  console.log(`Project completed: ${job.data.projectId}`);
});

worker.on('failed', (job, err) => {
  console.error(`Project failed: ${job.data.projectId}`, err.message);
});

module.exports = {
  projectQueue
};
