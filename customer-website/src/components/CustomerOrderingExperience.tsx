"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

type MenuItem = {
  id: string;
  name?: string;
  price?: number | string;
  category?: string;
  available?: boolean;
  imageUrl?: string;
  quantity?: number;
};

type CustomerOrderingExperienceProps = {
  tableNumber?: string;
};

type PlacedOrder = {
  id: string;
  createdAt?: {
    seconds?: number;
    toDate?: () => Date;
  };
  items?: MenuItem[];
  status?: string;
  tableNumber?: string;
  totalPrice?: number;
};

type Feedback = {
  tone: "error" | "success";
  title: string;
  message: string;
};

const waterBottleItem: MenuItem = {
  id: "quick-water-bottle",
  name: "Water Bottle",
  price: 20,
  category: "Beverages",
  available: true,
};

export default function CustomerOrderingExperience({
  tableNumber: initialTableNumber,
}: CustomerOrderingExperienceProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber] = useState(initialTableNumber || "");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const availableItems = useMemo(
    () => menuItems.filter((item) => item.available !== false),
    [menuItems]
  );

  const categories = useMemo(() => {
    const values = availableItems
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category));

    return ["All", ...Array.from(new Set(values))];
  }, [availableItems]);

  const visibleItems = useMemo(() => {
    return availableItems
      .filter((item) => activeCategory === "All" || item.category === activeCategory)
      .filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        return [item.name, item.category]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      });
  }, [activeCategory, availableItems, searchQuery]);

  const featuredItem =
    visibleItems.find((item) => item.imageUrl) ||
    availableItems.find((item) => item.imageUrl) ||
    visibleItems[0] ||
    availableItems[0];

  const chefPicks = visibleItems.filter((item) => item.imageUrl).slice(0, 3);

  const validCartItems = cartItems.filter((item) => Number(item.quantity || 0) > 0);

  const totalPrice = validCartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const totalQuantity = validCartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  const hasAssignedTable = tableNumber.trim().length > 0;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        const items: MenuItem[] = [];

        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (!hasAssignedTable) {
      setPlacedOrders([]);
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("tableNumber", "==", tableNumber)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlacedOrder[];

      orders.sort((a, b) => getOrderTime(b) - getOrderTime(a));
      setPlacedOrders(orders);
    });

    return unsubscribe;
  }, [hasAssignedTable, tableNumber]);

  const addToCart = (item: MenuItem) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: Number(cartItem.quantity || 1) + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, direction: "increase" | "decrease") => {
    setCartItems((currentItems) =>
      currentItems
        .map((cartItem) => {
          if (cartItem.id !== itemId) return cartItem;

          const nextQuantity =
            direction === "increase"
              ? Number(cartItem.quantity || 1) + 1
              : Number(cartItem.quantity || 1) - 1;

          return {
            ...cartItem,
            quantity: nextQuantity,
          };
        })
        .filter((cartItem) => Number(cartItem.quantity || 0) > 0)
    );
  };

  const placeOrder = async () => {
    if (!hasAssignedTable) {
      setFeedback({
        tone: "error",
        title: "Table not assigned",
        message: "Please scan the table QR code before sending an order.",
      });
      return;
    }

    if (validCartItems.length === 0 || totalQuantity === 0) {
      setFeedback({
        tone: "error",
        title: "Cart is empty",
        message: "Add at least one item before sending the order to kitchen.",
      });
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        customerName,
        tableNumber,
        items: validCartItems,
        note: orderNote.trim(),
        totalPrice,
        status: "PLACED",
        createdAt: new Date(),
      });

      setFeedback({
        tone: "success",
        title: "Sent to kitchen",
        message: `Your order for Table ${tableNumber} has been sent.`,
      });

      setCartItems([]);
      setOrderNote("");
      setCustomerName("");
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        title: "Order failed",
        message: "The order could not be sent. Please ask the staff for help.",
      });
    }
  };

  const requestBill = async () => {
    if (!hasAssignedTable) {
      setFeedback({
        tone: "error",
        title: "Table not assigned",
        message: "Please scan the table QR code before requesting the bill.",
      });
      return;
    }

    try {
      await addDoc(collection(db, "billRequests"), {
        customerName,
        tableNumber,
        totalPrice,
        status: "REQUESTED",
        createdAt: new Date(),
      });

      setFeedback({
        tone: "success",
        title: "Bill requested",
        message: `The bill request for Table ${tableNumber} has been sent.`,
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        title: "Bill request failed",
        message: "The bill request could not be sent. Please call the staff.",
      });
    }
  };

  const callWaiter = async () => {
    if (!hasAssignedTable) {
      setFeedback({
        tone: "error",
        title: "Table not assigned",
        message: "Please scan the table QR code before calling a waiter.",
      });
      return;
    }

    try {
      await addDoc(collection(db, "serviceRequests"), {
        customerName,
        tableNumber,
        requestType: "WAITER",
        status: "REQUESTED",
        createdAt: new Date(),
      });

      setFeedback({
        tone: "success",
        title: "Waiter called",
        message: `A service request for Table ${tableNumber} has been sent.`,
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        title: "Request failed",
        message: "The waiter request could not be sent. Please try again.",
      });
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070B] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#05070B_0%,#0A0F18_44%,#091411_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:58px_58px]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#D6B25E]/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        {feedback && (
          <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />
        )}

        <nav className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#D6B25E]/35 bg-[#D6B25E]/15 text-sm font-black text-[#F5D98B]">
              OS
            </div>
            <div>
              <p className="text-lg font-black">RestaurantOS</p>
              <p className="text-xs font-semibold text-slate-500">
                Live Menu Command Interface
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
            <StatusPill label="Kitchen Status" value="Online" tone="green" />
            <StatusPill
              label="QR Table"
              value={tableNumber || "Not assigned"}
              tone={hasAssignedTable ? "slate" : "red"}
            />
            <StatusPill label="Order Mode" value="Self Order" tone="gold" />
          </div>
        </nav>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-[36px] border border-white/10 bg-[#0B0F17] shadow-2xl shadow-black/40">
            {featuredItem?.imageUrl ? (
              <Image
                src={featuredItem.imageUrl}
                alt={featuredItem.name || "Featured dish"}
                width={1300}
                height={900}
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#101722,#091411)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,11,0.94)_0%,rgba(5,7,11,0.72)_42%,rgba(5,7,11,0.18)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#05070B] to-transparent" />

            <div className="relative z-10 flex min-h-[520px] max-w-3xl flex-col justify-between p-5 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge text="Live Menu" />
                <Badge text="Chef Picks" />
                <Badge text={`${availableItems.length} Dishes`} />
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#D6B25E]">
                  Smart Hospitality Console
                </p>
                <h1 className="mt-3 text-4xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                  Order from a living digital menu.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Discover chef highlights, filter the live catalog, track your
                  smart cart, and send your order straight to the kitchen.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <Metric label="Live Items" value={availableItems.length.toString()} />
                  <Metric label="Categories" value={(categories.length - 1).toString()} />
                  <Metric label="Cart Qty" value={totalQuantity.toString()} />
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-[#D6B25E]">
                    Chef Highlight
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {featuredItem?.name || "Today's selection"}
                  </h2>
                </div>
                <span className="rounded-full bg-[#35D07F]/15 px-3 py-1 text-xs font-black text-[#6EF2A9]">
                  Ready
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {featuredItem?.category || "Fresh kitchen selection"} selected
                from the live catalog.
              </p>
              <button
                disabled={!featuredItem}
                onClick={() => featuredItem && addToCart(featuredItem)}
                className="mt-5 w-full rounded-2xl bg-[#D6B25E] px-4 py-3 text-sm font-black text-black transition hover:bg-[#F5D98B] disabled:opacity-50"
              >
                Add to Order
              </button>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <p className="text-xs font-black uppercase text-[#D6B25E]">
                Kitchen Pulse
              </p>
              <div className="mt-4 space-y-4">
                <Pulse label="New Orders" value="12" percent="78%" />
                <Pulse label="Preparing" value="08" percent="54%" />
                <Pulse label="Ready" value="04" percent="34%" />
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[260px_1fr_410px]">
          <aside className="h-fit rounded-[32px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl xl:sticky xl:top-4">
            <p className="px-2 text-xs font-black uppercase text-[#D6B25E]">
              Menu Navigator
            </p>
            <label className="relative mt-4 block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D6B25E]">
                Search
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Dish or category"
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#070A0F] pl-20 pr-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-[#D6B25E]/70"
              />
            </label>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2 xl:overflow-visible">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full shrink-0 rounded-2xl border px-4 py-3 text-left text-sm font-black transition xl:block ${
                    activeCategory === category
                      ? "border-[#D6B25E] bg-[#D6B25E] text-black"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#D6B25E]/50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            {chefPicks.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {chefPicks.map((item) => (
                  <MiniPick key={item.id} item={item} onAdd={() => addToCart(item)} />
                ))}
              </div>
            )}

            {loading ? (
              <Panel>Loading menu...</Panel>
            ) : visibleItems.length === 0 ? (
              <Panel>No dishes match this search.</Panel>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visibleItems.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.065] shadow-xl shadow-black/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D6B25E]/45"
                  >
                    <div className="relative aspect-[1.18] overflow-hidden bg-[#0D111A]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name || "Menu item"}
                          width={760}
                          height={640}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-black text-[#D6B25E]">
                          Freshly prepared
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur">
                        {item.category || "Special"}
                      </div>
                      <div className="absolute bottom-3 right-3 rounded-full bg-[#35D07F]/90 px-3 py-1 text-xs font-black text-black">
                        Available
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black">{item.name}</h3>
                          <p className="mt-1 text-xs font-bold uppercase text-slate-500">
                            Smart recommendation
                          </p>
                        </div>
                        <p className="shrink-0 rounded-full bg-[#D6B25E]/15 px-3 py-1 text-sm font-black text-[#F5D98B]">
                          Rs. {item.price}
                        </p>
                      </div>

                      <button
                        onClick={() => addToCart(item)}
                        className="mt-4 w-full rounded-2xl bg-[#D6B25E] px-4 py-3 text-sm font-black text-black transition hover:bg-[#F5D98B]"
                      >
                        Add to Order
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <SmartCart
            cartItems={validCartItems}
            customerName={customerName}
            onAddWater={() => addToCart(waterBottleItem)}
            onCallWaiter={callWaiter}
            onNameChange={setCustomerName}
            onNoteChange={setOrderNote}
            onPlaceOrder={placeOrder}
            onQuantityChange={updateQuantity}
            onRequestBill={requestBill}
            orderNote={orderNote}
            placedOrders={placedOrders}
            hasAssignedTable={hasAssignedTable}
            tableNumber={tableNumber}
            totalPrice={totalPrice}
            totalQuantity={totalQuantity}
          />
        </section>
      </div>
    </main>
  );
}

