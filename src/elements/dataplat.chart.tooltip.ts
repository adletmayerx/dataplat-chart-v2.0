import { Chart } from '../core/dataplat.chart.core';
/// <reference path="./types/core.d.ts" />
import { ChartDate } from './dataplat.chart.date';

import { css } from '../helpers/dataplat.chart.helpers';

export class ChartToolTip {
	private readonly _chart: Chart;
	private readonly _ctx: CanvasRenderingContext2D;

	readonly Canvas: HTMLCanvasElement;

	private _tooltip: HTMLDivElement | undefined;
	private _Date: ChartDate;

	private _annotations: Array<DPChartAnnotationLine>;
	private _colorAnnotations: string;

	constructor(chart: Chart) {
		this._chart = chart;

		this.Canvas = document.createElement('canvas');
		// this.Canvas.classList.add('dp-chart-canvas')
		this._ctx = this.Canvas.getContext('2d')!;
		this._Date = new ChartDate(this._chart);

		this._annotations = [];
		this._colorAnnotations = '#FF0000';
	}

	setStylePointCanvas() {
		css(this.Canvas, { position: 'absolute' });
		css(this.Canvas, { width: this._chart._width + 'px' });
		css(this.Canvas, { height: this._chart._height + 'px' });
		css(this.Canvas, { top: 0 });
		css(this.Canvas, { left: 0 });

		this.Canvas.width = +this._chart._dpiWidth;
		this.Canvas.height = +this._chart._dpiHeight;
	}

	/**
	 * Перемещение мыши над графиком
	 * @param param0 - координаты по X and Y
	 */
	_mousemove = (e: MouseEvent) => {
		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		this._ctx.beginPath();

		this._defineToolTipItems(mouseX, mouseY);

		this._ctx.closePath();
	};

	private _defineToolTipItems(mouseX: number, mouseY: number, annotation?: boolean, props?: DPChartAnnotationLine) {
		let renderedData = this._chart._renderedData[0];

		let tooltipItems = [];

		let index = 0;
		let diff: number | null = null;
		let point: any = [];

		if (annotation) {
			for (let i = 0; i < renderedData.data.points.length; i++) {
				const [, , calcX, calcY] = renderedData.data.points[i];

				const dx = mouseX - calcX;

				if (!diff) diff = dx;

				if (dx < 0) break;

				if (diff > dx) {
					diff = dx;
					index = i;
				}
			}
		}

		if (annotation) {
			tooltipItems = this._getToolTipItems(renderedData, index, true)!;

			if (props) {
				props.label = {
					title: 'toolip',
					items: tooltipItems
				};
			}
		}

		for (let i = 0; i < renderedData.data.points.length; i++) {
			const [, , calcX, calcY] = renderedData.data.points[i];

			const dx = mouseX - calcX;
			const dy = mouseY - calcY / 2;

			if (dx * dx < this._chart._pointRadius) {
				tooltipItems = this._getToolTipItems(renderedData, i)!;

				if (!annotation) {
					this._drawXLine(calcX);
					if (this._chart._renderedData.length === 1) {
						this._drawYLine(calcY);
					}

					this._show(mouseY, mouseX, {
						title: 'toolip',
						items: tooltipItems
					});
				}
				return;
			}
		}
	}

	private _getToolTipItems(renderedData: DPChartCalcData, index: number, annotation?: boolean) {
		let tooltipItems = [];
		for (let k = 0; k < this._chart._renderedData.length; k++) {
			const countSymbols = this._chart._data[k].countSymbols || 0;

			if (k === 0) {
				this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
				this._drawAnnotations();
			}
			renderedData = this._chart._renderedData[k];

			const [pointX, pointY, x, y] = renderedData.data.points[index];

			if (!pointY) return;

			if (!annotation) {
				this._ctx.beginPath();
				this._ctx.arc(x, y, this._chart._pointRadius, 0, Math.PI * 2);
				this._ctx.fillStyle = renderedData.data.props.lineColor || '#00000';
				this._ctx.fill();
				this._ctx.closePath();
			}

			let xValue: any = pointX.toFixed(countSymbols);
			if (this._chart._data[0].xValueType === 'dateTime') {
				const format = this._chart._data[0].xValueFormat || 'dd.MM.yyyy HH:mm';
				xValue = this._Date._getTimeStampDate(format, xValue);
			}

			let name: any = renderedData.data.props.name;

			const tooltipItem = {
				xValue,
				name: `${name}`,
				value: `${pointY.toFixed(countSymbols)}`,
				lineColor: `${renderedData.data.props.lineColor}`
			};
			tooltipItems.push(tooltipItem);
		}

		return tooltipItems;
	}

