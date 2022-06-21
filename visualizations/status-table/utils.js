export const discoverErrors = props => {
  const { accountId, query } = props;

  const errors = [];

  if (!accountId) {
    errors.push('Account ID required');
  }

  if (!query) {
    errors.push('Query required');
  }

  return errors;
};

export const assessValue = (value, config) => {
  const {
    targetAttribute,
    regexMatch,
    valueEqual,
    valueAbove,
    valueBelow,
    bgColor,
    fontColor
  } = config;
  const result = {};

  if (!isNaN(value)) {
    if (!isEmpty(valueAbove) && value > valueAbove) {
      result.check = 'valueAbove';
    } else if (
      !isEmpty(valueBelow) &&
      !isEmpty(valueAbove) &&
      value < valueBelow &&
      value > valueAbove
    ) {
      result.check = 'valueBetween';
    } else if (!isEmpty(valueBelow) && value < valueBelow) {
      result.check = 'valueBelow';
    } else if (!isEmpty(valueEqual) && value === valueEqual) {
      result.check = 'valueEqual';
    }
  } else if (!isEmpty(regexMatch)) {
    const valueRegex = new RegExp(regexMatch);
    if (valueRegex.test(value)) {
      result.check = 'regexMatch';
    }
  }

  if (result.check) {
    result.bgColor = bgColor;
    result.fontColor = fontColor;
    result.targetAttribute = targetAttribute;
    result.value = value;

    // massage status levels and colors
    if (bgColor === 'healthy' || bgColor === 'green') {
      result.bgColor = '#01b076';
      result.fontColor = 'white';
    }

    if (fontColor === 'healthy' || fontColor === 'green') {
      result.fontColor = '#01b076';
    }

    if (bgColor === 'critical' || bgColor === 'red') {
      result.bgColor = '#f5554b';
      result.fontColor = 'white';
    }

    if (fontColor === 'critical' || fontColor === 'red') {
      result.fontColor = '#f5554b';
    }

    if (bgColor === 'warning' || bgColor === 'orange') {
      result.bgColor = '#f0b400';
      result.fontColor = 'white';
    }

    if (fontColor === 'warning' || fontColor === 'orange') {
      result.fontColor = '#f0b400';
    }

    if (bgColor === 'unknown' || bgColor === 'grey') {
      result.bgColor = '#9fa5a5';
    }

    if (fontColor === 'unknown' || fontColor === 'grey') {
      result.fontColor = '#9fa5a5';
    }
  }

  return result;
};

export const generateErrorsAndConfig = (
  thresholds,
  accountId,
  query,
  onClickUrl,
  modalQueries
) => {
  const errors = [];
  const sortedThresholds = thresholds.sort((a, b) => {
    const aNo = !isEmpty(a.priority) ? a.priority : 99999;
    const bNo = !isEmpty(b.priority) ? b.priority : 99999;

    return parseInt(aNo) - parseInt(bNo);
  });

  if (
    onClickUrl &&
    !onClickUrl.startsWith('http://') &&
    !onClickUrl.startsWith('https://')
  ) {
    errors.push('On Click URL missing http:// or https://');
  }

  (modalQueries || []).forEach((q, i) => {
    if (['line', 'area', 'sparkline', 'stackedbar'].includes(q.chartType)) {
      if (!q.query.toLowerCase().includes('timeseries')) {
        errors.push(`Modal query ${i + 1} - missing TIMESERIES keyword`);
      }
    } else if (q.query.toLowerCase().includes('timeseries')) {
      errors.push(
        `Modal query ${i + 1} - should not contain TIMESERIES keyword`
      );
    }

    if (q.query.toLowerCase().includes('since')) {
      errors.push(`Modal query ${i + 1} - should not contain SINCE keyword`);
    }

    if (q.query.toLowerCase().includes('until')) {
      errors.push(`Modal query ${i + 1} - should not contain UNTIL keyword`);
    }
  });

  if ((thresholds || []).length === 0) {
    errors.push('At least one threshold should be defined');
  }

  (thresholds || []).forEach((t, i) => {
    if (t.name) {
      if (!t.bgColor) {
        errors.push(`Threshold ${i + 1} - background color is not defined`);
      }

      // empty check
      if (
        isEmpty(t.valueAbove) &&
        isEmpty(t.valueBelow) &&
        isEmpty(t.valueEqual)
      ) {
        errors.push(
          `Threshold ${i + 1} - at least one value parameter should be define`
        );
      }

      if (!isEmpty(t.priority) && isNaN(t.priority)) {
        errors.push(`Threshold ${i + 1} - priority: must be a number`);
      }

      if (!isEmpty(t.valueAbove) && isNaN(t.valueAbove)) {
        errors.push(`Threshold ${i + 1} - above: must be a number`);
      }

      if (!isEmpty(t.valueBelow) && isNaN(t.valueBelow)) {
        errors.push(`Threshold ${i + 1} - below: must be a number`);
      }
      if (!isEmpty(t.valueEqual) && isNaN(t.valueEqual)) {
        errors.push(`Threshold ${i + 1} - equal: must be a number`);
      }
    }
  });

  if (!accountId) errors.push('Required: Account ID');
  if (!query || query.length < 6) {
    errors.push(
      'Required: Query eg. FROM Transaction SELECT count(*) FACET appName, hourOf(timestamp) ORDER BY timestamp LIMIT MAX'
    );
  } else {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('timeseries')) {
      errors.push('Query contains timeseries and should be removed');
    }
  }

  return { errors, sortedThresholds };
};

export const buildOrderedData = (data, nrqlQuery, thresholds) => {
  let xLabels = [];
  const unorderedHeatMapData = {};
  let query = nrqlQuery || '';

  data.forEach(d => {
    query = query || d.nrqlQuery;
    const metricName = d?.metadata?.groups?.[0]?.value || null;

    if (metricName) {
      const value = d?.data?.[0]?.[metricName] || 0;

      const y = d.metadata.groups[1].value;
      const x = d.metadata.groups[2].value;
      xLabels.push(x);

      const finalValue = assessValue({ value }, thresholds);

      if (y in unorderedHeatMapData) {
        unorderedHeatMapData[y][x] = { ...finalValue };
      } else {
        unorderedHeatMapData[y] = { [x]: { ...finalValue } };
      }
    }
  });

  xLabels = [...new Set(xLabels)];

  // allow additional sorting for hourOf and dateOf
  if (query) {
    if (query.includes('hourOf(')) {
      xLabels = xLabels.sort((a, b) => a.split(':')[0] - b.split(':')[0]);
    } else if (query.includes('dateOf(')) {
      xLabels = xLabels.sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
    }
  }

  const orderedHeatMapData = {};
  Object.keys(unorderedHeatMapData)
    .sort()
    .forEach(key => {
      orderedHeatMapData[key] = unorderedHeatMapData[key];
    });

  const heatmapData = [];
  const yLabels = [];

  Object.keys(orderedHeatMapData).forEach(key => {
    yLabels.push(key);
    const metricData = orderedHeatMapData[key];
    const dataArr = [];
    xLabels.forEach(label => {
      if (label in metricData) {
        dataArr.push(metricData[label]);
      } else {
        dataArr.push(0);
      }
    });
    heatmapData.push(dataArr);
  });

  return { orderedData: orderedHeatMapData, xLabels };
};

/**
 * Returns true when the provided value is either null, undefined or an empty string
 *
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  return [null, undefined, ''].includes(value);
}
