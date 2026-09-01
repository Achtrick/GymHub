import { useRef, useState } from "react";
import { getOrders, updateOrderStatus, type Order, type OrderStatus } from "../../../api/orders";
import type { LiftType } from "../../../api/prs";
import { useInfiniteList } from "../../../hooks/useInfiniteList";
import { useScrollLoadMore } from "../../../hooks/useScrollLoadMore";
import styles from "./Orders.module.scss";

const LIFT_LABELS: Record<LiftType, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  in_shipping: "In shipping",
  shipped: "Shipped",
};

const STATUS_ORDER: OrderStatus[] = ["received", "in_shipping", "shipped"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Orders() {
  const pageRef = useRef<HTMLDivElement>(null);
  const {
    items: orders,
    hasMore,
    isLoadingMore,
    error,
    loadMore,
    mutate,
  } = useInfiniteList<Order>({ fetchPage: getOrders });
  useScrollLoadMore(pageRef, loadMore, hasMore && !isLoadingMore);

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      const updated = await updateOrderStatus(id, status);
      mutate((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page} ref={pageRef}>
      <h1>Orders</h1>
      <p className={styles.subtitle}>
        Physical badge card orders — update the status as they move through fulfillment.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {!orders && !error && <p className={styles.hint}>Loading…</p>}
      {orders?.length === 0 && <p className={styles.hint}>No orders yet.</p>}

      {orders && orders.length > 0 && (
        <>
          <p className={styles.summary}>
            {orders.length} order{orders.length === 1 ? "" : "s"} loaded
            {hasMore ? " · scroll for more" : ""}
          </p>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Card</th>
                  <th>Price</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Ordered</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.userFullName}</td>
                    <td className={styles.muted}>
                      {order.tier} · {LIFT_LABELS[order.liftType]}
                    </td>
                    <td>€{order.priceEur.toFixed(2)}</td>
                    <td className={styles.address}>{order.shippingAddress}</td>
                    <td className={styles.muted}>{order.shippingPhoneNumber}</td>
                    <td className={styles.muted}>{formatDate(order.orderedAt)}</td>
                    <td>
                      <select
                        className={`${styles.statusSelect} ${styles[order.status]}`}
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                      >
                        {STATUS_ORDER.map((status) => (
                          <option value={status} key={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cardList}>
            {orders.map((order) => (
              <div className={styles.orderCard} key={order.id}>
                <div className={styles.orderCardHeader}>
                  <span className={styles.customerName}>{order.userFullName}</span>
                  <select
                    className={`${styles.statusSelect} ${styles[order.status]}`}
                    value={order.status}
                    disabled={busyId === order.id}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderStatus)
                    }
                  >
                    {STATUS_ORDER.map((status) => (
                      <option value={status} key={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.orderFields}>
                  <div className={styles.orderField}>
                    <span>Card</span>
                    <strong>
                      {order.tier} · {LIFT_LABELS[order.liftType]}
                    </strong>
                  </div>
                  <div className={styles.orderField}>
                    <span>Price</span>
                    <strong>€{order.priceEur.toFixed(2)}</strong>
                  </div>
                  <div className={styles.orderField}>
                    <span>Ordered</span>
                    <strong>{formatDate(order.orderedAt)}</strong>
                  </div>
                  <div className={styles.orderField}>
                    <span>Phone</span>
                    <strong>{order.shippingPhoneNumber}</strong>
                  </div>
                  <div className={`${styles.orderField} ${styles.orderFieldFull}`}>
                    <span>Address</span>
                    <strong>{order.shippingAddress}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoadingMore && <p className={styles.hint}>Loading more…</p>}
        </>
      )}
    </div>
  );
}

export default Orders;
