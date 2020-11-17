import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

interface Props {
  controller: GaugesController,
  size?: number
};
interface State {}

//TODO docs
class LedGauge extends Component<Props, State> {
  static NAME = "LED";

  canvasRef: React.RefObject<HTMLCanvasElement>;

  gauge: any;
  size: number;

  constructor(props: Props) {
    super(props);

    this.canvasRef = React.createRef();
    this.size = this.props.size ? this.props.size : 25;

    this.setTitle = this.setTitle.bind(this);
    this.setLedColor = this.setLedColor.bind(this);
    this.setLedOnOff = this.setLedOnOff.bind(this);
    this.blink = this.blink.bind(this);

    props.controller.subLed(
      LedGauge.NAME,
      {
        setTitle: this.setTitle,
        setLedColor: this.setLedColor,
        setLedOnOff: this.setLedOnOff,
        blink: this.blink
      }
    );
  }

  //TODO docs
  setTitle(newTitle: string) {
    if(this.canvasRef.current)
      this.canvasRef.current.title = newTitle;
  }

  //TODO docs
  //FIXME set params type
  setLedColor(newColour: any) {
      if (this.gauge) {
        this.gauge.setLedColor(newColour);
      }
  }

  //TODO docs
  //FIXME set params type
  setLedOnOff(onState: any) {
      if (this.gauge) {
        this.gauge.setLedOnOff(onState);
      }
  }

  //TODO docs
  //FIXME set params type
  blink(blinkState: any) {
      if (this.gauge) {
        this.gauge.blink(blinkState);
      }
  }

  componentDidMount() {
    if(this.canvasRef.current) {
      this.gauge = new steelseries.Led(
        this.canvasRef.current,
        {
            ledColor: steelseries.LedColor.GREEN_LED,
            size    : this.size
        })
    }
  }

  render() {
    return <canvas ref={this.canvasRef} width={this.size} height={this.size}></canvas>
  }
}

export default LedGauge;