import React from 'react';
import { NrqlQuery, Spinner } from 'nr1';
import ErrorState from './errorState';
import { deriveValues } from './utils';

export default class NrqlMetric extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false
    };
  }

  render() {
    const {
      direction,
      rightStatus,
      leftStatus,
      fullWidth,
      width,
      query,
      accountId,
      configuration,
      decimalPlaces,
      metricSuffix,
      updateState,
      metricLabelLeft,
      metricLabelRight
    } = this.props;
    let { metricLabel } = this.props;

    const { initialized } = this.state;

    return (
      <NrqlQuery
        query={query}
        accountId={parseInt(accountId)}
        pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
      >
        {({ data, loading, error }) => {
          if (loading) {
            return <Spinner />;
          }

          if (error && initialized === false) {
            return <ErrorState error={error.message || ''} query={query} />;
          }

          if (initialized === false) {
            this.setState({ initialized: true });
          }

          if (initialized === true && error) {
            setTimeout(() => {
              // eslint-disable-next-line
              console.log(`NRQL error for ${query} \nError: ${JSON.stringify(error)}\nReloading...`);
              window.location.reload();
            }, 5000);
          }

          const derivedValues = deriveValues(data, configuration);

          const { status, latestValue } = derivedValues;
          let statusLabel = derivedValues.statusLabel;

          if (direction === 'right' && rightStatus !== statusLabel) {
            updateState({ rightStatus: statusLabel });
          } else if (direction === 'left' && leftStatus !== statusLabel) {
            updateState({ leftStatus: statusLabel });
          }

          if (direction === 'left' && rightStatus) {
            statusLabel = leftStatus || '';
          } else if (direction === 'right' && leftStatus) {
            statusLabel = rightStatus || '';
          }

          if (!statusLabel && direction === 'left' && !rightStatus) {
            statusLabel = null;
          } else if (!statusLabel && direction === 'right' && !leftStatus) {
            statusLabel = null;
          }

          let metricValue = latestValue;
          if (!isNaN(latestValue) && decimalPlaces !== undefined) {
            metricValue = latestValue.toFixed(decimalPlaces);
          }

          if (metricValue === undefined || metricValue === null) {
            // eslint-disable-next-line
            console.log(
              `${query} : returning null\nvalue: ${latestValue}\ndata: ${data}\nError: ${JSON.stringify(
                error
              )}`
            );
            metricValue = 'null';
          }

          if (metricLabel === undefined || metricLabel === '') {
            metricLabel = null;
          }

          if (direction === 'right' && metricLabelLeft) {
            metricLabel = metricLabel || '';
          } else if (direction === 'left' && metricLabelRight) {
            metricLabel = metricLabel || '';
          }

          const availWidth = fullWidth ? width : width / 2;

          return (
            <div
              style={{ width: availWidth }}
              className={`${status}-bg flex-container`}
            >
              <div className="flex-col">
                <div
                  title={metricValue}
                  className="flex-item"
                  style={{
                    color: 'white',
                    fontSize: '11vh',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    width: availWidth
                  }}
                >
                  {metricValue}
                  {metricSuffix && (
                    <div
                      style={{
                        display: 'inline',
                        fontSize: '6vh',
                        verticalAlign: 'middle',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      &nbsp;{metricSuffix}
                    </div>
                  )}
                  {metricLabel !== null && metricLabel !== undefined && (
                    <div
                      style={{
                        marginTop: '-4vh',
                        fontSize: '6vh',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}
                    >
                      {metricLabel || <span>&nbsp;</span>}
                    </div>
                  )}
                </div>
                {statusLabel !== null && statusLabel !== undefined && (
                  <div
                    className="flex-item"
                    style={{
                      marginTop: '-3.5vh',
                      marginBottom: '1.3vh',
                      color: 'white',
                      fontSize: '9vh',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      width: availWidth
                    }}
                  >
                    {statusLabel || <span>&nbsp;</span>}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </NrqlQuery>
    );
  }
}
