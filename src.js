(() => {
  // Configuration
  const Config = {
    pluginName: "insomnia-plugin-copy-console-and-response",
    setSeparator: "",
    displayCurrentLocalTime: false,
    hideConnectionProcessDetails: false,
    maskingLogFiledRegex: /([Cc]ookie:|[Aa]uthorization: Bearer|"access_token":)(.*)/g,
    waitTimeForInitialization: 3000,
    buttonPosition: "Sign up for free",
    buttonText: "Console",
  };

  // Utility functions
  const Utils = {
    // Wait for specified time
    wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

    appendCss: cssDefinition => {
      if (Array.from(document.querySelectorAll('style')).some(style => style.innerHTML === cssDefinition)) return;
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = cssDefinition;
      document.head.appendChild(style);
    },

    formatDate: date => {
      const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const d = new Date(date);
      const pad = num => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${weekday[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    maskSensitiveInfo: text => text.replaceAll(Config.maskingLogFiledRegex, "$1 ****")
  };

  // DOM operation functions
  const DomOperations = {
    clickElement: async ({ selector, xpath, getTarget }) => {
      try {
        let el = null;
        if (selector) {
          el = document.querySelector(selector);
        } else if (xpath) {
          el = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        }
        if (getTarget && el) el = getTarget(el);
        el?.click();
        return !!el;
      } catch (e) {
        console.error("Failed to click element:", e);
        return false;
      }
    },

    clickTimelineTab: async () => DomOperations.clickElement({ selector: "[data-key='timeline']" }),

    clickPreviewTab: async () => DomOperations.clickElement({ selector: "[data-key='preview']" }),

    clickPreviewModeModal: async () =>
      DomOperations.clickElement({
        selector: "[data-key='preview']",
        getTarget: el => el.parentElement?.nextElementSibling?.querySelector("[type='Button']")
      }),

    clickSourceCodeInPreviewMode: async () =>
      DomOperations.clickElement({
        xpath: '//*[not(contains(name(), "script")) and contains(text(), "Source Code")]'
      }),

    insertElementAtPosition: (element, referenceText) => {
      try {
        const node = document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + referenceText + '")]',
          document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        if (node?.parentNode) {
          node.parentNode.insertBefore(element, node.nextSibling);
          return true;
        }
      } catch (e) { console.error("Failed to insert element:", e); }
      return false;
    }
  };

  // Data processing functions
  const DataProcessor = {
    getPanelHeaderValues: result => {
      return new Promise((resolve, reject) => {
        try {
          const panelAreaElement = document.querySelector("[data-testid='response-pane']").querySelector(`[aria-live="polite"]`);
          const panelValues = Array.from(panelAreaElement.childNodes).map(e => e.innerText);
          // s or ms
          const responseTotalTime = panelValues[1];
          const responsedSize = panelValues[2];
          const responsedDatetime = panelAreaElement.nextSibling?.getElementsByTagName("span")[0].getAttribute("title");

          let requestStartTime = Utils.formatDate(responsedDatetime);
          if (!responseTotalTime.includes("ms") && responseTotalTime.includes("s")) {
            // 123.4 s -> 123.4 -> 123400
            const responseTimeInSec = responseTotalTime.replace(/\ss/, "") * 1000;
            requestStartTime = Utils.formatDate(new Date(responsedDatetime) - responseTimeInSec);
          }

          if (Config.setSeparator) result.value += Config.setSeparator + "\n";
          result.value += [requestStartTime, responseTotalTime, responsedSize].join(", ") + "\n";
          resolve(result);
        } catch (e) {
          console.error("Failed to get header values:", e);
          reject(e);
        }
      });
    },

    getTimeline: async result => {
      try {
        const cm = document.querySelector("[data-key='timeline']")
          .parentElement.nextElementSibling?.querySelector(".CodeMirror")?.CodeMirror;

        if (cm) {
          let text = cm.getValue().replace(/\n[|]\s/gm, "\n");

          if (Config.hideConnectionProcessDetails) {
            text = text.replace(/(?:^|\n)\*[^\n]+/g, "").replace(/\n\n/g, "\n") + "\n";
          } else {
            // Add line breaks for better readabligity of response body
            text = text + "\n\n";
          }

          if (Config.displayCurrentLocalTime) {
            text = text.replace(/([d|D]ate:.*GMT)/g, s =>
              s + " ( LocalTime: " + Utils.formatDate(new Date(Date.parse(s))) +
              " - provided by " + Config.pluginName + " )"
            );
          }

          result.value += text;
        }
        return result;
      } catch (e) {
        console.error("Failed to get timeline data:", e);
        return result;
      }
    },

    getPreviewContent: result => {
      return new Promise((resolve, reject) => {
        try {
          const cm = document.querySelector("[data-key='preview']")
            .parentElement.nextElementSibling?.querySelector(".CodeMirror")?.CodeMirror;

          let content = ""
          if (cm) {
            content = cm.getValue();
          }

          // Remove "Rawxxxxxxxxxx " prefix and remove zero-width characters
          let formatted = content.replace(/[\u200B-\u200D\uFEFF]/g, "");

          try {
            // Format if JSON
            formatted = JSON.stringify(JSON.parse(formatted), null, 2);
          } catch (e) {
            console.error("Failed to JSON.stringify(JSON.parse(formatted), null, 2):", e);
          } // Leave as is if not JSON

          result.value += formatted + "\n";
          resolve(result);
        } catch (e) {
          console.error("Failed to get preview:", e);
          reject(e);
        }
      });
    },

    copyToClipboard: result => {
      return new Promise((resolve, reject) => {
        try {
          navigator.clipboard.writeText(Utils.maskSensitiveInfo(result.value));
          resolve(result);
        } catch (e) {
          console.error("Failed to copy to clipboard:", e);
          reject(e);
        }
      });
    }
  };

  const createCopyButton = () => {
    const copyButton = document.createElement("div");

    // Define CSS
    Utils.appendCss(`
      .${Config.pluginName}-icon {
        box-sizing: border-box;
        display: inline-block;
        font-size: inherit;
        font-style: normal;
        height: 1em;
        position: relative;
        text-indent: -9999px;
        vertical-align: middle;
        width: 1em;
      }
      
      .${Config.pluginName}-icon::before,
      .${Config.pluginName}-icon::after {
        content: "";
        display: block;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .${Config.pluginName}-icon-copy::before {
        border: .1rem solid currentColor;
        border-bottom-color: transparent;
        border-radius: .1em;
        border-right-color: transparent;
        height: .8em;
        left: 40%;
        top: 40%;
        width: .7em;
      }
      
      .${Config.pluginName}-icon-copy::after {
        border: .1rem solid currentColor;
        border-radius: .1em;
        height: .8em;
        left: 60%;
        top: 60%;
        width: .7em;
      }
    `);

    // Create button element
    copyButton.style.cssText = "display: flex;";
    copyButton.innerHTML = `
    <button style="padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%); display: flex; justify-content: center; align-items: center;">
      <div class="${Config.pluginName}-icon ${Config.pluginName}-icon-copy" style="margin: 2px 5px 0px 3px"></div>
      <div style="display: flex; justify-content: center; align-items: center;">${Config.buttonText}</div>
    </button>
    `;

    // Data collection process
    const processData = async () => {
      try {
        const result = { value: "" };

        // Collect timeline data
        await DomOperations.clickTimelineTab();
        await Utils.wait(100);
        await DataProcessor.getPanelHeaderValues(result);
        await DataProcessor.getTimeline(result);

        // Collect preview data
        await DomOperations.clickPreviewTab();
        await Utils.wait(100);
        await DomOperations.clickPreviewModeModal();
        await Utils.wait(200);
        await DomOperations.clickSourceCodeInPreviewMode();
        await Utils.wait(300);
        await DataProcessor.getPreviewContent(result);

        // Execute copy
        await DataProcessor.copyToClipboard(result);
        console.log("Copying data completed");
      } catch (e) {
        console.error("Data collection process failed:", e);
      }
    };

    // Set click event
    copyButton.addEventListener("click", processData);

    // Place button
    DomOperations.insertElementAtPosition(copyButton, Config.buttonPosition);

    return copyButton;
  };

  // Initialize the plugin
  setTimeout(() => {
    try {
      createCopyButton();
      console.log(`${Config.pluginName} plugin initialized`);
    } catch (e) {
      console.error("Plugin initialization failed:", e);
    }
  }, Config.waitTimeForInitialization);

})();
