import React from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import StatusTimelineWidget from './status-timeline-widget';

export default class StatusTimelineWidgetRoot extends React.Component {
  render() {
    return (
      <AutoSizer>
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {platformState => {
              return (
                <StatusTimelineWidget
                  timeRange={platformState.timeRange}
                  width={width}
                  height={height}
                  {...this.props}
                />
              );
            }}
          </PlatformStateContext.Consumer>
        )}
      </AutoSizer>
    );
  }
}
