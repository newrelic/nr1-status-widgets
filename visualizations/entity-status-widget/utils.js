export const generateErrors = props => {
  const errors = [];
  const {
    entityGuids,
    entitySearchQuery,
    trackCritical,
    trackWarning,
    trackHealthy,
    trackNotConfigured
  } = props;

  // at least one status must be tracked
  if (!trackCritical && !trackWarning && !trackHealthy && !trackNotConfigured) {
    errors.push('At least one status must be tracked');
  }

  // at least one guid or one entity search query should be defined
  // // filter nulls
  const guids = entityGuids.filter(g => g.guid);
  if (guids.length === 0 && !entitySearchQuery) {
    errors.push('At least one guid or a entity search query should be defined');
  }

  return errors;
};

// filter entities
export const filterEntities = (props, entities) => {
  const {
    trackCritical,
    trackWarning,
    trackHealthy,
    trackNotConfigured
  } = props;

  const filterEntities = entities.filter(e => {
    if (trackCritical && e.alertSeverity === 'CRITICAL') return true;
    if (trackWarning && e.alertSeverity === 'WARNING') return true;
    if (trackNotConfigured && e.alertSeverity === 'NOT_CONFIGURED') return true;
    if (trackHealthy && e.alertSeverity === 'NOT_ALERTING') return true;

    return false;
  });

  return filterEntities;
};

// chunking for batching nerdgraph calls
export const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
