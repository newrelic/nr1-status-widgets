import React, { useContext } from 'react';
import { PlatformStateContext, AutoSizer } from 'nr1';
import StatusTableWidget from './status-table-widget';

function StatusTableWidgetRoot(props) {
  const platformContext = useContext(PlatformStateContext);

  return (
    <div style={{ height: '100%' }}>
      <AutoSizer>
        {({ width, height }) => (
          <StatusTableWidget
            platformContext={platformContext}
            width={width}
            height={height}
            {...props}
          />
        )}
      </AutoSizer>
    </div>
  );
}

export default StatusTableWidgetRoot;
