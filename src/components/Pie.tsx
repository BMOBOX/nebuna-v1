"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#10B981", // emerald
  "#34D399", // teal-green
  "#6EE7B7", // soft mint
  "#A7F3D0", // very soft green
  "#F87171", // soft red
  "#FCA5A5", // light red/pink
  "#FBBF24", // amber/yellow
  "#FCD34D", // light yellow
  "#60A5FA", // blue
  "#93C5FD", // light blue
];

export default function PortfolioPieChart({ stocks }: { stocks?: any[] }) {
  if (!stocks || stocks.length === 0) return null;

  // Map to the format Pie expects: { name, quantity }
  const pieData = stocks.map((s) => ({
    name: s.stock_name,
    quantity: s.quantity,
  }));

  return (
    <div className="w-72 h-60 bg-zinc-900/40 border rounded-lg shadow-sm p-2">
      <h3 className="text-xs font-semibold text-gray-300 text-center">
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
        <div className="w-20 flex flex-col justify-center items-start ml-4">
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
