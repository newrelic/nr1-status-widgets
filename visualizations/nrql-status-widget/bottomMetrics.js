import React from 'react';
import NrqlMetric from './bottomNrqlMetric';

export default class BottomMetrics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rightStatus: null,
      leftStatus: null
    };
  }

  updateState = state => this.setState(state);

  render() {
    const {
      leftMetric,
      rightMetric,
      width,
      mainProps,
      displayTimeline
    } = this.props;

    const {
      accountId,
      metricSuffixLeft,
      decimalPlacesLeft,
      metricSuffixRight,
      decimalPlacesRight
    } = mainProps;

    let {
      queryRight,
      queryLeft,
      metricLabelRight,
      metricLabelLeft
    } = mainProps;

    // force null since custom viz props don't clear properly and leave a FROM clause
    if ((queryRight || '').length <= 4) queryRight = null;
    if ((queryLeft || '').length <= 4) queryLeft = null;

    if (queryRight === null && queryLeft === null) {
      return '';
    }

    const fullWidth = !(queryRight && queryLeft);

    // blank gap appears if label is used on one and not the other
    if (metricLabelRight && !metricLabelLeft) metricLabelLeft = '';
    if (metricLabelLeft && !metricLabelRight) metricLabelRight = '';

    return (
      <div
        className="flex-item"
        style={{
          position: 'absolute',
          bottom: displayTimeline ? '6.75vh' : '0px',
          fontSize: '10vh',
          display: 'inline-flex',
          paddingTop: '2vh',
          paddingBottom: displayTimeline ? '2vh' : '0px',
          width,
          // alignItems: 'center',
          justifyContent: 'space-around'
        }}
      >
        {queryLeft && (
          <NrqlMetric
            direction="left"
            fullWidth={fullWidth}
            width={width}
            query={queryLeft}
            accountId={accountId}
            configuration={leftMetric.configuration}
            altConfiguration={rightMetric?.configuration || {}}
            decimalPlaces={decimalPlacesLeft}
            metricSuffix={metricSuffixLeft}
            metricLabel={metricLabelLeft}
            updateState={this.updateState}
            rightStatus={this.state.rightStatus}
            leftStatus={this.state.leftStatus}
            metricLabelRight={metricLabelRight}
          />
        )}
        {queryRight && (
          <NrqlMetric
            direction="right"
            fullWidth={fullWidth}
            width={width}
            query={queryRight}
            accountId={accountId}
            configuration={rightMetric.configuration}
            altConfiguration={leftMetric?.configuration || {}}
            decimalPlaces={decimalPlacesRight}
            metricSuffix={metricSuffixRight}
            metricLabel={metricLabelRight}
            updateState={this.updateState}
            rightStatus={this.state.rightStatus}
            leftStatus={this.state.leftStatus}
            metricLabelLeft={metricLabelLeft}
          />
        )}
      </div>
    );
  }
}
