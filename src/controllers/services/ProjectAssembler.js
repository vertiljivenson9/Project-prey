'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const BASE_PROJECTS_PATH = path.resolve(process.cwd(), 'storage/projects');
const BASE_PREVIEW_PATH = path.resolve(process.cwd(), 'storage/previews');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class ProjectAssembler {
  static getProjectPath(projectId) {
    return path.join(BASE_PROJECTS_PATH, projectId);
  }

  static getPreviewPath(projectId) {
    const previewPath = path.join(BASE_PREVIEW_PATH, projectId);
    return fs.existsSync(previewPath) ? previewPath : null;
  }

  static async assemble(projectId, files) {
    const projectPath = this.getProjectPath(projectId);
    ensureDir(projectPath);

    for (const file of files) {
      const fullPath = path.join(projectPath, file.path);
      ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, file.content, 'utf-8');
    }

    return projectPath;
  }

  static async buildPreview(projectId) {
    const sourcePath = this.getProjectPath(projectId);
    const previewPath = path.join(BASE_PREVIEW_PATH, projectId);

    ensureDir(previewPath);

    fs.cpSync(sourcePath, previewPath, { recursive: true });

    return previewPath;
  }

  static async zipProject(projectId) {
    const projectPath = this.getProjectPath(projectId);
    const zipPath = path.join(projectPath, `${projectId}.zip`);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(zipPath));
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(projectPath, false);
      archive.finalize();
    });
  }
}

module.exports = ProjectAssembler;
