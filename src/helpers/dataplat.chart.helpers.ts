/// <reference path="../types/dataplat.chart.d.ts" />

export function css(el: HTMLElement | HTMLDivElement | HTMLButtonElement, styles = {}) {
	Object.assign(el.style, styles);
}

export function initTypePoints(points: number | Array<number> | DPChartDataPoints) {
	let pointX = 0;
	let pointY = 0;
	let label = null;

	if (typeof points === 'number') {
	} else if (Array.isArray(points)) {
		pointX = points[0] || 0;
		pointY = points[1] || 0;
	} else {
		pointX = points.x || 0;
		pointY = points.y;
		label = points.label;
	}

	return { pointX, pointY, label };
}
