import * as React from 'react'
import styles from './styles.module.css'

import GaugesController from './gauges-controller';
import TempGauge from './gauges/temp';
import GaugeSize from './style/gaugeSize';

interface Props {
  text: string
}

class ExampleComponent extends React.Component<Props, {}> {
  controller: any;

  constructor(props: Props) {
    super(props);
    this.controller = new GaugesController();
	}
	
	componentDidMount() {
		this.controller.getRealTime();
	}

  render() {
    return (
      <div>
        <div className={styles.test}>Example Component: {this.props.text}</div>
        <TempGauge controller={this.controller} size={GaugeSize.Sml} />
      </div>
    )
  }

}

export { ExampleComponent };
