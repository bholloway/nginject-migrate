/**
 * Derive an application version from the Windows Build manifest
 * @type {{withDefaultValue:function}}
 */
module.exports = {
    withDefaultValue: withDefaultValue
};

/**
 * Obtain the build number from the Windows Build or else use the supplied default.
 * @param {string} defaultValue Default version string to use
 * @returns {function} An angular factory method
 */
function withDefaultValue(defaultValue) {
    /**
     * sd
     * @ngInject
     */
    return function appVersionFactory($window) {
        if ('Windows' in $window) {
            var thisPackage = $window.Windows.ApplicationModel.Package.current;
            var version = thisPackage.id.version;
            return [version.major, version.minor, version.build, version.revision].join('.');
        } else {
            return defaultValue;
        }
    };
}