function SmartCart({
  cartItems,
  customerName,
  hasAssignedTable,
  onAddWater,
  onCallWaiter,
  onNameChange,
  onNoteChange,
  onPlaceOrder,
  onQuantityChange,
  onRequestBill,
  orderNote,
  placedOrders,
  tableNumber,
  totalPrice,
  totalQuantity,
}: {
  cartItems: MenuItem[];
  customerName: string;
  hasAssignedTable: boolean;
  onAddWater: () => void;
  onCallWaiter: () => void;
  onNameChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPlaceOrder: () => void;
  onQuantityChange: (itemId: string, direction: "increase" | "decrease") => void;
  onRequestBill: () => void;
  orderNote: string;
  placedOrders: PlacedOrder[];
  tableNumber: string;
  totalPrice: number;
  totalQuantity: number;
}) {
  return (
    <aside className="h-fit rounded-[34px] border border-white/10 bg-[#090D14]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl xl:sticky xl:top-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-[#D6B25E]">
            Smart Cart
          </p>
          <h2 className="mt-1 text-3xl font-black">Table Order</h2>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#D6B25E]/30 bg-[#D6B25E]/10 text-xl font-black text-[#F5D98B]">
          {totalQuantity}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <input
          type="text"
          placeholder="Guest name"
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-white/10 bg-[#05070B] px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-[#D6B25E]/70"
        />

        <div className="rounded-2xl border border-white/10 bg-[#05070B] px-4 py-3">
          <p className="text-[11px] font-black uppercase text-[#D6B25E]">
            Table from QR
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {tableNumber || "No table assigned"}
          </p>
        </div>
      </div>

      <textarea
        value={orderNote}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Order note, for example less spicy or no onion"
        className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-[#05070B] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-[#D6B25E]/70"
      />

      {!hasAssignedTable && (
        <div className="mt-4 rounded-2xl border border-[#FF4D4D]/30 bg-[#FF4D4D]/10 p-3 text-sm font-bold text-[#FF9A9A]">
          Scan a table QR code to send orders or request the bill.
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          onClick={onAddWater}
          className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm font-black text-white transition hover:border-[#D6B25E]/45"
        >
          Water Bottle
        </button>
        <button
          onClick={onCallWaiter}
          className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm font-black text-white transition hover:border-[#D6B25E]/45"
        >
          Call Waiter
        </button>
        <button
          onClick={onRequestBill}
          className="rounded-2xl border border-[#D6B25E]/25 bg-[#D6B25E]/10 px-3 py-3 text-sm font-black text-[#F5D98B] transition hover:border-[#D6B25E]/60"
        >
          Request Bill
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
          Your smart cart is empty. Add a chef pick or choose from the live menu.
        </div>
      ) : (
        <ul className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
          {cartItems.map((item) => (
            <li key={item.id} className="rounded-3xl bg-white/[0.055] p-3">
              <div className="flex gap-3">
                <div className="relative h-17 w-17 shrink-0 overflow-hidden rounded-2xl bg-[#0D111A]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name || "Cart item"}
                      width={180}
                      height={180}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-bold text-[#D6B25E]">
                      Dish
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Rs. {Number(item.price || 0) * Number(item.quantity || 1)}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-[#35D07F]/15 px-2 py-1 text-[11px] font-black text-[#6EF2A9]">
                      In order
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQuantityChange(item.id, "decrease")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#FF4D4D]/15 font-black text-[#FF8080]"
                      >
                        -
                      </button>
                      <span className="min-w-5 text-center text-sm font-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(item.id, "increase")}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#35D07F]/15 font-black text-[#6EF2A9]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <OrderHistory hasAssignedTable={hasAssignedTable} orders={placedOrders} />

      <div className="mt-5 rounded-3xl border border-[#D6B25E]/20 bg-[#D6B25E]/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#F5D98B]">Subtotal</span>
          <span className="text-3xl font-black">Rs. {totalPrice}</span>
        </div>
        <button
          onClick={onPlaceOrder}
          disabled={!hasAssignedTable || cartItems.length === 0 || totalQuantity === 0}
          className="mt-4 w-full rounded-2xl bg-[#35D07F] px-4 py-3 font-black text-black transition hover:bg-[#6EF2A9] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Send to Kitchen
        </button>
      </div>
    </aside>
  );
}

function MiniPick({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="group flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 text-left shadow-xl shadow-black/20 backdrop-blur-xl transition hover:border-[#D6B25E]/45"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#0D111A]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name || "Chef pick"}
            width={160}
            height={160}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase text-[#D6B25E]">Chef Pick</p>
        <p className="truncate text-sm font-black">{item.name}</p>
        <p className="mt-1 text-xs text-slate-500">Rs. {item.price}</p>
      </div>
    </button>
  );
}

function OrderHistory({
  hasAssignedTable,
  orders,
}: {
  hasAssignedTable: boolean;
  orders: PlacedOrder[];
}) {
  if (!hasAssignedTable) {
    return null;
  }

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[#D6B25E]">
            My Orders
          </p>
          <h3 className="mt-1 text-lg font-black">Live order status</h3>
        </div>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-300">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-slate-400">
          Orders sent from this table will appear here.
        </p>
      ) : (
        <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {orders.map((order, index) => {
            const items = order.items || [];
            const status = order.status || "PLACED";

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-white/10 bg-[#05070B] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">Order #{orders.length - index}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatOrderTime(order)}
                    </p>
                  </div>
                  <OrderStatusBadge status={status} />
                </div>

                <div className="mt-3 space-y-1">
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={`${order.id}-${item.id}`}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-slate-300">
                        {item.name}
                      </span>
                      <span className="font-black text-slate-400">
                        x{item.quantity || 1}
                      </span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-xs text-slate-500">
                      +{items.length - 3} more item{items.length - 3 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-sm font-black text-[#F5D98B]">
                    Rs. {order.totalPrice || 0}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  const tone =
    normalizedStatus === "SERVED"
      ? "bg-[#35D07F]/15 text-[#6EF2A9] border-[#35D07F]/30"
      : normalizedStatus === "READY"
        ? "bg-[#D6B25E]/15 text-[#F5D98B] border-[#D6B25E]/30"
        : normalizedStatus === "PREPARING"
          ? "bg-[#4DA3FF]/15 text-[#A8D0FF] border-[#4DA3FF]/30"
          : "bg-white/[0.06] text-slate-300 border-white/10";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${tone}`}>
      {normalizedStatus}
    </span>
  );
}

function FeedbackPanel({
  feedback,
  onClose,
}: {
  feedback: Feedback;
  onClose: () => void;
}) {
  const toneClass =
    feedback.tone === "success"
      ? "border-[#35D07F]/35 bg-[#35D07F]/12 text-[#A8F5C8]"
      : "border-[#FF4D4D]/35 bg-[#FF4D4D]/12 text-[#FFB0B0]";

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 rounded-[24px] border p-4 shadow-xl shadow-black/25 backdrop-blur-xl ${toneClass}`}
    >
      <div>
        <p className="text-sm font-black">{feedback.title}</p>
        <p className="mt-1 text-sm opacity-85">{feedback.message}</p>
      </div>
      <button
        onClick={onClose}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-black/20 text-sm font-black"
      >
        x
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "gold" | "green" | "red" | "slate";
  value: string;
}) {
  const styles = {
    gold: "border-[#D6B25E]/30 bg-[#D6B25E]/10 text-[#F5D98B]",
    green: "border-[#35D07F]/30 bg-[#35D07F]/10 text-[#6EF2A9]",
    red: "border-[#FF4D4D]/30 bg-[#FF4D4D]/10 text-[#FF9A9A]",
    slate: "border-white/10 bg-white/[0.05] text-slate-200",
  };

  return (
    <div className={`rounded-2xl border px-3 py-2 ${styles[tone]}`}>
      <p className="text-[11px] font-bold uppercase opacity-70">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function getOrderTime(order: PlacedOrder) {
  if (order.createdAt?.toDate) {
    return order.createdAt.toDate().getTime();
  }

  return Number(order.createdAt?.seconds || 0) * 1000;
}

function formatOrderTime(order: PlacedOrder) {
  const time = getOrderTime(order);

  if (!time) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(time));
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-black uppercase text-slate-200 backdrop-blur">
      {text}
    </span>
  );
}

function Pulse({
  label,
  percent,
  value,
}: {
  label: string;
  percent: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <span className="text-sm font-black text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#35D07F]"
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-slate-300 shadow-xl shadow-black/20 backdrop-blur-xl">
      {children}
    </div>
  );
}
