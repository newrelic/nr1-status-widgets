import React from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
// import StatusWidget from './status-widget';
import Tiler from './tiler';

export default class NrqlStatusWidgetRoot extends React.Component {
  render() {
    return (
      <AutoSizer
        style={{
          overflowY: 'hidden'
        }}
      >
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {platformState => {
              return (
                <Tiler
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
