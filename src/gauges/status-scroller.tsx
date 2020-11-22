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

    this.params = {
      width            : props.width,
      height           : props.height ? props.height : 25,
      lcdColor         : props.controller.gaugeGlobals.lcdColour,
      unitStringVisible: false,
      value            : props.controller.lang.statusStr,
      digitalFont      : props.controller.config.digitalForecast,
      valuesNumeric    : false,
      autoScroll       : true,
      alwaysScroll     : false
    }

    this.setText = this.setText.bind(this);

    props.controller.subStatusScroller(
      StatusScrollerGauge.NAME,
      { setText: this.setText }
    );
  }

  //TODO docs
  setText(txt: string) {
    if(this.gauge)
      this.gauge.setValue(txt);
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new steelseries.DisplaySingle(this.canvasRef.current, this.params);
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

interface State {}

export default StatusScrollerGauge;