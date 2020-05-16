const babelRegister = require('@porterjs/babel-register');
babelRegister();

const { destringify, restringify } = require('./src/index');
// const { destringify, restringify } = require('./lib/index');
// import { destringify, restringify } from './src/index';

const input = {
  property: [
    JSON.stringify({
      key: JSON.stringify(123)
    })
  ]
};

const destringified = destringify(input);
const restringified = restringify(destringified);

const { result, map } = destringified;

console.log('input: ', input);
console.log('restringified: ', restringified);
console.log('result: ', result);
console.log('map: ', map);
console.log('stringified map: ', JSON.stringify(map, null, '  '));