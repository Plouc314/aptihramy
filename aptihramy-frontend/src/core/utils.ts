// Convert percentage (0 to 100) to a color scale (red → green)
export function getPanelColor(value: number) {
    const red = Math.min(255, Math.floor((1 - value) * 255));
    const green = Math.min(255, Math.floor((value) * 255));

    return `rgb(${red}, ${green}, 110)`;
};