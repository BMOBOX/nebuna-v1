import Transactions from "@/components/Transactions";

export default function Page() {
  return (
    <div className="shadcn-theme dark min-h-screen">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Transactions History
      </h1>
      <Transactions />
    </div>
  );
}
