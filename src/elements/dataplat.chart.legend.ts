import { Chart } from '../core/dataplat.chart.core';
/// <reference path="./types/main.d.ts" />

export class ChartLegend {
	_chart: Chart;
	_legend: DPChartLegend;
	_prevPosition: any;

	textWidth: number;
	lineWidth: number;
	paddingText: number;
	paddingBetween: number;

	_baseline: string;

	_nullLegends: Array<any>;

	constructor(chart: Chart) {
		this._chart = chart;
		this._legend = {
			fontSize: 14,
			fontFamily: 'Ubuntu, sans-serif',
			fontWeight: 'normal',
			fontColor: '#3A3A3A',
			fontStyle: 'normal',
			verticalAlign: 'center',
			horizontalAlign: 'left'
		};

		this.textWidth = 10;
		this.lineWidth = 20;
		this.paddingText = 5;
		this.paddingBetween = 10;
		this._baseline = 'middle';

		this._nullLegends = [];
	}

	changePaddings() {
		const size = this._getLegendSize();

		const vert = this._legend.verticalAlign;
		const hoz = this._legend.horizontalAlign;

		if (vert === 'top') {
			this._chart._padding += this._legend.fontSize!;
		}

		if (vert === 'center') {
			if (hoz === 'left') {
				this._chart._paddingLeft += size;
			} else if (hoz === 'right') {
				this._chart._paddingRight += size;
			} else if (hoz === 'center') {
				this._chart._padding += this._legend.fontSize!;
			}
		}

		if (vert === 'bottom') {
			this._chart._paddingBottom += this._legend.fontSize! + this.paddingBetween;
		}
	}

	draw() {
		if (!this._chart._data) return;

		const ctx = this._chart._ctx;

		if (!ctx) return;

		ctx.lineWidth = 5;

		const size = this._getLegendSize();

		for (let i = 0; i < this._chart._data.length; i++) {
			ctx.beginPath();
			ctx.save();

			const model = this._chart._data[i];

			let text = 'Legend';
			if (model.legendText) {
				text = model.legendText!;
			} else if (model.name) {
				text = model.name;
			}

			ctx.fillStyle = model.lineColor || this._chart._defaultColor;

			this.textWidth =
				+this._chart._ctx.measureText(text).width + this.lineWidth + this.paddingText + this.paddingBetween;

			let [x, y] = this._calcPosition(i, size);

			let yAttribute = y;

			if (this._baseline === 'bottom') {
				yAttribute = y - this._legend.fontSize! / 2;
			}

			ctx.arc(x + this.lineWidth / 2, yAttribute, 3, 0, Math.PI * 2);

			ctx.fillText(text, x + this.lineWidth + this.paddingText, y);

			ctx.moveTo(x, yAttribute);
			ctx.lineTo(x + this.lineWidth, yAttribute);
			ctx.lineWidth = 3;
			ctx.fill();
			ctx.strokeStyle = model.lineColor || this._chart._defaultColor;

			ctx.stroke();
			ctx.restore();
			ctx.closePath();
		}

		if (!this._nullLegends.length) return;

		for (let i = this._chart._data.length; i < this._nullLegends.length + this._chart._data.length; i++) {
			ctx.beginPath();
			ctx.save();

			const name = this._nullLegends[i - this._chart._data.length]?.name;
			const color = this._nullLegends[i - this._chart._data.length]?.color;

			if (!name) continue;

			ctx.fillStyle = color || this._chart._defaultColor;

			this.textWidth =
				+this._chart._ctx.measureText(name).width + this.lineWidth + this.paddingText + this.paddingBetween;

			const [x, y] = this._calcPosition(i, size);

			ctx.fillText(name, x + this.lineWidth + this.paddingText, y);

			ctx.setLineDash([3, 5]);

			ctx.moveTo(x, y);
			ctx.lineTo(x + this.lineWidth, y);
			ctx.lineWidth = 3;
			ctx.strokeStyle = color || this._chart._defaultColor;

			ctx.stroke();
			ctx.restore();
			ctx.closePath();
		}
	}

