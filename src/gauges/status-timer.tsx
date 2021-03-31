import React, { Component } from 'react';
import GaugesController from '../controller/controller';
// @ts-ignore
import { DisplaySingle, LcdColor } from "steelseries";
import { RtData, StatusDef } from '../controller/types';
import { LCD_COLOR } from './defaults';


class StatusTimerGauge extends Component<Props, State> {
  static NAME = "STATUS_TIMER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  gauge: DisplaySingle;

  config: Config;

  tickTockInterval: NodeJS.Timeout|undefined;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.config = {
      width: props.width,
      height: props.height ? props.height : 25,
      lcdColor: LCD_COLOR,
      resetValue: props.controller.config.realtimeInterval
    }

    this.state = {
      count: 0
    }

    this.update = this.update.bind(this);
    this.statusUpdate = this.statusUpdate.bind(this);
    this._tick = this._tick.bind(this);
    props.controller.subscribe(StatusTimerGauge.NAME, this.update, this.statusUpdate);
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new DisplaySingle(this.canvasRef.current, {
        width            : this.config.width,
        height           : this.config.height,
        lcdColor         : this.config.lcdColor,
        lcdDecimals      : 0,
        unitString       : this.props.controller.lang.timer,
        unitStringVisible: true,
        value            : this.state.count
      });
    }
  }

  async update({ timerReset }: RtData) {
    if(timerReset) {
      this.setState({ count: this.config.resetValue });
    }
  }

  async statusUpdate({ timerState, timerReset }: StatusDef) {
    if(timerState && this.tickTockInterval === undefined) {
      this.tickTockInterval = setInterval(this._tick, 1000);
    }
    else if(!timerState && this.tickTockInterval !== undefined) {
      clearInterval(this.tickTockInterval);
      this.tickTockInterval = undefined;
    }

    if(timerReset !== -1) {
      this.setState({ count: timerReset });
    }
  }

  _tick() {
    this.setState({ count: (this.state.count - 1) });
  }

  componentDidUpdate() {
    if(this.gauge) {
      this.gauge.setValue(this.state.count);
    }
  }

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        width={this.config.width}
        height={this.config.height}
      ></canvas>
    )
  }
}


interface Props {
  controller: GaugesController,
  width: number,
  height?: number
}

interface Config {
  width: number,
  height: number,
  lcdColor: LcdColor,
  resetValue: number
}

interface State {
  count: number
}

export default StatusTimerGauge;