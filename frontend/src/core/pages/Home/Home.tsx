import { useEffect, useState } from "react";
import SwipeableTabs from "../../Components/Controls/SwipeableTabs/SwipeableTabs";
import { HomeIcon, MedalIcon, TrophyIcon } from "../../Components/Controls/Icons";
import Feed from "../Feed/Feed";
import Leaderboard from "../Leaderboard/Leaderboard";
import MyPrs from "../MyPrs/MyPrs";

const TABS = [
  { id: "feed", label: "Feed", icon: <HomeIcon /> },
  { id: "leaderboard", label: "Leaderboard", icon: <TrophyIcon /> },
  { id: "my-prs", label: "My PRs", icon: <MedalIcon /> },
];

function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const goToFeed = () => setActiveIndex(0);
    window.addEventListener("gymhub:go-to-feed", goToFeed);
    return () => window.removeEventListener("gymhub:go-to-feed", goToFeed);
  }, []);

  return (
    <SwipeableTabs tabs={TABS} activeIndex={activeIndex} onChange={setActiveIndex}>
      {[<Feed key="feed" />, <Leaderboard key="leaderboard" />, <MyPrs key="my-prs" />]}
    </SwipeableTabs>
  );
}

export default Home;
