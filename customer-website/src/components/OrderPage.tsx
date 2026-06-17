import CustomerOrderingExperience from "@/components/CustomerOrderingExperience";

interface OrderPageProps {
  tableNumber?: string;
}

export default function OrderPage({ tableNumber }: OrderPageProps) {
  return <CustomerOrderingExperience tableNumber={tableNumber} />;
}
