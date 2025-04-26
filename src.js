(() => {

  /* Constant value */
  const PluginName = "insomnia-plugin-copy-timeline-and-response";

  /* Optional settings */
  const OptionalSettingSetSeparator = "";
  const OptionalSettingDisplayCurrentTimezoneTime = false;
  const MaskingLogFiledRegex = /([Cc]ookie:|[Aa]uthorization: Bearer|"access_token":)(.*)/g;

  /* Wait specified millisecond */
  const waitMillisecond = (millisecond) => {
    return new Promise(resolve => setTimeout(resolve, millisecond));
  };

  const appendCssDefinition = (cssDefinition) => {
    // Define main class style
    let styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = cssDefinition;
    document.getElementsByTagName('head')[0].appendChild(styleElement);
  };

  const clickTimelineTab = () => {
    return new Promise((resolve) => {
      document.querySelector("[data-key='timeline']").click();
      resolve();
    });
  };

  const clickPreviewTab = () => {
    return new Promise((resolve) => {
      document.querySelector("[data-key='preview']").click();
      resolve();
    });
  };

  const clickPreviewModeModal = () => {
    return new Promise((resolve) => {
      document.querySelector("[data-key='preview']").parentElement.nextElementSibling.querySelector("[type='Button']").click();
      resolve();
    });
  };

  const clickRawDataInPreviewMode = () => {
    return new Promise((resolve) => {
      const searchTargetText = "Raw Data"
      document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + searchTargetText + '")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0).click();
      resolve();
    });
  };

  const scrollTimeline = () => {
    return new Promise((resolve) => {
      const timelineElement = document.querySelector("[data-key='timeline']").parentElement.nextElementSibling;
      const codeMirrorScroll = timelineElement.getElementsByClassName("CodeMirror-scroll")[0];
      // スクロール量を表示領域の高さ分に設定
      const scrollAmount = codeMirrorScroll.clientHeight;
      codeMirrorScroll.scroll(0, codeMirrorScroll.scrollTop + scrollAmount);
      resolve();
    });
  };

  const getPanelHeaderValues = (result) => {
    return new Promise((resolve) => {
      const panelHeaderValueElements = document.querySelector("[aria-live='polite']").getElementsByTagName("div");
      const values = Array.from(new Set(Array.from(panelHeaderValueElements).map(e => e.textContent))).join(", ");
      if (OptionalSettingSetSeparator !== "") {
        result.value += OptionalSettingSetSeparator + "\n";
      }
      result.value += values;
      resolve(result);
    });
  };

  const fetchTimelineContent = () => {
    /* curl用のprefix文字列を削除 */
    Array.from(document.getElementsByClassName("cm-curl-prefix cm-curl-data")).forEach(e => e.remove());
    const timelineElement = document.querySelector("[data-key='timeline']").parentElement.nextElementSibling;
    /* 先頭の xxxxxxxxxx という文字を削って保存 + GMTのよこにJST追加 */
    let timelineContent = Array.from(timelineElement.getElementsByTagName("pre"))
      .map(e => e.textContent).join("\n").slice(10);
    const getFormattedDate = (date) => {
      let weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      let yyyy = date.getFullYear();
      let mm = ("0" + (date.getMonth() + 1)).slice(-2);
      let dd = ("0" + date.getDate()).slice(-2);
      let hh = ("0" + date.getHours()).slice(-2);
      let mi = ("0" + date.getMinutes()).slice(-2);
      let ss = ("0" + date.getSeconds()).slice(-2);
      let week = weekday[date.getDay()];
      return `${yyyy}-${mm}-${dd} ${week} ${hh}:${mi}:${ss}`;
    };
    if (OptionalSettingDisplayCurrentTimezoneTime) {
      timelineContent = timelineContent.replace(/([d|D]ate:.*GMT)/g, (s) => {
        return s + " ( " + getFormattedDate(new Date(Date.parse(s))) + " )";
      });
    }
    return timelineContent;
  };

  const acquireCompleteTimeline = async (result) => {
    let mergedContent = "";
    let prevContent = "";
    let currentContent = "";
    do {
      await scrollTimeline();
      await waitMillisecond(100);
      currentContent = fetchTimelineContent();
      if (currentContent === prevContent) break;
      // 既に取得済みの部分を除いた新規差分を抽出
      let diff = currentContent.substring(prevContent.length);
      mergedContent += diff;
      prevContent = currentContent;
    } while (true);
    result.value += mergedContent;
  };

  const getPreviewContent = (result) => {
    return new Promise((resolve) => {
      const previewContent = document.querySelector("[data-key='preview']").parentElement.nextElementSibling.textContent;
      /* remove prefix "Rawxxxxxxxxxx " */
      let previewContentResult = previewContent.slice(14);
      try {
        /* If preview content is json string, it is formatted. */
        previewContentResult = JSON.stringify(JSON.parse(previewContentResult), null, 2);
      } catch (e) {
        console.log(e);
      }
      result.value += "\n" + previewContentResult + "\n";
      resolve(result);
    });
  };

  const copy = (result) => {
    return new Promise((resolve) => {
      /* Replace secret value */
      const v = result.value.replaceAll(MaskingLogFiledRegex, "$1 ****");
      navigator.clipboard.writeText(v);
      resolve(result);
    });
  };

  const createCopyButton = () => {
    /* <button type="button" style="padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%);">Copy</button> */
    const copyButton = document.createElement("div");

    /* icons.css/dist/icons.css at master · picturepan2/icons.css https://github.com/picturepan2/icons.css/blob/master/dist/icons.css */
    appendCssDefinition(`
      .${PluginName}-icon {
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
      
      .${PluginName}-icon::before,
      .${PluginName}-icon::after {
        content: "";
        display: block;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .${PluginName}-icon-copy::before {
        border: .1rem solid currentColor;
        border-bottom-color: transparent;
        border-radius: .1em;
        border-right-color: transparent;
        height: .8em;
        left: 40%;
        top: 40%;
        width: .7em;
      }
      
      .${PluginName}-icon-copy::after {
        border: .1rem solid currentColor;
        border-radius: .1em;
        height: .8em;
        left: 60%;
        top: 60%;
        width: .7em;
      }
    `)

    copyButton.style.cssText = "display: flex;";
    copyButton.innerHTML = `
    <button style="padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%); display: flex; justify-content: center; align-items: center;">
      <div class="${PluginName}-icon ${PluginName}-icon-copy" style="margin: 2px 5px 0px 3px"></div>
      <div style="display: flex; justify-content: center; align-items: center;">Timeline</div>
    </button>
    `;
    copyButton.addEventListener("click", () => {
      const result = {
        value: ""
      };
      (async () => {
        /* Wait searched results and gather these messages */
        await clickTimelineTab();
        await waitMillisecond(100);
        await getPanelHeaderValues(result);
        await acquireCompleteTimeline(result);
        await clickPreviewTab();
        await waitMillisecond(100);
        await clickPreviewModeModal();
        await waitMillisecond(200);
        await clickRawDataInPreviewMode();
        await waitMillisecond(300);
        await getPreviewContent(result);
        await copy(result);
      })();
    })
    const searchTargetText = "Sign up for free";
    const nodesSnapshot = document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + searchTargetText + '")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const signUpNode = nodesSnapshot.snapshotItem(0);
    signUpNode.parentNode.insertBefore(copyButton, signUpNode.nextSibling);
  };

  /* main */
  const main = () => {
    const waitTimeMillSeconds = 3000;
    setTimeout(createCopyButton, waitTimeMillSeconds);
  };

  main();
})()
