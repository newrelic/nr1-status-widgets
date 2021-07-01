import React from 'react';
import {
  AutoSizer,
  NerdletStateContext,
  HeadingText,
  LineChart,
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

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

export default class CustomModalNerdlet extends React.Component {
  renderChart = (accountId, chartType, query, height, width) => {
    switch (chartType) {
      case 'area': {
        return (
          <AreaChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'bar': {
        return (
          <BarChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'billboard': {
        return (
          <BillboardChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'funnel': {
        return (
          <FunnelChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'heatmap': {
        return (
          <HeatmapChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'histogram': {
        return (
          <HistogramChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'json': {
        return (
          <JsonChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'line': {
        return (
          <LineChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'pie': {
        return (
          <PieChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'scatter': {
        return (
          <ScatterChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'sparkline': {
        return (
          <SparklineChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'stackedbar': {
        return (
          <StackedBarChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      case 'table': {
        return (
          <TableChart
            accountId={accountId}
            query={query}
            style={{ height, width }}
          />
        );
      }
      default: {
        return 'Unsupported chart type';
      }
    }
  };

  render() {
    return (
      <AutoSizer>
        {({ width, height }) => (
          <NerdletStateContext.Consumer>
            {nerdletState => {
              const { queries, accountId } = nerdletState;
              width = width * 0.95;

              let widgetsPerCol = 3;
              if (queries.length === 2) widgetsPerCol = 2;

              let widgetsPerRow = 3;
              if (queries.length === 2) widgetsPerRow = 2;

              return (
                <div style={{ padding: '10px' }}>
                  {(queries || []).map((q, i) => {
                    const widgetHeight =
                      q.height && !isNaN(q.height)
                        ? `${q.height}px`
                        : undefined;
                    const widgetWidth =
                      q.width && !isNaN(q.width) ? `${q.width}px` : undefined;

                    return (
                      <div
                        key={i}
                        style={{
                          padding: '7px',
                          paddingBottom: '50px',
                          float: 'left',
                          height: widgetHeight || height / widgetsPerRow,
                          width: widgetWidth || width / widgetsPerCol
                        }}
                      >
                        {!q.hideTitle && (
                          <HeadingText
                            type={HeadingText.TYPE.HEADING_4}
                            style={{ paddingBottom: '5px' }}
                          >
                            {q.chartTitle}
                          </HeadingText>
                        )}
                        {this.renderChart(
                          accountId,
                          q.chartType,
                          q.query,
                          height,
                          width
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </NerdletStateContext.Consumer>
        )}
      </AutoSizer>
    );
  }
}
