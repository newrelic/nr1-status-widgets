export const subVariables = (query, variables) => {
  if (variables && Object.keys(variables || {}).length > 0) {
    let newQuery = query;

    Object.keys(variables).forEach(varKey => {
      const variable = variables[varKey];
      if (Array.isArray(variable)) {
        const subString = `'${variable.join("','")}'`;
        newQuery = newQuery.replaceAll(`{{${varKey}}}`, subString);
      } else {
        newQuery = newQuery.replaceAll(`{{${varKey}}}`, variable);
      }
    });

    return newQuery;
  }

  return query;
};
