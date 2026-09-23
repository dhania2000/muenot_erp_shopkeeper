const { withAppBuildGradle } = require('expo/config-plugins');

// CNG regenerates android/, so keep the local signing rule in a config plugin.
// EAS Build injects its own signing configuration after prebuild.
module.exports = function withMuenotReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') throw new Error('Expected Groovy Android build.gradle');
    let source = config.modResults.contents;
    const debugConfig = /    signingConfigs \{\s*debug \{[\s\S]*?\n        \}\n    \}/;
    if (!debugConfig.test(source)) throw new Error('Expo signingConfigs template changed; review release signing plugin');
    source = source.replace(debugConfig, (match) => match.replace(/\n    \}$/, `
        release {
            def storePath = findProperty('MUENOT_UPLOAD_STORE_FILE') ?: System.getenv('MUENOT_UPLOAD_STORE_FILE')
            def alias = findProperty('MUENOT_UPLOAD_KEY_ALIAS') ?: System.getenv('MUENOT_UPLOAD_KEY_ALIAS')
            def storePass = findProperty('MUENOT_UPLOAD_STORE_PASSWORD') ?: System.getenv('MUENOT_UPLOAD_STORE_PASSWORD')
            def keyPass = findProperty('MUENOT_UPLOAD_KEY_PASSWORD') ?: System.getenv('MUENOT_UPLOAD_KEY_PASSWORD')
            if (storePath && alias && storePass && keyPass) {
                storeFile file(storePath)
                storePassword storePass
                keyAlias alias
                keyPassword keyPass
            }
        }
    }`));
    const releaseBlock = /        release \{\s*\/\/ Caution![\s\S]*?signingConfig signingConfigs\.debug/;
    if (!releaseBlock.test(source)) throw new Error('Expo release build template changed; review release signing plugin');
    source = source.replace(releaseBlock, (match) => match.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release'));
    source += `
// EAS injects its own managed credentials after prebuild. A direct local release
// must never silently use the generated debug key or emit an unsigned APK.
if (System.getenv('EAS_BUILD') != 'true') {
    gradle.taskGraph.whenReady { graph ->
        if (graph.allTasks.any { it.path == ':app:assembleRelease' || it.path == ':app:bundleRelease' }) {
            def signing = android.signingConfigs.release
            if (!signing.storeFile?.isFile() || !signing.storePassword || !signing.keyAlias || !signing.keyPassword) {
                throw new GradleException('Muenot release signing credentials missing. Restore the established production keystore and set MUENOT_UPLOAD_* in local Gradle properties or environment.')
            }
        }
    }
}
`;
    config.modResults.contents = source;
    return config;
  });
};
