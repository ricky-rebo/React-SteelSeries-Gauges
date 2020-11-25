import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

//TODO docs
class StatusScrollerGauge extends Component<Props, State> {
  static NAME = "STATUS_SCROLLER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  gauge: any;
  params: any;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = {
      value: props.controller.lang.statusStr
    }

    this.params = {
      width            : props.width,
      height           : props.height ? props.height : 25,
      lcdColor         : props.controller.gaugeGlobals.lcdColour,
      unitStringVisible: false,
      value            : this.state.value,
      digitalFont      : props.controller.config.digitalForecast,
      valuesNumeric    : false,
      autoScroll       : true,
      alwaysScroll     : false
    }

    this.update = this.update.bind(this);
    props.controller.subscribe(StatusScrollerGauge.NAME, this.update);
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new steelseries.DisplaySingle(this.canvasRef.current, this.params);
    }
  }

  async update({ forecast }: { forecast: string }) {
    if(forecast !== undefined)
      this.setState({ value: forecast });
  }

  componentDidUpdate() {
    if(this.gauge)
      this.gauge.setValue(this.state.value);
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
  value: string
}

export default StatusScrollerGauge;