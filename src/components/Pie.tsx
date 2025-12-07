"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#F13C59", // red
  "#3B82F6", // blue
  "#EA5F89", // orange
  "#10B981", // green
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F97316", // deep orange
  "#14B8A6", // teal
  "#22D3EE", // cyan
  "#A3E635", // lime
];

export default function PortfolioPieChart({ stocks }: { stocks?: any[] }) {
  if (!stocks || stocks.length === 0) return null;

  // Map to the format Pie expects: { name, quantity }
  const pieData = stocks.map((s) => ({
    name: s.stock_name,
    quantity: s.quantity,
  }));

  return (
    <div className="w-72 h-60 bg-zinc-900/40 border rounded-lg shadow-sm">
      <h3 className="text-xs font-semibold text-gray-300 text-center mt-2">
        Portfolio Quantity Distribution
      </h3>

      <div className="flex items-center justify-center h-full">
        {/* Pie Chart */}
        <div className="flex-1 flex justify-center items-center">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="quantity"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={30}
                paddingAngle={4}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  <span
                    style={{ color: "#f9fafb", fontWeight: 600 }}
                  >{`${value} stocks of ${name}`}</span>,
                  <span style={{ color: "#f9fafb", fontSize: "0.7rem" }}>
                    {name}
                  </span>,
                ]}
                contentStyle={{
                  backgroundColor: "rgba(23,23,23,0.9)",
                  border: "1px solid #374151",
                  borderRadius: "4px",
                  padding: "3px 6px",
                  fontSize: "0.7rem",
                }}
                labelStyle={{ display: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-20 flex flex-col justify-center items-start ml-4 mr-4">
          {pieData.map((d, index) => (
            <div
              key={index}
              className="flex items-center mb-1 text-xs text-gray-300"
            >
              <div
                className="w-2 h-2 mr-1 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
