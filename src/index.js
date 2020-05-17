const MAP_DEFAULT = { count: 0 };

export const isMapEqual = (mapA, mapB) => {
  const a = mapA || MAP_DEFAULT;
  const b = mapB || MAP_DEFAULT;
  if (
    a.count !== b.count ||
    typeof a.children !== typeof b.children ||
    Array.isArray(a.children) !== Array.isArray(b.children)) {
    return false;
  }
  if (typeof a.children === 'object') {
    if (Array.isArray(a.children)) {
      if (a.length !== b.length) {
        return false;
      }
      return !a.children.some((child, i) => !isMapEqual(child, b.children[i]));
    } else {
      const aKeys = Object.keys(a.children);
      const bKeys = Object.keys(b.children);
      if (aKeys.length !== bKeys.length) {
        return false;
      }
      return !aKeys.some(aKey => !isMapEqual(a.children[aKey], b.children[aKey])) && !bKeys.some(bKey => !isMapEqual(a.children[bKey], b.children[bKey]));
    }
  }
  return true;
};

export const destringify = (target) => {
  let parseResult = target;
  let parseMap = MAP_DEFAULT;
  switch (typeof target) {
    case 'string':
      try {
        const parsed = JSON.parse(target);
        if (parsed !== target) {
          const { result, map } = destringify(parsed);
          parseResult = result;
          parseMap = {
            ...map,
            count: map.count + 1
          };
        }
      } catch (ex) { /* ignore json parse error */ }
      break;
    case 'number':
      break;
    case 'object':
      if (Array.isArray(target)) {
        if (target.length > 0) {
          const parsedElements = target.map(targetElement => destringify(targetElement));
          let arrayChildren = parsedElements.map(({ map }) => map);
          parseResult = parsedElements.map(({ result }) => result);
          if (arrayChildren && arrayChildren.length > 0 && arrayChildren.some(arrayElement => arrayElement !== MAP_DEFAULT)) {
            parseMap = {
              ...parseMap,
              children: arrayChildren
            };
          }
        }
      } else if (target) {
        const keys = Object.keys(target);
        if (keys.length > 0) {
          const parsedPropertyValues = keys.reduce((m, k) => {
            m[k] = destringify(target[k]);
            return m;
          }, {});
          parseResult = keys.reduce((m, k) => {
            m[k] = parsedPropertyValues[k].result;
            return m;
          }, {});
          const mapChildren = keys.reduce((m, k) => {
            const { map: mapChild } = parsedPropertyValues[k];
            if (mapChild !== MAP_DEFAULT) {
              if (mapChild.count > 0) {
                m[k] = {
                  count: mapChild.count
                };
              }
              if (mapChild.children !== undefined && Object.keys(mapChild.children).some(key => mapChild.children[key] !== MAP_DEFAULT)) {
                m[k] = {
                  ...mapChild
                };
              }
            }
            return m;
          }, {});
          if (mapChildren && Object.keys(mapChildren).length > 0) {
            parseMap = {
              ...parseMap,
              children: mapChildren
            };
          }
        }
      }
      break;
  }
  return {
    result: parseResult,
    map: parseMap
  };
};

export const restringify = ({ result, map }) => {
  let json = result;

  const { count, children } = map;
  if (typeof children === 'object' && typeof result === 'object') {
    if (Array.isArray(children) && Array.isArray(result)) {
      json = [];
      children.forEach((child, i) => {
        json.push(restringify({ result: result[i], map: child }));
      });
    } else if (children && result) {
      const keys = Object.keys(result);
      json = {};
      keys.forEach(key => {
        if (children[key]) {
          json[key] = restringify({ result: result[key], map: children[key] });
        }
        else {
          json[key] = result[key];
        }
      });
    }
  }
  for (let i = 0; i < count; i++) {
    json = JSON.stringify(json, null, '');
  }
  return json;
};