	_drawXLine(x: number) {
		this._ctx.beginPath();
		const padding = this._chart._padding;
		this._ctx.setLineDash([6, 3]);
		this._ctx.moveTo(x + 0.5, padding);
		this._ctx.lineTo(x + 0.5, this._chart._dpiHeight - this._chart._paddingBottom);
		this._ctx.lineWidth = 1;
		this._ctx.globalCompositeOperation = 'destination-over';
		this._ctx.stroke();
		this._ctx.closePath();
	}

	_drawYLine(y: number) {
		this._ctx.beginPath();
		const padding = this._chart._padding + this._chart._paddingBottom;
		this._ctx.setLineDash([6, 3]);
		this._ctx.moveTo(this._chart._paddingLeft, y + 0.5);
		this._ctx.lineTo(this._chart._viewWidth + this._chart._paddingLeft, y + 0.5);
		this._ctx.globalCompositeOperation = 'destination-over';
		this._ctx.lineWidth = 1;
		this._ctx.stroke();
		this._ctx.closePath();
	}

	/** Срабатывает, когда мышь покидает пространство графика */
	_mouseleave = (e: MouseEvent) => {
		this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this._drawAnnotations();
		this._hide();
	};

	public clean() {
		this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this._annotations = [];
	}

	private _removeAnnotation = (e: MouseEvent) => {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		this._annotations = annotations.filter((model: any) => {
			if (model.mode === 'vertical') {
				if (!(mouseX >= model.mouseX - 5 && mouseX <= model.mouseX + 5)) {
					return model;
				}
			} else {
				if (!(mouseY >= model.mouseY - 5 && mouseY <= model.mouseY + 5)) {
					return model;
				}
			}
		});

		if (annotations.length !== this._annotations.length) {
			this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
			this._drawAnnotations();
		}
	};

	public onRemoveAnnotations() {
		this.Canvas.addEventListener('mousedown', this._removeAnnotation);
	}

	public offRemoveAnnotations() {
		this.Canvas.removeEventListener('mousedown', this._removeAnnotation);
	}

	_mousedown = (e: MouseEvent) => {
		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		if (mouseX > this._chart._paddingLeft && mouseX < this._chart._dpiWidth - this._chart._paddingRight) {
			this._ctx.beginPath();

			const padding = this._chart._padding;

			let moveX = mouseX + 0.5;
			let moveY = padding;
			let lineX = mouseX + 0.5;
			let lineY = this._chart._dpiHeight - this._chart._paddingBottom;
			if (this._chart._annotation.mode !== 'vertical') {
				moveX = this._chart._paddingLeft;
				moveY = mouseY + 0.5;
				lineX = this._chart._viewWidth + this._chart._paddingLeft;
				lineY = mouseY + 0.5;
			}
			this._ctx.setLineDash([0, 0]);
			this._ctx.moveTo(moveX, moveY);
			this._ctx.lineTo(lineX, lineY);

			let annotationProperties = {
				mode: this._chart._annotation.mode || 'vertical',
				mouseX,
				mouseY,
				moveX,
				moveY,
				lineX,
				lineY,
				label: {}
			} as DPChartAnnotationLine;

			this._ctx.lineWidth = 1.5;
			this._ctx.strokeStyle = this._colorAnnotations;
			this._ctx.stroke();
			this._ctx.closePath();

			this._annotations.push(annotationProperties);

			this._defineToolTipItems(mouseX, mouseY, true, annotationProperties);
		}
	};

