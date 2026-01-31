"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  ColorType,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  LineData,
  HistogramSeries,
  HistogramData,
} from "lightweight-charts";
import { useParams } from "next/navigation";

interface Quote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface StockPriceResponse {
  quotes: Quote[];
}

interface CurrentPriceResponse {
  regularMarketPrice: number;
}

interface HoveredCandle {
  high: number | null;
  low: number | null;
}

interface DrawingLine {
  id: string;
  points: { time: number; price: number }[];
  color: string;
}

// Technical indicator calculation functions
const calculateSMA = (
  data: Quote[],
  period: number
): LineData<UTCTimestamp>[] => {
  const sma: LineData<UTCTimestamp>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({
      time: Math.floor(new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
      value: sum / period,
    });
  }
  return sma;
};

const calculateEMA = (
  data: Quote[],
  period: number
): LineData<UTCTimestamp>[] => {
  const ema: LineData<UTCTimestamp>[] = [];
  const multiplier = 2 / (period + 1);

  let emaValue = data[0].close;
  for (let i = 0; i < data.length; i++) {
    emaValue = (data[i].close - emaValue) * multiplier + emaValue;
    ema.push({
      time: Math.floor(new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
      value: emaValue,
    });
  }
  return ema;
};

const calculateRSI = (
  data: Quote[],
  period: number = 14
): LineData<UTCTimestamp>[] => {
  const rsi: LineData<UTCTimestamp>[] = [];
  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    rsi.push({
      time: Math.floor(new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
      value: rsiValue,
    });
  }
  return rsi;
};

const calculateMACD = (
  data: Quote[]
): {
  macd: LineData<UTCTimestamp>[];
  signal: LineData<UTCTimestamp>[];
  histogram: HistogramData<UTCTimestamp>[];
} => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  const macd: LineData<UTCTimestamp>[] = [];
  for (let i = 0; i < ema12.length && i < ema26.length; i++) {
    macd.push({
      time: ema12[i].time,
      value: ema12[i].value - ema26[i].value,
    });
  }

  // Signal line (9-period EMA of MACD)
  const signalData = macd.map((m, i) => ({
    date: new Date(m.time * 1000).toISOString(),
    close: m.value,
    open: m.value,
    high: m.value,
    low: m.value,
  }));
  const signal = calculateEMA(signalData, 9);

  // Histogram
  const histogram: HistogramData<UTCTimestamp>[] = [];
  for (let i = 0; i < macd.length && i < signal.length; i++) {
    histogram.push({
      time: macd[i].time,
      value: macd[i].value - signal[i].value,
      color: macd[i].value - signal[i].value >= 0 ? "#26a69a" : "#ef5350",
    });
  }

  return { macd, signal, histogram };
};

