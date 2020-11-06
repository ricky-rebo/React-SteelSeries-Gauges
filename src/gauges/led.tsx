import React, { Component } from 'react';
// @ts-ignore
import steelseries from '../libs/steelseries';

type gaugeParams = {
  width: number,
  height: number
}

type Props = {};
type State = {
  gauge: object,
  instance: object,
  params: gaugeParams
}

class LedGauge extends Component<Props, State> {
  canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: any) {
    super(props);

    this.canvasRef = React.createRef();

    this.state = {
      gauge: {},
      instance: {},
      params: {
        width: 25,
        height: 25
      }
    }
  }

  setTitle(newTitle: string) {
    if(this.canvasRef.current)
      this.canvasRef.current.title = newTitle;
  }

  componentDidMount() {
    let gauge = new steelseries.Led(
        this.canvasRef.current,
        {
            ledColor: steelseries.LedColor.GREEN_LED,
            size    : this.canvasRef.current?.width
        })

    this.setState({ gauge: gauge });
  }

  render() {
    return <canvas ref={this.canvasRef} width={this.state.params.width} height={this.state.params.height}></canvas>
  }
}

export default LedGauge;