// src/components/SentimentPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type ChartConfig, ChartContainer, ChartTooltipContent } from '~/components/ui/chart'; // Sesuaikan path jika perlu

interface SentimentPieChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

const chartConfig = {
  positive: {
    label: 'Positif',
    color: 'hsl(var(--chart-green))', // Anda perlu definisikan warna ini di CSS Anda
  },
  neutral: {
    label: 'Netral',
    color: 'hsl(var(--chart-gray))', // Anda perlu definisikan warna ini di CSS Anda
  },
  negative: {
    label: 'Negatif',
    color: 'hsl(var(--chart-red))', // Anda perlu definisikan warna ini di CSS Anda
  },
} satisfies ChartConfig;

const SentimentPieChart: React.FC<SentimentPieChartProps> = ({ positive, neutral, negative }) => {
  const data = [
    { name: 'Positif', value: positive, fill: chartConfig.positive.color },
    { name: 'Negatif', value: negative, fill: chartConfig.negative.color },
    { name: 'Netral', value: neutral, fill: chartConfig.neutral.color },
  ].filter((item) => item.value > 0); // Hanya tampilkan slice jika nilainya > 0

  if (data.length === 0 && positive === 0 && neutral === 0 && negative === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Belum ada data sentimen untuk ditampilkan.
      </div>
    );
  }

  // Jika semua value 0 tapi ada histori (misal dari API defaultnya 0 semua)
  // Atau jika total curhat > 0 tapi semua sentimen 0 (jarang terjadi tapi mungkin)
  // Anda bisa tambahkan penanganan khusus jika ingin, misal placeholder chart kosong.
  // Untuk sekarang, jika semua value 0, data akan kosong dan chart tidak tampil.

  return (
    <ChartContainer config={chartConfig} className="min-h-[150px] w-full max-w-[250px] mx-auto">
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={55}
            innerRadius={40} // Membuatnya menjadi donut chart, set ke 0 untuk pie chart biasa
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          {/* Anda bisa menambahkan Legend jika diinginkan
          <Legend content={({ payload }) => {
              return (
                <ul className="flex flex-col space-y-1 text-xs text-muted-foreground mt-2">
                  {payload?.map((entry, index) => (
                    <li key={`item-${index}`} className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
                      {String(entry.value)}: {entry.payload?.value}%
                    </li>
                  ))}
                </ul>
              )
            }} />
          */}
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default SentimentPieChart;
