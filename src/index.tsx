import * as React from 'react'
import styles from './styles.module.css'

import GaugesController from './gauges-controller';

interface Props {
  text: string
}

class ExampleComponent extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);

	}
	
	componentDidMount() {
		let tempCtrl = new GaugesController();
		tempCtrl.getRealTime();
	}

  render() {
    return (
      <div>
        <div className={styles.test}>Example Component: {this.props.text}</div>
      </div>
    )
  }

}

export { ExampleComponent };
