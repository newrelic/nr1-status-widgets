import React from 'react';
import StatusWidget from './status-widget';
import { AccountStorageQuery } from 'nr1';

const collection = 'status-widgets';

export default class Tiler extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      documentValue: null,
      loadingDocument: false
    };
  }

  componentDidMount() {
    const { accountId, documentId } = this.props;
    this.setState({ loadingDocument: true }, () => {
      AccountStorageQuery.query({
        accountId,
        collection,
        documentId
      }).then(({ data }) => {
        // eslint-disable-next-line
        console.log(data);
        this.setState({
          loadingDocument: false,
          documentValue: data || {}
        });
      });
    });
  }

  render() {
    const { documentValue, loadingDocument } = this.state;
    const widgets = documentValue?.widgets || [];
    const columns = documentValue?.columns || 1;
    const { timeRange, width, height } = this.props;

    if (loadingDocument) {
      return 'Loading configuration...';
    }

    if (widgets.length === 0) {
      return 'No widgets defined...';
    }

    console.log(height);
    const rows = Math.ceil(widgets.length / columns);
    const widgetHeight = height / rows - rows * 3;
    // const widgetWidth = (width - 25) / columns - columns * 1.5;
    const widgetWidth = (width - 20) / columns - columns;

    return (
      <div>
        {widgets.map((widget, i) => {
          const row = Math.ceil((i + 1) / columns);
          const endPos = row * columns;
          const startPos = endPos - (columns - 1);

          let adjustBasicWidget = false;

          // check if there is a widget to left or right
          if (!widget.queryLeft && !widget.queryRight) {
            //  check left
            if (i + 1 > startPos && widgets[i - 1]) {
              if (widgets[i + 1]?.queryLeft || widgets[i + 1]?.queryRight) {
                adjustBasicWidget = true;
              }
            }
            //  check right
            if (i + 1 < endPos && widgets[i + 1]) {
              if (widgets[i - 1]?.queryLeft || widgets[i + -1]?.queryRight) {
                adjustBasicWidget = true;
              }
            }
          }

          const fontSizeMultiplier = 0.75;

          let bottom = 0;

          if (rows === row) {
            bottom = 10;
          } else {
            bottom = rows * height - height * row + 140;
          }

          return (
            <div
              key={i}
              style={{
                display: 'inline-block',
                width: widgetWidth,
                maxWidth: widgetWidth,
                maxHeight: widgetHeight,
                overflow: 'hidden',
                padding: '3px'
              }}
            >
              {widget.dummy ? (
                <table style={{ width: widgetWidth, height: widgetHeight }}>
                  <tr>
                    <td colSpan="2">&nbsp;</td>
                  </tr>
                </table>
              ) : (
                <StatusWidget
                  widgetKey={i}
                  isTile
                  adjustBasicWidget={adjustBasicWidget}
                  timeRange={timeRange}
                  width={widgetWidth - 6}
                  height={widgetHeight - 6}
                  {...widget}
                  columns={columns.length}
                  row={row}
                  rows={rows}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
