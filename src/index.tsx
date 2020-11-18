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
import RainGauge from './gauges/rain';
import RainRateGauge from './gauges/rain-rate';
import UVGauge from './gauges/uv';
import SolarGauge from './gauges/solar';
import CloudBaseGauge from './gauges/cloudbase';
import BaroGauge from './gauges/baro';
import WindDirGauge from './gauges/winddir';
import WindSpeedGauge from './gauges/wind-speed';
import WindRoseGauge from './gauges/rose';

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
    let dim=GaugeSize.Lrg;
    let controller=this.controller
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
            <TempGauge controller={controller} size={dim} />
            <DewGauge controller={controller} size={dim} />
            <HumGauge controller={controller} size={dim} />

            <BaroGauge controller={controller} size={dim} />
            <RainGauge controller={controller} size={dim} />
            <RainRateGauge controller={controller} size={dim} />
            
            <UVGauge controller={controller} size={dim} />
            <SolarGauge controller={controller} size={dim} />
            <CloudBaseGauge controller={controller} size={dim} />
            
            <WindSpeedGauge controller={controller} size={dim}/>
            <WindDirGauge controller={controller} size={dim}/>
            <WindRoseGauge controller={controller} size={dim}/>
          </div>
        </div>
        
      </div>
    )
  }

}

export { ExampleComponent };
