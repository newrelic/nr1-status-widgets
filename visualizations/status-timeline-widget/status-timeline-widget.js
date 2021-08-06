import React from 'react';
import { NrqlQuery, Spinner, navigation } from 'nr1';
import { generateErrorsAndConfig, buildOrderedData } from './utils';
import EmptyState from '../shared/emptyState';
import ErrorState from '../shared/errorState';
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
      thresholds,
      onClickUrl,
      modalQueries,
      displayMetrics
    } = this.props;
    const validModalQueries = modalQueries.filter(
      q => q.query && q.chartType && q.query.length > 5
    );

    const { errors, sortedThresholds } = generateErrorsAndConfig(
      thresholds,
      accountId,
      query,
      onClickUrl,
      validModalQueries
    );

    if (errors.length > 0) {
      return (
        <EmptyState errors={errors} reducedFeatureWidth={reducedFeatureWidth} />
      );
    }

    // let finalQuery = `${query} ${timeseriesValue} `;
    let finalQuery = query;

    // // eslint-disable-next-line
    // console.log(`Query: ${finalQuery}`);

    if (
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
              sortedThresholds
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
                <table style={{ width: '100%' }}>
                  {Object.keys(orderedData).map(key => {
                    const data = orderedData[key];
                    return (
                      <tr key={key}>
                        <td>{key === 'undefined' ? 'Other' : key}</td>
                        {Object.keys(data).map(key2 => {
                          const { value, bgColor, fontColor } = data[key2];
                          // console.log(data[key2]);
                          return (
                            <td
                              key={key2}
                              style={{
                                backgroundColor: bgColor,
                                color: fontColor
                              }}
                            >
                              {displayMetrics && value}
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
                        bottom: '0px'
                      }}
                    />
                    {xLabels.map(label => {
                      return (
                        <td
                          key={label}
                          style={{
                            position: 'sticky',
                            bottom: '0px'
                          }}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                </table>
              </div>
            );
          }}
        </NrqlQuery>
      </>
    );
  }
}
