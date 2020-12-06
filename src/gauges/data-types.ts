import GaugesController from "../controller/gauges_controller";

export enum DewTemp { APP = 'app', 	DEW = 'dew', WND = 'wnd', HEA = 'hea', HUM = 'hum' }

export enum InOutTemp { OUT = 'out', IN = 'in'  }

export interface Props {
  controller: GaugesController,
  size: number
}