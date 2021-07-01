export const deriveValues = (nrqlData, config) => {
  const values = { timeseries: [] };
  (nrqlData || []).forEach(d => {
    const groupDisplayName =
      d.metadata.groups[d.metadata.groups.length - 1].displayName;
    const groupName = d.metadata.groups[d.metadata.groups.length - 1].name;
    const groupValue = d.metadata.groups[d.metadata.groups.length - 1].value;

    let selectedGroup = '';

    if (
      d.data[0][groupDisplayName] !== null &&
      d.data[0][groupDisplayName] !== undefined
    ) {
      values[groupDisplayName] = d.data[d.data.length - 1][groupDisplayName];
      values.latestValue = values[groupDisplayName];
      values.value = values.latestValue;
      selectedGroup = 'groupDisplayName';
    } else if (
      d.data[0][groupName] !== null &&
      d.data[0][groupName] !== undefined
    ) {
      values[groupName] = d.data[d.data.length - 1][groupName];
      values.latestValue = values[groupName];
      values.value = values.latestValue;
      selectedGroup = 'groupName';
    } else if (
      d.data[0][groupValue] !== null &&
      d.data[0][groupValue] !== undefined
    ) {
      values[groupValue] = d.data[d.data.length - 1][groupValue];
      values.latestValue = values[groupValue];
      values.value = values.latestValue;
      selectedGroup = 'groupValue';
    }

    assessValue(values, config);

    // perform decorations and calculations on existing values
    d.data.forEach(value => {
      const currentValue = { ...value, value: null };
      if (selectedGroup === 'groupName') {
        currentValue.value = value[groupName];
      } else if (selectedGroup === 'groupDisplayName') {
        currentValue.value = value[groupDisplayName];
      } else if (selectedGroup === 'groupValue') {
        currentValue.value = value[groupValue];
      }
      assessValue(currentValue, config);
      values.timeseries.push(currentValue);
    });
  });

  return values;
};

export const assessValue = (value, config) => {
  value.status = 'healthy';
  value.statusLabel = config.healthyLabel;

  if (config.thresholdType === 'numeric') {
    if (config.thresholdDirection === 'above') {
      if (value.value > config.warningThreshold) {
        value.status = 'warning';
        value.statusLabel = config.warningLabel;
      }
      if (value.value > config.criticalThreshold) {
        value.status = 'critical';
        value.statusLabel = config.criticalLabel;
      }
    }

    if (config.thresholdDirection === 'below') {
      if (value.value < config.warningThreshold) {
        value.status = 'warning';
        value.statusLabel = config.warningLabel;
      }
      if (value.value < config.criticalThreshold) {
        value.status = 'critical';
        value.statusLabel = config.criticalLabel;
      }
    }
  } else if (config.thresholdType === 'regex') {
    const warningRegex = new RegExp(config.warningThreshold);
    if (warningRegex.test(value.y)) {
      value.status = 'warning';
      value.statusLabel = config.warningLabel;
    }

    const criticalRegex = new RegExp(config.criticalThreshold);
    if (criticalRegex.test(value.y)) {
      value.status = 'critical';
      value.statusLabel = config.criticalLabel;
    }
  }
};

export const generateErrorsAndConfig = (
  criticalLabel,
  warningLabel,
  healthyLabel,
  warningThreshold,
  criticalThreshold,
  thresholdDirection,
  accountId,
  query,
  onClickUrl,
  modalQueries
) => {
  const errors = [];

  const configuration = {
    criticalLabel,
    warningLabel,
    healthyLabel,
    warningThreshold,
    criticalThreshold
  };

  if (
    onClickUrl &&
    !onClickUrl.startsWith('http://') &&
    !onClickUrl.startsWith('https://')
  ) {
    errors.push('On Click URL missing http:// or https://');
  }

  (modalQueries || []).forEach((q, i) => {
    if (['line', 'area', 'sparkline'].includes(q.chartType)) {
      if (!q.query.toLowerCase().includes('timeseries')) {
        errors.push(`Modal query ${i + 1} - missing TIMESERIES keyword`);
      }
    } else if (q.query.toLowerCase().includes('timeseries')) {
      errors.push(
        `Modal query ${i + 1} - should not contain TIMESERIES keyword`
      );
    }
  });

  if (isNaN(warningThreshold) && isNaN(criticalThreshold)) {
    configuration.thresholdType = 'regex';
  } else if (!isNaN(warningThreshold) && !isNaN(criticalThreshold)) {
    configuration.thresholdType = 'numeric';
    configuration.warningThreshold = parseFloat(warningThreshold);
    configuration.criticalThreshold = parseFloat(criticalThreshold);
    if (criticalThreshold && criticalThreshold === warningThreshold) {
      errors.push(
        'Critical and warning thresholds should not be the same value'
      );
    }
  } else {
    errors.push(
      'Threshold values are mixed types, they must both be numerics or all strings'
    );
  }

  if (configuration.thresholdType === 'numeric') {
    if (['above', 'below'].includes(thresholdDirection)) {
      configuration.thresholdDirection = thresholdDirection;
    } else {
      configuration.thresholdDirection = 'above';
    }

    if (
      configuration.thresholdDirection === 'above' &&
      configuration.warningThreshold > configuration.criticalThreshold
    ) {
      errors.push(
        'Warning threshold is higher than critical threshold, correct this or set your threshold direction to below'
      );
    } else if (
      configuration.thresholdDirection === 'below' &&
      configuration.warningThreshold < configuration.criticalThreshold
    ) {
      errors.push(
        'Warning threshold is less than critical threshold, correct this or set your threshold direction to above'
      );
    }
  }

  if (!accountId) errors.push('Required: Account ID');
  if (!query) {
    errors.push('Required: Query eg. FROM TransactionError SELECT count(*)');
  } else {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('timeseries') || lowerQuery.includes('facet')) {
      errors.push(
        'Query contains timeseries and/or facet and should be removed'
      );
    }
    if (lowerQuery.includes('since') || lowerQuery.includes('until')) {
      errors.push(
        'Query contains since and/or until and should be removed, use the parameters further below to set'
      );
    }
  }
  if (!criticalThreshold) errors.push('Required: Critical threshold');
  if (!warningThreshold) errors.push('Required: Warning threshold');

  return { errors, configuration };
};

export const generateSloErrors = sloConfig => {
  const errors = [];
  const {
    sloId,
    sloDays,
    sloTarget,
    sloBudget,
    sloBar,
    sloDaysToView
  } = sloConfig;

  if (sloId) {
    if (!sloDays) {
      errors.push('SLO ID is set, but time window is not');
    }
    if (!sloTarget) {
      errors.push('SLO ID is set, but SLO target is not');
    }
    if (!sloBudget) {
      errors.push('SLO ID is set, but SLO budget is not');
    }
  }

  if (!sloId) {
    if (sloBar) {
      errors.push('SLO Status Bar is enabled, but SLO ID is not set');
    }
    if (sloDaysToView) {
      errors.push('SLO Days to view is set, but SLO ID is not set');
    }
  }

  return errors;
};
