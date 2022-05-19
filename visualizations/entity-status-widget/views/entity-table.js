import React from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  EntityTitleTableRowCell,
  navigation,
  TextField
} from 'nr1';
import CsvDownload from 'react-json-to-csv';

export default class EntityTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { searchText: '' };
  }

  render() {
    const { searchText } = this.state;
    const { width, height, entities, isFetching } = this.props;
    const searchedEntities = entities.filter(e =>
      e.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <div
        style={{
          width: width ? width - 20 : '100%',
          height
        }}
      >
        <div style={{ paddingLeft: '5px', paddingTop: '5px' }}>
          <TextField
            loading={isFetching}
            style={{ width: width - 85 }}
            type={TextField.TYPE.SEARCH}
            placeholder={`Search ${entities.length} entities...`}
            onChange={e => this.setState({ searchText: e.target.value })}
          />
          &nbsp;
          <CsvDownload
            data={searchedEntities.map(e => ({
              guid: e.guid,
              name: e.name,
              type: e.type,
              entityType: e.entityType,
              domain: e.domain,
              reporting: e.reporting,
              alertSeverity: e.alertSeverity,
              accountId: e.account.id,
              accountName: e.account.name
            }))}
            filename={`${new Date().getTime()}-entities.csv`}
            style={{
              minHeight: '0px',
              paddingLeft: '8px',
              paddingRight: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              height: '24px',
              width: '52px',
              fontSize: '12px'
            }}
          >
            Export
          </CsvDownload>
        </div>

        <Table items={searchedEntities}>
          <TableHeader>
            <TableHeaderCell>Entity</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
          </TableHeader>

          {({ item }) => (
            <TableRow>
              <EntityTitleTableRowCell
                value={item}
                onClick={() => navigation.openStackedEntity(item.guid)}
              />
              <TableRowCell>{item.type}</TableRowCell>
            </TableRow>
          )}
        </Table>
      </div>
    );
  }
}
