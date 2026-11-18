import "./index.css";
import { Composition } from "remotion";
import { video } from "./components";
import { ComponentShowcase } from "./scenes/ComponentShowcase";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
