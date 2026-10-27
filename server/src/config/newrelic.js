const isNewRelicEnabled = process.env.NEW_RELIC_ENABLED === 'true';
const nodeMajorVersion = Number(process.versions.node.split('.')[0]);

if (isNewRelicEnabled && nodeMajorVersion >= 22 && nodeMajorVersion < 24) {
    require('newrelic');
} else if (isNewRelicEnabled) {
    process.stderr.write(
        `New Relic disabled for unsupported Node.js runtime ${process.versions.node}\n`
    );
}
