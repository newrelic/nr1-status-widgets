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
      displayMetric,
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

    let fontSizeMultiplier = fontMultiplier || 0.75;
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

            let bottom = 0;

            if (rows === row) {
              bottom = 10;
            } else {
              bottom = rows * height - height * row + 140;
            }

            if (numberFormat) {
              metricValue = numeral(metricValue).format(numberFormat);
            }

            return (
              <div
                style={{
                  width,
                  height,
                  maxWidth: width,
                  maxHeight: height,
                  overflow: 'hidden'
                }}
                className={`${status}${
                  enableFlash ? '' : '-solid'
                }-bg flex-container`}
              >
                <div className="flex-col" style={{}}>
                  {displayMetric && (
                    <div
                      onClick={chartOnClick}
                      title={metricValue}
                      className="flex-item"
                      style={{
                        color: 'white',
                        fontSize: `${20 * fontSizeMultiplier}vh`,
                        width,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop,
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                    >
                      <div>{adjustBasicWidget ? <>&nbsp;</> : metricValue}</div>
                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: `${17 * fontSizeMultiplier}vh`,
                            verticalAlign: 'top',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          &nbsp;{metricSuffix}
                        </div>
                      )}
                      {metricLabel && (
                        <div
                          style={{
                            marginTop: '-5vh',
                            fontSize: `${9 * fontSizeMultiplier}vh`,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          {metricLabel}
                        </div>
                      )}
                    </div>
                  )}
                  {statusLabel && (
                    <div
                      className="flex-item"
                      style={{
                        color: 'white',
                        fontSize: displayMetric ? '13vh' : '20vh',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {statusLabel}
                    </div>
                  )}
                </div>

                {displayMetric && adjustBasicWidget && (
                  <div
                    className="flex-item"
                    style={{
                      position: 'absolute',
                      bottom: `${bottom}px`,
                      fontSize: `${20 * fontSizeMultiplier}vh`,
                      display: 'inline-flex',
                      paddingTop: '2vh',
                      // paddingBottom: displayTimeline ? '2vh' : '0px',
                      width,
                      // alignItems: 'center',
                      justifyContent: 'space-around'
                    }}
                  >
                    <div
                      onClick={chartOnClick}
                      title={metricValue}
                      className="flex-item"
                      style={{
                        color: 'white',
                        fontSize: `${20 * fontSizeMultiplier}vh`,
                        width,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop,
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                    >
                      <div>{metricValue}</div>
                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: `${17 * fontSizeMultiplier}vh`,
                            verticalAlign: 'top',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          &nbsp;{metricSuffix}
                        </div>
                      )}
                      {metricLabel && (
                        <div
                          style={{
                            marginTop: '-5vh',
                            fontSize: `${9 * fontSizeMultiplier}vh`,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          {metricLabel}
                        </div>
                      )}
                    </div>

                    {statusLabel && (
                      <div
                        className="flex-item"
                        style={{
                          color: 'white',
                          fontSize: displayMetric ? '13vh' : '20vh',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {statusLabel}
                      </div>
                    )}
                  </div>
                )}

                <BottomMetrics
                  hideLabels={hideLabels}
                  leftMetric={leftMetric}
                  rightMetric={rightMetric}
                  displayTimeline={displayTimeline}
                  width={width}
                  height={height + 4}
                  row={row}
                  rows={rows}
                  mainProps={this.props}
                  fontSizeMultiplier={fontSizeMultiplier}
                />

                {displayTimeline && (
                  <Timeline
                    displayMetric={displayMetric}
                    timeseries={timeseries}
                    width={width}
                    height={height + 4}
                    row={row}
                    rows={rows}
                  />
                )}
              </div>
            );
          }}
        </NrqlQuery>
      </>
    );
  }
}
