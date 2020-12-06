import React, { Component } from 'react';
import GaugesController from '../controller/gauges_controller';
// @ts-ignore
import { DisplaySingle } from "steelseries";

//TODO docs
class StatusTimerGauge extends Component<Props, State> {
  static NAME = "STATUS_TIMER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  params: any;
  gauge: any;

  tickTockInterval: NodeJS.Timeout|undefined;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = { count: 1 }

    this.params = {
      width            : props.width,
      height           : props.height ? props.height : 25,
      lcdColor         : props.controller.gaugeConfig.lcdColor,
      lcdDecimals      : 0,
      unitString       : props.controller.lang.timer,
      unitStringVisible: true,
      digitalFont      : props.controller.gaugeConfig.digitalFont,
      value            : this.state.count
    }

    this.update = this.update.bind(this);
    this._tick = this._tick.bind(this);
    props.controller.subscribe(StatusTimerGauge.NAME, this.update, this.update);
  }

  componentDidMount() {
    if(this.canvasRef) {
      this.gauge = new DisplaySingle(this.canvasRef.current, this.params);
    }
  }

  async update({ statusTimerStart, statusTimerReset, statusTimerStop }: any) {
    if(statusTimerStop !== undefined && this.tickTockInterval !== undefined) {
      clearInterval(this.tickTockInterval);
      this.tickTockInterval = undefined;
    }
    else if(statusTimerStart !== undefined && this.tickTockInterval === undefined) {
      this.tickTockInterval = setInterval(this._tick, 1000);
    }
    
    if(statusTimerReset  !== undefined) {
      this.setState({ count: statusTimerReset });
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