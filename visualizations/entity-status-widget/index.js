import React from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import EntityStatusWidget from './entity-status-widget';

export default class EntityStatusWidgetRoot extends React.Component {
  render() {
    return (
      <AutoSizer>
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {platformState => {
              return (
                <EntityStatusWidget
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
