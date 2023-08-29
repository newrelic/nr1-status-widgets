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
        accountIds: [accountId],
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
      modalGuid,
      modalChartColumns,
      modalQueries,
      sloId,
      sloDays,
      sloTarget,
      sloBudget,
      sloBar,
      sloDaysToView,
      fontMultiplier,
      pollInterval
    } = this.props;
    let { displayTimeline, metricLabel, queryLeft, queryRight } = this.props;

    if ((queryRight || '').length <= 5) queryRight = '';
    if ((queryLeft || '').length <= 5) queryLeft = '';

    const validModalQueries = modalQueries.filter(
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
          modalChartColumns,
          timeRange,
          height,
          width
        }
      };

      chartOnClick = () => navigation.openStackedNerdlet(nerdlet);
    }

    if (modalGuid) {
      chartOnClick = () => navigation.openStackedEntity(modalGuid);
    }

    let fontSizeMultiplier = fontMultiplier || 1;
    let hideLabels = false;
    if (width <= reducedFeatureWidth) {
      hideLabels = true;
      displayTimeline = false;
      fontSizeMultiplier *= 1.4;
    }

    const selectedAccountId = parseInt(accountId);
    const selectedPollInterval = pollInterval
      ? parseInt(pollInterval)
      : NrqlQuery.AUTO_POLL_INTERVAL;

    return (
      <>
        <ModalCharts
          open={modalOpen}
          close={this.modalClose}
          queries={validModalQueries}
          accountId={accountId}
        />
        <NrqlQuery
          query={query}
          accountIds={[selectedAccountId]}
          pollInterval={selectedPollInterval}
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

            return (
              <div
                style={{
                  width,
                  height,
                  maxWidth: width,
                  maxHeight: height,
                  overflow: 'hidden'
                }}
                // eslint-disable-next-line
                className={`${status}${enableFlash ? '' : '-solid'
                  }-bg flex-container`} // eslint-disable-line
              >
                <div className="flex-col">
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
                        marginTop:
                          queryRight || queryLeft
                            ? `${-25 * fontSizeMultiplier}vh`
                            : '0px',
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                    >
                      {metricValue}
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

                <BottomMetrics
                  hideLabels={hideLabels}
                  leftMetric={leftMetric}
                  rightMetric={rightMetric}
                  displayTimeline={displayTimeline}
                  width={width}
                  height={height}
                  mainProps={this.props}
                  fontSizeMultiplier={fontSizeMultiplier}
                  pollInterval={pollInterval}
                />

                {displayTimeline && (
                  <Timeline
                    finalQuery={finalQuery}
                    reducedFeatureWidth={reducedFeatureWidth}
                    timeRangeResult={timeRangeResult}
                    configuration={configuration}
                    selectedAccountId={selectedAccountId}
                    selectedPollInterval={selectedPollInterval}
                    displayMetric={displayMetric}
                    timeseries={timeseries}
                    width={width}
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
