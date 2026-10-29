import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, MotionConfig } from "motion/react";
import App from "./App";
import "./index.css";
import "./showcase.css";

const root = document.getElementById("root");
if (!root) throw new Error("The page root is missing.");
const loadMotionFeatures = () => import('./motion-features').then(module => module.default);

createRoot(root).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user"><App /></MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
