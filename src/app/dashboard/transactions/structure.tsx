import Search from "@/components/Search";
import Sidebar from "@/components/Sidebar";
import Transactions from "@/components/Transactions";
import { transaction } from "nebuna";
import { Session } from "next-auth";

export function Structure({
  children,
  transaction,
}: {
  children: React.ReactNode;
  transaction?: transaction[];
}) {
  return (
    <>
      <div className="shadcn dark">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Transaction History
        </h1>
        <Transactions transaction={transaction} />
      </div>
      <div>{children}</div>
    </>
  );
}
