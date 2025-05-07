// Convert percentage (0 to 100) to a color scale (red → green)
export function getPanelColor(value: number) {
    const red = Math.min(255, Math.floor((1 - value) * 255));
    const green = Math.min(255, Math.floor((value) * 255));

    return `rgb(${red}, ${green}, 110)`;
};

export function getNodeColor(matched: boolean) {
    const rootStyles = getComputedStyle(document.documentElement);
    return matched ? rootStyles.getPropertyValue("--color-matched").trim() : rootStyles.getPropertyValue("--color-unmatched").trim()
}

export function getEdgeColor(value: number) {
    const rootStyles = getComputedStyle(document.documentElement);

    if (value <= 0.25) return rootStyles.getPropertyValue("--color-red").trim();
    if (value <= 0.5) return rootStyles.getPropertyValue("--color-orange").trim();
    if (value <= 0.75) return rootStyles.getPropertyValue("--color-yellow").trim();


    return rootStyles.getPropertyValue("--color-green").trim();
}