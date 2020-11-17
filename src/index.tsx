import * as React from 'react'
import styles from './styles.module.css'

import GaugesController from './gauges-controller';
import TempGauge from './gauges/temp';
import GaugeSize from './style/gaugeSize';
import StatusScrollerGauge from './gauges/status-scroller';
import LedGauge from './gauges/led';
import StatusTimerGauge from './gauges/status-timer';
import DewGauge from './gauges/dew';
import HumGauge from './gauges/hum';
import UVGauge from './gauges/uv';

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
        <div style={{ marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          <div>
            <LedGauge controller={this.controller} />
            <StatusScrollerGauge controller={this.controller} width={550} /> &nbsp;
            <StatusTimerGauge controller={this.controller} width={70} />
          </div>
          <div>
            <TempGauge controller={this.controller} size={GaugeSize.Sml} />
            <DewGauge controller={this.controller} size={GaugeSize.Sml} />
            <HumGauge controller={this.controller} size={GaugeSize.Sml} />
            <UVGauge controller={this.controller} size={GaugeSize.Sml} />
          </div>
        </div>
        
      </div>
    )
  }

}

export { ExampleComponent };
