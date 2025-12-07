import Info from "@/components/Info";
import PortfolioPieChart from "@/components/Pie";
import PortfolioTable from "@/components/Portfolio";

export function Structure({
  children,
  investedValue,
  currentValue,
  stocks,
}: {
  children: React.ReactNode;
  investedValue?: number;
  currentValue?: number;
  stocks?: any[];
}) {
  return (
    <>
      <div className="shadcn dark">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-center md:text-left">
          Portfolio
        </h1>

        {/* Flex container for Info and Pie Chart */}
        <div className="flex flex-col md:flex-row justify-center gap-6 md:mx-16 2xl:mx-48 mb-6">
          {/* Info */}
          <div className="flex-1 w-full md:w-auto">
            <Info
              investedValue_={investedValue}
              currentValue_={currentValue}
              stocks={stocks}
            />
          </div>

          {/* Pie Chart Card centered */}
          <div className="flex justify-center w-full md:w-auto">
            <PortfolioPieChart stocks={stocks} />
          </div>
        </div>

        {/* Table below */}
        <div className="w-full overflow-x-auto">
          <PortfolioTable stocks={stocks} />
        </div>
      </div>

      <div>{children}</div>
    </>
  );
}
