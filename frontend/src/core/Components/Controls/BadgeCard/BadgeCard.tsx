import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  claimBadge,
  createCheckoutSession,
  type Badge,
  type BadgeTier,
  type OrderStatus,
} from "../../../api/badges";
import type { LiftType } from "../../../api/prs";
import { useAuth } from "../../../auth/useAuth";
import Modal from "../Modal/Modal";
import {
  AmexLogo,
  ApplePayLogo,
  CreditCardIcon,
  GooglePayLogo,
  LockIcon,
  MastercardLogo,
  PayPalLogo,
  PlateIcon,
  VisaLogo,
} from "../Icons";
import styles from "./BadgeCard.module.scss";

interface BadgeCardProps {
  badge: Badge;
  interactive: boolean;
  onChange?: () => void;
}

const ORDER_STATUS_STEPS: OrderStatus[] = ["received", "in_shipping", "shipped"];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Order received",
  in_shipping: "In shipping",
  shipped: "Delivered",
};

const PAYMENT_LOGOS = [
  { id: "visa", Logo: VisaLogo },
  { id: "mastercard", Logo: MastercardLogo },
  { id: "amex", Logo: AmexLogo },
  { id: "paypal", Logo: PayPalLogo },
  { id: "apple-pay", Logo: ApplePayLogo },
  { id: "google-pay", Logo: GooglePayLogo },
];

const LIFT_LABELS: Record<LiftType, string> = {
  squat: "Squat",
  bench: "Bench Press",
  deadlift: "Deadlift",
};

const TIER_TITLES: Record<BadgeTier, string> = {
  bronze: "Contender",
  silver: "Beast",
  gold: "Olympian",
  platinum: "Titan",
};

// Keep these in sync with .bgPlate's width/margin-left in BadgeCard.module.scss.
const PLATE_SIZE = 90;
const PLATE_RADIUS = PLATE_SIZE / 2;
const PLATE_OVERLAP = 80.5; // how far each plate is pulled left onto the previous one
const CUT_GAP = 5; // width of the crescent gap cut into the plate behind

// The thin crescent "cut" between two overlapping plates: a mask that punches
// a hole in a plate exactly where the next plate (painted on top of it) sits,
// slightly larger than that plate so a sliver of the card shows through.
// Uses the plates' fixed layout box (before any scale transform below), since
// mask-image positioning is resolved against the untransformed border-box.
function nextPlateMask() {
  const centerX = PLATE_RADIUS + (PLATE_SIZE - PLATE_OVERLAP);
  const cutRadius = PLATE_RADIUS + CUT_GAP;
  const gradient = `radial-gradient(circle ${cutRadius}px at ${centerX}px ${PLATE_RADIUS}px, transparent 0, transparent ${cutRadius - 3}px, black ${cutRadius}px, black 100%)`;
  return { WebkitMaskImage: gradient, maskImage: gradient };
}

// Subtle depth cue: the plate lowest in the stack (painted first, furthest
// back) renders a touch smaller; the one highest in the stack (painted last,
// frontmost) a touch bigger. Uses transform so the flex layout box (and the
// mask above, which is computed against that box) is unaffected.
const MIN_PLATE_SCALE = 0.92;
const MAX_PLATE_SCALE = 1.06;

function plateScale(index: number, total: number) {
  if (total <= 1) return 1;
  const t = index / (total - 1);
  return MIN_PLATE_SCALE + (MAX_PLATE_SCALE - MIN_PLATE_SCALE) * t;
}

