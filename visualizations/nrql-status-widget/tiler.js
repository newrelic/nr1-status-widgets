import React from 'react';
import StatusWidget from './status-widget';
import groupBy from 'lodash.groupby';

const withIndex = fn => {
  let index = 0;
  return thing => fn(thing, index++);
};

export default class Tiler extends React.Component {
  render() {
    const { timeRange, width, height, widgets } = this.props;
    // const realWidgets = this.props.widgets; // revert
    const columns = parseFloat(this.props?.columns || 1);

    // const widgets = [];
    // for (let z = 0; z < 12; z++) {
    //   widgets.push(realWidgets[0]);
    // }

    if (widgets.length === 0) {
      return 'No widgets defined...';
    }

    const rowGroupedWidgets = groupBy(
      widgets,
      withIndex((w, i) => {
        const row = Math.ceil((i + 1) / columns);
        return row;
      })
    );

    const padding = 1;
    const rows = Math.ceil(widgets.length / columns);
    const widgetHeight = height / rows - padding * 2 * rows;
    const widgetWidth = width / columns - padding * 2 * columns;

    return (
      <table style={{ tableLayout: 'fixed' }}>
        {Object.keys(rowGroupedWidgets).map(rowNo => {
          const rowData = rowGroupedWidgets[rowNo];
          return (
            <tr key={rowNo}>
              {rowData.map((widget, widgetIndex) => {
                return (
                  <td
                    key={widgetIndex}
                    style={{
                      padding: `${padding}px`,
                      maxWidth: widgetWidth,
                      maxHeight: widgetHeight
                    }}
                  >
                    {widget.dummy ? (
                      <div>&nbsp;</div>
                    ) : (
                      <StatusWidget
                        widgetKey={widgetIndex}
                        isTile
                        // adjustBasicWidget={adjustBasicWidget}
                        timeRange={timeRange}
                        width={widgetWidth}
                        height={widgetHeight}
                        {...widget}
                        columns={columns.length}
                        row={rowNo}
                        rows={rows}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </table>
    );
  }
}
