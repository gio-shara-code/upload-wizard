/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,

    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/__test__/'],


    testEnvironment: 'node',

    // A map from regular expressions to paths to transformers
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],
}
