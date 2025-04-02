import React, { useState, useContext, useEffect } from 'react';
import {
  NrqlQuery,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  MetricTableRowCell,
  NerdletStateContext
} from 'nr1';
import ErrorState from '../shared/errorState';
import { assessValue, discoverErrors, isEmpty } from './utils';
import { subVariables } from '../shared/utils';
import { useInterval, useSetState } from '@mantine/hooks';

const ignoreKeys = ['begin_time', 'end_time', 'x', 'y', 'events'];

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeRangeToNrql = timeRange => {
  if (!timeRange) {
    return 'SINCE 1 minute ago';
  }

  if (timeRange.beginTime && timeRange.endTime) {
    return `SINCE ${timeRange.beginTime} UNTIL ${timeRange.endTime}`;
  } else if (timeRange.begin_time && timeRange.end_time) {
    return `SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`;
  } else if (timeRange.duration <= HOUR) {
    return `SINCE ${timeRange.duration / MINUTE} MINUTES AGO`;
  } else if (timeRange.duration <= DAY) {
    return `SINCE ${timeRange.duration / HOUR} HOURS AGO`;
  } else {
    return `SINCE ${timeRange.duration / DAY} DAYS AGO`;
  }
};

export default function StatusTableWidget(props) {
  const {
    width,
    height,
    accountId,
    useTimeRange,
    enableFilters,
    platformContext,
    columnSort,
    defaultSortNo,
    defaultSortDir,
    query,
    cellConfigs = [],
    headerConfigs = [],
    showKey,
    pollInterval
  } = props;
  const { timeRange } = platformContext;
  const nerdletContext = useContext(NerdletStateContext);
  const { filters, selectedVariables } = nerdletContext;
  const [nrdbResult, setNrdbResult] = useSetState(null);
  const [finalQuery, setQuery] = useState(null);
  const [inputErrors, setInputErrors] = useState([]);
  const filterClause = filters ? `WHERE ${filters}` : '';
  const [column, setColumn] = useState(parseInt(defaultSortNo || 0));
  const [sortedCellConfigs, setCellConfigs] = useState([]);
  const [sortingType, setSortingType] = useState(
    TableHeaderCell.SORTING_TYPE[
      defaultSortNo ? defaultSortDir || 'NONE' : 'NONE'
    ]
  );

  useEffect(() => {
    if (query) {
      let tempQuery = subVariables(query, selectedVariables);

      if (useTimeRange) {
        tempQuery += ` ${timeRangeToNrql(timeRange)}`;
      }

      if (enableFilters) {
        tempQuery += ` ${filterClause}`;
      }

      setQuery(tempQuery);
    }

    const inputErrors = discoverErrors(props);
    setInputErrors(inputErrors);
  }, [query, selectedVariables, enableFilters, filterClause, timeRange]);

  useEffect(() => {
    const configs = (cellConfigs || []).sort((a, b) => {
      const aNo = !isEmpty(a.priority) ? a.priority : 99999;
      const bNo = !isEmpty(b.priority) ? b.priority : 99999;
      return parseInt(aNo) - parseInt(bNo);
    });

    setCellConfigs(configs);
  }, [cellConfigs]);

  const fetchData = async () => {
    if (finalQuery && accountId) {
      const result = await NrqlQuery.query({
        query: finalQuery,
        accountIds: [parseInt(accountId)],
        formatType: NrqlQuery.FORMAT_TYPE.RAW
      });
      setNrdbResult(result);
    }
  };

  const interval = useInterval(() => {
    fetchData();
  }, (pollInterval || 60) * 1000);

  useEffect(() => {
    fetchData();
    interval.stop();
    interval.start();
    return interval.stop;
  }, [finalQuery, accountId, pollInterval]);

  if (inputErrors.length > 0) {
    return <ErrorState errors={inputErrors} />;
  }

  const onClickTableHeaderCell = (nextColumn, { nextSortingType }) => {
    if (nextColumn === column) {
      setSortingType(nextSortingType);
    } else {
      setSortingType(nextSortingType);
      setColumn(nextColumn);
    }
  };

  if (nrdbResult === null) {
    return <Spinner />;
  }

  if (nrdbResult?.error) {
    // eslint-disable-next-line
    console.log('nrdb error ->', nrdbResult);
    return (
      <ErrorState
        errors={[nrdbResult?.error?.message || '']}
        query={finalQuery}
      />
    );
  }

  const data = nrdbResult?.data;

  if (finalQuery && data) {
    // do this to not effect the original object
    const workingData = JSON.parse(JSON.stringify(data));

    const { metadata } = workingData;

    let headers = [];

    if (!columnSort || columnSort === 'FIRST') {
      headers = [
        ...new Set([
          ...(Array.isArray(metadata?.facet) ? metadata?.facet : []),
          ...Object.keys(workingData?.results?.[0]?.events?.[0] || {}),
          ...(Array.isArray(metadata?.contents) ? metadata?.contents : [])
            .map(
              c =>
                c.alias ||
                (c.attribute ? `${c.function}.${c.attribute}` : c.function)
            )
            .flat(),
          ...(metadata?.contents?.contents || [])
            .map(
              c =>
                c.alias ||
                (c.attribute ? `${c.function}.${c.attribute}` : c.function)
            )
            .flat()
        ])
      ].filter(f => !ignoreKeys.includes(f));
    }

    if (columnSort === 'LAST') {
      headers = [
        ...new Set([
          ...Object.keys(workingData?.results?.[0]?.events?.[0] || {}),
          ...(Array.isArray(metadata?.contents) ? metadata?.contents : [])
            .map(
              c =>
                c.alias ||
                (c.attribute ? `${c.function}.${c.attribute}` : c.function)
            )
            .flat(),
          ...(metadata?.contents?.contents || [])
            .map(
              c =>
                c.alias ||
                (c.attribute ? `${c.function}.${c.attribute}` : c.function)
            )
            .flat(),
          ...(Array.isArray(metadata?.facet) ? metadata?.facet : [])
        ])
      ].filter(f => !ignoreKeys.includes(f));
    }

    let singleFacet = false;
    let multiFacet = false;
    if (typeof workingData?.metadata?.facet === 'string') {
      if (!columnSort || columnSort === 'FIRST') {
        headers.unshift(workingData?.metadata?.facet);
      } else if (columnSort === 'LAST') {
        headers.push(workingData?.metadata?.facet);
      }
      singleFacet = workingData?.metadata?.facet;
    } else {
      multiFacet = workingData?.metadata?.facet || [];
      // multiFacet = (data?.metadata?.facet || []).filter(
      //   f => f !== 'name'
      // );
      // multiFacet.push('name');
    }

    let items = [];

    if (workingData?.results?.[0]?.events) {
      items = workingData?.results?.[0]?.events || [];
    } else if (workingData?.facets) {
      (workingData?.facets || []).forEach(f => {
        if (singleFacet) {
          if (singleFacet === 'name') {
            f.tempName = f.name;
          } else {
            f[singleFacet] = f.name;
          }
        } else {
          multiFacet.forEach((mf, i) => {
            if (mf === 'name') {
              f.tempName = f.name[i];
            } else {
              f[mf] = f.name[i];
            }
          });
        }

        const contents =
          metadata?.contents?.contents || metadata?.contents || [];
        f.results.forEach((r, i) => {
          let firstValue = r[Object.keys(r)[0]];

          // handle nested percentiles and values that are returned as json and not a flat number
          // eg.{ "90": 5600 }
          if (
            firstValue &&
            typeof firstValue === 'object' &&
            Object.keys(firstValue || {}).length > 0
          ) {
            firstValue = firstValue[Object.keys(firstValue)[0]];
          }

          if (contents[i]) {
            const { alias, attribute } = contents[i];
            const fn = contents[i].function;
            f[alias] = firstValue;
            f[attribute] = firstValue;
            f[fn] = firstValue;
            f[`${fn}.${attribute}`] = firstValue;
          }
        });

        f.name = f.tempName;
        items.push(f);
      });
    } else if (Array.isArray(data?.results)) {
      const newItem = {};

      metadata.contents.forEach((c, i) => {
        const attr =
          c.alias ||
          (c.attribute ? `${c.function}.${c.attribute}` : c.function);

        newItem[attr] = data?.results?.[i][Object.keys(data?.results?.[i])[0]];
      });

      items.push(newItem);
    }

    sortedCellConfigs.forEach(config => {
      const { targetAttribute, highlightRow } = config;

      items.forEach(item => {
        const value =
          item[targetAttribute] !== null && item[targetAttribute] !== undefined
            ? item[targetAttribute]
            : (item?.groups || []).find(g => g.name === targetAttribute)?.value;

        const assessment = assessValue(value, config);

        if (assessment?.check) {
          if (!item.cellStyles) {
            item.cellStyles = { [targetAttribute]: assessment };
          } else {
            item.cellStyles[targetAttribute] = assessment;
          }

          if (highlightRow) {
            item.rowStyle = assessment;
          }
        }
      });
    });

    return (
      <>
        <Table
          items={items}
          style={{
            height: showKey ? height - 40 : height,
            width: width + 52
          }}
        >
          <TableHeader>
            {headers
              .filter(
                h =>
                  !headerConfigs.find(c => c.targetAttribute === h)
                    ?.hideHeader === true
              )
              .map((h, i) => {
                const headerConfig = headerConfigs.find(
                  c => c.targetAttribute === h
                );

                let headerWidth = headerConfig?.headerWidth || 0;
                if (headerWidth) {
                  const parsedHw = parseFloat(headerWidth);
                  if (!isNaN(parsedHw)) {
                    headerWidth = `${parsedHw}px`;
                  } else {
                    headerWidth = 0;
                  }
                }

                return (
                  <TableHeaderCell
                    key={h}
                    value={({ item }) => item[h]}
                    alignmentType={
                      TableHeaderCell.ALIGNMENT_TYPE[
                        headerConfig?.alignmentType || 'LEFT'
                      ]
                    }
                    width={headerWidth || '1fr'}
                    sortable
                    sortingType={
                      column === i
                        ? sortingType
                        : TableHeaderCell.SORTING_TYPE.NONE
                    }
                    onClick={(event, data) => onClickTableHeaderCell(i, data)}
                  >
                    {headerConfig?.renameHeader || h}
                  </TableHeaderCell>
                );
              })}
          </TableHeader>
          {({ item }) => {
            const { rowStyle, cellStyles } = item || {};

            return (
              <TableRow>
                {headers
                  .filter(
                    h =>
                      !headerConfigs.find(c => c.targetAttribute === h)
                        ?.hideHeader === true
                  )
                  .map(h => {
                    const value =
                      item[h] !== undefined && item[h] !== null
                        ? item[h]
                        : (item?.groups || []).find(g => g.name === h)?.value;

                    const headerConfig = headerConfigs.find(
                      c => c.targetAttribute === h
                    );

                    const cellConfig = cellConfigs.find(
                      c => c.targetAttribute === h
                    );

                    const style = {};
                    if (rowStyle) {
                      style.color = rowStyle?.fontColor;
                      style.backgroundColor = rowStyle?.bgColor;
                    }

                    if (Object.keys(cellStyles?.[h] || {}).length > 0) {
                      style.color = cellStyles[h]?.fontColor;
                      style.backgroundColor = cellStyles[h]?.bgColor;
                    }

                    if (headerConfig?.valueType) {
                      if (headerConfig?.valueType === 'TIMESTAMP') {
                        return (
                          <TableRowCell
                            key={`${h}_${value}`}
                            alignmentType={
                              TableRowCell.ALIGNMENT_TYPE[
                                cellConfig?.alignmentType || 'LEFT'
                              ]
                            }
                            style={style}
                          >
                            {new Date(value).toLocaleString()}
                          </TableRowCell>
                        );
                      } else {
                        return (
                          <MetricTableRowCell
                            key={`${h}_${value}`}
                            type={
                              MetricTableRowCell.TYPE[
                                headerConfig?.valueType || 'UNKNOWN'
                              ]
                            }
                            value={value}
                            style={style}
                          />
                        );
                      }
                    }

                    return (
                      <TableRowCell
                        key={`${h}_${value}`}
                        alignmentType={
                          TableRowCell.ALIGNMENT_TYPE[
                            cellConfig?.alignmentType || 'LEFT'
                          ]
                        }
                        style={style}
                      >
                        {value}
                      </TableRowCell>
                    );
                  })}
              </TableRow>
            );
          }}
        </Table>
        {showKey && (
          <div
            style={{
              position: 'sticky',
              bottom: '0px',
              textAlign: 'center',
              padding: '10px',
              backgroundColor: 'white'
            }}
          >
            {cellConfigs.map(t => {
              const value = {};
              const { bgColor, fontColor } = t;

              const headerConfig = headerConfigs.find(
                c => c.targetAttribute === t.targetAttribute
              );

              if (bgColor === 'healthy' || bgColor === 'green') {
                value.bgColor = '#3a845e';
                value.fontColor = 'white';
              }

              if (fontColor === 'healthy' || fontColor === 'green') {
                value.fontColor = '#3a845e';
              }

              if (bgColor === 'critical' || bgColor === 'red') {
                value.bgColor = '#a1251a';
                value.fontColor = 'white';
              }

              if (fontColor === 'critical' || fontColor === 'red') {
                value.fontColor = '#a1251a';
              }

              if (bgColor === 'warning' || bgColor === 'orange') {
                value.bgColor = '#f8d45c';
                value.fontColor = 'black';
              }

              if (fontColor === 'warning' || fontColor === 'orange') {
                value.fontColor = '#f8d45c';
              }

              if (bgColor === 'unknown' || bgColor === 'grey') {
                value.bgColor = '#9fa5a5';
              }

              if (fontColor === 'unknown' || fontColor === 'grey') {
                value.fontColor = '#9fa5a5';
              }

              return (
                <>
                  <div style={{ display: 'inline' }}>
                    <span style={{ color: value.bgColor }}>&#9632;</span>
                    &nbsp;
                    {t?.keyLabel ||
                      headerConfig?.renameHeader ||
                      t.targetAttribute}
                  </div>
                  &nbsp;&nbsp;&nbsp;
                </>
              );
            })}
          </div>
        )}
      </>
    );
  } else {
    // eslint-disable-next-line
    console.log('unhandled case', nrdbResult, props);
    return <></>;
  }
}
