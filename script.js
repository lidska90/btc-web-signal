class BinanceWebSocket {
    constructor() {
        this.ws = null;
        this.reconnectTimeout = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.subscriptions = new Set();
        this.isConnected = false;
    }

    connect() {
        try {
            this.ws = new WebSocket('wss://stream.binance.com:9443/ws');
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectDelay = 1000;
                this.updateConnectionStatus('connected');
                // Resubscribe to all previous streams
                this.subscriptions.forEach(symbol => {
                    this.subscribe(symbol);
                });
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            this.ws.onclose = (e) => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                this.ws.close();
            };
        } catch (error) {
            console.error('Connection error:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
        }, this.reconnectDelay);
    }

    subscribe(streamName) {
        if (this.isConnected) {
            const payload = {
                method: "SUBSCRIBE",
                params: [streamName],
                id: Date.now()
            };
            this.ws.send(JSON.stringify(payload));
            this.subscriptions.add(streamName);
        }
    }

    unsubscribe(streamName) {
        if (this.isConnected) {
            const payload = {
                method: "UNSUBSCRIBE",
                params: [streamName],
                id: Date.now()
            };
            this.ws.send(JSON.stringify(payload));
            this.subscriptions.delete(streamName);
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = status;
        statusElement.className = status;
    }

    handleMessage(data) {
        // Process different types of messages
        if (data.e === 'kline') {
            this.handleKlineData(data);
        }
        // Handle other message types
    }

    handleKlineData(klineData) {
        // Process candlestick data
        const candle = {
            time: klineData.k.t / 1000,
            open: parseFloat(klineData.k.o),
            high: parseFloat(klineData.k.h),
            low: parseFloat(klineData.k.l),
            close: parseFloat(klineData.k.c),
            volume: parseFloat(klineData.k.v)
        };
        
        // Update chart
        if (window.chartSeries) {
            window.chartSeries.update(candle);
        }
        
        // Update price display
        this.updatePriceDisplay(candle.close);
    }

    updatePriceDisplay(price) {
        const priceElement = document.getElementById('current-price');
        const changeElement = document.getElementById('price-change');
        
        const previousPrice = parseFloat(priceElement.dataset.previousPrice) || price;
        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        priceElement.textContent = `$${price.toFixed(2)}`;
        priceElement.dataset.previousPrice = price;
        
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
        changeElement.className = `change-indicator ${change >= 0 ? 'positive' : 'negative'}`;
    }
}
