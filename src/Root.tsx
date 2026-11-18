import "./index.css";
import { Composition } from "remotion";
import { video } from "./components";
import { ComponentShowcase } from "./scenes/ComponentShowcase";
import { BudgetReel } from "./reel/BudgetReel";
import { REEL } from "./reel/config";
import { AutomatedBudgetShort } from "./short/AutomatedBudgetShort";
import { SHORT } from "./short/config";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AutomatedBudgetShort"
        component={AutomatedBudgetShort}
        durationInFrames={SHORT.durationInFrames}
        fps={SHORT.fps}
        width={SHORT.width}
        height={SHORT.height}
      />
      <Composition
        id="BudgetReel"
        component={BudgetReel}
        durationInFrames={REEL.durationInFrames}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      <Composition
        id="ComponentShowcase"
        component={ComponentShowcase}
        durationInFrames={480}
        fps={video.fps}
        width={video.width}
        height={video.height}
      />
    </>
  );
};
