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

    if (valueAbove !== null && valueAbove !== '') {
      rulesToMeet.valueAbove = value.value > valueAbove;
    }

    if (valueBelow !== null && valueBelow !== '') {
      rulesToMeet.valueBelow = value.value < valueBelow;
    }

    if (valueEqual !== null && valueEqual !== '') {
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
        value.bgColor = '#01b076';
        value.fontColor = 'white';
      }

      if (fontColor === 'healthy' || fontColor === 'green') {
        value.fontColor = '#01b076';
      }

      if (bgColor === 'critical' || bgColor === 'red') {
        value.bgColor = '#f5554b';
        value.fontColor = 'white';
      }

      if (fontColor === 'critical' || fontColor === 'red') {
        value.fontColor = '#f5554b';
      }

      if (bgColor === 'warning' || bgColor === 'orange') {
        value.bgColor = '#f0b400';
        value.fontColor = 'white';
      }

      if (fontColor === 'warning' || fontColor === 'orange') {
        value.fontColor = '#f0b400';
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
  modalQueries
) => {
  const errors = [];
  const sortedThresholds = thresholds.sort((a, b) => {
    const aNo = a.priority !== '' && a.priority !== null ? a.priority : 99999;
    const bNo = b.priority !== '' && b.priority !== null ? b.priority : 99999;

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
        (t.valueAbove === null || t.valueAbove === '') &&
        (t.valueBelow === null || t.valueBelow === '') &&
        (t.valueEqual === null || t.valueEqual === '')
      ) {
        errors.push(
          `Threshold ${i + 1} - at least one value parameter should be define`
        );
      }

      if (t.priority !== null && t.priority !== '' && isNaN(t.priority)) {
        errors.push(`Threshold ${i + 1} - priority: must be a number`);
      }

      if (t.valueAbove !== null && t.valueAbove !== '' && isNaN(t.valueAbove)) {
        errors.push(`Threshold ${i + 1} - above: must be a number`);
      }
      if (t.valueBelow !== null && t.valueBelow !== '' && isNaN(t.valueBelow)) {
        errors.push(`Threshold ${i + 1} - below: must be a number`);
      }
      if (t.valueEqual !== null && t.valueEqual !== '' && isNaN(t.valueEqual)) {
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