	private _getLegendSize() {
		const data = this._chart._data;

		this._chart._ctx.font = `${this._legend.fontStyle} ${this._legend.fontWeight} ${this._legend.fontSize}px ${this._legend.fontFamily}, sans-serif`;

		let width = 0;

		this._nullLegends = [];

		for (let i = 0; i < data.length; i++) {
			const model = data[i];

			let text = 'Legend';
			if (model.legendText) {
				text = model.legendText!;
			} else if (model.name) {
				text = model.name;
			}

			if (model.nullData?.showLegend && this._chart._isNullData) {
				this._nullLegends.push({
					type: model.nullData.lineType || 'dash',
					name: model.nullData.nameLegend,
					color: model.nullData.lineColor || model.lineColor
				});
			}

			const widthText = +this._chart._ctx.measureText(text).width;

			width += widthText + this.lineWidth + this.paddingText;

			if (i !== data.length - 1) width += this.paddingBetween;
		}

		if (this._nullLegends?.length) {
			for (let nullObj of this._nullLegends) {
				let widthText = 0;
				if (nullObj.name?.length) {
					widthText = +this._chart._ctx.measureText(nullObj.name).width;
				}

				width += widthText + this.lineWidth + this.paddingText;
			}
		}

		return width;
	}

	private _calcPosition(index: number, size: number) {
		let x = 0;
		let y = 0;

		const navigatorHeight = +this._chart._Slider.height!;
		const vert = this._legend.verticalAlign;
		const hoz = this._legend.horizontalAlign;

		if (!hoz || !vert) return [x, y];

		let titleSize = this._getTitleSize(hoz, vert);

		if (vert === 'top') {
			if (hoz === 'center') {
				if (index < 1) x = this._chart._dpiWidth / 2 - size / 2;
			} else if (hoz === 'left') {
				if (index < 1) x = this.paddingBetween;
			} else {
				if (index < 1) x = this._chart._dpiWidth - size - this.paddingBetween;
			}
			if (index > 0) x = this._prevPosition.x + this._prevPosition.width;

			let axis = Array.isArray(this._chart._axisY) ? this._chart._axisY[0] : this._chart._axisY;
			this._chart._ctx.textBaseline = 'bottom';
			this._baseline = 'bottom';
			y = this._chart._padding - axis.label?.fontSize! - 5;
		} else if (vert === 'bottom') {
			if (hoz === 'center') {
				if (index < 1) x = this._chart._dpiWidth / 2 - size / 2;
			} else if (hoz === 'left') {
				if (index < 1) x = this.paddingBetween;
			} else {
				if (index < 1) x = this._chart._dpiWidth - size - this.paddingBetween;
			}
			if (index > 0) x = this._prevPosition.x + this._prevPosition.width;
			this._chart._ctx.textBaseline = 'bottom';
			this._baseline = 'bottom';
			if (titleSize) titleSize += 7;
			y = this._chart._dpiHeight - this.paddingBetween - navigatorHeight - titleSize;
		} else {
			if (hoz === 'left') {
				if (index < 1) x = this.paddingBetween + titleSize;
				y = this._chart._dpiHeight / 2;
			} else if (hoz === 'right') {
				if (index < 1) x = this._chart._dpiWidth - size - this.paddingBetween - titleSize;
				y = this._chart._dpiHeight / 2;
			} else if (hoz === 'center') {
				if (index < 1) x = this._chart._dpiWidth / 2 - size / 2;
				y = this._chart._padding - this.paddingBetween * 1.5;
			}
			if (index > 0) x = this._prevPosition.x + this._prevPosition.width;
			this._chart._ctx.textBaseline = 'middle';
			this._baseline = 'middle';
		}

		this._prevPosition = { width: this.textWidth, x, y };

		return [x, y];
	}

	private _getTitleSize(hoz: string, vert: string) {
		if (!this._chart._chartTitle.text) return 0;

		const titleFonteSize = this._chart._chartTitle.fontSize || 0;

		const titleVert = this._chart._chartTitle.verticalAlign;
		const titleHoz = this._chart._chartTitle.horizontalAlign;

		if (hoz === 'left' && vert === 'center' && titleHoz === 'left' && titleVert === 'center') {
			return titleFonteSize;
		} else if (hoz === 'right' && vert === 'center' && titleHoz === 'right' && titleVert === 'center') {
			return titleFonteSize;
		} else if (vert === 'bottom' && titleVert === 'bottom') {
			return titleFonteSize;
		} else if (titleVert === 'top' && vert === 'top') {
			return titleFonteSize;
		}

		return 0;
	}
}
