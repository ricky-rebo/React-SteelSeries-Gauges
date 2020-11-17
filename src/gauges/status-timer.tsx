import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

interface Props {
  controller: GaugesController,
  width: number,
  height?: number
};
interface State {
  count: number
}

//TODO docs
class StatusTimerGauge extends Component<Props, State> {
  static NAME = "STATUS_TIMER";

  gauge: any;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  params: { width: number, height: number };
  tickTockInterval: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = { count: 1 }

    this.params = {
      width: props.width,
      height: props.height ? props.height : 25
    }

    this.start = this.start.bind(this);
    this.tick = this.tick.bind(this);
    this.reset = this.reset.bind(this);
    this.stop = this.stop.bind(this);

    props.controller.subStatusTimer(
      StatusTimerGauge.NAME,
      {
        start: this.start,
        tick: this.tick,
        reset: this.reset,
        stop: this.stop
      }
    )
  }

  //TODO docs
  start() {
    this.tickTockInterval = setInterval(this.tick, 1000);
  }

  //TODO docs
  tick() {
    this.setState({ count: (this.state.count - 1) });
  }

  //TODO docs
  reset(val: number) {
    this.setState({ count: val });
  }

  //TODO docs
  stop() {
    clearInterval(this.tickTockInterval);
  }

  componentDidMount() {
    if(this.canvasRef) {
      this.gauge = new steelseries.DisplaySingle(
        this.canvasRef.current,
        {
          width            : this.params.width,
          height           : this.params.height,
          lcdColor         : this.props.controller.gaugeGlobals.lcdColour,
          lcdDecimals      : 0,
          unitString       : this.props.controller.lang.timer,
          unitStringVisible: true,
          digitalFont      : this.props.controller.config.digitalFont,
          value            : this.state.count
        });
    }
  }

  componentDidUpdate() {
    if(this.gauge) {
      this.gauge.setValue(this.state.count);
    }
  }

  render() {
    return (
      <canvas ref={this.canvasRef}
        width={this.params.width}
        height={this.params.height}
      ></canvas>
    )
  }
}

export default StatusTimerGauge;