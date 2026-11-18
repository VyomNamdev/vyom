import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ReelBackground } from "../reel/ui";
import { Captions } from "./Captions";
import { SCENES } from "./config";
import { EndScreen } from "./scenes/EndScreen";
import { Hook } from "./scenes/Hook";
import { Pipeline } from "./scenes/Pipeline";
import { Statement } from "./scenes/Statement";
import { Transform } from "./scenes/Transform";
import { SlideWrap, TRANSITION } from "./SlideWrap";

type Kind = React.ComponentProps<typeof SlideWrap>["enter"];

/**
 * Each scene's Sequence starts TRANSITION frames early (except the first) so
 * slide transitions overlap: the outgoing scene slides out while the next
 * slides in.
 */
const parts: {
  key: keyof typeof SCENES;
  C: React.FC;
  enter: Kind;
  exit: Kind;
}[] = [
  { key: "hook", C: Hook, enter: "none", exit: "up" },
  { key: "statement", C: Statement, enter: "up", exit: "fade" },
  { key: "transform", C: Transform, enter: "none", exit: "left" },
  { key: "pipeline", C: Pipeline, enter: "left", exit: "fade" },
  { key: "end", C: EndScreen, enter: "up", exit: "none" },
];

export const AutomatedBudgetShort: React.FC = () => (
  <AbsoluteFill>
    <ReelBackground />
    {parts.map(({ key, C, enter, exit }) => {
      const { from, duration } = SCENES[key];
      const lead = enter === "up" || enter === "left" ? TRANSITION : 0;
      const d = duration + lead;
      return (
        <Sequence key={key} from={from - lead} durationInFrames={d} name={key}>
          <SlideWrap duration={d} enter={enter} exit={exit}>
            <Sequence from={lead} layout="none">
              <C />
            </Sequence>
          </SlideWrap>
        </Sequence>
      );
    })}
    <Captions />
  </AbsoluteFill>
);
