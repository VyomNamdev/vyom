import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SCENES } from "./config";
import { Budget } from "./scenes/Budget";
import { Step1, Step2 } from "./scenes/Chat";
import { Cta } from "./scenes/Cta";
import { Hook, Intro } from "./scenes/Hook";
import { ReelBackground, SceneWrap } from "./ui";

const parts: { key: keyof typeof SCENES; C: React.FC }[] = [
  { key: "hook", C: Hook },
  { key: "intro", C: Intro },
  { key: "step1", C: Step1 },
  { key: "step2", C: Step2 },
  { key: "step3", C: Budget },
  { key: "cta", C: Cta },
];

/** 30s vertical reel: managing your budget with AI → comment for the PDF. */
export const BudgetReel: React.FC = () => (
  <AbsoluteFill>
    <ReelBackground />
    {parts.map(({ key, C }) => {
      const { from, duration } = SCENES[key];
      // The last scene holds to the end instead of fading out.
      const d = key === "cta" ? duration + 20 : duration;
      return (
        <Sequence key={key} from={from} durationInFrames={d} name={key}>
          <SceneWrap duration={d}>
            <C />
          </SceneWrap>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
