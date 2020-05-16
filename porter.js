module.exports = {
  babel: {
    targets: [
      "> 4%",
      "ie 11",
      "safari 8"
    ],
    options: {
      decorators: false,
        classProperties: false,
        privateMethods: false,
        nullishCoalescing: false,
        objectRestSpread: true,
        optionalChaining: false,
        reactJsx: false,
        forOfAsArray: false,
        reactRemovePropTypes: false,
        transformImportsMap: false,
        rewire: false
    },
    inputPath: "src",
    cjsOutputPath: "lib",
    esOutputPath: "es"
  },
  rollup: {
    useEslint: false,
    log: false,
    name: 'JSONDestringify',
    licenseFile: 'LICENSE',
    inputFile: "src/index.js",
    analyze: true,
    umdOutputFile: "dist/json-destringify.js",
    minOutputFile: "dist/json-destringify.min.js"
  },
  eslint: {
    rules: {
      "semi": ["error", "always"]
    },
    plugins: [
      "import"
    ],
    extends: [
      "eslint:recommended",
      "plugin:import/errors"
    ],
    settings: {
    },
    env: {
      "browser": true, // only for src
      "es6": true,
      "jest": true, // only for test
      "node": true // only for porter.js
    },
    files: ['src', 'test', 'sample.js', 'porter.js']
  },
  jest: {
    "testMatch": [
      "<rootDir>/test/*.js"
    ]
  }
};