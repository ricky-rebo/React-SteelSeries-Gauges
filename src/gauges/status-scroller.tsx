import React, { Component } from 'react';
import GaugesController from '../controller/controller';
// @ts-ignore
import { DisplaySingle } from "steelseries";
import { RtData, StatusDef } from '../controller/types';


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
      lcdColor         : props.controller.gaugeConfig.lcdColor,
      unitStringVisible: false,
      value            : this.state.value,
      digitalFont      : false,
      valuesNumeric    : false,
      autoScroll       : true,
      alwaysScroll     : false
    }

    this.dataUpdate = this.dataUpdate.bind(this);
    this.statusUpdate = this.statusUpdate.bind(this);
    props.controller.subscribe(StatusScrollerGauge.NAME, this.dataUpdate, this.statusUpdate);
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new DisplaySingle(this.canvasRef.current, this.params);
    }
  }

  async dataUpdate({ forecast }: RtData) {
    this.setState({ value: forecast });
  }

  async statusUpdate({ statusMsg }: StatusDef) {
    if(statusMsg !== "")
      this.setState({ value: statusMsg });
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