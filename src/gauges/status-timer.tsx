import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

//TODO docs
class StatusTimerGauge extends Component<Props, State> {
  static NAME = "STATUS_TIMER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  params: any;
  gauge: any;

  tickTockInterval: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = { count: 1 }

    this.params = {
      width            : props.width,
      height           : props.height ? props.height : 25,
      lcdColor         : props.controller.gaugeGlobals.lcdColour,
      lcdDecimals      : 0,
      unitString       : props.controller.lang.timer,
      unitStringVisible: true,
      digitalFont      : props.controller.config.digitalFont,
      value            : this.state.count
    }

    this.update = this.update.bind(this);
    this._tick = this._tick.bind(this);
    props.controller.subscribe(StatusTimerGauge.NAME, this.update);
  }

  componentDidMount() {
    if(this.canvasRef) {
      this.gauge = new steelseries.DisplaySingle(this.canvasRef.current, this.params);
    }
  }

  async update({ statusTimerAction, statusTimerVal }: any) {
    if(statusTimerAction !== undefined) {
      if(statusTimerAction === 'START') {
        this.tickTockInterval = setInterval(this._tick, 1000);
      }
      else if(statusTimerAction === 'RESET' && statusTimerVal !== undefined) {
        this.setState({ count: statusTimerVal });
      }
      else if(statusTimerAction === 'STOP') {
        clearInterval(this.tickTockInterval);
      }
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