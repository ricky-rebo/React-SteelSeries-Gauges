import React, { Component } from 'react';
import GaugesController from '../controller/controller';
// @ts-ignore
import { DisplaySingle } from "steelseries";
import { RtData, StatusDef } from '../controller/types';


class StatusTimerGauge extends Component<Props, State> {
  static NAME = "STATUS_TIMER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  params: any;
  gauge: any;

  tickTockInterval: NodeJS.Timeout|undefined;
  lastUpdate = "";
  resetValue: number;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = { count: 0 }

    this.params = {
      width            : props.width,
      height           : props.height ? props.height : 25,
      lcdColor         : props.controller.gaugeConfig.lcdColor,
      lcdDecimals      : 0,
      unitString       : props.controller.lang.timer,
      unitStringVisible: true,
      value            : this.state.count
    }

    this.resetValue = props.controller.config.realtimeInterval;

    this.update = this.update.bind(this);
    this.statusUpdate = this.statusUpdate.bind(this);
    this._tick = this._tick.bind(this);
    props.controller.subscribe(StatusTimerGauge.NAME, this.update, this.statusUpdate);
  }

  componentDidMount() {
    if(this.canvasRef) {
      this.gauge = new DisplaySingle(this.canvasRef.current, this.params);
    }
  }

  async update({ timerReset }: RtData) {
    if(timerReset) {
      this.setState({ count: this.resetValue });
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
    //if(this.state.count > 0) {
      this.setState({ count: (this.state.count - 1) });
    /*}
    else if(this.tickTockInterval) {
      clearInterval(this.tickTockInterval);
      this.tickTockInterval = undefined;
    }*/
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
        width={this.params.width}
        height={this.params.height}
      ></canvas>
    )
  }
}

interface Props {
  controller: GaugesController,
  width: number,
  height?: number
};

interface State {
  count: number
}

export default StatusTimerGauge;