import { defineConfig } from "vitepress";

const repoBase = process.env.VITEPRESS_BASE ?? "/lime-agent-workbench/";

export default defineConfig({
  lang: "zh-CN",
  title: "Lime Agent Workbench",
  description: "Lime 的 AgentRuntime 与 AgentUI 工作台标准",
  base: repoBase,
  head: [["link", { rel: "icon", type: "image/svg+xml", href: `${repoBase}logo.svg` }]],
  cleanUrls: true,
  lastUpdated: true,
  appearance: "dark",
  markdown: {
    lineNumbers: true,
    config(md) {
      const defaultFence = md.renderer.rules.fence;
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = token.info.trim();

        if (info === "mermaid") {
          const code = JSON.stringify(token.content);
          return `<ClientOnly><MermaidDiagram :code='${code}' /></ClientOnly>`;
        }

        return defaultFence
          ? defaultFence(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
      };
    }
  },
  themeConfig: {
    logo: "/logo.svg",
    outline: {
      label: "本页目录"
    },
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    lastUpdated: {
      text: "最后更新"
    },
    darkModeSwitchLabel: "外观",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    langMenuLabel: "切换语言",
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索",
                buttonAriaLabel: "搜索文档"
              },
              modal: {
                displayDetails: "显示详细列表",
                resetButtonTitle: "重置搜索",
                backButtonTitle: "关闭搜索",
                noResultsText: "没有结果",
                footer: {
                  selectText: "选择",
                  selectKeyAriaLabel: "回车",
                  navigateText: "导航",
                  navigateUpKeyAriaLabel: "上箭头",
                  navigateDownKeyAriaLabel: "下箭头",
                  closeText: "关闭",
                  closeKeyAriaLabel: "Esc"
                }
              }
            }
          }
        }
      }
    },
    nav: [
      { text: "文档", link: "/introduction" },
      { text: "Subagents", link: "/subagents" },
      { text: "SDKs", link: "/sdk/typescript/overview" }
    ],
    sidebar: [
      {
        text: "入门",
        items: [
          { text: "Lime Agent 总览", link: "/introduction" },
          { text: "MCP、A2A 与 AG-UI", link: "/agentic-protocols" },
          { text: "Subagents 标准", link: "/subagents" },
          {
            text: "Quickstart",
            collapsed: false,
            items: [
              { text: "产品应用接入", link: "/quickstart/product-app" },
              { text: "构建集成", link: "/quickstart/" },
              { text: "Runtime 提供方", link: "/quickstart/runtime-provider" },
              { text: "UI 消费方", link: "/quickstart/ui-consumer" }
            ]
          }
        ]
      },
      {
        text: "核心概念",
        items: [
          { text: "核心架构", link: "/concepts/architecture" },
          { text: "事件", link: "/concepts/events" },
          { text: "Agents", link: "/concepts/agents" },
          { text: "Middleware", link: "/concepts/middleware" },
          { text: "消息", link: "/concepts/message-parts" },
          { text: "Reasoning", link: "/concepts/reasoning" },
          { text: "过程投影", link: "/concepts/process-tree" },
          { text: "状态管理", link: "/concepts/state-and-hydration" },
          { text: "Interrupts", link: "/concepts/human-in-the-loop" },
          { text: "Serialization", link: "/concepts/serialization" },
          { text: "工具", link: "/concepts/tools" },
          { text: "Capabilities", link: "/concepts/capabilities" },
          { text: "生成式 UI", link: "/concepts/generative-ui" }
        ]
      },
      {
        text: "Lime 契约",
        items: [
          { text: "Runtime 事件", link: "/contracts/runtime-event" },
          { text: "Runtime 读模型", link: "/contracts/runtime-read-model" },
          { text: "UI 投影", link: "/contracts/ui-projection" },
          { text: "App Server 宿主", link: "/contracts/app-server-host" },
          { text: "一致性验收", link: "/contracts/conformance" }
        ]
      },
      {
        text: "草案提案",
        items: [
          { text: "总览", link: "/drafts/" },
          { text: "Process Projection", link: "/drafts/process-projection" },
          { text: "Meta Events", link: "/drafts/meta-events" }
        ]
      },
      {
        text: "教程",
        items: [
          { text: "Content Studio 接入", link: "/tutorials/content-studio" },
          { text: "调试 Runtime 事件", link: "/tutorials/debugging" }
        ]
      },
      {
        text: "开发",
        items: [
          { text: "更新记录", link: "/development/updates" },
          { text: "路线图", link: "/development/roadmap" },
          { text: "贡献指南", link: "/development/contributing" },
          { text: "反馈入口", link: "/talk-to-us" }
        ]
      },
      {
        text: "SDKs",
        items: [
          {
            text: "TypeScript",
            items: [
              { text: "总览", link: "/sdk/typescript/overview" },
              { text: "Package boundaries", link: "/sdk/typescript/package-boundaries" },
              { text: "Core types", link: "/sdk/typescript/core-types" },
              { text: "Runtime client", link: "/sdk/typescript/runtime-client" },
              { text: "UI projection", link: "/sdk/typescript/ui-projection" },
              { text: "React surfaces", link: "/sdk/typescript/react-surfaces" },
              { text: "Conformance", link: "/sdk/typescript/conformance" }
            ]
          },
          {
            text: "Python",
            items: [
              { text: "总览", link: "/sdk/python/overview" },
              { text: "Fixture tools", link: "/sdk/python/fixtures" }
            ]
          },
          {
            text: "Runtime Schemas",
            items: [
              { text: "事件 Schema", link: "/sdk/schemas/runtime-event" },
              { text: "投影 Schema", link: "/sdk/schemas/ui-projection" }
            ]
          }
        ]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/limecloud/lime-agent-workbench" }
    ],
    footer: {
      message: "Lime Agent Workbench 是面向 Lime AgentRuntime 与 AgentUI 的治理优先标准。",
      copyright: "版权所有 Lime"
    }
  }
});
