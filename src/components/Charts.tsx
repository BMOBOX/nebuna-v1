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
} from "lightweight-charts";
import { useParams } from "next/navigation";

interface Quote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
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

const Chart: React.FC<{ interval: string }> = ({ interval }) => {
  const [data, setData] = useState<CandlestickData<UTCTimestamp>[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle>({
    high: null,
    low: null,
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const params = useParams();
  const stock = params.stock as string;

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

        const chartData: CandlestickData<UTCTimestamp>[] = histRes.quotes
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
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [stock, interval]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1d232a" },
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
      height: 500,
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

    // Resize chart dynamically
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 600,
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
  }, []);

  // Update only data (NO FIT-CONTENT — prevents jump)
  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div className="relative w-full">
      <div
        ref={chartContainerRef}
        className="w-full h-[500px] bg-[#161a1f] rounded-lg shadow-lg"
      />

      {data.length === 0 && (
        <div className="text-center text-gray-400 mt-4">
          Loading chart data...
        </div>
      )}

      {hoveredCandle.high !== null && hoveredCandle.low !== null && (
        <div
          className="absolute bg-gray-900/95 text-white text-xs rounded px-3 py-2 pointer-events-none z-50 border border-gray-700 shadow-xl"
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
  );
};

export default Chart;
