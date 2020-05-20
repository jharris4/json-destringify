import { destringify, restringify, isTreeEqual } from '../src/index';

describe('json-destringify', () => {
  const simpleValues = [
    { value: 'a', expected: 'a' },
    { value: 3, expected: 3 },
    { value: true, expected: true },
    { value: [], expected: [] },
    { value: {}, expected: {} },
    { value: null, expected: null }
  ];
  
  const rootValues = [
    { root: {}, key: 'property' },
    { root: [] }
  ];
  
  const options = {
    shouldParse: () => true,
    groupChildren: false
  };

  const destringifyWithOptions = stringified => destringify(stringified, options);

  const testDeReStringifySimple = ({ value, expected }, count) => {
    let stringified = value;
    for (let i = 0; i < count; i++) {
      stringified = JSON.stringify(stringified);
    }
    const { result, tree } = destringifyWithOptions(stringified);

    expect(result).toEqual(expected);
    expect(tree).toEqual({ count });
    expect(restringify({ result, tree })).toEqual(stringified);
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
    
    const { result, tree } = destringifyWithOptions(stringified);
    const json = restringify({ result, tree });

    expect(result).toEqual(Array.isArray(root) ? [ ...root, expected ] : { ...root, [key]: expected });
    expect(tree).toEqual({
      count: rootCount,
      ...(count > 0 ? { children: Array.isArray(root) ? [{ count }] : { [key]: { count } } } : {})
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

    const { result, tree } = destringifyWithOptions(stringifiedRoot);
    const json = restringify({ result, tree });

    const expectedMiddleResult = Array.isArray(middleRoot) ? [ ...middleRoot, expected ] : { ...middleRoot, [middleKey]: expected };
    const expectedResult = Array.isArray(root) ? [ ...root, expectedMiddleResult ] : { ...root, [key]: expectedMiddleResult };
    const expectedMiddleTreeChildren = count > 0 ? { children: Array.isArray(middleRoot) ? [{ count }] : { [middleKey]: { count } } } : {};
    const expectedTreeChildren = middleCount > 0 || count > 0 ? { children: Array.isArray(root) ? [{ count: middleCount, ...expectedMiddleTreeChildren }] : { [key]: { count: middleCount, ...expectedMiddleTreeChildren } } } : {};
    const expectedTree = { count: rootCount, ...expectedTreeChildren };
    expect(result).toEqual(expectedResult);
    expect(tree).toEqual(expectedTree);
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
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {},
      tree: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a double stringified string', () => {
    const input = JSON.stringify(JSON.stringify(''));
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: "",
      tree: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a quoted string', () => {
    const input = '"abc"';
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: 'abc',
      tree: {
        count: 1
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a number', () => {
    const input = 123;
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: 123,
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a string number', () => {
    const input = '123';
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: 123,
      tree: {
        count: 1
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies a quoted number', () => {
    const input = '"123"';
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: 123,
      tree: {
        count: 2
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an empty object', () => {
    const input = {};
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {},
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a property', () => {
    const input = { property: 'value' };
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value'
      },
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a quoted property', () => {
    const input = { '"property"': 'value' };
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        '"property"': 'value'
      },
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a quoted value', () => {
    const input = { property: '"value"' };
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value'
      },
      tree: {
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
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        property: 123
      },
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with a string number value', () => {
    const input = { property: '123' };
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        property: 123
      },
      tree: {
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
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: {
        property: 'value',
        nested: {
          nestProperty: 'nestedValue'
        }
      },
      tree: {
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
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: ['a', 'b', 'c'],
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with multiple objects with properties', () => {
    const input = [{ a: 1 }, { b: true }, { c: 'aString' }];
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: [{ a: 1 }, { b: true }, { c: 'aString' }],
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with multiple objects with some stringified properties', () => {
    const input = [{ a: 1 }, { b: true }, { c: JSON.stringify('aString') }];
    const inputResult = destringifyWithOptions(input);
    expect(inputResult).toEqual({
      result: [{ a: 1 }, { b: true }, { c: 'aString' }],
      tree: {
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
    const inputResult = destringifyWithOptions(input);
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
      tree: {
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
    const inputResult = destringifyWithOptions(input);

    const expectedContent = { property: true };
    const expectedContentTree = {
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
      tree: {
        count: 0,
        children: [
          expectedContentTree,
          expectedContentTree,
          expectedContentTree
        ]
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an array with no stringified elements', () => {
    const content = { property: true };
    const input = [{...content}, {...content}, {...content}];
    const inputResult = destringifyWithOptions(input);

    const expectedContent = { property: true };

    expect(inputResult).toEqual({
      result: [
        expectedContent,
        expectedContent,
        expectedContent
      ],
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('destringifies and restringifies an object with some stringified property values', () => {
    const content = JSON.stringify(true);
    const input = { property: [content, content, content] };
    const inputResult = destringifyWithOptions(input);

    const expectedContent = true;
    const expectedContentTree = {
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
      tree: {
        count: 0,
        children: {
          property: {
            count: 0,
            children: [
              expectedContentTree,
              expectedContentTree,
              expectedContentTree
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
    const inputResult = destringifyWithOptions(input);

    const expectedContent = true;

    expect(inputResult).toEqual({
      result: {
        property: [
          expectedContent,
          expectedContent,
          expectedContent
        ]
      },
      tree: {
        count: 0
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });
});

describe('groupChildren', () => {
  it('does group all children when they are the same', () => {
    const content = "true";
    const input = { property: [content, content, content] };
    const inputResult = destringify(input, { groupChildren: true, shouldParse: () => true });

    const expectedContent = true;

    expect(inputResult).toEqual({
      result: {
        property: [
          expectedContent,
          expectedContent,
          expectedContent
        ]
      },
      tree: {
        count: 0,
        groupChildren: {
          count: 0,
          groupChildren: {
            count: 1
          }
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('does not group all children when one of them is different', () => {
    const content = "true";
    const input = { property: [content, true, content] };
    const inputResult = destringify(input, { groupChildren: true, shouldParse: () => true });

    const expectedContent = true;

    expect(inputResult).toEqual({
      result: {
        property: [
          expectedContent,
          expectedContent,
          expectedContent
        ]
      },
      tree: {
        count: 0,
        groupChildren: {
          count: 0,
          children: [
            {
              count: 1
            },
            {
              count: 0
            },
            {
              count: 1
            }
          ]
        }
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('does not group all children of an object when one of the object values needs no parsing', () => {
    const input = { property: "true", otherProperty: 1 };
    const inputResult = destringify(input, { groupChildren: true, shouldParse: () => true });

    expect(inputResult).toEqual({
      result: {
        property: true,
        otherProperty: 1
      },
      tree: {
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
});

describe('shouldParse', () => {
  it('allows all types to be parsed', () => {
    const input = ["\"a\"", "1", "true", "{}", "[]"];
    const inputResult = destringify(input, { groupChildren: false, shouldParse: () => true });

    expect(inputResult).toEqual({
      result: ["a", 1, true, {}, []],
      tree: {
        count: 0,
        children: [
          {
            count: 1
          },
          {
            count: 1
          },
          {
            count: 1
          },
          {
            count: 1
          },
          {
            count: 1
          }
        ]
      }
    });
    const json = restringify(inputResult);
    expect(input).toEqual(json);
  });

  it('allows specific types to be excluded from parsing', () => {
    const input = ["\"a\"", "1", "true", "{}", "[]"];
    const expected = ["a", 1, true, {}, []];

    const shouldParses = [
      (value, type) => type !== 'string',
      (value, type) => type !== 'number',
      (value, type) => type !== 'boolean',
      (value, type) => type !== 'object',
      (value, type) => type !== 'array'
    ]

    shouldParses.forEach((shouldParse, i) => {
      const inputResult = destringify(input, { groupChildren: false, shouldParse });

      expect(inputResult).toEqual({
        result: [
          i === 0 ? input[0] : expected[0],
          i === 1 ? input[1] : expected[1],
          i === 2 ? input[2] : expected[2],
          i === 3 ? input[3] : expected[3],
          i === 4 ? input[4] : expected[4]
        ],
        tree: {
          count: 0,
          children: [
            {
              count: i == 0 ? 0 : 1
            },
            {
              count: i == 1 ? 0 : 1
            },
            {
              count: i == 2 ? 0 : 1
            },
            {
              count: i == 3 ? 0 : 1
            },
            {
              count: i == 4 ? 0 : 1
            }
          ]
        }
      });
      const json = restringify(inputResult);
      expect(input).toEqual(json);
    });
  });
});

describe('isTreeEqual', () => {
  it('does match two trees with same counts', () => {
    const count = 0;
    expect(isTreeEqual({ count }, { count })).toBe(true);
  });

  it('does not match two trees with different counts', () => {
    const countA = 0;
    const countB = 1;
    expect(isTreeEqual({ count: countA }, { count: countB })).toBe(false);
  });

  it('does match two trees with same counts and same object children', () => {
    const count = 0;
    const children = { property: { count: 1 } };
    expect(isTreeEqual({ count, children: {...children} }, { count, children: {...children} })).toBe(true);
  });

  it('does not match two trees with same counts and different object children', () => {
    const count = 0;
    const childrenA = { property: { count: 1 } };
    const childrenB = { property: { count: 2 } };
    expect(isTreeEqual({ count, children: childrenA }, { count, children: childrenB })).toBe(false);
  });

  it('does match two trees with same counts and same array children', () => {
    const count = 0;
    const children = [{ count: 1 }];
    expect(isTreeEqual({ count, children: {...children} }, { count, children: {...children} })).toBe(true);
  });

  it('does not match two trees with same counts and different array children', () => {
    const count = 0;
    const childrenA = [{ count: 1 }];
    const childrenB = [{ count: 2 }];
    expect(isTreeEqual({ count, children: childrenA }, { count, children: childrenB })).toBe(false);
  });
});

describe('edit', () => {
  const options = {
    shouldParse: () => true,
    groupChildren: false
  };

  const destringifyWithOptions = stringified => destringify(stringified, options);

  it('allows editing a value', () => {
    const input = JSON.stringify({ keyA: 'value1', keyB: 'value2' });
    const inputResult = destringifyWithOptions(input);
    const { result, tree } = inputResult;
    const edited = {...result, keyA: 'value3' };
    const editedStringified = restringify({ result: edited, tree });
    expect(editedStringified).toEqual(JSON.stringify({ keyA: 'value3', keyB: 'value2' }));
  });

  it('allows deleting an object property', () => {
    const input = JSON.stringify({ keyA: 'value1', keyB: 'value2' });
    const inputResult = destringifyWithOptions(input);
    const { result, tree } = inputResult;
    const { keyA, ...edited } = result;
    const editedStringified = restringify({ result: edited, tree });
    expect(editedStringified).toEqual(JSON.stringify({ keyB: 'value2' }));
  });

  it('allows deleting an object property that has children', () => {
    const input = JSON.stringify({ keyA: { property: JSON.stringify('value1') }, keyB: 'value2' });
    const inputResult = destringifyWithOptions(input);
    const { result, tree } = inputResult;
    const { keyA, ...edited } = result;
    const editedStringified = restringify({ result: edited, tree });
    expect(editedStringified).toEqual(JSON.stringify({ keyB: 'value2' }));
  });

  it('allows deleting an array element', () => {
    const input = JSON.stringify(['value1', 'value2']);
    const inputResult = destringifyWithOptions(input);
    const { result, tree } = inputResult;
    const edited = ['value3', result[1]]
    const editedStringified = restringify({ result: edited, tree });
    expect(editedStringified).toEqual(JSON.stringify(['value3', 'value2']));
  });

  it('allows deleting an array element that has children', () => {
    const input = JSON.stringify([[JSON.stringify('value1')], 'value2']);
    const inputResult = destringifyWithOptions(input);
    const { result, tree } = inputResult;
    const edited = [null, result[1]]
    const editedStringified = restringify({ result: edited, tree });
    expect(editedStringified).toEqual(JSON.stringify([null, 'value2']));
  });
});