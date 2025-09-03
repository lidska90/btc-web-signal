const chartContainer = document.getElementById('candlestick-chart');

const chart = LightweightCharts.createChart(chartContainer, {
    layout: {
        backgroundColor: '#1A1A2E',
        textColor: '#E0E0E0',
    },
    grid: {
        vertLines: { color: 'rgba(70, 70, 70, 0.5)' },
        horzLines: { color: 'rgba(70, 70, 70, 0.5)' },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    priceScale: {
        borderColor: '#4A4A4A',
    },
    timeScale: {
        borderColor: '#4A4A4A',
    },
});

const candleSeries = chart.addCandlestickSeries({
    upColor: '#00C853',
    downColor: '#FF5252',
    borderUpColor: '#00C853',
    borderDownColor: '#FF5252',
    wickUpColor: '#00C853',
    wickDownColor: '#FF5252',
});

const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const kline = data.k; 

    const newCandle = {
        time: kline.t / 1000,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
    };

    candleSeries.update(newCandle);
};
