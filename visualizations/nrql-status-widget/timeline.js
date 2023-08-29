import React from 'react';
import { Tooltip, NrqlQuery, Spinner } from 'nr1';
import { deriveValues } from './utils';

export default class Timeline extends React.Component {
  render() {
    const {
      displayMetric,
      finalQuery,
      timeRangeResult,
      configuration,
      width,
      selectedAccountId,
      selectedPollInterval
    } = this.props;

    return (
      <NrqlQuery
        query={finalQuery}
        accountIds={[selectedAccountId]}
        pollInterval={selectedPollInterval}
      >
        {({ data, loading, error }) => {
          if (loading) {
            return <Spinner />;
          }

          if (error) {
            // eslint-disable-next-line
            console.log(error);
          }

          const derivedValues = deriveValues(
            data,
            configuration,
            timeRangeResult
          );

          const { timeseries } = derivedValues;

          return (
            <div
              className="flex-item"
              style={{
                position: 'absolute',
                bottom: '0px',
                fontSize: displayMetric ? '10vh' : '12vh',
                display: 'inline-flex',
                paddingTop: '2vh',
                paddingBottom: '2vh',
                width,
                // backgroundColor: "black",
                backgroundColor: '#272727',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {(timeseries || []).map((ts, i) => {
                const beginDate = new Date(ts.begin_time);
                const endDate = new Date(ts.end_time);
                /* eslint-disable */
                const hoverText = `${beginDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}\n${ts.value
                  }`;
                /* eslint-enable */

                return (
                  <Tooltip
                    text={hoverText}
                    key={i}
                    placementType={Tooltip.PLACEMENT_TYPE.TOP}
                  >
                    <div
                      className={`${ts.status}-solid-bg`}
                      style={{
                        width: '2.5vh',
                        height: '5.75vh',
                        marginRight: '1.75vh',
                        border: '1px solid white'
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          );
        }}
      </NrqlQuery>
    );
  }
}
