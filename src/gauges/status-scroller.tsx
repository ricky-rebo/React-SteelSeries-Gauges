import React, { Component } from 'react';
import GaugesController from '../controller/controller';
import { DisplaySingle, LcdColor } from "steelseries";
import { RtData, StatusDef } from '../controller/types';
import { LCD_COLOR } from './defaults';


class StatusScrollerGauge extends Component<Props, State> {
  static NAME = "STATUS_SCROLLER";

  canvasRef: React.RefObject<HTMLCanvasElement>;
  gauge: DisplaySingle;

  config: Config;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();

    this.config = {
      lcdColor: LCD_COLOR,
      width: props.width,
      height: props.height ? props.height : 25
    }

    this.state = {
      value: props.controller.lang.statusStr
    }

    this.dataUpdate = this.dataUpdate.bind(this);
    this.statusUpdate = this.statusUpdate.bind(this);
    props.controller.subscribe(StatusScrollerGauge.NAME, this.dataUpdate, this.statusUpdate);
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new DisplaySingle(this.canvasRef.current, {
        width            : this.props.width,
        height           : this.props.height ? this.props.height : 25,
        lcdColor         : this.config.lcdColor,
        unitStringVisible: false,
        value            : this.state.value,
        digitalFont      : false,
        valuesNumeric    : false,
        autoScroll       : true,
        alwaysScroll     : false
      });
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
};

interface Config {
  lcdColor: LcdColor,
  width: number,
  height: number
}

interface State {
  value: string
}

export default StatusScrollerGauge;