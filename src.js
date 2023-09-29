(() => {
  
  /* Optional settings */
  const OptionalSettingSetSeparator = "";
  const OptionalSettingDisplayCurrentTimezoneTime = false;
  
  /* Wait specified millisecond */
  const waitMillisecond = (millisecond) => {
    return new Promise(resolve => setTimeout(resolve, millisecond));
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
      /* 1回のクリックだと反応しない場合があるので二度Clickする */
      document.querySelector("[data-key='preview']").getElementsByTagName("i")[0].click();
      document.querySelector("[data-key='preview']").getElementsByTagName("i")[0].click();
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
      const timelineElement = document.querySelector("[aria-label='Response pane tabs']").nextElementSibling;
      timelineElement.getElementsByClassName("CodeMirror-scroll")[0].scroll(0, 10000);
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
  
  const getTimelineContent = (result) => {
    return new Promise((resolve) => {
      const timelineElement = document.querySelector("[aria-label='Response pane tabs']").nextElementSibling;
      /* 先頭の xxxxxxxxxx という文字を削って保存 + GMTのよこにJST追加 */
      const timelineContent = Array.from(timelineElement.getElementsByTagName("pre")).map(e => e.textContent).join("\n").slice(10);
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
      result.value += timelineContent;
      if (OptionalSettingDisplayCurrentTimezoneTime) {
        result.value = result.value.replace(/([d|D]ate:.*GMT)/g, (s) => {
          return s + " ( " + getFormattedDate(new Date(Date.parse(s))) + " )";
        });
      }
      resolve(result);
    });
  };
  
  const getPreviewContent = (result) => {
    return new Promise((resolve) => {
      const previewContent = document.querySelector("[aria-label='Response pane tabs']").nextElementSibling.textContent;
      /* remove prefix "xxxxxxxxxx " */
      let previewContentResult = previewContent.slice(11);
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
      navigator.clipboard.writeText(result.value);
      resolve(result);
    });
  };
  
  const createCopyButton = () => {
    /* <button type="button" style="padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%);">Copy</button> */
    const copyButton = document.createElement("div");
    copyButton.style.cssText = "display: flex;";
    copyButton.innerHTML = `
    <button style="padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%); justify-content: center; align-items: center;">
        Copy
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
        await scrollTimeline();
        await waitMillisecond(100);
        await getPanelHeaderValues(result);
        await getTimelineContent(result);
        await clickPreviewTab();
        await waitMillisecond(100);
        await clickPreviewModeModal();
        await waitMillisecond(200);
        await clickRawDataInPreviewMode()
        await waitMillisecond(300);
        await getPreviewContent(result);
        await copy(result);
      })();
    })
    const searchTargetText = "Sign Up";
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
