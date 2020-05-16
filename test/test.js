import { destringify, restringify } from '../src/index';

const simpleValues = [
  { value: 'a', expected: 'a' },
  { value: 3, expected: 3 },
  { value: true, expected: true },
  { value: '{}', expected: {} },
  { value: '[]', expected: [] }
];

const rootValues = [
  { root: {}, key: 'property' },
  { root: [], key: 0 }
];

describe('json-destringify', () => {
  const testDeReStringifySimple = ({ value, expected }, count) => {
    let stringified = value;
    for (let i = 0; i < count; i++) {
      stringified = JSON.stringify(stringified);
    }
    const valueCount = typeof expected === 'object' ? count + 1 : count;
    const { result, map } = destringify(stringified);
    expect(result).toEqual(expected);
    expect(map).toEqual({ count: valueCount });
    expect(restringify({ result, map })).toEqual(stringified);
  };

  const testDeReStringifyPair = ({ root, key }, rootCount, { value, expected }, count) => {
    let stringifiedValue = value;
    for (let i = 0; i < count; i++) {
      stringifiedValue = JSON.stringify(stringifiedValue);
    }
    let stringified = Array.isArray(root) ? [...root, stringifiedValue] : { ...root, [key]: stringifiedValue };
    for (let i = 0; i < rootCount; i++) {
      stringified = JSON.stringify(stringified);
    }
    
    const { result, map } = destringify(stringified);
    const json = restringify({ result, map });

    const valueCount = typeof expected === 'object' ? count + 1 : count;
    expect(result).toEqual(Array.isArray(root) ? [ ...root, expected ] : { ...root, [key]: expected });
    expect(map).toEqual({
      count: rootCount,
      ...(valueCount > 0 ? { children: Array.isArray(root) ? [{ count: valueCount }] : { [key]: { count: valueCount } } } : {})
    });
    expect(json).toEqual(stringified);
  };

  const testDeReStringifyTriple = ({ root, key }, rootCount, { root: middleRoot, key: middleKey }, middleCount, { value, expected }, count) => {
    let stringifiedValue = value;
    for (let i = 0; i < count; i++) {
      stringifiedValue = JSON.stringify(stringifiedValue);
    }
    let stringified = Array.isArray(middleRoot) ? [...middleRoot, stringifiedValue] : { ...middleRoot, [middleKey]: stringifiedValue };
    for (let i = 0; i < middleCount; i++) {
      stringified = JSON.stringify(stringified);
    }
    let stringifiedRoot = Array.isArray(root) ? [...root, stringified] : { ...root, [key]: stringified };
    for (let i = 0; i < rootCount; i++) {
      stringifiedRoot = JSON.stringify(stringifiedRoot);
    }

    const { result, map } = destringify(stringifiedRoot);
    const json = restringify({ result, map });

    const valueCount = typeof expected === 'object' ? count + 1 : count;
    const expectedMiddleResult = Array.isArray(middleRoot) ? [ ...middleRoot, expected ] : { ...middleRoot, [middleKey]: expected };
    const expectedResult = Array.isArray(root) ? [ ...root, expectedMiddleResult ] : { ...root, [key]: expectedMiddleResult };
    const expectedMiddleMapChildren = valueCount > 0 ? { children: Array.isArray(middleRoot) ? [{ count: valueCount }] : { [middleKey]: { count: valueCount } } } : {};
    const expectedMapChildren = middleCount > 0 || valueCount > 0 ? { children: Array.isArray(root) ? [{ count: middleCount, ...expectedMiddleMapChildren }] : { [key]: { count: middleCount, ...expectedMiddleMapChildren } } } : {};
    const expectedMap = { count: rootCount, ...expectedMapChildren };
    expect(result).toEqual(expectedResult);
    expect(map).toEqual(expectedMap);
    expect(json).toEqual(stringifiedRoot);
  };

  it('destringifies and restringifies simple values', () => {
    for (let simpleValue of simpleValues) {
      for (let i = 0; i < 3; i++) {
        testDeReStringifySimple(simpleValue, i);
      }
    }
  });

  it('destringifies and restringifies pairs of container and simple values', () => {
    for (let rootValue of rootValues) {
      for (let simpleValue of simpleValues) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            testDeReStringifyPair(rootValue, i, simpleValue, j);
          }
        }
      }
    }
  });

  it('destringifies and restringifies triples of container, container and simple values', () => {
    for (let rootValue of rootValues) {
      for (let middleValue of rootValues) {
        for (let simpleValue of simpleValues) {
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              for (let k = 0; k < 3; k++) {
                testDeReStringifyTriple(rootValue, i, middleValue, j, simpleValue, k);
              }
            }
          }
        }
      }
    }
  });

  it('destringifies and restringifies a stringified object string', () => {
    const input = JSON.stringify('{}');
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {},
      map: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a double stringified string', () => {
    const input = JSON.stringify(JSON.stringify(''));
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: "",
      map: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a quoted string', () => {
    const input = '"abc"';
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: 'abc',
      map: {
        count: 1
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a number', () => {
    const input = 123;
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: 123,
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a string number', () => {
    const input = '123';
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: 123,
      map: {
        count: 1
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a quoted number', () => {
    const input = '"123"';
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: 123,
      map: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an empty object', () => {
    const input = {};
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {},
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a property', () => {
    const input = { property: 'value' };
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value'
      },
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a quoted property', () => {
    const input = { '"property"': 'value' };
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        '"property"': 'value'
      },
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a quoted value', () => {
    const input = { property: '"value"' };
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value'
      },
      map: {
        count: 0,
        children: {
          property: {
            count: 1
          }
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a number value', () => {
    const input = { property: 123 };
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        property: 123
      },
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a string number value', () => {
    const input = { property: '123' };
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        property: 123
      },
      map: {
        count: 0,
        children: {
          property: {
            count: 1
          }
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a doubly stringified object with nested stringified values', () => {
    const input = JSON.stringify(JSON.stringify({ property: "value", nested: { nestProperty: JSON.stringify("nestedValue") } }));
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value',
        nested: {
          nestProperty: 'nestedValue'
        }
      },
      map: {
        count: 2,
        children: {
          nested: {
            count: 0,
            children: {
              nestProperty: {
                count: 1
              }
            }
          }
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with multiple strings', () => {
    const input = ['a', 'b', 'c'];
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: ['a', 'b', 'c'],
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with multiple objects with properties', () => {
    const input = [{ a: 1 }, { b: true }, { c: 'aString' }];
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: [{ a: 1 }, { b: true }, { c: 'aString' }],
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with multiple objects with some stringified properties', () => {
    const input = [{ a: 1 }, { b: true }, { c: JSON.stringify('aString') }];
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: [{ a: 1 }, { b: true }, { c: 'aString' }],
      map: {
        count: 0,
        children: [
          {
            count: 0
          },
          {
            count: 0
          },
          {
            count: 0,
            children: {
              c: {
                count: 1
              }
            }
          }
        ]
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a doubly stringified array with nested stringified values', () => {
    const input = JSON.stringify(JSON.stringify(['abc', { property: 'value', nested: { nestProperty: JSON.stringify('nestedValue') } }]));
    const inputResult = destringify(input);
    expect(inputResult).toEqual({
      result: [
        'abc',
        {
          property: 'value',
          nested: {
            nestProperty: 'nestedValue'
          }
        }
      ],
      map: {
        count: 2,
        children: [
          {
            count: 0
          },
          {
            count: 0,
            children: {
              nested: {
                count: 0,
                children: {
                  nestProperty: {
                    count: 1
                  }
                }
              }
            }
          }
        ]
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with some stringified elements', () => {
    const content = { property: JSON.stringify(true) };
    const input = [{...content}, {...content}, {...content}];
    const inputResult = destringify(input);

    const expectedContent = { property: true };
    const expectedContentMap = {
      count: 0,
      children: {
        property: {
          count: 1
        }
      }
    };

    expect(inputResult).toEqual({
      result: [
        expectedContent,
        expectedContent,
        expectedContent
      ],
      map: {
        count: 0,
        children: [
          expectedContentMap,
          expectedContentMap,
          expectedContentMap
        ]
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with no stringified elements', () => {
    const content = { property: true };
    const input = [{...content}, {...content}, {...content}];
    const inputResult = destringify(input);

    const expectedContent = { property: true };

    expect(inputResult).toEqual({
      result: [
        expectedContent,
        expectedContent,
        expectedContent
      ],
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with some stringified property values', () => {
    const content = JSON.stringify(true);
    const input = { property: [content, content, content] };
    const inputResult = destringify(input);

    const expectedContent = true;
    const expectedContentMap = {
      count: 1
    };

    expect(inputResult).toEqual({
      result: {
        property: [
          expectedContent,
          expectedContent,
          expectedContent
        ]
      },
      map: {
        count: 0,
        children: {
          property: {
            count: 0,
            children: [
              expectedContentMap,
              expectedContentMap,
              expectedContentMap
            ]
          }
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with no stringified property values', () => {
    const content = true;
    const input = { property: [content, content, content] };
    const inputResult = destringify(input);

    const expectedContent = true;

    expect(inputResult).toEqual({
      result: {
        property: [
          expectedContent,
          expectedContent,
          expectedContent
        ]
      },
      map: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });
});
