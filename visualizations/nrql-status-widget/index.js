import React from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import StatusWidget from './status-widget';

export default class StatusWidgetRoot extends React.Component {
  render() {
    return (
      <AutoSizer>
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {platformState => {
              return (
                <StatusWidget
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
