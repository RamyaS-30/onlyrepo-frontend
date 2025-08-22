// craco.config.js
module.exports = {
  jest: {
    configure: (jestConfig) => {
      // Transform ignore patterns for ESM node_modules
      jestConfig.transformIgnorePatterns = [
        "/node_modules/(?!(axios|@supabase)/)"
      ];
      // Mock CSS imports
      jestConfig.moduleNameMapper = {
        "^.+\\.css$": "identity-obj-proxy",
      };
      return jestConfig;
    },
  },
};