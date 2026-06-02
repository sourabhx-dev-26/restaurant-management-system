import OrderPage from "@/components/OrderPage";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  return (
    <OrderPage
      tableNumber={tableId}
    />
  );
}