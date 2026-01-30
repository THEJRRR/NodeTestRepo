const npmRegistry = require('./npm');
const pypiRegistry = require('./pypi');
const mavenRegistry = require('./maven');

async function getPackageInfo(ecosystem, name, version) {
  const normalizedEcosystem = ecosystem?.toLowerCase() || '';

  switch (normalizedEcosystem) {
    case 'npm':
      return npmRegistry.getPackageInfo(name);

    case 'pypi':
      return pypiRegistry.getPackageInfo(name);

    case 'maven':
      if (name.includes(':')) {
        const [groupId, artifactId] = name.split(':');
        return mavenRegistry.getPackageInfo(groupId, artifactId);
      }
      return null;

    default:
      return null;
  }
}

function getSupportedEcosystems() {
  return ['npm', 'pypi', 'maven'];
}

module.exports = {
  getPackageInfo,
  getSupportedEcosystems
};
