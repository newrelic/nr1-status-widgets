import React from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import StatusWidget from './status-widget';
import EditMode from './edit';
import Tiler from './tiler';

export default class NrqlStatusWidgetRoot extends React.Component {
  render() {
    return (
      <AutoSizer>
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {platformState => {
              if (!this.props.disableEdit) {
                return (
                  <EditMode
                    timeRange={platformState.timeRange}
                    width={width}
                    height={height}
                    {...this.props}
                  />
                );
              }

              return (
                <Tiler
                  timeRange={platformState.timeRange}
                  width={width}
                  height={height}
                  {...this.props}
                />
              );

              // return (
              //   <StatusWidget
              // timeRange={platformState.timeRange}
              // width={width}
              // height={height}
              // {...this.props}
              //   />
              // );
            }}
          </PlatformStateContext.Consumer>
        )}
      </AutoSizer>
    );
  }
}
