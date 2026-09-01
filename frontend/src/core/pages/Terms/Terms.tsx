import { Link } from "react-router-dom";
import styles from "./Terms.module.scss";

const LAST_UPDATED = "August 31, 2026";

function Terms() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.back}>
          ← Back
        </Link>

        <span className={styles.brand}>
          Gym<span>Hub</span>
        </span>
        <h1>Terms and Conditions</h1>
        <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <p>
          These Terms and Conditions ("Terms") govern your access to and use of GymHub (the
          "Service"). By creating an account or otherwise using the Service, you agree to be
          bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2>1. Eligibility and Your Account</h2>
        <p>
          You must provide accurate information when registering, including your name, phone
          number, sex, and (optionally) date of birth and height. You are responsible for keeping
          your login credentials confidential and for all activity that happens under your
          account. You may sign in with an email/password or with a Google account.
        </p>

        <h2>2. Content You Submit</h2>
        <p>
          GymHub lets you upload lift videos, bodyweight verification photos, a profile picture,
          and comments. You keep ownership of what you upload, but you grant GymHub a
          non-exclusive license to store, display, and process that content so the Service can
          function — for example, showing your approved lift videos in the feed and leaderboard,
          or your profile picture next to your name.
        </p>
        <p>
          Submitted lift videos and weigh-in photos are reviewed by an administrator before they
          appear publicly (on the feed, leaderboard, or your badges). Don't upload content that
          isn't genuinely yours, that misrepresents your lifts or bodyweight, or that infringes on
          someone else's rights.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Impersonate another person or misrepresent your affiliation with anyone.</li>
          <li>Upload content that is unlawful, harassing, or infringes another person's rights.</li>
          <li>Submit falsified lifts, weigh-ins, or other data to manipulate the leaderboard or badges.</li>
          <li>Attempt to access another user's account or interfere with the Service's normal operation.</li>
        </ul>

        <h2>4. Data We Collect and How We Use It</h2>
        <p>
          GymHub saves the information you provide and the information the Service generates
          about your activity so it can actually work as a fitness tracker and community feed.
          This includes:
        </p>
        <ul>
          <li>
            <strong>Account information</strong> — your name, email, phone number, sex, date of
            birth, and password (stored as a one-way hash, never in plain text).
          </li>
          <li>
            <strong>Athletic data</strong> — your height, bodyweight history, lift submissions,
            and the weight class and progression charts calculated from them.
          </li>
          <li>
            <strong>Media</strong> — the videos and photos you upload for lift verification,
            weigh-ins, and your profile picture.
          </li>
          <li>
            <strong>Activity</strong> — likes, comments, mentions, badges you claim, and physical
            card orders (including shipping address and phone number, if you order one).
          </li>
        </ul>
        <p>
          We use this data to operate the Service: displaying the feed and leaderboard, verifying
          submissions, calculating badges and weight classes, processing physical card orders, and
          sending you in-app notifications about activity related to your account (comments,
          likes, mentions, order and submission status changes). We do not sell your personal
          data.
        </p>

        <h2>5. Automated Systems and Artificial Intelligence</h2>
        <p>
          GymHub may use automated systems — including artificial intelligence or
          machine-learning-based tools — to help operate and improve the Service. This can
          include assisting with content moderation, detecting suspicious or fraudulent
          submissions, generating summaries or insights from your training data, or otherwise
          processing the data described in Section 4. Where such tools are used, they operate on
          the data you've already provided to the Service and are subject to the same data-use
          principles described in these Terms.
        </p>

        <h2>6. Third-Party Services</h2>
        <p>
          GymHub uses trusted third parties to provide parts of the Service: Google, for
          "Continue with Google" sign-in, and Stripe, for processing payments on physical badge
          card orders. When you use these features, the relevant information (e.g. your Google
          profile at sign-in, or payment details at checkout) is handled directly by that
          provider under its own terms and privacy policy — GymHub does not store your raw
          payment card details.
        </p>

        <h2>7. Badges and Physical Card Orders</h2>
        <p>
          Badges are awarded automatically based on verified lift data and are purely
          in-application recognition with no cash value. Ordering a physical card is optional,
          priced as shown at checkout, and processed through Stripe. Orders are fulfilled based on
          the shipping address you provide — it's your responsibility to make sure it's correct.
        </p>

        <h2>8. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate accounts that
          violate these Terms, submit fraudulent data, or otherwise misuse the Service.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          GymHub is a tracking and community tool, not a source of medical or professional
          coaching advice. Weightlifting carries inherent risk of injury — use appropriate form,
          equipment, and supervision, and consult a qualified professional before starting any
          training program. The Service is provided "as is," without warranties of any kind, and
          GymHub is not liable for injuries, losses, or damages arising from your use of it.
        </p>

        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service after a
          change means you accept the updated Terms.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions about these Terms can be directed to your GymHub administrator.
        </p>
      </div>
    </div>
  );
}

export default Terms;