	private _drawAnnotations() {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		for (let i = 0; i < annotations.length; i++) {
			const { mouseX, mouseY, moveX, moveY, lineX, lineY } = annotations[i];

			this._ctx.beginPath();

			this._ctx.setLineDash([0, 0]);
			this._ctx.moveTo(moveX, moveY);
			this._ctx.lineTo(lineX, lineY);

			this._ctx.lineWidth = 1.5;
			this._ctx.strokeStyle = this._colorAnnotations;
			this._ctx.stroke();
			this._ctx.closePath();
		}
	}

	private _showAnnotationLabel = (e: MouseEvent) => {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		for (let i = 0; i < annotations.length; i++) {
			const model = annotations[i];

			if (!model.label?.items?.length) return;

			const { moveX, moveY, lineX, lineY } = annotations[i];

			if (model.mode === 'vertical') {
				if (mouseX >= model.mouseX - 5 && mouseX <= model.mouseX + 5) {
					this._show(moveY, moveX, model.label!);
				}
			} else {
				if (mouseY >= model.mouseY - 5 && mouseY <= model.mouseY + 5) {
					this._show(mouseY, mouseX, model.label!);
				}
			}
		}
	};

	/**
	 * Добавляем слушатели событий для работы tooltip
	 * @returns
	 */
	_addListeners() {
		if (!this.Canvas) return;

		this.Canvas.addEventListener('mousemove', this._mousemove);
		this.Canvas.addEventListener('mouseleave', this._mouseleave);
	}

	addMousedownListener() {
		if (this._chart._annotation.enable) {
			this.Canvas.addEventListener('mousedown', this._mousedown);
			this.Canvas.removeEventListener('mousemove', this._showAnnotationLabel);
		} else {
			this.Canvas.addEventListener('mousemove', this._showAnnotationLabel);
			this.Canvas.removeEventListener('mousedown', this._mousedown);
		}
	}

	/**
	 * Проверяем, находимся ли мы над графиком
	 * @param mouse - объект, содержащий координаты мыши
	 * @param x - скорректированная координата по оси X
	 * @param length
	 * @returns
	 */
	_isOver(mouse: any, x: number, length: number, type: string) {
		if (!mouse) return false;
		const width = this._chart._viewWidth / length;
		if (Math.abs(x - mouse.x) < width / 2) {
			return true;
		}
	}

	/** Создаем tooltip */
	_createTooltip(): HTMLDivElement {
		this._tooltip = document.createElement('div');
		this._tooltip.classList.add('dp-chart-tooltip');
		this._tooltip.dataset.visible = 'false';

		return this._tooltip;
	}

	/**
	 * Устанавливаем данные для отрисовки tooltip
	 * @param data - Данные для отрисовки tooltip
	 * @returns
	 */
	_dataBound(data: DPChartTooltipData) {
		if (!this._tooltip) return;

		let list = document.createElement('ul');
		list.classList.add('dp-chart-tooltip-list');

		this._tooltip.append(list);

		let title = document.createElement('p');
		title.classList.add('dp-chart-tooltip-text');

		for (let model of data.items) {
			let item = document.createElement('li');
			item.classList.add('dp-chart-tooltip-item');

			title.innerText = model.xValue;

			let content = document.createElement('p');
			content.classList.add('dp-chart-tooltip-text');
			content.innerText = `${model.name}:`;
			if (model.lineColor) {
				content.style.color = model.lineColor;
			}

			let value = document.createElement('p');
			value.classList.add('dp-chart-tooltip-value');
			value.innerText = `${model.value}`;

			item.append(content, value);
			list.append(item);
		}

		list.prepend(title);
	}

	/**
	 * Показываем tooltip
	 * @param {top, left} - значение top and left
	 * @param data - Данные tooltip
	 * @returns - выходит из функции если элемент tooltip отсутствует
	 */
	_show(top: number, left: number, data: DPChartTooltipData) {
		if (!this._tooltip) return;

		const { height, width } = this._tooltip.getBoundingClientRect();
		this._tooltip.innerHTML = '';
		this._tooltip.removeAttribute('data-visible');
		this._dataBound(data);

		this._tooltip.style.top = top - height + 'px';
		this._tooltip.style.left = left + 30 + 'px';
	}

	/** Скрываем tooltip */
	_hide() {
		if (!this._tooltip) return;
		this._tooltip.dataset.visible = 'false';
	}
}
