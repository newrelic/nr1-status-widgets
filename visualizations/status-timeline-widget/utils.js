export const assessValue = (value, thresholds) => {
  for (let z = 0; z < thresholds.length; z++) {
    const {
      valueAbove,
      valueBelow,
      valueEqual,
      bgColor,
      fontColor,
      name
    } = thresholds[z];

    const rulesToMeet = {};

    if (!isEmpty(valueAbove)) {
      rulesToMeet.valueAbove = value.value > valueAbove;
    }

    if (!isEmpty(valueBelow)) {
      rulesToMeet.valueBelow = value.value < valueBelow;
    }

    if (!isEmpty(valueEqual)) {
      rulesToMeet.valueEqual = value.value === valueEqual;
    }

    const failuresExist = Object.keys(rulesToMeet).find(
      key => !rulesToMeet[key]
    );

    if (!failuresExist) {
      value.bgColor = bgColor;
      value.fontColor = fontColor;
      value.name = name;

      // massage status levels and colors
      if (bgColor === 'healthy' || bgColor === 'green') {
        value.bgColor = '#3a845e';
        value.fontColor = 'white';
      }

      if (fontColor === 'healthy' || fontColor === 'green') {
        value.fontColor = '#3a845e';
      }

      if (bgColor === 'critical' || bgColor === 'red') {
        value.bgColor = '#a1251a';
        value.fontColor = 'white';
      }

      if (fontColor === 'critical' || fontColor === 'red') {
        value.fontColor = '#a1251a';
      }

      if (bgColor === 'warning' || bgColor === 'orange') {
        value.bgColor = '#f8d45c';
        value.fontColor = 'black';
      }

      if (fontColor === 'warning' || fontColor === 'orange') {
        value.fontColor = '#f8d45c';
      }

      if (bgColor === 'unknown' || bgColor === 'grey') {
        value.bgColor = '#9fa5a5';
      }

      if (fontColor === 'unknown' || fontColor === 'grey') {
        value.fontColor = '#9fa5a5';
      }

      break;
    }
  }

  return value;
};

export const generateErrorsAndConfig = (
  thresholds,
  accountId,
  query,
  onClickUrl,
  modalQueries,
  useTimeRange
) => {
  const errors = [];
  const sortedThresholds = thresholds.sort((a, b) => {
    const aNo = !isEmpty(a.priority) ? a.priority : 99999;
    const bNo = !isEmpty(b.priority) ? b.priority : 99999;

    return parseInt(aNo) - parseInt(bNo);
  });

  if ((useTimeRange && query.includes('since')) || query.includes('until')) {
    errors.push(
      'You have the time range enabled, remove the SINCE and UNTIL clauses from your query'
    );
  }

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

  if (query) {
    if (query.includes('hourOf(')) {
      xLabels.sort((a, b) => {
        const hourA = parseInt(a.split(':')[0], 10);
        const hourB = parseInt(b.split(':')[0], 10);
        return hourA - hourB;
      });
    } else if (query.includes('minuteOf(')) {
      xLabels.sort((a, b) => {
        const minA = parseInt(a);
        const minB = parseInt(b);
        return minA - minB;
      });
    } else if (query.includes('dateOf(')) {
      xLabels.sort((a, b) => new Date(a) - new Date(b));
    } else {
      xLabels = sortMixedArray(xLabels);
    }
  }

  const orderedHeatMapData = {};
  Object.keys(unorderedHeatMapData)
    .sort()
    .forEach(key => {
      const metricData = unorderedHeatMapData[key];
      orderedHeatMapData[key] = {};
      xLabels.forEach(label => {
        orderedHeatMapData[key][label] =
          label in metricData ? metricData[label] : 0;
      });
    });

  return { orderedData: orderedHeatMapData, xLabels };
};

/**
 * Returns true when the provided value is either null, undefined or an empty string
 *
 * @param {any} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return [null, undefined, ''].includes(value);
}

export const sortMixedArray = arr => {
  return arr.slice().sort((a, b) => {
    const isTimestamp = value => !isNaN(Date.parse(value));
    const isNumber = value => typeof value === 'number';
    const isString = value => typeof value === 'string';

    if (isTimestamp(a) && isTimestamp(b)) {
      return new Date(a) - new Date(b); // Sort timestamps
    } else if (isNumber(a) && isNumber(b)) {
      return a - b; // Sort numbers
    } else if (isString(a) && isString(b)) {
      return a.localeCompare(b); // Sort strings alphabetically
    } else {
      // Default case: separate different types
      if (isTimestamp(a)) return -1;
      if (isTimestamp(b)) return 1;
      if (isNumber(a)) return -1;
      if (isNumber(b)) return 1;
      return 0;
    }
  });
};
