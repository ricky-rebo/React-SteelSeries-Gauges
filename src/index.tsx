import * as React from 'react'
import styles from './styles.module.css'

import GaugesController from './controller/gauges_controller';
import TempGauge from './gauges/temp';
import GaugeSize from './style/gaugeSize';
import StatusScrollerGauge from './gauges/status-scroller';
import LedGauge from './gauges/led';
import StatusTimerGauge from './gauges/status-timer';
import HumGauge from './gauges/hum';
import RainGauge from './gauges/rain';
import RainRateGauge from './gauges/rain-rate';
import UVGauge from './gauges/uv';
import SolarGauge from './gauges/solar';
import CloudBaseGauge from './gauges/cloudbase';
import BaroGauge from './gauges/baro';
import WindDirGauge from './gauges/wind-dir';
import WindSpeedGauge from './gauges/wind-speed';
import WindRoseGauge from './gauges/wind-rose';

import { WProgram } from './controller/data-types';
import { UNITS } from './controller/defaults';

// @ts-ignore
import LANG from './controller/language.js';
import { DewTemp } from './gauges/data-types';
import DewGauge from './gauges/dew';

class ExampleComponent extends React.Component<{ text: string }, {}> {
  constructor(props: { text: string }) { super(props); }

  render() {
    return <div className={styles.test}>Example Component: {this.props.text}</div>
  }

}

const Gauge = {
  Led: LedGauge,
  StatusScroller: StatusScrollerGauge,
  Timer: StatusTimerGauge,

  Temp: TempGauge,
  Dew: DewGauge,
  Hum: HumGauge,

  Baro: BaroGauge,
  Rain: RainGauge,
  RainRate: RainRateGauge,

  UV: UVGauge,
  Solar: SolarGauge,
  CloudBase: CloudBaseGauge,

  WindSpeed: WindSpeedGauge,
  WindDir: WindDirGauge,
  WindRose: WindRoseGauge
}

const Type = {
  Program: {...WProgram},
  DewDisplay: {...DewTemp}
}

export { ExampleComponent, Gauge, GaugeSize, GaugesController, Type, LANG as Lang, UNITS as Units};
