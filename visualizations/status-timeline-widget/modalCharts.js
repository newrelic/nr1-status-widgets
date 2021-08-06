import React from 'react';
import {
  Modal,
  Button,
  LineChart,
  HeadingText,
  BillboardChart,
  AreaChart,
  BarChart,
  StackedBarChart,
  PieChart,
  SparklineChart,
  HeatmapChart,
  HistogramChart,
  JsonChart,
  TableChart,
  FunnelChart,
  ScatterChart
} from 'nr1';

export default class ModalCharts extends React.Component {
  renderChart = (accountId, chartType, query, height) => {
    switch (chartType) {
      case 'area': {
        return (
          <AreaChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'bar': {
        return (
          <BarChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'billboard': {
        return (
          <BillboardChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'funnel': {
        return (
          <FunnelChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'heatmap': {
        return (
          <HeatmapChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'histogram': {
        return (
          <HistogramChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'json': {
        return (
          <JsonChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'line': {
        return (
          <LineChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'pie': {
        return (
          <PieChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      case 'scatter': {
        return (
          <ScatterChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'sparkline': {
        return (
          <SparklineChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'stackedbar': {
        return (
          <StackedBarChart
            accountId={accountId}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'table': {
        return (
          <TableChart accountId={accountId} query={query} style={{ height }} />
        );
      }
      default: {
        return 'Unsupported chart type';
      }
    }
  };

  render() {
    const { open, close, queries, accountId } = this.props;

    return (
      <Modal hidden={!open} onClose={close}>
        <>
          {queries.map((q, i) => {
            const height =
              q.height && !isNaN(q.height) ? `${q.height}px` : undefined;

            return (
              <div
                key={i}
                style={{
                  padding: '7px',
                  height
                }}
              >
                {!q.hideTitle && (
                  <HeadingText type={HeadingText.TYPE.HEADING_4}>
                    {q.chartTitle}
                  </HeadingText>
                )}
                {this.renderChart(accountId, q.chartType, q.query, height)}
              </div>
            );
          })}
          <div style={{ paddingTop: '10px' }}>
            <Button onClick={close}>Close</Button>
          </div>
        </>
      </Modal>
    );
  }
}
