export const calculateSMA = (data: any[], count: number) => {
    let result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < count - 1) {
            result.push({ time: data[i].time, value: NaN });
            continue;
        }
        let sum = 0;
        for (let j = 0; j < count; j++) {
            sum += data[i - j].close;
        }
        result.push({ time: data[i].time, value: sum / count });
    }
    return result;
};

export const calculateEMA = (data: any[], count: number) => {
    let result = [];
    const k = 2 / (count + 1);
    let ema = data[0].close;

    result.push({ time: data[0].time, value: ema });

    for (let i = 1; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
        result.push({ time: data[i].time, value: ema });
    }
    return result;
};

export const calculateRSI = (data: any[], count: number = 14) => {
    let result = [];
    let gains = 0;
    let losses = 0;

    // First period
    for (let i = 1; i <= count; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / count;
    let avgLoss = losses / count;

    // Subsequent periods
    for (let i = count + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        let gain = change > 0 ? change : 0;
        let loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (count - 1) + gain) / count;
        avgLoss = (avgLoss * (count - 1) + loss) / count;

        let rs = avgGain / avgLoss;
        let rsi = 100 - (100 / (1 + rs));

        result.push({ time: data[i].time, value: rsi });
    }

    // Pad initial
    const padding = data.length - result.length;
    const finalResult = [];
    for (let i = 0; i < padding; i++) {
        finalResult.push({ time: data[i].time, value: NaN });
    }
    return [...finalResult, ...result];
};

export const calculateMACD = (data: any[], fast: number = 12, slow: number = 26, signal: number = 9) => {
    const emaFast = calculateEMA(data, fast);
    const emaSlow = calculateEMA(data, slow);

    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
        macdLine.push({ time: data[i].time, value: emaFast[i].value - emaSlow[i].value });
    }

    // Calculate Signal Line (EMA of MACD Line)
    // We need to pass the MACD line values as 'close' for EMA function or adapt it
    const macdFormat = macdLine.map(item => ({ time: item.time, close: item.value }));
    const signalLine = calculateEMA(macdFormat, signal);

    const histogram = [];
    for (let i = 0; i < data.length; i++) {
        histogram.push({
            time: data[i].time,
            value: macdLine[i].value - signalLine[i].value,
            color: (macdLine[i].value - signalLine[i].value) >= 0 ? '#ef4444' : '#10b981'
        });
    }

    return {
        diff: macdLine, // MACD Line (Fast - Slow)
        dea: signalLine, // Signal Line (EMA of MACD)
        hist: histogram
    };
};
