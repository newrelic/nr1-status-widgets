import React from 'react';
import { NrqlQuery, Spinner, navigation } from 'nr1';
import {
  deriveValues,
  generateErrorsAndConfig,
  generateSloErrors
} from './utils';
import EmptyState from './emptyState';
import ErrorState from './errorState';
import Timeline from './timeline';
import BottomMetrics from './bottomMetrics';
import ModalCharts from './modalCharts';

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
      timelineBucket,
      untilClause,
      displayTimeline,
      thresholdDirection,
      criticalThreshold,
      criticalLabel,
      warningThreshold,
      warningLabel,
      healthyLabel,
      displayMetric,
      metricLabel,
      metricSuffix,
      decimalPlaces,
      onClickUrl,
      queryLeft,
      thresholdDirectionLeft,
      criticalThresholdLeft,
      criticalLabelLeft,
      warningThresholdLeft,
      warningLabelLeft,
      healthyLabelLeft,
      queryRight,
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
      sloDaysToView
    } = this.props;
    const validModalQueries = modalQueries.filter(
      q => q.query && q.chartType && q.query.length > 5
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

    const sloErrors = generateSloErrors(sloConfig);

    if (errors.length > 0 || sloErrors.length > 0) {
      return <EmptyState errors={[...errors, ...sloErrors]} />;
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
                <ErrorState error={error.message || ''} query={finalQuery} />
              );
            }

            if (initialized === false) {
              this.setState({ initialized: true });
            }

            if (initialized === true && error) {
              setTimeout(() => {
                // eslint-disable-next-line
                console.log(`NRQL error for ${finalQuery} \nError: ${JSON.stringify(error)}\nReloading...`);
                window.location.reload();
              }, 5000);
            }

            const derivedValues = deriveValues(data, configuration);

            const {
              status,
              statusLabel,
              latestValue,
              timeseries
            } = derivedValues;

            let metricValue = latestValue;
            if (!isNaN(latestValue) && decimalPlaces !== undefined) {
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
                  maxHeight: height
                }}
                className={`${status}-bg flex-container`}
              >
                <div className="flex-col">
                  {displayMetric && (
                    <div
                      onClick={chartOnClick}
                      title={timeRangeResult || metricValue}
                      className="flex-item"
                      style={{
                        color: 'white',
                        fontSize: '17vh',
                        width,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        marginTop: queryRight || queryLeft ? '-19vh' : '0px',
                        cursor: chartOnClick ? 'pointer' : 'default'
                      }}
                    >
                      {timeRangeResult || metricValue}
                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: '14vh',
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
                            fontSize: '6vh',
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
                        fontSize: displayMetric ? '10vh' : '17vh',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {statusLabel}
                    </div>
                  )}
                </div>

                <BottomMetrics
                  leftMetric={leftMetric}
                  rightMetric={rightMetric}
                  displayTimeline={displayTimeline}
                  width={width}
                  height={height}
                  mainProps={this.props}
                />

                {displayTimeline && (
                  <Timeline
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
