(() => {
  
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
      result.value += "----------------------------------\n";
      result.value += values;
      resolve(result);
    });
  };
  
  const getTimelineContent = (result) => {
    return new Promise((resolve) => {
      const timelineElement = document.querySelector("[aria-label='Response pane tabs']").nextElementSibling;
      const timelineContent = Array.from(timelineElement.getElementsByTagName("pre")).map(e => e.textContent).join("\n");
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
      /* 先頭の xxxxxxxxxx という文字を削って保存 + GMTのよこにJST追加 */
      result.value += timelineContent.slice(10).replace(/(date:.*GMT)/g, (s) => {
        return s + " ( " + getFormattedDate(new Date(Date.parse(s))) + " JST )";
      });
      resolve(result);
    });
  };
  
  const getPreviewContent = (result) => {
    return new Promise((resolve) => {
      const responseElement = document.querySelector("[aria-label='Response pane tabs']").nextElementSibling;
      const responseContent = Array.from(responseElement.getElementsByTagName("pre")).map(e => e.textContent).join("\n");
      /* 先頭の xxxxxxxxxx という文字を削って保存 */
      result.value += responseContent.slice(10) + "\n";
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
    const copyButton = document.createElement("button");
    copyButton.style.cssText = "padding: 10px;color: #FFF;background: rgb(130 130 130 / 35%);";
    copyButton.textContent = "Copy";
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
        await waitMillisecond(100);
        await clickPreviewTab();
        await waitMillisecond(100);
        await getPreviewContent(result);
        await copy(result);
      })();
    })
    const searchTargetText = "Sign Up";
    const nodesSnapshot = document.evaluate('//*[not(contains(name(), "script")) and contains(text(), "' + searchTargetText + '")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const signUpNode = nodesSnapshot.snapshotItem(0);
    signUpNode.parentNode.insertBefore(copyButton, signUpNode.nextSibling);
  };
  
  /* メイン処理 */
  const main = () => {
    createCopyButton();
  };
  
  main();
})()
