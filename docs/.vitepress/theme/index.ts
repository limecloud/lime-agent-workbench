import DefaultTheme from "vitepress/theme";
import LiveMatrix from "./LiveMatrix.vue";
import MermaidDiagram from "./MermaidDiagram.vue";
import SubagentsLiveLoop from "./SubagentsLiveLoop.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LiveMatrix", LiveMatrix);
    app.component("MermaidDiagram", MermaidDiagram);
    app.component("SubagentsLiveLoop", SubagentsLiveLoop);
  }
};
