const { Container, Image } = require('@quilt/quilt');

// imageName transforms `repo` into a Docker image name. The name is always
// `node-app`, and the tag is the final path in the repository name. For example.
// "https://github.com/tejasmanohar/node-todo.git" becomes "node-app:node-todo.git".
function imageName(repo) {
  let name = 'node-app';
  const repoIdx = repo.lastIndexOf('/');
  if (repoIdx !== -1) {
    name += `:${repo.slice(repoIdx + 1)}`;
  }
  return name;
}

function buildContainer(repo) {
  const name = imageName(repo);
  const image = new Image(name, `FROM quilt/nodejs
RUN git clone ${repo} . && npm install`);
  return new Container('node-app', image);
}

// Specs for Node.js web service
function Node(cfg) {
  if (typeof cfg.nWorker !== 'number') {
    throw new Error('`nWorker` is required');
  }
  if (typeof cfg.repo !== 'string') {
    throw new Error('`repo` is required');
  }

  this._port = cfg.port || 80;

  const env = cfg.env || {};
  const containers = buildContainer(cfg.repo).withEnv(env).replicate(cfg.nWorker);
  this.cluster = containers;
}

Node.prototype.deploy = function deploy(deployment) {
  deployment.deploy(this.cluster);
};

Node.prototype.port = function port() {
  return this._port;
};

module.exports = Node;
