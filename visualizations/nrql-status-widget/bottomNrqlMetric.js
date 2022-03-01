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

  componentDidMount() {
    const { widgetKey, direction } = this.props;

    this.intervalId = setInterval(() => {
      const attributes = [`displayMetric_${widgetKey}_${direction}`];
      const overflowState = {};

      attributes.forEach(a => {
        overflowState[`${a}Overflow`] = this.isEllipsisActive(this[a]);
      });

      this.setState(overflowState);
    }, 1000);
  }

  componentDidUpdate() {
    const { width, widgetKey, direction } = this.props;
    this.trackWidth(width, widgetKey, direction);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  trackWidth = (width, widgetKey, direction) => {
    const stateWidth = this.state.width;
    if (width !== stateWidth) {
      this.setState({
        width,
        [`displayMetric_${widgetKey}_${direction}Adjust`]: 0
      });
    }
  };

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
      widgetKey,
      fontSizeMultiplier = { fontSizeMultiplier }
    } = this.props;
    let { metricLabel } = this.props;

    const { initialized } = this.state;

    const displayMetricAdjust =
      this.state[`displayMetric_${widgetKey}_${direction}Adjust`] || 0;
    let displayMetricFontSize = (9 + displayMetricAdjust) * fontSizeMultiplier;
    displayMetricFontSize =
      displayMetricFontSize <= 0 ? 1 : displayMetricFontSize;

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
            statusFont: 1,
            metricFont: 1,
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
              cfg.statusFont = 0.5;
              cfg.metricFont = 0.5;
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
                textOverflow: 'ellipsis',
                borderLeft: '1px solid white',
                borderRight: '1px solid white'
              }}
              className={`${status}${enableFlash ? '' : '-solid'}-bg`}
            >
              <tr
                className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                style={{ height: cfg.mainHeight }}
              >
                {displayMetric && (
                  <td
                    id={`displayMetric_${widgetKey}_${direction}`}
                    colSpan={cfg.colSpan}
                    title={metricValue}
                    className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                    style={{
                      color: 'white',
                      fontSize: `${displayMetricFontSize}vh`,
                      width,
                      maxWidth: width,
                      textAlign: 'center',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                      // cursor: chartOnClick ? 'pointer' : 'default'
                    }}
                    ref={ref =>
                      (this[`displayMetric_${widgetKey}_${direction}`] = ref)
                    }
                  >
                    <div style={{ maxHeight: cfg.mainHeight, maxWidth: width }}>
                      {metricValue}

                      {metricSuffix && (
                        <div
                          style={{
                            display: 'inline',
                            fontSize: `${displayMetricFontSize * 0.6}vh`,
                            verticalAlign: 'top',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          &nbsp;{metricSuffix}
                        </div>
                      )}
                    </div>
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
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      textAlign: 'center'
                    }}
                    className={`${status}${enableFlash ? '' : '-solid'}-bg`}
                  >
                    <div
                      style={{
                        maxHeight: cfg.metricLabelHeight,
                        height: cfg.metricLabelHeight,
                        width,
                        maxWidth: width,
                        display: 'table-cell',
                        verticalAlign: 'top',
                        textAlign: 'center',
                        overflow: 'hidden',
                        fontSize: `${displayMetricFontSize * cfg.metricFont}vh`
                      }}
                    >
                      {metricLabel}
                    </div>
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
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        maxHeight: cfg.statusLabelHeight,
                        height: cfg.statusLabelHeight,
                        width,
                        maxWidth: width,
                        display: 'table-cell',
                        verticalAlign: 'top',
                        textAlign: 'center',
                        overflow: 'hidden',
                        fontSize: `${displayMetricFontSize * cfg.statusFont}vh`
                      }}
                    >
                      {statusLabel}
                    </div>
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
