export default function getData(limit: number, type: string, isData: boolean = false) {
	if (type === 'line' || type === 'line-null' || type === 'scatter') {
		const data = chooseData(limit, type);

		// if (isData) return data;

		const model = {
			type: type,
			name: 'Test line',
			lineColor: '#3d9ad8',
			lineWidth: 3,
			lineType: 'solid',
			showLegend: true,
			legendText: 'Line Legend',
			dataPoints: data,
			fillArea: false,
			xValueType: '',
			marker: {
				enabled: false,
				size: 10,
				type: 'triangle'
			},
			nullData: {
				lineType: 'dash',
			},
			stepped: false,
			spline: false,
		} as DPChartDataSeries

		if (type === 'line-null') {
			model.xValueType = 'dateTime'
			model.xValueFormat = 'dd MMM HH:mm'
		} 

		return [ model ];
	} else  {
		return chooseData(limit, type);
	}
}

function chooseData(limit: number, type: string) {
	let data: Array<any> = [];
	if (type === 'line') {
		let y = 100;
		for (var i = 0; i < limit; i += 1) {
			y += Math.round(Math.random() * 10 - 5);
			data.push({
				x: i,
				y: y
			});
		}
	} else if (type === 'line-null') {
		data = [
			{ x: 1501048673000, y: 35.939,  },
			{ x: 1501052273000, y: 40.896,  },
			{ x: 1501055873000, y: 56.625,  },
			{ x: 1501059473000, y: null,  },
			{ x: 1501063073000, y: 20.376,  },
			{ x: 1501066673000, y: 19.774,  },
			{ x: 1501070273000, y: 23.508,  },
			{ x: 1501073873000, y: 18.577,  },
			{ x: 1501077473000, y: 15.918,  },
			{ x: 1501081073000, y: null,  }, // Null Data
			{ x: 1501084673000, y: 10.314,  },
			{ x: 1501088273000, y: 10.574,  },
			{ x: 1501091873000, y: 14.422,  },
			{ x: 1501095473000, y: 18.576,  },
			{ x: 1501099073000, y: 22.342,  },
			{ x: 1501102673000, y: 22.836,  },
			{ x: 1501106273000, y: 23.222,  },
			{ x: 1501109873000, y: null,  },
			{ x: 1501113473000, y: 24.596,  },
			{ x: 1501117073000, y: 31.947,  },
			{ x: 1501120673000, y: 31.142,  },
		];
	} else if (type === 'multi-line') {
		data = [
			{
				name: 'Martha Vineyard',
				type: 'line',
				yValueFormatString: '#0.## °C',
				showLegend: true,
				lineWidth: 2,
				lineColor: '#ff0000',
				fillArea: true,
				dataPoints: []
			},
			{
				name: 'Myrtle Beach',
				type: 'line',
				yValueFormatString: '#0.## °C',
				showLegend: true,
				lineWidth: 2,
				lineColor: '#3d9ad8',
				axisYType: 'secondary',
				fillArea: true,
				dataPoints: []
			},
			{
				name: 'Nantucket',
				type: 'line',
				yValueFormatString: '#0.## °C',
				showLegend: true,
				lineWidth: 2,
				lineColor: '#129900',
				fillArea: true,
				axisYType: 'secondary',
				dataPoints: []
			}
		];

		let y = 100;

		for (let i = 0; i < data.length; i++) {
			for (var k = 0; k < limit; k += 1) {
				y += Math.round(Math.random() * 10 - 5);
				data[i].dataPoints.push({
					x: k,
					y: y
				});
			}
		}
	} else if (type === 'scatter') {
		data = [
			{ x: 800, y: 350 },
			{ x: 900, y: 450 },
			{ x: 850, y: 450 },
			{ x: 1250, y: 700 },
			{ x: 1100, y: 650 },
			{ x: 1350, y: 850 },
			{ x: 1200, y: 900 },
			{ x: 1410, y: 1250 },
			{ x: 1250, y: 1100 },
			{ x: 1400, y: 1150 },
			{ x: 1500, y: 1050 },
			{ x: 1330, y: 1120 },
			{ x: 1580, y: 1220 },
			{ x: 1620, y: 1400 },
			{ x: 1250, y: 1450 },
			{ x: 1350, y: 1600 },
			{ x: 1650, y: 1300 },
			{ x: 1700, y: 1620 },
			{ x: 1750, y: 1700 },
			{ x: 1830, y: 1800 },
			{ x: 1900, y: 2000 },
			{ x: 2050, y: 2200 },
			{ x: 2150, y: 1960 },
			{ x: 2250, y: 1990 }
		];
	} else if (type === 'column') {
		data = [{
			type: "column",
			name: "Proven Oil Reserves (bn)",
			legendText: "Proven Oil Reserves ",
			showLegend: true, 
			lineColor: 'green',
			stacked: false,
			dataPoints:[
				{ label: "Saudi", y: 266.21 },
				{ label: "Venezuela", y: 302.25 },
				{ label: "Iran", y: 157.20 },
				{ label: "Iraq", y: 148.77 },
				{ label: "Kuwait", y: 101.50 },
				{ label: "UAE", y: 97.8 }
			]
		},
		{
			type: "column",	
			name: "Oil Production (million/day)",
			legendText: "Oil Production",
			axisYType: "secondary",
			showLegend: true,
			lineColor: 'red',
			stacked: false,
			dataPoints:[
				{ label: "Saudi", y: 150.46 },
				{ label: "Venezuela", y: 62.27 },
				{ label: "Iran", y: 92.99 },
				{ label: "Iraq", y: 360.45 },
				{ label: "Kuwait", y: 55.92 },
				{ label: "UAE", y: 93.1 }
			]
		},
		{
			type: "column",	
			name: "Oil Production (million/day)",
			legendText: "Oil Production",
			showLegend: true,
			lineColor: 'blue',
			stacked: false,
			dataPoints:[
				{ label: "Saudi", y: 25.46 },
				{ label: "Venezuela", y: 41.27 },
				{ label: "Iran", y: 420.99 },
				{ label: "Iraq", y: 120.45 },
				{ label: "Kuwait", y: 25.92 },
				{ label: "UAE", y: 55.1 }
			]
		},
		{
			type: "column",	
			name: "Oil Production (million/day)",
			legendText: "Oil Production",
			showLegend: true,
			lineColor: 'gray',
			stacked: false,
			dataPoints:[
				{ label: "Saudi", y: 65.46 },
				{ label: "Venezuela", y: 189.27 },
				{ label: "Iran", y: 520.99 },
				{ label: "Iraq", y: 145.45 },
				{ label: "Kuwait", y: 112.92 },
				{ label: "UAE", y: 66.1 }
			]
		}]
	} else if (type === 'bar') {
		data = [
			{ y: 3, label: "Sweden" },
			{ y: 7, label: "Taiwan" },
			{ y: 5, label: "Russia" },
			{ y: 9, label: "Spain" },
			{ y: 7, label: "Brazil" },
			{ y: 7, label: "India" },
			{ y: 9, label: "Italy" },
			{ y: 8, label: "Australia" },
			{ y: 11, label: "Canada" },
			{ y: 15, label: "South Korea" },
			{ y: 12, label: "Netherlands" },
			{ y: 15, label: "Switzerland" },
			{ y: 25, label: "Britain" },
			{ y: 28, label: "Germany" },
			{ y: 29, label: "France" },
			{ y: 52, label: "Japan" },
			{ y: 103, label: "China" },
			{ y: 134, label: "US" }
		]
	} else if (type === 'radar') {
		data = [{
			type: "radar",	
			name: "Oil Production (million/day)",
			legendText: "Oil Production",
			showLegend: true,
			lineColor: 'gray',
			stacked: false,
			dataPoints:[
				{ x: 800, y: 350 },
				{ x: 900, y: 450 },
				{ x: 850, y: 450 },
				{ x: 1250, y: 700 },
				{ x: 1100, y: 650 },
				{ x: 1350, y: 850 },
				{ x: 1200, y: 900 },
				{ x: 1410, y: 1250 },
				{ x: 1250, y: 1100 },
				{ x: 1400, y: 1150 },
				{ x: 1500, y: 1050 },
				{ x: 1330, y: 1120 },
				{ x: 1580, y: 1220 },
				{ x: 1620, y: 1400 },
				{ x: 1250, y: 1450 },
				{ x: 1350, y: 1600 },
				{ x: 1650, y: 1300 },
				{ x: 1700, y: 1620 },
				{ x: 1750, y: 1700 },
				{ x: 1830, y: 1800 },
				{ x: 1900, y: 2000 },
				{ x: 2050, y: 2200 },
				{ x: 2150, y: 1960 },
				{ x: 2250, y: 1990 }
			]
		}] 
	}

	return data;
}
