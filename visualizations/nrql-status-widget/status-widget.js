import React from 'react';
import { NrqlQuery, Spinner, navigation } from 'nr1';
import {
  deriveValues,
  generateErrorsAndConfig,
  generateSloErrors
} from './utils';
import EmptyState from '../shared/emptyState';
import ErrorState from '../shared/errorState';
import Timeline from './timeline';
import BottomMetrics from './bottomMetrics';
import ModalCharts from './modalCharts';

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
      timeRangeResult: null
    };
  }

  componentDidMount() {
    this.handleTime(this.props.timeRange);
  }

  componentDidUpdate() {
    this.handleTime(this.props.timeRange);
  }

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
    const { modalOpen, initialized, timeRange, timeRangeResult } = this.state;
    const {
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
      adjustBasicWidget,
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

    let fontSizeMultiplier = fontMultiplier || 1;
    let hideLabels = false;
    if (width <= reducedFeatureWidth) {
      hideLabels = true;
      displayTimeline = false;
      fontSizeMultiplier *= 1.4;
    }

    // unsupported tiling features
    if (isTile) {
      displayTimeline = false;
    }

    return (
      <>
        <ModalCharts
          open={modalOpen}
          close={this.modalClose}
          queries={validModalQueries}
          accountId={accountId}
        />
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

            let marginTop =
              queryRight || queryLeft ? `${-25 * fontSizeMultiplier}vh` : '0px';

            if (adjustBasicWidget) {
              marginTop = `${-25 * fontSizeMultiplier}vh`;
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
                  cfg.metricLabelHeight = tmpHeights * 1;
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
              const tmpHeights = height / 8;
              cfg.mainHeight = tmpHeights * 4;
              cfg.metricLabelHeight = tmpHeights * 1;
              cfg.statusLabelHeight = tmpHeights * 3;
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
                      colSpan={cfg.colSpan}
                      onClick={chartOnClick}
                      title={metricValue}
                      className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                      style={{
                        color: 'white',
                        fontSize: `${13 * fontSizeMultiplier}vh`,
                        width,
                        maxWidth: width,
                        textAlign: 'center',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop,
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                    >
                      {metricValue}
                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: `${6 * fontSizeMultiplier}vh`,
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
                  <tr
                    style={{
                      height: cfg.statusLabelHeight
                    }}
                    className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                  >
                    <td
                      colSpan={cfg.colSpan}
                      className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                      style={{
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
