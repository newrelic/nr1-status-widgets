import React from 'react';
import { Spinner } from 'nr1';

export default class Summarized extends React.Component {
  render() {
    const {
      width,
      height,
      summarizedHealthStatus,
      enableFlash,
      healthyLabel,
      warningLabel,
      criticalLabel,
      isFetching
    } = this.props;

    let healthStatus = '';
    let statusLabel = '';

    switch (summarizedHealthStatus) {
      case 'NOT_ALERTING': {
        healthStatus = 'healthy';
        statusLabel = healthyLabel;
        break;
      }
      case 'CRITICAL': {
        healthStatus = 'critical';
        statusLabel = criticalLabel;
        break;
      }
      case 'WARNING': {
        healthStatus = 'warning';
        statusLabel = warningLabel;
        break;
      }
      case 'UNCONFIGURED': {
        healthStatus = 'unknown';
        break;
      }
    }

    const displayMetric = false;

    return (
      <div
        className={`${healthStatus}${
          enableFlash ? '' : '-solid'
        }-bg flex-container`}
        style={{
          width,
          height
        }}
      >
        <div className="flex-col">
          {isFetching && <Spinner />}

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
      </div>
    );
  }
}
