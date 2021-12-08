import React from 'react';
import { NrqlQuery, Spinner, navigation } from 'nr1';
import {
  deriveValues,
  generateErrorsAndConfig,
  generateSloErrors
} from './utils';
import EmptyState from '../shared/emptyState';
import ErrorState from '../shared/errorState';
// import Timeline from './timeline';
import BottomMetrics from './bottomMetrics';

const numeral = require('numeral');

// if the width is below this figure particular features will be disable
export const reducedFeatureWidth = 175;

export default class StatusWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false,
      initialized: false,
      timeRange: undefined,
      timeRangeResult: null,
      width: 0
    };
  }

  componentDidMount() {
    const { widgetKey } = this.props;
    this.handleTime(this.props.timeRange);

    this.intervalId = setInterval(() => {
      const attributes = [`displayMetric_${widgetKey}`];
      const overflowState = {};

      attributes.forEach(a => {
        overflowState[`${a}Overflow`] = this.isEllipsisActive(this[a]);
      });

      this.setState(overflowState);
    }, 1000);
  }

  componentDidUpdate() {
    this.handleTime(this.props.timeRange);
    this.trackWidth(this.props.width, this.props.widgetKey);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  isEllipsisActive = e => {
    if (e) {
      const active =
        e.offsetHeight < e.scrollHeight || e.offsetWidth < e.scrollWidth;

      if (active) {
        const metricName = `${e.id}Adjust`;
        const metricValue = this.state[metricName] || 0;
        const newValue = metricValue + (active ? -1 : 1);

        this.setState({ [metricName]: newValue }, () => {
          if (active) {
            setTimeout(() => {
              this.isEllipsisActive(e);
            }, 75);
          }
          return active;
        });
      }
    } else {
      return false;
    }
  };

  trackWidth = (width, widgetKey) => {
    const stateWidth = this.state.width;
    if (width !== stateWidth) {
      this.setState({ width, [`displayMetric_${widgetKey}Adjust`]: 0 });
    }
  };

  handleTime = async incomingTimeRange => {
    const currentTimeRange = this.state.timeRange;
    const currentTimeRangeStr = JSON.stringify(currentTimeRange);
    const incomingTimeRangeStr = JSON.stringify(incomingTimeRange);

    if (!incomingTimeRange && incomingTimeRangeStr !== currentTimeRangeStr) {
      this.setState({ timeRange: undefined, timeRangeResult: null });
    } else if (
      JSON.stringify(currentTimeRange) !== JSON.stringify(incomingTimeRange)
    ) {
      const stateUpdate = { timeRange: incomingTimeRange };
      const { query, accountId } = this.props;
      const nrqlResult = await NrqlQuery.query({
        query,
        accountId,
        timeRange: incomingTimeRange
      });
      stateUpdate.timeRangeResult = nrqlResult?.data?.[0]?.data?.[0]?.y || null;
      this.setState(stateUpdate);
    }
  };

  modalClose = () => {
    this.setState({ modalOpen: false });
  };

  render() {
    const { initialized, timeRange, timeRangeResult } = this.state;
    const {
      widgetKey,
      width,
      height,
      accountId,
      query,
      enableFlash,
      timelineBucket,
      untilClause,
      thresholdEmptyHandling,
      thresholdDirection,
      criticalThreshold,
      criticalLabel,
      warningThreshold,
      warningLabel,
      healthyLabel,
      // displayMetric,
      metricSuffix,
      decimalPlaces,
      onClickUrl,
      thresholdDirectionLeft,
      criticalThresholdLeft,
      criticalLabelLeft,
      warningThresholdLeft,
      warningLabelLeft,
      healthyLabelLeft,
      thresholdDirectionRight,
      criticalThresholdRight,
      criticalLabelRight,
      warningThresholdRight,
      warningLabelRight,
      healthyLabelRight,
      modalQueries,
      sloId,
      sloDays,
      sloTarget,
      sloBudget,
      sloBar,
      sloDaysToView,
      fontMultiplier,
      isTile,
      row,
      rows,
      numberFormat,
      numberFormatLeft,
      numberFormatRight
    } = this.props;
    let { displayTimeline, metricLabel, queryLeft, queryRight } = this.props;

    if ((queryRight || '').length <= 5) queryRight = '';
    if ((queryLeft || '').length <= 5) queryLeft = '';

    const validModalQueries = (modalQueries || []).filter(
      q => q.query && q.chartType && (q.query || '').length > 5
    );

    const sloConfig = {
      sloId,
      sloDays,
      sloTarget,
      sloBar,
      sloBudget,
      sloDaysToView
    };

    let leftMetric = null;
    let rightMetric = null;

    if (queryLeft) {
      leftMetric = generateErrorsAndConfig(
        criticalLabelLeft,
        warningLabelLeft,
        healthyLabelLeft,
        warningThresholdLeft,
        criticalThresholdLeft,
        thresholdDirectionLeft,
        accountId,
        queryLeft
      );
      if (leftMetric.configuration) {
        leftMetric.configuration.thresholdEmptyHandling = thresholdEmptyHandling;
      }
      leftMetric.numberFormat = numberFormatLeft;
    }

    if (queryRight) {
      rightMetric = generateErrorsAndConfig(
        criticalLabelRight,
        warningLabelRight,
        healthyLabelRight,
        warningThresholdRight,
        criticalThresholdRight,
        thresholdDirectionRight,
        accountId,
        queryRight
      );
      if (rightMetric.configuration) {
        rightMetric.configuration.thresholdEmptyHandling = thresholdEmptyHandling;
      }
      rightMetric.numberFormat = numberFormatRight;
    }

    const { errors, configuration } = generateErrorsAndConfig(
      criticalLabel,
      warningLabel,
      healthyLabel,
      warningThreshold,
      criticalThreshold,
      thresholdDirection,
      accountId,
      query,
      onClickUrl,
      validModalQueries
    );
    configuration.thresholdEmptyHandling = thresholdEmptyHandling;

    const sloErrors = generateSloErrors(sloConfig);

    if (errors.length > 0 || sloErrors.length > 0) {
      return (
        <EmptyState
          errors={[...errors, ...sloErrors]}
          reducedFeatureWidth={reducedFeatureWidth}
        />
      );
    }

    const bucketValue =
      !isNaN(timelineBucket) && timelineBucket > 0 ? timelineBucket : 1;
    const timeseriesValue = `TIMESERIES ${bucketValue} minute`;
    const untilValue = untilClause || '';
    const sinceClause = `SINCE ${bucketValue * 24} minutes ago`;

    let finalQuery = `${query} ${timeseriesValue} `;

    // // eslint-disable-next-line
    // console.log(`Query: ${finalQuery}`);

    if (
      !query.toLowerCase().includes('since') &&
      !query.toLowerCase().includes('until')
    ) {
      finalQuery += ` ${sinceClause} ${untilValue}`;
    }

    let chartOnClick;

    if (onClickUrl) {
      chartOnClick = () => window.open(onClickUrl, '_blank');
    }

    if (validModalQueries.length > 0) {
      const nerdlet = {
        id: 'custom-modal',
        urlState: {
          accountId: parseInt(accountId),
          queries: validModalQueries,
          timeRange,
          height,
          width
        }
      };

      chartOnClick = () => navigation.openStackedNerdlet(nerdlet);
    }

    const fontSizeMultiplier = fontMultiplier || 1;
    let hideLabels = false;
    if (width <= reducedFeatureWidth) {
      hideLabels = true;
      displayTimeline = false;
      // fontSizeMultiplier *= 1.4;
    }

    // unsupported tiling features
    if (isTile) {
      displayTimeline = false;
    }

    const displayMetricAdjust =
      this.state[`displayMetric_${widgetKey}Adjust`] || 0;
    let displayMetricFontSize = (17 + displayMetricAdjust) * fontSizeMultiplier;
    displayMetricFontSize =
      displayMetricFontSize <= 0 ? 1 : displayMetricFontSize;

    return (
      <>
        <NrqlQuery
          query={finalQuery}
          accountId={parseInt(accountId)}
          pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
        >
          {({ data, loading, error }) => {
            if (loading) {
              return <Spinner />;
            }

            if (error && initialized === false) {
              return (
                <ErrorState
                  error={error.message || ''}
                  query={finalQuery}
                  reducedFeatureWidth={reducedFeatureWidth}
                />
              );
            }

            if (initialized === false) {
              this.setState({ initialized: true });
            }

            if (initialized === true && error) {
              setTimeout(() => {
                // eslint-disable-next-line
                console.log(
                  `NRQL error for ${finalQuery} \nError: ${JSON.stringify(
                    error
                  )}\nReloading...`
                );
                window.location.reload();
              }, 5000);
            }

            const derivedValues = deriveValues(
              data,
              configuration,
              timeRangeResult
            );

            const { status, latestValue, timeseries } = derivedValues;
            const statusLabel = hideLabels ? '' : derivedValues.statusLabel;

            let metricValue = latestValue;
            if (
              !isNaN(latestValue) &&
              decimalPlaces !== undefined &&
              decimalPlaces !== null
            ) {
              metricValue = latestValue.toFixed(decimalPlaces);
            }

            if (metricValue === undefined || metricValue === null) {
              // eslint-disable-next-line
              console.log(
                `${finalQuery} : returning null\nvalue: ${latestValue}\ndata: ${data}\nError: ${JSON.stringify(
                  error
                )}`
              );
              metricValue = 'null';
            }

            if (numberFormat) {
              metricValue = numeral(metricValue).format(numberFormat);
            }

            const displayMetric = true;

            const cfg = {
              mainHeight: height,
              secondaryHeight: '',
              statusLabelHeight: '',
              metricLabelHeight: '',
              colSpan: 1
            };

            if (queryLeft || queryRight) {
              if (!statusLabel) {
                if (metricLabel) {
                  const tmpHeights = height / 8;
                  cfg.mainHeight = tmpHeights * 4;
                  cfg.metricLabelHeight = tmpHeights;
                  cfg.secondaryHeight = tmpHeights * 3;
                } else {
                  const tmpHeights = height / 3;
                  cfg.mainHeight = tmpHeights * 2;
                  cfg.secondaryHeight = tmpHeights;
                }
              } else if (statusLabel) {
                if (metricLabel) {
                  const tmpHeights = height / 16;
                  cfg.mainHeight = tmpHeights * 8;
                  cfg.metricLabelHeight = tmpHeights * 2;
                  cfg.statusLabelHeight = tmpHeights * 2;
                  cfg.secondaryHeight = tmpHeights * 4;
                } else {
                  const tmpHeights = height / 8;

                  cfg.mainHeight = tmpHeights * 4;
                  cfg.statusLabelHeight = tmpHeights * 2;
                  cfg.secondaryHeight = tmpHeights * 2;
                }
              }
            } else if (!queryLeft && !queryRight && statusLabel) {
              if (metricLabel) {
                const tmpHeights = height / 8;
                cfg.mainHeight = tmpHeights * 4;
                cfg.metricLabelHeight = tmpHeights * 2;
                cfg.statusLabelHeight = tmpHeights * 2;
              }
            } else if (
              !queryLeft &&
              !queryRight &&
              !statusLabel &&
              metricLabel
            ) {
              const tmpHeights = height / 4;
              cfg.mainHeight = tmpHeights * 3;
              cfg.metricLabelHeight = tmpHeights;
            } else {
              const tmpHeights = height / 3;
              cfg.mainHeight = tmpHeights * 2;
              cfg.statusLabelHeight = tmpHeights;
            }

            if (queryRight && queryLeft) {
              cfg.colSpan = 2;
            }

            return (
              <table
                style={{
                  width,
                  height,
                  maxWidth: width,
                  maxHeight: height,
                  textOverflow: 'ellipsis'
                }}
                className={`${status}${enableFlash ? '' : '-solid'}-bg`}
              >
                <tr
                  className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                  style={{ height: cfg.mainHeight }}
                >
                  {displayMetric && (
                    <td
                      id={`displayMetric_${widgetKey}`}
                      colSpan={cfg.colSpan}
                      onClick={chartOnClick}
                      title={metricValue}
                      className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                      style={{
                        color: 'white',
                        fontSize: `${displayMetricFontSize}vh`,
                        width,
                        maxWidth: width,
                        textAlign: 'center',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                      ref={ref => (this[`displayMetric_${widgetKey}`] = ref)}
                    >
                      {metricValue}

                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: `${displayMetricFontSize * 0.7}vh`,
                            verticalAlign: 'top',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          &nbsp;{metricSuffix}
                        </div>
                      )}
                    </td>
                  )}
                </tr>

                {metricLabel && (
                  <tr
                    style={{
                      height: cfg.metricLabelHeight
                    }}
                    className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                  >
                    <td
                      colSpan={cfg.colSpan}
                      style={{
                        verticalAlign: 'top',
                        color: 'white',
                        fontSize: `${4 * fontSizeMultiplier}vh`,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        textAlign: 'center'
                      }}
                      className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                    >
                      {metricLabel}
                    </td>
                  </tr>
                )}

                {statusLabel && (
                  <tr className={`${status}${enableFlash ? '' : '-solid'}-bg`}>
                    <td
                      colSpan={cfg.colSpan}
                      className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                      style={{
                        maxHeight: cfg.statusLabelHeight,
                        height: cfg.statusLabelHeight,
                        verticalAlign: 'top',
                        color: 'white',
                        textAlign: 'center',
                        fontSize: `${6 * fontSizeMultiplier}vh`,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {statusLabel}
                    </td>
                  </tr>
                )}

                <BottomMetrics
                  colSpan={cfg.colSpan}
                  hideLabels={hideLabels}
                  leftMetric={leftMetric}
                  rightMetric={rightMetric}
                  displayTimeline={displayTimeline}
                  width={width}
                  height={cfg.secondaryHeight}
                  row={row}
                  rows={rows}
                  mainProps={this.props}
                  fontSizeMultiplier={fontSizeMultiplier}
                />
                {/* 
                {displayTimeline && (
                  <Timeline
                    displayMetric={displayMetric}
                    timeseries={timeseries}
                    width={width}
                    height={height + 4}
                    row={row}
                    rows={rows}
                  />
                )} */}
              </table>
            );
          }}
        </NrqlQuery>
      </>
    );
  }
}
