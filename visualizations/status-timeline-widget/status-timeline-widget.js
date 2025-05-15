import React from 'react';
import { NrqlQuery, Spinner } from 'nr1';
import { generateErrorsAndConfig, buildOrderedData } from './utils';
import EmptyState from '../shared/emptyState';
import ErrorState from '../shared/errorState';
import ModalCharts from './modalCharts';

// if the width is below this figure particular features will be disable
export const reducedFeatureWidth = 175;

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return 'SINCE 60 minutes ago';
  }

  if (timeRange.beginTime && timeRange.endTime) {
    return `SINCE ${timeRange.beginTime} UNTIL ${timeRange.endTime}`;
  } else if (timeRange.begin_time && timeRange.end_time) {
    return `SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`;
  } else if (timeRange.duration <= HOUR) {
    return `SINCE ${timeRange.duration / MINUTE} MINUTES AGO`;
  } else if (timeRange.duration <= DAY) {
    return `SINCE ${timeRange.duration / HOUR} HOURS AGO`;
  } else {
    return `SINCE ${timeRange.duration / DAY} DAYS AGO`;
  }
};

export default class StatusWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false,
      initialized: false
      // timeRange: undefined,
      // timeRangeResult: null
    };
  }

  // componentDidMount() {
  //   this.handleTime(this.props.timeRange);
  // }

  // componentDidUpdate() {
  //   this.handleTime(this.props.timeRange);
  // }

  // handleTime = async incomingTimeRange => {
  //   const currentTimeRange = this.state.timeRange;
  //   const currentTimeRangeStr = JSON.stringify(currentTimeRange);
  //   const incomingTimeRangeStr = JSON.stringify(incomingTimeRange);

  //   if (!incomingTimeRange && incomingTimeRangeStr !== currentTimeRangeStr) {
  //     this.setState({ timeRange: undefined, timeRangeResult: null });
  //   } else if (
  //     JSON.stringify(currentTimeRange) !== JSON.stringify(incomingTimeRange)
  //   ) {
  //     const stateUpdate = { timeRange: incomingTimeRange };
  //     const { query, accountId } = this.props;
  //     const nrqlResult = await NrqlQuery.query({
  //       query,
  //       accountId,
  //       timeRange: incomingTimeRange
  //     });
  //     stateUpdate.timeRangeResult = nrqlResult?.data?.[0]?.data?.[0]?.y || null;
  //     this.setState(stateUpdate);
  //   }
  // };

  modalClose = () => {
    this.setState({ modalOpen: false });
  };

  render() {
    const { modalOpen, initialized } = this.state;
    const {
      width,
      height,
      accountId,
      query,
      thresholds = [],
      onClickUrl,
      modalQueries,
      hideMetrics,
      decimalPlaces,
      hideKey,
      timeRange,
      useTimeRange,
      emptyHandling
    } = this.props;
    const validModalQueries = (modalQueries || []).filter(
      q => q.query && q.chartType && q.query.length > 5
    );

    const { errors, sortedThresholds } = generateErrorsAndConfig(
      thresholds,
      accountId,
      (query || '').toLowerCase(),
      onClickUrl,
      validModalQueries,
      useTimeRange
    );

    if (errors.length > 0) {
      return (
        <EmptyState
          errors={errors}
          reducedFeatureWidth={reducedFeatureWidth}
          isTimeline
        />
      );
    }

    // let finalQuery = `${query} ${timeseriesValue} `;
    let finalQuery = query;

    // // eslint-disable-next-line
    // console.log(`Query: ${finalQuery}`);

    if (useTimeRange) {
      finalQuery += ` ${timeRangeToNrql(timeRange)}`;
    } else if (
      !query.toLowerCase().includes('since') &&
      !query.toLowerCase().includes('until')
    ) {
      // switched off for testing
      // finalQuery += ` ${sinceClause} ${untilValue}`;
      finalQuery += ` SINCE 1 day ago`;
    }

    // let chartOnClick;

    // if (onClickUrl) {
    //   chartOnClick = () => window.open(onClickUrl, '_blank');
    // }

    // if (validModalQueries.length > 0) {
    //   const nerdlet = {
    //     id: 'custom-modal',
    //     urlState: {
    //       accountId: parseInt(accountId),
    //       queries: validModalQueries,
    //       timeRange,
    //       height,
    //       width
    //     }
    //   };

    //   chartOnClick = () => navigation.openStackedNerdlet(nerdlet);
    // }

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
          accountIds={[parseInt(accountId)]}
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

            const { orderedData, xLabels } = buildOrderedData(
              data,
              query,
              sortedThresholds,
              emptyHandling
            );

            return (
              <div
                style={{
                  width,
                  height,
                  maxWidth: width,
                  maxHeight: height
                }}
              >
                <table
                  style={{
                    width: '100%',
                    bottom: hideKey ? undefined : '30px'
                  }}
                >
                  {Object.keys(orderedData).map(key => {
                    const data = orderedData[key];
                    return (
                      <tr key={key}>
                        <td>{key === 'undefined' ? 'Other' : key}</td>
                        {Object.keys(data).map(key2 => {
                          let { bgColor, fontColor } = data[key2];
                          let value = data[key2].value;
                          if (
                            decimalPlaces !== null &&
                            decimalPlaces !== undefined
                          ) {
                            // this is intentional otherwise zeroes can populate rather then leaving it blank when no data exists for the given period
                            if (value !== undefined) {
                              value = (value || 0).toFixed(
                                parseInt(decimalPlaces)
                              );
                            }
                          }

                          if (
                            (value === undefined || value === null) &&
                            emptyHandling
                          ) {
                            value = emptyHandling.text;
                            bgColor = emptyHandling?.bgColor || bgColor;
                            fontColor = emptyHandling?.fontColor || fontColor;
                          }

                          return (
                            <td
                              key={key2}
                              style={{
                                backgroundColor: bgColor,
                                color: fontColor
                              }}
                            >
                              {!hideMetrics && value}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr>
                    <td
                      style={{
                        position: 'sticky',
                        bottom: hideKey ? '0px' : '30px'
                      }}
                    />
                    {xLabels.map(label => {
                      return (
                        <td
                          key={label}
                          style={{
                            position: 'sticky',
                            bottom: hideKey ? '0px' : '30px'
                          }}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                </table>

                {!hideKey && (
                  <div
                    style={{
                      position: 'sticky',
                      bottom: '0px',
                      textAlign: 'center',
                      padding: '10px',
                      backgroundColor: 'white'
                    }}
                  >
                    {thresholds.map(t => {
                      const value = {};
                      const { bgColor, fontColor } = t;

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

                      return (
                        <>
                          <div style={{ display: 'inline' }}>
                            <span style={{ color: value.bgColor }}>
                              &#9632;
                            </span>
                            &nbsp;
                            {t.name}
                          </div>
                          &nbsp;&nbsp;&nbsp;
                        </>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }}
        </NrqlQuery>
      </>
    );
  }
}
