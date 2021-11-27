import React from 'react';
import { NrqlQuery, Spinner } from 'nr1';
import ErrorState from '../shared/errorState';
import { deriveValues } from './utils';

const numeral = require('numeral');

export default class NrqlMetric extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false
    };
  }

  render() {
    const {
      height,
      direction,
      rightStatus,
      leftStatus,
      fullWidth,
      width,
      query,
      enableFlash,
      accountId,
      configuration,
      decimalPlaces,
      metricSuffix,
      updateState,
      metricLabelLeft,
      metricLabelRight,
      hideLabels,
      numberFormat,
      fontSizeMultiplier = { fontSizeMultiplier }
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
              console.log(
                `NRQL error for ${query} \nError: ${JSON.stringify(
                  error
                )}\nReloading...`
              );
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

          if (numberFormat) {
            metricValue = numeral(metricValue).format(numberFormat);
          }
          const cfg = {
            mainHeight: height,
            statusLabelHeight: '',
            metricLabelHeight: '',
            colSpan: 1
          };

          if (!statusLabel) {
            if (metricLabel) {
              const tmpHeights = height / 8;
              cfg.mainHeight = tmpHeights * 4;
              cfg.metricLabelHeight = tmpHeights * 4;
            } else {
              const tmpHeights = height / 3;
              cfg.mainHeight = tmpHeights * 3;
            }
          } else if (statusLabel) {
            if (metricLabel) {
              const tmpHeights = height / 16;
              cfg.mainHeight = tmpHeights * 8;
              cfg.metricLabelHeight = tmpHeights * 2;
              cfg.statusLabelHeight = tmpHeights * 2;
            } else {
              const tmpHeights = height / 8;
              cfg.mainHeight = tmpHeights * 4;
              cfg.statusLabelHeight = tmpHeights * 2;
            }
          }

          const displayMetric = true;

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
                    title={metricValue}
                    className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                    style={{
                      height: cfg.mainHeight,
                      color: 'white',
                      fontSize: `${6 * fontSizeMultiplier}vh`,
                      width,
                      maxWidth: width,
                      textAlign: 'center',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {metricValue}
                    {metricSuffix && (
                      <div
                        style={{
                          display: 'inline',
                          fontSize: `${3 * fontSizeMultiplier}vh`,
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
                      height: cfg.metricLabelHeight,
                      verticalAlign: 'top',
                      color: 'white',
                      fontSize: `${2 * fontSizeMultiplier}vh`,
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
                      height: cfg.statusLabelHeight,
                      verticalAlign: 'top',
                      color: 'white',
                      textAlign: 'center',
                      fontSize: `${4 * fontSizeMultiplier}vh`,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    {statusLabel}
                  </td>
                </tr>
              )}
            </table>
          );
        }}
      </NrqlQuery>
    );
  }
}