function BadgeCard({ badge, interactive, onChange }: BadgeCardProps) {
  const { user } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ address: "", phoneNumber: user?.phoneNumber ?? "" });
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const fullPlateCount = Math.floor(badge.platesPerSide);
  const hasHalfPlate = badge.platesPerSide % 1 !== 0;
  // true = half-size disc for the fractional remainder, false = a full plate.
  const plateSpecs = [
    ...Array.from({ length: fullPlateCount }, () => false),
    ...(hasHalfPlate ? [true] : []),
  ];

  const handleClaim = async () => {
    setError(null);
    setIsClaiming(true);
    try {
      await claimBadge(badge.liftType, badge.tier);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim badge.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleStartCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (!badge.id) return;
    setOrderError(null);
    setIsRedirecting(true);
    try {
      const { url } = await createCheckoutSession(
        badge.id,
        orderForm.address,
        orderForm.phoneNumber,
        window.location.href,
      );
      window.location.href = url;
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Could not start checkout.");
      setIsRedirecting(false);
    }
  };

  const openPreview = () => {
    if (badge.claimed) setShowPreview(true);
  };

  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview();
    }
  };

  const renderCardFace = (shine: boolean) => (
    <div
      className={`${styles.card} ${styles[badge.tier]} ${!badge.claimed ? styles.locked : ""}`}
    >
      {shine && <div className={styles.shine} />}

      <div className={styles.plateBackground}>
        {plateSpecs.map((isHalf, i) => (
          <PlateIcon
            key={i}
            className={isHalf ? `${styles.bgPlate} ${styles.bgPlateHalf}` : styles.bgPlate}
            style={{
              ...(i < plateSpecs.length - 1 ? nextPlateMask() : null),
              transform: `scale(${plateScale(i, plateSpecs.length)})`,
            }}
          />
        ))}
      </div>

      <div className={styles.cardTop}>
        <span className={styles.wordmark}>GymHub</span>
        <span className={styles.tierLabel}>{badge.tier}</span>
      </div>

      <div className={styles.cardMiddle}>
        <span className={styles.badgeTitle}>{TIER_TITLES[badge.tier]}</span>
        <span className={styles.disciplineName}>{LIFT_LABELS[badge.liftType]}</span>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.cardBottomLeft}>
          <span className={styles.holderName}>{badge.userFullName}</span>
          <span className={styles.plateLabel}>{badge.platesPerSide}× 20kg / side</span>
        </div>
        <span className={styles.thresholdWeight}>{badge.weightKg}kg</span>
      </div>

      {!badge.claimed && (
        <div className={styles.overlay}>
          {badge.eligible ? (
            <>
              <span className={styles.overlayText}>Unlocked!</span>
              {interactive && (
                <button type="button" onClick={handleClaim} disabled={isClaiming}>
                  {isClaiming ? "Claiming…" : "Claim badge"}
                </button>
              )}
            </>
          ) : (
            <>
              <LockIcon className={styles.lockIcon} />
              <span className={styles.overlayText}>Reach {badge.weightKg}kg</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {badge.eligible && <div className={`${styles.aura} ${styles[badge.tier]}`} />}

      <div
        className={badge.claimed ? styles.clickable : undefined}
        onClick={openPreview}
        onKeyDown={badge.claimed ? handlePreviewKeyDown : undefined}
        role={badge.claimed ? "button" : undefined}
        tabIndex={badge.claimed ? 0 : undefined}
        aria-label={badge.claimed ? "Preview badge card" : undefined}
      >
        {renderCardFace(false)}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {badge.claimed && interactive && (
        <button
          type="button"
          className={`${styles.orderButton} ${badge.cardOrdered ? styles.orderButtonOrdered : ""}`}
          onClick={() => setShowOrderForm(true)}
          disabled={badge.cardOrdered}
        >
          {badge.cardOrdered && badge.orderStatus ? (
            <div className={styles.orderStatusContent}>
              <span className={styles.orderStatusLabel}>
                <CreditCardIcon />
                {ORDER_STATUS_LABELS[badge.orderStatus]}
              </span>
              <span className={styles.orderSteps}>
                {ORDER_STATUS_STEPS.map((step, i) => {
                  const currentIndex = ORDER_STATUS_STEPS.indexOf(badge.orderStatus!);
                  return (
                    <span
                      key={step}
                      className={`${styles.orderStep} ${i <= currentIndex ? styles.orderStepDone : ""} ${i === currentIndex ? styles.orderStepCurrent : ""}`}
                      title={ORDER_STATUS_LABELS[step]}
                    />
                  );
                })}
              </span>
            </div>
          ) : (
            <>
              <CreditCardIcon />
              Order physical card <span className={styles.orderButtonPrice}>€{badge.priceEur}</span>
            </>
          )}
        </button>
      )}

      {showPreview && (
        <Modal
          title={`${TIER_TITLES[badge.tier]} · ${LIFT_LABELS[badge.liftType]}`}
          onClose={() => setShowPreview(false)}
        >
          <div className={styles.previewCard}>{renderCardFace(true)}</div>
        </Modal>
      )}

      {showOrderForm && (
        <Modal title="Order your card" onClose={() => setShowOrderForm(false)}>
          <p className={styles.orderPrice}>€{badge.priceEur.toFixed(2)}</p>

          <div className={styles.secureBadge}>
            <LockIcon className={styles.secureIcon} />
            <span>
              Secured checkout by Stripe — GymHub never sees or stores your card details.
            </span>
          </div>

          <div className={styles.paymentMethods}>
            {PAYMENT_LOGOS.map(({ id, Logo }) => (
              <Logo key={id} className={styles.paymentLogo} />
            ))}
          </div>

          {orderError && <p className={styles.error}>{orderError}</p>}
          <form className={styles.orderForm} onSubmit={handleStartCheckout}>
            <label className={styles.field}>
              <span>Shipping address</span>
              <textarea
                required
                rows={3}
                value={orderForm.address}
                onChange={(e) => setOrderForm((p) => ({ ...p, address: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span>Phone number</span>
              <input
                type="tel"
                required
                value={orderForm.phoneNumber}
                onChange={(e) => setOrderForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              />
            </label>
            <button type="submit" disabled={isRedirecting}>
              <LockIcon className={styles.submitLockIcon} />
              {isRedirecting ? "Redirecting to payment…" : "Continue to secure payment"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default BadgeCard;
