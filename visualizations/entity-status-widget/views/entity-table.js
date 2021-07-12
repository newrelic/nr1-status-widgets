import React from 'react';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  EntityTitleTableRowCell,
  navigation,
  TextField
} from 'nr1';

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
          width: width - 20,
          height
        }}
      >
        <div style={{ paddingLeft: '5px', paddingTop: '5px' }}>
          <TextField
            loading={isFetching}
            style={{ width: '100%' }}
            type={TextField.TYPE.SEARCH}
            placeholder={`Search ${entities.length} entities...`}
            onChange={e => this.setState({ searchText: e.target.value })}
          />
        </div>

        <Table items={searchedEntities}>
          <TableHeader>
            <TableHeaderCell>Entity</TableHeaderCell>
          </TableHeader>

          {({ item }) => (
            <TableRow>
              <EntityTitleTableRowCell
                value={item}
                onClick={() => navigation.openStackedEntity(item.guid)}
              />
            </TableRow>
          )}
        </Table>
      </div>
    );
  }
}
