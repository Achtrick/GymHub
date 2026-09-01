import { useEffect, useState, type FormEvent } from "react";
import { getCardPricing, updateCardPricing, type CardPricing } from "../../../api/badges";
import styles from "./CardPricing.module.scss";

const TIER_LABELS: Record<keyof CardPricing, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_ORDER: (keyof CardPricing)[] = ["bronze", "silver", "gold", "platinum"];

function CardPricingPage() {
  const [pricing, setPricing] = useState<CardPricing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCardPricing()
      .then(setPricing)
      .catch(() => setError("Could not load card pricing."));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pricing) return;
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const updated = await updateCardPricing(pricing);
      setPricing(updated);
      setSaved(true);
    } catch {
      setError("Could not save pricing.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Badge card pricing</h1>
      <p className={styles.subtitle}>
        The price shown to a user ordering a physical badge card, per tier (EUR).
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {saved && <p className={styles.success}>Saved.</p>}
      {!pricing && !error && <p className={styles.hint}>Loading…</p>}

      {pricing && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {TIER_ORDER.map((tier) => (
            <label className={styles.field} key={tier}>
              <span>{TIER_LABELS[tier]}</span>
              <div className={styles.priceInput}>
                <span className={styles.currency}>€</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  required
                  value={pricing[tier]}
                  onChange={(e) => {
                    setSaved(false);
                    setPricing((p) => (p ? { ...p, [tier]: Number(e.target.value) } : p));
                  }}
                />
              </div>
            </label>
          ))}
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save pricing"}
          </button>
        </form>
      )}
    </div>
  );
}

export default CardPricingPage;
