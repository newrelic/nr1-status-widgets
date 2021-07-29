import React from 'react';
import { navigation, Spinner, Modal, HeadingText } from 'nr1';
import EntityTable from './entity-table';
import _ from 'lodash';

export default class Summarized extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hidden: true };
  }

  onClose = () => this.setState({ hidden: true });

  render() {
    const {
      width,
      height,
      summarizedHealthStatus,
      enableFlash,
      healthyLabel,
      warningLabel,
      criticalLabel,
      isFetching,
      entities,
      displayValue
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
      case 'NOT_CONFIGURED': {
        healthStatus = 'unknown';
        break;
      }
    }

    const displayMetric = false;

    let display = '';
    let displayValueFontSize = '30vh';
    switch (displayValue) {
      case 'noOfEntities': {
        display = entities.length;
        break;
      }
      case 'entitiesGroupedByAlert': {
        displayValueFontSize = '12vh';
        const alertGroupedEntities = _.groupBy(entities, e =>
          e.alertSeverity === 'NOT_ALERTING' ? 'HEALTHY' : e.alertSeverity
        );

        display = '';
        Object.keys(alertGroupedEntities).forEach((key, i) => {
          display += `${key}: ${alertGroupedEntities[key].length}${
            i === Object.keys(alertGroupedEntities).length - 1 ? '' : '\n'
          }`;
        });
        break;
      }
      case 'notHealthyEntities': {
        const notHealthyEntities = entities.filter(
          e => e.alertSeverity !== 'NOT_ALERTING'
        );
        display = notHealthyEntities.length;
        break;
      }
      case 'percentageOfHealthyEntities': {
        const healthyEntities = entities.filter(
          e => e.alertSeverity === 'NOT_ALERTING'
        );
        display = `${(healthyEntities.length / entities.length) * 100}%`;
        break;
      }
    }

    let onClick;
    if (entities.length === 1) {
      onClick = () => navigation.openStackedEntity(entities[0].guid);
    } else if (entities.length > 1) {
      onClick = () => this.setState({ hidden: false });
    }

    return (
      <div
        onClick={onClick}
        className={`${healthStatus}${
          enableFlash ? '' : '-solid'
        }-bg flex-container`}
        style={{
          width,
          height,
          cursor: onClick ? 'pointer' : 'text'
        }}
      >
        {entities.length > 1 && (
          <Modal hidden={this.state.hidden} onClose={this.onClose}>
            <HeadingText type={HeadingText.TYPE.HEADING_1}>
              Entities
            </HeadingText>
            <EntityTable
              isFetching={isFetching}
              height="100%"
              entities={entities}
            />
          </Modal>
        )}

        <div className="flex-col">
          {isFetching && <Spinner />}

          {display && (
            <div
              className="flex-item"
              style={{
                color: 'white',
                fontSize: displayValueFontSize,
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {display}
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
      </div>
    );
  }
}
