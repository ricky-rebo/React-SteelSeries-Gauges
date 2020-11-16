// @ts-ignore
import steelseries from '../libs/steelseries.js';

export default class GaugeUtils {
    /**
     * Creates an array of gauge sections appropriate for Celsius or Fahrenheit scales
     * @param useCelsius True id you're using Celsius, False otherwise
     */
    static createTempSections = (useCelsius: boolean) => {
        if (useCelsius) {
            return [
                steelseries.Section(-100, -35, 'rgba(195, 92, 211, 0.4)'),
                steelseries.Section(-35, -30, 'rgba(139, 74, 197, 0.4)'),
                steelseries.Section(-30, -25, 'rgba(98, 65, 188, 0.4)'),
                steelseries.Section(-25, -20, 'rgba(62, 66, 185, 0.4)'),
                steelseries.Section(-20, -15, 'rgba(42, 84, 194, 0.4)'),
                steelseries.Section(-15, -10, 'rgba(25, 112, 210, 0.4)'),
                steelseries.Section(-10, -5, 'rgba(9, 150, 224, 0.4)'),
                steelseries.Section(-5, 0, 'rgba(2, 170, 209, 0.4)'),
                steelseries.Section(0, 5, 'rgba(0, 162, 145, 0.4)'),
                steelseries.Section(5, 10, 'rgba(0, 158, 122, 0.4)'),
                steelseries.Section(10, 15, 'rgba(54, 177, 56, 0.4)'),
                steelseries.Section(15, 20, 'rgba(111, 202, 56, 0.4)'),
                steelseries.Section(20, 25, 'rgba(248, 233, 45, 0.4)'),
                steelseries.Section(25, 30, 'rgba(253, 142, 42, 0.4)'),
                steelseries.Section(30, 40, 'rgba(236, 45, 45, 0.4)'),
                steelseries.Section(40, 100, 'rgba(245, 109, 205, 0.4)')
            ];
        } else {
            return [
                steelseries.Section(-200, -30, 'rgba(195, 92, 211, 0.4)'),
                steelseries.Section(-30, -25, 'rgba(139, 74, 197, 0.4)'),
                steelseries.Section(-25, -15, 'rgba(98, 65, 188, 0.4)'),
                steelseries.Section(-15, -5, 'rgba(62, 66, 185, 0.4)'),
                steelseries.Section(-5, 5, 'rgba(42, 84, 194, 0.4)'),
                steelseries.Section(5, 15, 'rgba(25, 112, 210, 0.4)'),
                steelseries.Section(15, 25, 'rgba(9, 150, 224, 0.4)'),
                steelseries.Section(25, 32, 'rgba(2, 170, 209, 0.4)'),
                steelseries.Section(32, 40, 'rgba(0, 162, 145, 0.4)'),
                steelseries.Section(40, 50, 'rgba(0, 158, 122, 0.4)'),
                steelseries.Section(50, 60, 'rgba(54, 177, 56, 0.4)'),
                steelseries.Section(60, 70, 'rgba(111, 202, 56, 0.4)'),
                steelseries.Section(70, 80, 'rgba(248, 233, 45, 0.4)'),
                steelseries.Section(80, 90, 'rgba(253, 142, 42, 0.4)'),
                steelseries.Section(90, 110, 'rgba(236, 45, 45, 0.4)'),
                steelseries.Section(110, 200, 'rgba(245, 109, 205, 0.4)')
            ];
        }
    }

    /**
     * Create a shadow effect for the gauge using CSS
     * @param size The size of the gauge
     * @param color The color of the shadow (specified in the controller's config)
     */
    static gaugeShadow = (size: number, color: string) => {
        var offset = Math.floor(size * 0.015);
        return {
            boxShadow   : offset + 'px ' + offset + 'px ' + offset + 'px ' + color,
            borderRadius: Math.floor(size / 2) + 'px'
        };
    }
}