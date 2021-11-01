import React from 'react';
import {
  Button,
  AccountStorageQuery,
  AccountStorageMutation,
  HeadingText,
  SelectItem,
  Form,
  Select,
  TextField,
  AccountPicker,
  Switch
} from 'nr1';

const { configuration } = require('./nr1-original.json');

const collection = 'status-widgets';
const defaultFormWidth = '300px';

export default class EditMode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accountId: null,
      documentId: '',
      documentValue: null,
      stage: null,
      checkingDocument: false,
      savingDocument: false
    };
  }

  componentDidMount() {
    // const { documentId, accountId } = this.props;
    // AccountStorageMutation.mutate({
    //   accountId,
    //   actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    //   collection,
    //   documentId,
    //   document: {
    //     columns: 1,
    //     widgets: []
    //   }
    // });
  }

  componentDidUpdate() {
    const { documentId, accountId } = this.props;
    if (
      documentId !== this.state.documentId ||
      accountId !== this.state.accountId
    ) {
      // eslint-disable-next-line
      this.setState({
        documentId,
        accountId,
        stage: null,
        documentValue: null
      });
    }
  }

  saveDocument = () => {
    this.setState({ savingDocument: true }, () => {
      const { documentValue, documentId, accountId } = this.state;
      AccountStorageMutation.mutate({
        accountId,
        actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection,
        documentId,
        document: {
          columns: documentValue?.columns || 1,
          widgets: documentValue?.widgets || []
        }
      }).then(v => {
        this.setState({
          savingDocument: false
        });
      });
    });
  };

  checkDocument = (accountId, documentId) => {
    this.setState({ checkingDocument: true }, () => {
      AccountStorageQuery.query({
        accountId,
        collection,
        documentId
      }).then(({ data }) => {
        // eslint-disable-next-line
        console.log(data);
        this.setState({
          documentId,
          checkingDocument: false,
          documentValue: data || {},
          stage: 'documentChecked'
        });
      });
    });
  };

  addWidget = () => {
    const { documentValue } = this.state;
    const widgets = documentValue.widgets || [];
    widgets.push({});
    documentValue.widgets = widgets;
    this.setState({ documentValue });
  };

  addCollectionItem = (index, field) => {
    const { documentValue } = this.state;
    const widgets = documentValue.widgets || [];
    const currentWidget = widgets[index];
    currentWidget[field] = currentWidget[field] || [];
    currentWidget[field].push({});
    widgets[index] = currentWidget;
    documentValue.widgets = widgets;
    this.setState({ documentValue });
  };

  removeWidget = index => {
    const { documentValue } = this.state;
    const widgets = documentValue.widgets || [];
    widgets.splice(index, 1);
    documentValue.widgets = widgets;
    this.setState({ documentValue });
  };

  removeCollectionItem = (index, field) => {
    const { documentValue } = this.state;
    const widgets = documentValue.widgets || [];
    const currentWidget = widgets[index];
    currentWidget[field].splice(index, 1);
    widgets[index] = currentWidget;
    documentValue.widgets = widgets;
    this.setState({ documentValue });
  };

  updateWidgetValue = (
    index,
    field,
    value,
    collectionIndex,
    collectionName
  ) => {
    const { documentValue } = this.state;
    const widgets = documentValue.widgets || [];
    const currentWidget = widgets[index];

    if (collectionIndex !== null && collectionIndex !== undefined) {
      currentWidget[collectionName] = currentWidget[collectionName] || [];
      currentWidget[collectionName][collectionIndex][field] = value;
    } else {
      currentWidget[field] = value;
    }

    widgets[index] = currentWidget;
    documentValue.widgets = widgets;
    this.setState({ documentValue });
  };

  renderConfiguration = (c, ci, w, i, collectionIndex, collectionName) => {
    const paddingLeft = collectionIndex !== null ? 10 : 0;
    const value = w[c.name];

    if (c.name === 'accountId') {
      return (
        <React.Fragment key={ci} style={{ paddingLeft }}>
          <br />
          <AccountPicker
            value={value}
            onChange={(e, a) =>
              this.updateWidgetValue(
                i,
                'accountId',
                a,
                collectionIndex,
                collectionName
              )
            }
          />
        </React.Fragment>
      );
    } else if (c.type === 'nrql') {
      return (
        <TextField
          key={ci}
          placeholder="SELECT count(*) FROM Transaction"
          label={c.title}
          info={c.description || undefined}
          value={value}
          style={{ width: '100%', paddingLeft }}
          onChange={e =>
            this.updateWidgetValue(
              i,
              c.name,
              e.target.value,
              collectionIndex,
              collectionName
            )
          }
        />
      );
    } else if (c.type === 'boolean') {
      return (
        <Switch
          key={ci}
          checked={value}
          info={c.description || undefined}
          label={c.title}
          style={{ paddingLeft }}
          onChange={e =>
            this.updateWidgetValue(
              i,
              c.name,
              e.target.checked,
              collectionIndex,
              collectionName
            )
          }
        />
      );
    } else if (c.type === 'number') {
      return (
        <TextField
          key={ci}
          placeholder="Enter a number"
          info={c.description || undefined}
          label={c.title}
          value={value}
          style={{ width: defaultFormWidth, paddingLeft }}
          onChange={e =>
            this.updateWidgetValue(
              i,
              c.name,
              e.target.value,
              collectionIndex,
              collectionName
            )
          }
        />
      );
    } else if (c.type === 'string') {
      return (
        <TextField
          key={ci}
          info={c.description || undefined}
          label={c.title}
          value={value}
          style={{ width: defaultFormWidth, paddingLeft }}
          onChange={e =>
            this.updateWidgetValue(
              i,
              c.name,
              e.target.value,
              collectionIndex,
              collectionName
            )
          }
        />
      );
    } else if (c.type === 'enum') {
      return (
        <Select
          key={ci}
          info={c.description || undefined}
          label={c.title}
          style={{ width: defaultFormWidth, paddingLeft }}
          value={value}
          onChange={(e, value) =>
            this.updateWidgetValue(
              i,
              c.name,
              value,
              collectionIndex,
              collectionName
            )
          }
        >
          {c.items.map((item, ii) => {
            return (
              <SelectItem key={ii} value={item.value}>
                {item.title}
              </SelectItem>
            );
          })}
        </Select>
      );
    } else if (c.type === 'collection') {
      return (
        <React.Fragment key={ci}>
          <h4 type={HeadingText.TYPE.HEADING_4}>
            {c.title} - {(value || []).length}
          </h4>

          <Button
            onClick={() => this.addCollectionItem(i, c.name)}
            type={Button.TYPE.PRIMARY}
            iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS}
            sizeType={Button.SIZE_TYPE.SMALL}
            spacingType={[HeadingText.SPACING_TYPE.NONE]}
          >
            Add item
          </Button>

          {(value || []).map((v, valueIndex) => {
            return (
              <>
                {c.items.map((item, ii) => {
                  return (
                    <React.Fragment key={ii}>
                      {this.renderConfiguration(
                        item,
                        `${ci}_${valueIndex}_${ii}`,
                        item,
                        i,
                        valueIndex,
                        c.name
                      )}
                    </React.Fragment>
                  );
                })}
                <Button
                  type={Button.TYPE.DESTRUCTIVE}
                  sizeType={Button.SIZE_TYPE.SMALL}
                  spacingType={[HeadingText.SPACING_TYPE.NONE]}
                  onClick={() => this.removeCollectionItem(i, c.name)}
                >
                  Remove item
                </Button>
                <hr className="solid" />
              </>
            );
          })}
        </React.Fragment>
      );
    }

    return <React.Fragment key={ci} />;
  };

  render() {
    const {
      documentValue,
      stage,
      checkingDocument,
      savingDocument
    } = this.state;
    const { accountId, documentId } = this.props;
    const errors = [];
    if (!accountId) errors.push('Account not selected');
    if (!documentId || !documentId.trim())
      errors.push('Document ID not supplied');

    const columns = documentValue?.columns || 1;
    const widgets = documentValue?.widgets || [];

    return (
      <div style={{ padding: '10px' }}>
        <h1>Edit Mode</h1> <br />
        <h3>Note: Disable edit mode before adding to your dashboard.</h3>
        <hr className="solid" />
        {errors.length > 0 ? (
          <>
            <h3>Errors:</h3>
            {errors.map((e, i) => (
              <h4 key={i}>{e}</h4>
            ))}
          </>
        ) : (
          <>
            <h4>Selected Document ID: {documentId}</h4>
            <Button
              onClick={() => this.checkDocument(accountId, documentId)}
              type={Button.TYPE.PRIMARY}
              iconType={Button.ICON_TYPE.DOCUMENTS__DOCUMENTS__NOTES__A_ADD}
              loading={checkingDocument}
            >
              {stage === 'documentChecked' ? 'Re-check' : 'Check'} Document
            </Button>
            &nbsp;
            <br /> <br /> <hr className="solid" />
            {stage === 'documentChecked' && (
              <>
                <Form>
                  <TextField
                    placeholder="Enter a number"
                    label="Columns to split the widget into (default: 1)"
                    style={{ width: defaultFormWidth }}
                    value={columns}
                    onChange={e => {
                      documentValue.columns = e.target.value;
                      this.setState({ documentValue });
                    }}
                  />
                </Form>
                <hr className="solid" />
                <h4>Configured Widgets: {widgets.length}</h4>
                <Button
                  onClick={() => this.addWidget()}
                  type={Button.TYPE.PRIMARY}
                  iconType={Button.ICON_TYPE.INTERFACE__SIGN__PLUS}
                  loading={checkingDocument}
                >
                  Add widget
                </Button>
                &nbsp;
                <Button
                  onClick={() => this.saveDocument()}
                  type={Button.TYPE.PRIMARY}
                  iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK}
                  loading={savingDocument}
                  disabled={widgets.length === 0}
                >
                  Save configuration
                </Button>
                {widgets.map((w, i) => {
                  return (
                    <React.Fragment key={i}>
                      <Form>
                        {configuration.map((c, ci) => {
                          return this.renderConfiguration(c, ci, w, i, null);
                        })}

                        <Button
                          type={Button.TYPE.DESTRUCTIVE}
                          sizeType={Button.SIZE_TYPE.SMALL}
                          spacingType={[
                            HeadingText.SPACING_TYPE.EXTRA_LARGE,
                            HeadingText.SPACING_TYPE.NONE
                          ]}
                          onClick={() => this.removeWidget(i)}
                        >
                          Remove widget
                        </Button>
                      </Form>
                      <hr className="solid" />
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    );
  }
}
