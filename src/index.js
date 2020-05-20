const TREE_DEFAULT = { count: 0 };

export const isTreeEqual = (treeA, treeB) => {
  const a = treeA || TREE_DEFAULT;
  const b = treeB || TREE_DEFAULT;
  if (
    a.count !== b.count ||
    typeof a.groupChildren !== typeof b.groupChildren ||
    typeof a.children !== typeof b.children ||
    Array.isArray(a.children) !== Array.isArray(b.children)) {
    return false;
  }
  if (typeof a.groupChildren === 'object') {
    if (!isTreeEqual(a.groupChildren, b.groupChildren)) {
      return false;
    }
  }
  if (typeof a.children === 'object') {
    if (Array.isArray(a.children)) {
      if (a.length !== b.length) {
        return false;
      }
      return !a.children.some((child, i) => !isTreeEqual(child, b.children[i]));
    } else {
      const aKeys = Object.keys(a.children);
      const bKeys = Object.keys(b.children);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      return !aKeys.some(aKey => !isTreeEqual(a.children[aKey], b.children[aKey])) && !bKeys.some(bKey => !isTreeEqual(a.children[bKey], b.children[bKey]));
    }
  }
  return true;
};

export const DEFAULT_OPTIONS = {
  groupChildren: true,
  shouldParse: (value, type) => type === 'string' || type === 'array' || type === 'object'
};

const shouldParse = (value,  { shouldParse }) =>
  shouldParse(value, Array.isArray(value) ? 'array' : typeof value);

export const destringify = (target, paramOptions = {}) => {
  const options = {...DEFAULT_OPTIONS, ...paramOptions};
  let parseResult = target;
  let parseTree = TREE_DEFAULT;
  switch (typeof target) {
    case 'string':
      try {
        const parsed = JSON.parse(target);
        if (parsed !== target && shouldParse(parsed, options)) {
          const { result, tree } = destringify(parsed, options);
          
          parseResult = result;
          parseTree = {
            ...tree,
            count: tree.count + 1
          };
        }
      } catch (ex) { /* ignore json parse error */ }
      break;
    case 'number':
      break;
    case 'object':
      const { groupChildren } = options;
      if (Array.isArray(target)) {
        if (target.length > 0) {
          const parsedElements = target.map(targetElement => destringify(targetElement, options));
          let arrayChildrenTree = parsedElements.map(({ tree }) => tree);
          parseResult = parsedElements.map(({ result }) => result);
          if (arrayChildrenTree && arrayChildrenTree.length > 0 && arrayChildrenTree.some(tree => tree !== TREE_DEFAULT)) {
            const firstTree = arrayChildrenTree[0];
            if (groupChildren && !arrayChildrenTree.some(tree => !isTreeEqual(firstTree, tree))) {
              parseTree = {
                ...parseTree,
                groupChildren: firstTree
              };
            } else {
              parseTree = {
                ...parseTree,
                children: arrayChildrenTree
              };
            }
          }
        }
      } else if (target) {
        const keys = Object.keys(target);
        if (keys.length > 0) {
          const parsedPropertyValues = keys.reduce((m, k) => {
            m[k] = destringify(target[k], options);
            return m;
          }, {});
          parseResult = keys.reduce((m, k) => {
            m[k] = parsedPropertyValues[k].result;
            return m;
          }, {});
          const treeChildren = keys.reduce((m, k) => {
            const { tree: treeChild } = parsedPropertyValues[k];
            if (treeChild !== TREE_DEFAULT) {
              if (treeChild.count > 0) {
                m[k] = {
                  count: treeChild.count
                };
              }
              if (treeChild.groupChildren !== undefined || 
                (treeChild.children !== undefined && Object.keys(treeChild.children).some(key => treeChild.children[key] !== TREE_DEFAULT))) {
                m[k] = {
                  ...treeChild
                };
              }
            }
            return m;
          }, {});
          if (treeChildren && Object.keys(treeChildren).length > 0) {
            const treeKeys = Object.keys(treeChildren);
            const firstKeyTree = treeChildren[treeKeys[0]];
            if (groupChildren && !keys.some(key => !isTreeEqual(firstKeyTree, treeChildren[key]))) {
              parseTree = {
                ...parseTree,
                groupChildren: firstKeyTree
              };
            } else {
              parseTree = {
                ...parseTree,
                children: treeChildren
              };
            }
          }
        }
      }
      break;
  }
  return {
    result: parseResult,
    tree: parseTree
  };
};

export const restringify = ({ result, tree }) => {
  let json = result;

  const { count, children, groupChildren } = tree;
  if (typeof result === 'object') {
    if (groupChildren) {
      if (Array.isArray(result)) {
        json = [];
        result.forEach(resultElement => {
          json.push(restringify({ result: resultElement, tree: groupChildren }));
        });
      } else if (result) {
        json = {};
        Object.keys(result).forEach(key => {
          json[key] = restringify({ result: result[key], tree: groupChildren });
        });
      }
    } else if (children) {
      if (Array.isArray(children) && Array.isArray(result)) {
        json = [];
        children.forEach((tree, i) => {
          json.push(restringify({ result: result[i], tree }));
        });
      } else if (children && result) {
        json = {};
        Object.keys(result).forEach(key => {
          if (children[key]) {
            json[key] = restringify({ result: result[key], tree: children[key] });
          }
          else {
            json[key] = result[key];
          }
        });
      }
    }
  }
  for (let i = 0; i < count; i++) {
    json = JSON.stringify(json, null, '');
  }
  return json;
};