const Chart: React.FC<{ interval: string }> = ({ interval }) => {
  const [data, setData] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const [rawQuotes, setRawQuotes] = useState<Quote[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle>({
    high: null,
    low: null,
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingLines, setDrawingLines] = useState<DrawingLine[]>([]);
  const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
  const [selectedColor, setSelectedColor] = useState("#3b82f6");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const drawingSeriesRef = useRef<ISeriesApi<"Line">[]>([]);

  const params = useParams();
  const stock = params.stock as string;

  const colors = [
    "#3b82f6",
    "#ef4444",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];

  // Track mouse position for tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const container = chartContainerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);

    return () => container?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Fetch candle data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, priceRes] = await Promise.all([
          fetch(`/api/stock-price/${stock}/${interval}`).then((r) => r.json()),
          fetch(`/api/stock-price/${stock}/current`).then((r) => r.json()),
        ]);

        const quotes = histRes.quotes;
        setRawQuotes(quotes);

        const chartData: CandlestickData<UTCTimestamp>[] = quotes
          .map((q: Quote) => ({
            time: Math.floor(new Date(q.date).getTime() / 1000) as UTCTimestamp,
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
          }))
          .filter((d: any) => d.open && d.high && d.low && d.close);

        // Update last candle with live price
        if (chartData.length > 0 && priceRes?.regularMarketPrice) {
          const last = chartData[chartData.length - 1];
          const previousClose =
            chartData.length > 1
              ? chartData[chartData.length - 2].close
              : last.open;

          chartData[chartData.length - 1] = {
            ...last,
            open: previousClose,
            close: priceRes.regularMarketPrice,
            high: Math.max(last.high, priceRes.regularMarketPrice),
            low: Math.min(last.low, priceRes.regularMarketPrice),
          };
        }

        setData(chartData);
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 300000);
    return () => clearInterval(id);
  }, [stock, interval]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#18181b" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#334155", visible: false },
        horzLines: { color: "#334155", visible: false },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    candleSeriesRef.current = series;

    // Tooltip logic
    chart.subscribeCrosshairMove((param) => {
      if (!param?.time || !param.point || !series) {
        setHoveredCandle({ high: null, low: null });
        return;
      }

      const dataPoint = param.seriesData.get(series);
      if (dataPoint && "high" in dataPoint) {
        setHoveredCandle({
          high: dataPoint.high,
          low: dataPoint.low,
        });
      }
    });

    // Drawing mode click handler
    chart.subscribeClick((param) => {
      if (!isDrawingMode || !param.point || !param.time) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;

      const time = param.time as UTCTimestamp;

      if (!currentLine) {
        // Start new line
        const newLine: DrawingLine = {
          id: Date.now().toString(),
          points: [{ time, price }],
          color: selectedColor,
        };
        setCurrentLine(newLine);
      } else {
        // Complete line
        const completedLine = {
          ...currentLine,
          points: [...currentLine.points, { time, price }],
        };
        setDrawingLines((prev) => [...prev, completedLine]);
        setCurrentLine(null);
      }
    });

    // Resize chart dynamically
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 600,
        height: chartContainerRef.current?.clientHeight ?? 500,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Fit content ONLY ONCE
    setTimeout(() => {
      chart.timeScale().fitContent();
    }, 0);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [isDrawingMode]);

  // Update only data (NO FIT-CONTENT — prevents jump)
  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data);
    }
  }, [data]);

  // Update indicators
  useEffect(() => {
    if (!candleSeriesRef.current || rawQuotes.length === 0) return;

    // Clear existing indicators
    indicatorSeriesRef.current.forEach((series) => {
      chartRef.current?.removeSeries(series);
    });
    indicatorSeriesRef.current = [];

    // Clear RSI chart
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    }

    // Clear MACD chart
    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistogramSeriesRef.current = null;
    }

    activeIndicators.forEach((indicator) => {
      switch (indicator) {
        case "sma20":
          const sma20 = calculateSMA(rawQuotes, 20);
          const sma20Series = chartRef.current?.addSeries(LineSeries, {
            color: "#3b82f6",
            lineWidth: 2,
            title: "SMA 20",
          });
          if (sma20Series) {
            sma20Series.setData(sma20);
            indicatorSeriesRef.current.push(sma20Series);
          }
          break;
        case "sma50":
          const sma50 = calculateSMA(rawQuotes, 50);
          const sma50Series = chartRef.current?.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 2,
            title: "SMA 50",
          });
          if (sma50Series) {
            sma50Series.setData(sma50);
            indicatorSeriesRef.current.push(sma50Series);
          }
          break;
        case "ema12":
          const ema12 = calculateEMA(rawQuotes, 12);
          const ema12Series = chartRef.current?.addSeries(LineSeries, {
            color: "#8b5cf6",
            lineWidth: 2,
            title: "EMA 12",
          });
          if (ema12Series) {
            ema12Series.setData(ema12);
            indicatorSeriesRef.current.push(ema12Series);
          }
          break;
        case "ema26":
          const ema26 = calculateEMA(rawQuotes, 26);
          const ema26Series = chartRef.current?.addSeries(LineSeries, {
            color: "#ec4899",
            lineWidth: 2,
            title: "EMA 26",
          });
          if (ema26Series) {
            ema26Series.setData(ema26);
            indicatorSeriesRef.current.push(ema26Series);
          }
          break;
        case "rsi":
          if (chartContainerRef.current) {
            const rsiChart = createChart(chartContainerRef.current, {
              layout: {
                background: { type: ColorType.Solid, color: "#18181b" },
                textColor: "#d1d5db",
              },
              grid: {
                vertLines: { color: "#334155", visible: false },
                horzLines: { color: "#334155", visible: false },
              },
              rightPriceScale: { borderColor: "#334155" },
              timeScale: {
                borderColor: "#334155",
                timeVisible: true,
                secondsVisible: false,
              },
              height: 150,
            });
            rsiChartRef.current = rsiChart;

            const rsiSeries = rsiChart.addSeries(LineSeries, {
              color: "#22c55e",
              lineWidth: 2,
              title: "RSI",
            });
            rsiSeriesRef.current = rsiSeries;

            const rsiData = calculateRSI(rawQuotes);
            rsiSeries.setData(rsiData);

            // Add overbought/oversold lines
            const overboughtSeries = rsiChart.addSeries(LineSeries, {
              color: "#ef4444",
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              lastValueVisible: false,
              title: "Overbought (70)",
            });
            const oversoldSeries = rsiChart.addSeries(LineSeries, {
              color: "#22c55e",
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              lastValueVisible: false,
              title: "Oversold (30)",
            });

            const overboughtLine = rsiData.map((d) => ({
              time: d.time,
              value: 70,
            }));
            const oversoldLine = rsiData.map((d) => ({
              time: d.time,
              value: 30,
            }));
            overboughtSeries.setData(overboughtLine);
            oversoldSeries.setData(oversoldLine);
          }
          break;
        case "macd":
          if (chartContainerRef.current) {
            const macdChart = createChart(chartContainerRef.current, {
              layout: {
                background: { type: ColorType.Solid, color: "#18181b" },
                textColor: "#d1d5db",
              },
              grid: {
                vertLines: { color: "#334155", visible: false },
                horzLines: { color: "#334155", visible: false },
              },
              rightPriceScale: { borderColor: "#334155" },
              timeScale: {
                borderColor: "#334155",
                timeVisible: true,
                secondsVisible: false,
              },
              height: 150,
            });
            macdChartRef.current = macdChart;

            const { macd, signal, histogram } = calculateMACD(rawQuotes);

            const macdSeries = macdChart.addSeries(LineSeries, {
              color: "#3b82f6",
              lineWidth: 2,
              title: "MACD",
            });
            macdSeriesRef.current = macdSeries;
            macdSeries.setData(macd);

            const signalSeries = macdChart.addSeries(LineSeries, {
              color: "#f59e0b",
              lineWidth: 2,
              title: "Signal",
            });
            macdSignalSeriesRef.current = signalSeries;
            signalSeries.setData(signal);

            const histogramSeries = macdChart.addSeries(HistogramSeries, {
              title: "Histogram",
            });
            macdHistogramSeriesRef.current = histogramSeries;
            histogramSeries.setData(histogram);
          }
          break;
      }
    });

    // Sync time scales
    if (rsiChartRef.current && chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (range && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleRange(range);
        }
      });
    }
    if (macdChartRef.current && chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (range && macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleRange(range);
        }
      });
    }
  }, [activeIndicators, rawQuotes]);

  // Update drawing lines
  useEffect(() => {
    // Clear existing drawing series
    drawingSeriesRef.current.forEach((series) => {
      chartRef.current?.removeSeries(series);
    });
    drawingSeriesRef.current = [];

    // Add completed lines
    drawingLines.forEach((line) => {
      if (line.points.length >= 2) {
        const series = chartRef.current?.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          lastValueVisible: false,
          title: "",
        });
        if (series) {
          const lineData: LineData<UTCTimestamp>[] = line.points.map((p) => ({
            time: p.time as UTCTimestamp,
            value: p.price,
          }));
          series.setData(lineData);
          drawingSeriesRef.current.push(series);
        }
      }
    });

    // Add current line being drawn
    if (currentLine && currentLine.points.length >= 1) {
      // Current line preview would require mouse tracking - simplified for now
    }
  }, [drawingLines, currentLine]);

  const toggleIndicator = (indicator: string) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  };

  const clearDrawings = () => {
    setDrawingLines([]);
    setCurrentLine(null);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-900 border-b border-zinc-800">
        {/* Drawing Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isDrawingMode
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {isDrawingMode ? "Exit Draw" : "Draw Line"}
          </button>
          {isDrawingMode && (
            <>
              <div className="flex items-center gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color
                        ? "border-white"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={clearDrawings}
                className="px-3 py-1.5 rounded text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        {/* Technical Indicators */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase font-medium">
            Indicators:
          </span>
          {[
            { id: "sma20", label: "SMA 20" },
            { id: "sma50", label: "SMA 50" },
            { id: "ema12", label: "EMA 12" },
            { id: "ema26", label: "EMA 26" },
            { id: "rsi", label: "RSI" },
            { id: "macd", label: "MACD" },
          ].map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => toggleIndicator(indicator.id)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeIndicators.includes(indicator.id)
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/50"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {indicator.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div
          ref={chartContainerRef}
          className="w-full h-full bg-zinc-900 rounded-lg shadow-lg"
        />

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Loading chart data...
          </div>
        )}

        {hoveredCandle.high !== null && hoveredCandle.low !== null && (
          <div
            className="absolute bg-zinc-900/95 text-white text-xs rounded px-3 py-2 pointer-events-none z-50 border border-zinc-800 shadow-xl"
            style={{
              left: cursorPos.x + 15,
              top: cursorPos.y + 15,
              transform: "translateY(-50%)",
            }}
          >
            <div>
              High:{" "}
              <span className="text-green-400 font-medium">
                {hoveredCandle.high.toFixed(2)}
              </span>
            </div>
            <div>
              Low:{" "}
              <span className="text-red-400 font-medium">
                {hoveredCandle.low.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
