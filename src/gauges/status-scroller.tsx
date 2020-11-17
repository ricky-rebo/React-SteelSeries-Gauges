import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

interface Props {
  controller: GaugesController,
  width: number,
  height?: number
};
interface State {}

//TODO docs
class StatusScrollerGauge extends Component<Props, State> {
  static NAME = "STATUS_SCROLLER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  gauge: any;
  params: { width: number, height: number };

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.params = {
      width: props.width,
      height: props.height ? props.height : 25
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
      this.gauge = new steelseries.DisplaySingle(
        this.canvasRef.current, 
        {
          width            : this.params.width,
          height           : this.params.height,
          lcdColor         : this.props.controller.gaugeGlobals.lcdColour,
          unitStringVisible: false,
          value            : this.props.controller.lang.statusStr,
          digitalFont      : this.props.controller.config.digitalForecast,
          valuesNumeric    : false,
          autoScroll       : true,
          alwaysScroll     : false
        });
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

export default StatusScrollerGauge;