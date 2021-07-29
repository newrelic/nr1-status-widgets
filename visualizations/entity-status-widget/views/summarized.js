import React from 'react';
import { navigation, Spinner, Modal, HeadingText } from 'nr1';
import EntityTable from './entity-table';

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
      entities
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
