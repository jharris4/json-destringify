# json-destringify
Parses JSON while eagerly destringifying. A stringification tree is returned to allow the parsed/cleaned result to be edited and converted back to the original stringified format

Installation:
----------

```shell
$ yarn add json-destringify
```

```shell
$ npm install json-destringify
```

Build:
----------

```shell
$ yarn build
$ yarn deploy
```

```shell
$ npm run build
$ npm run deploy
```

Test:
----------

```shell
$ yarn test
```

```shell
$ npm run test
```

Usage:
----------

```js
import { destringify, restringify } from 'json-destringify';

const sampleInput = JSON.stringify({ property: 'true' });
// sampleInput = "{\"property\":\"true\"}"

const { result, tree } = destringify(sampleInput);
// result = { property: true }
// tree = { count: 1, children: { property: { count: 1 } } }

const sampleOutput = restringify({ result, tree });
// sampleOutput = "{\"property\":\"true\"}"

const changedResult = {
  property: false
};

const changedOutput = restringify({ result: changedResult, tree });
// changedOutput = "{\"property\":\"false\"}"
```


Example:
----------

```js
import { destringify, restringify } from 'json-destringify';

const input = {
  property: [
    JSON.stringify({
      key: JSON.stringify(123)
    })
  ]
};
/*
input = { property: [ '{"key":"123"}' ] }
*/

const destringified = destringify(input);

const restringified = restringify(destringified);

/*
restringified = { property: [ '{"key":"123"}' ] }
*/

const { result, tree } = destringified;

/*
result = { property: [ { key: 123 } ] }

tree = {
  count: 0,
  children: {
    property: {
      count: 0,
      children: [
        {
          count: 1,
          children: {
            key: {
              count: 1
            }
          }
        }
      ]
    }
  }
}
*/
```