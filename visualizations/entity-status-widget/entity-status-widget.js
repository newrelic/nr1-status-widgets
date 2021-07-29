import React from 'react';
import { Spinner, ngql, NerdGraphQuery } from 'nr1';
import EmptyState from '../shared/emptyState';
import {
  generateErrors,
  chunk,
  filterAndSortEntities,
  alertLevels
} from './utils';
import queue from 'async/queue';
import Summarized from './views/summarized';
import EntityTable from './views/entity-table';

const relationshipQuery = (guids, end_time) => {
  return ngql`{
    actor {
      entities(guids: [${guids}]) {
        account {
          id
          name
        }
        guid
        name
        domain
        type
        entityType
        reporting
        ... on AlertableEntity {
          alertSeverity
        }
        relationships(endTime: ${end_time})  {
          source {
            entity {
              name
              guid
              entityType
              type
              ... on AlertableEntityOutline {
                alertSeverity
              }
            }
          }
          target {
            entity {
              name
              guid
              entityType
              type
              ... on AlertableEntityOutline {
                alertSeverity
              }
            }
          }
        }
      }
    }
  }`;
};

const entityQuery = (query, cursor, limit) => {
  return ngql`{
    actor {
      entitySearch(query: "${query}",  options: {limit: ${parseFloat(limit) ||
    100}}) {
        results${cursor ? `(cursor: "${cursor}")` : ''} {
          entities {
            name
            guid
          }
          nextCursor
        }
      }
    }
  }`;
};

const deriveHealthStatus = data => {
  let currentSeverity = 0;
  let currentStatus = 'NOT_CONFIGURED';
  data.forEach(entity => {
    const alertSeverity = alertLevels[entity.alertSeverity] || 0;

    if (alertSeverity > currentSeverity) {
      currentSeverity = alertSeverity;
      currentStatus = entity.alertSeverity;
    }
  });

  return currentStatus;
};

