import { Chart } from '../core/dataplat.chart.core';

export class ChartDate {
	private _chart: Chart;

	private _Date: Date;

	private _format: string;
	private _date: number;
	private _year: number;
	private _month: number;
	private _day: number;
	private _hours: number;
	private _minutes: number;
	private _seconds: number;

	private _shortMonths: Array<string>;
	private _longMonths: Array<string>;

	constructor(chart: Chart) {
		this._format = '';
		this._chart = chart;

		this._Date = new Date();
		this._date = this._Date.getDate();
		this._year = this._Date.getFullYear();
		this._month = this._Date.getMonth() + 1;
		this._day = this._Date.getDay() + 1;
		this._hours = this._Date.getHours();
		this._minutes = this._Date.getMinutes();
		this._seconds = this._Date.getSeconds();

		this._shortMonths = [];
		this._longMonths = [];
		this._initMonths();
	}

	private _initDate(date: Date) {
		this._Date = date;
		this._date = this._Date.getDate();
		this._year = this._Date.getFullYear();
		this._month = this._Date.getMonth() + 1;
		this._day = this._Date.getDay() + 1;
		this._hours = this._Date.getHours();
		this._minutes = this._Date.getMinutes();
		this._seconds = this._Date.getSeconds();
	}

	private _initMonths() {
		this._shortMonths = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
		this._longMonths = [
			'Январь',
			'Февраль',
			'Март',
			'Апрель',
			'Май',
			'Июнь',
			'Июль',
			'Август',
			'Сентябрь',
			'Октябрь',
			'Ноябрь',
			'Декабрь'
		];
	}

	_getTimeStampDate(format: string, value: number) {
		const date = new Date(value);
		if (!isNaN(Date.parse(date.toString()))) {
			this._initDate(date);
			return this._getStringDate(format, date);
		}
	}

	_getStringDate(format: string, date: Date | string) {
		if (!format) format = this._format;

		this._checkCorrectDate();

		return format
			.replace(/\bYYYY\b/, `${this._year}`)
			.replace(/\byyyy\b/, `${this._year}`)
			.replace(/\bDD\b/, `${this._date}`)
			.replace(/\bdd\b/, `${this._date}`)
			.replace(/\bMM\b/, `${this._month}`)
			.replace(/\bMMM\b/, `${this._shortMonths[this._month]}`)
			.replace(/\bMMMM\b/, `${this._longMonths[this._month]}`)
			.replace(/\bHH\b/, `${this._hours}`)
			.replace(/\bmm\b/, `${this._minutes}`)
			.replace(/\bss\b/, `${this._seconds}`);
	}

	private _checkCorrectDate() {
		if (this._date < 10) {
			let date = '0' + this._date;
			this._date = Number(date);
		}

		if (this._month < 10) {
			let month = '0' + this._month;
			this._month = Number(month);
		}

		if (this._hours < 10 && typeof this._hours === 'number') {
			let hours = '0' + this._hours;
			this._hours = Number(hours);
		}

		if (this._minutes < 10 && typeof this._minutes === 'number') {
			let minutes = '0' + this._minutes;
			this._minutes = Number(minutes);
		}

		if (this._seconds < 10 && typeof this._seconds === 'number') {
			let seconds = '0' + this._seconds;
			this._seconds = Number(seconds);
		}
	}
}
