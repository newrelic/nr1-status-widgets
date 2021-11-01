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

    return (documentValue?.widgets || []).map((widget, i) => {
      return (
        <div
          key={i}
          style={{ display: 'inline-block', border: '1px solid white' }}
        >
          <StatusWidget
            timeRange={timeRange}
            width={width / columns - 11}
            height={height}
            {...widget}
            columns={columns}
          />
        </div>
      );
    });
  }
}