export default class EntityStatusWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredEntities: [],
      summarizedHealthStatus: 'NOT_CONFIGURED',
      entityData: {},
      timeRange: undefined,
      errors: [],
      entitySearchErrors: [],
      isFetching: false,
      end_time: 4500000,
      entitySearchQuery: '',
      entitySearchLimit: 100,
      entityGuids: [],
      trackCritical: null,
      trackWarning: null,
      trackHealthy: null,
      trackNotConfigured: null,
      viewMode: null,
      firstLoadComplete: false
    };
  }

  async componentDidMount() {
    const errors = await generateErrors(this.props);
    const {
      entitySearchQuery,
      entityGuids,
      trackNotReporting,
      entitySearchLimit
    } = this.props;
    this.setState(
      {
        errors,
        entityGuids,
        entitySearchQuery,
        trackNotReporting,
        entitySearchLimit
      },
      () => {
        this.fetchData(this.props);

        // fetch data on poll
        let pollInterval = this.props.pollInterval || 30000;
        pollInterval = pollInterval < 15000 ? 15000 : pollInterval;

        this.widgetPoll = setInterval(() => {
          this.fetchData(this.props);
        }, pollInterval);
      }
    );
    // this.handleTime(this.props.timeRange);
  }

  async componentDidUpdate() {
    const errors = await generateErrors(this.props);
    const stateUpdate = {};
    if (JSON.stringify(errors) !== JSON.stringify(this.state.errors)) {
      stateUpdate.errors = errors;
    }

    const {
      entitySearchQuery,
      entityGuids,
      trackCritical,
      trackHealthy,
      trackWarning,
      trackNotConfigured,
      trackNotReporting,
      viewMode
    } = this.props;
    if (entitySearchQuery !== this.state.entitySearchQuery) {
      stateUpdate.entitySearchQuery = entitySearchQuery;
    }

    if (
      JSON.stringify(entityGuids) !== JSON.stringify(this.state.entityGuids)
    ) {
      stateUpdate.entityGuids = entityGuids;
    }

    if (trackCritical !== this.state.trackCritical) {
      stateUpdate.trackCritical = trackCritical;
    }

    if (trackWarning !== this.state.trackWarning) {
      stateUpdate.trackWarning = trackWarning;
    }

    if (trackHealthy !== this.state.trackHealthy) {
      stateUpdate.trackHealthy = trackHealthy;
    }

    if (trackNotConfigured !== this.state.trackNotConfigured) {
      stateUpdate.trackNotConfigured = trackNotConfigured;
    }

    if (trackNotReporting !== this.state.trackNotReporting) {
      stateUpdate.trackNotReporting = trackNotReporting;
    }

    if (viewMode !== this.state.viewMode) {
      stateUpdate.viewMode = viewMode;
    }

    if (Object.keys(stateUpdate).length > 0) {
      // eslint-disable-next-line
      console.log('updating state', stateUpdate);

      // eslint-disable-next-line
      this.setState(stateUpdate, () => {
        if (this.widgetPoll) {
          // eslint-disable-next-line
          console.log('resetting interval');
          clearInterval(this.widgetPoll);
          this.fetchData(this.props);

          // fetch data on poll
          let pollInterval = this.props.pollInterval || 30000;
          pollInterval = pollInterval < 15000 ? 15000 : pollInterval;

          this.widgetPoll = setInterval(() => {
            this.fetchData(this.props);
          }, pollInterval);
        }
      });
    }
    // this.handleTime(this.props.timeRange);
  }

  componentWillUnmount() {
    if (this.widgetPoll) {
      clearInterval(this.widgetPoll);
    }
  }

  handleTime = async incomingTimeRange => {
    const currentTimeRange = this.state.timeRange;
    const currentTimeRangeStr = JSON.stringify(currentTimeRange);
    const incomingTimeRangeStr = JSON.stringify(incomingTimeRange);

    if (!incomingTimeRange && incomingTimeRangeStr !== currentTimeRangeStr) {
      this.setState({ timeRange: undefined });
    } else if (
      JSON.stringify(currentTimeRange) !== JSON.stringify(incomingTimeRange)
    ) {
      const stateUpdate = { timeRange: incomingTimeRange };
      this.setState(stateUpdate);
    }
  };

  fetchData = props => {
    const { isFetching, end_time } = this.state;

    if (!isFetching) {
      this.setState({ isFetching: true }, () => {
        this.recursiveEntityFetch().then(async data => {
          // this.setState({ data, isFetching: false });
          const entityGuids = data.map(e => e.guid);
          const entityChunks = chunk(entityGuids, 25);

          const entityPromises = entityChunks.map(chunk => {
            // eslint-disable-next-line
            return new Promise(async resolve => {
              const guids = `"${chunk.join(`","`)}"`;
              const nerdGraphResult = await NerdGraphQuery.query({
                query: relationshipQuery(guids, end_time)
              });
              resolve(nerdGraphResult);
            });
          });

          let completeEntities = [];
          await Promise.all(entityPromises).then(values => {
            values.forEach(v => {
              const entities = v?.data?.actor?.entities || [];
              completeEntities = [...completeEntities, ...entities];
            });
          });

          const filteredEntities = filterAndSortEntities(
            props,
            completeEntities
          );
          const entityData = {};
          filteredEntities.forEach(e => {
            entityData[e.guid] = { ...e };
          });

          const summarizedHealthStatus = deriveHealthStatus(filteredEntities);

          this.setState({
            filteredEntities,
            entityData,
            summarizedHealthStatus,
            isFetching: false,
            firstLoadComplete: true
          });
        });
      });
    }
  };

  recursiveEntityFetch = async () => {
    const {
      entitySearchQuery,
      entityGuids,
      trackNotReporting,
      entitySearchLimit
    } = this.state;

    // eslint-disable-next-line
    return new Promise(async resolve => {
      const guidData = [];
      let entitySearchErrors = [];

      if (entitySearchQuery) {
        const q = queue((task, callback) => {
          NerdGraphQuery.query({
            query: entityQuery(
              `${task.entitySearchQuery} ${
                !trackNotReporting ? ` AND reporting='true'` : ''
              }`,
              task.cursor,
              entitySearchLimit
            )
          }).then(value => {
            const results = value?.data?.actor?.entitySearch?.results || null;
            const searchErrors = value?.errors || [];
            entitySearchErrors = [...entitySearchErrors, ...searchErrors];

            if (results) {
              if (results.entities.length > 0) {
                guidData.push(results.entities);
              }

              if (results.nextCursor) {
                q.push({ entitySearchQuery, cursor: results.nextCursor });
              }
            }

            callback();
          });
        }, 5);

        q.push({ entitySearchQuery, cursor: null });

        await q.drain();
      }

      const entitySearchQueryGuids = guidData.flat() || [];
      const finalGuids = [...entitySearchQueryGuids, ...entityGuids];

      this.setState({ entitySearchErrors }, () => resolve(finalGuids));
    });
  };

  render() {
    const {
      entitySearchQuery,
      errors,
      entitySearchErrors,
      entityData,
      filteredEntities,
      summarizedHealthStatus,
      isFetching,
      firstLoadComplete
    } = this.state;
    const { width, height, viewMode } = this.props;
    const completeErrors = [...errors];

    if (filteredEntities.length === 0 && !isFetching && firstLoadComplete) {
      completeErrors.push(
        'No entities found... Check if you are tracking the required status conditions.'
      );
    }

    entitySearchErrors.forEach(e =>
      completeErrors.push(
        `Entity search error - query: ${entitySearchQuery}, message: ${e.message}`
      )
    );

    if (completeErrors.length > 0) {
      return <EmptyState isEntity errors={[...completeErrors]} />;
    }

    if (isFetching && !firstLoadComplete) {
      return <Spinner />;
    }

    if (!viewMode || viewMode === 'summarized') {
      return (
        <Summarized
          isFetching={isFetching}
          {...this.props}
          entities={filteredEntities}
          entityData={entityData}
          summarizedHealthStatus={summarizedHealthStatus}
        />
      );
    } else if (viewMode === 'table') {
      return (
        <EntityTable
          isFetching={isFetching}
          firstLoadComplete={firstLoadComplete}
          {...this.props}
          entities={filteredEntities}
          entityData={entityData}
          summarizedHealthStatus={summarizedHealthStatus}
        />
      );
    }

    return <div style={{ height, width }}>unknown view mode</div>;
  }
}
