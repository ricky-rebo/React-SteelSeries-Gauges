import { ControllerConfig, DisplayUnits, StatusDef, /*GaugeConfig,*/ StatusType } from "./types";
import { LedColor } from "steelseries";


export const CONTROLLER_DEF: ControllerConfig = {
  realTimeUrl: '',

  realtimeInterval   : 15,
  stationTimeout     : 3,
  pageUpdateLimit    : 20,

  useCookies         : true
}

//TODO remove? (usare units di data?)
export const DISPLAY_UNITS: DisplayUnits = {
  temp   : "°C",
  rain   : "mm",
  press  : "hPa",
  wind   : "km/h",
  windrun: "km",
  cloud  : "m"
}

export const Status: Record<string, StatusDef> = {
  Loading: {
    type: StatusType.LOADING,

    ledColor: LedColor.GREEN_LED,
    ledState: "blink",
    ledTitle: '',

    statusMsg: '',

    timerState: false,
    timerReset: -1
  },
  OK: {
    type: StatusType.OK,

    ledColor: LedColor.GREEN_LED,
    ledState: "on",
    ledTitle: '',

    statusMsg: '',

    timerState: true,
    timerReset: -1
  },
  Warning: {
    type: StatusType.WARNING,

    ledColor: LedColor.ORANGE_LED,
    ledState: "blink",
    ledTitle: '',

    statusMsg: '',

    timerState: true,
    timerReset: -1
  },

  Error: {
    type: StatusType.ERROR,

    ledColor: LedColor.RED_LED,
    ledState: "off",
    ledTitle: '',

    statusMsg: '',

    timerState: false,
    timerReset: 0
  }
}