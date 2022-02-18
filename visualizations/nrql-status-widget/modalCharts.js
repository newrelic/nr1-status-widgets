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
          <AreaChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'bar': {
        return (
          <BarChart accountIds={[accountId]} query={query} style={{ height }} />
        );
      }
      case 'billboard': {
        return (
          <BillboardChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'funnel': {
        return (
          <FunnelChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'heatmap': {
        return (
          <HeatmapChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'histogram': {
        return (
          <HistogramChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'json': {
        return (
          <JsonChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'line': {
        return (
          <LineChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'pie': {
        return (
          <PieChart accountIds={[accountId]} query={query} style={{ height }} />
        );
      }
      case 'scatter': {
        return (
          <ScatterChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'sparkline': {
        return (
          <SparklineChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'stackedbar': {
        return (
          <StackedBarChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
        );
      }
      case 'table': {
        return (
          <TableChart
            accountIds={[accountId]}
            query={query}
            style={{ height }}
          />
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
