import React from 'react';
import { Card, CardBody, HeadingText } from 'nr1';

export default class EmptyState extends React.Component {
  render() {
    const { errors } = this.props;

    return (
      <Card className="EmptyState">
        <CardBody className="EmptyState-cardBody">
          <HeadingText
            spacingType={[HeadingText.SPACING_TYPE.LARGE]}
            type={HeadingText.TYPE.HEADING_3}
          >
            Status widget supports both numeric and string evaluation. String
            evaluation is performed with regex.
          </HeadingText>
          <br />
          <HeadingText
            spacingType={[HeadingText.SPACING_TYPE.LARGE]}
            type={HeadingText.TYPE.HEADING_3}
          >
            Please amend any errors and supply the base configuration...
          </HeadingText>
          <div>
            {errors.map((error, i) => {
              return (
                <HeadingText
                  key={i}
                  spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                  type={HeadingText.TYPE.HEADING_4}
                >
                  {error}
                </HeadingText>
              );
            })}
          </div>

          <HeadingText
            spacingType={[HeadingText.SPACING_TYPE.LARGE]}
            type={HeadingText.TYPE.HEADING_5}
          >
            Author: Kav P.
          </HeadingText>
        </CardBody>
      </Card>
    );
  }
}
