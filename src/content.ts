import type { PlasmoCSConfig } from "plasmo"

// content/content.ts
export type Field = {
  id: string
  label: string
  type: string
  value: string
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape_elements") {
    //get all fields on the page, even in iframes
    const elements = document.querySelectorAll("input, textarea, select")
    let data: any = Array.from(elements)
    const embeds = document.querySelectorAll("iframe")
    for (const embed of embeds) {
      const iframeElements = embed.contentDocument?.querySelectorAll(
        "input, textarea, select"
      )
      if (iframeElements) {
        data.push(...Array.from(iframeElements))
      }
    }
    data = data.map((el) => {
      if (
        el.type === "hidden" ||
        el.type === "submit" ||
        (!el.id && !el.name)
      ) {
        return
      }
      const labelElement =
        el.id && el.parentElement.querySelector("label[for=" + el.id + "]")
      return {
        id: el.id || el.name,
        label: labelElement?.textContent || el.placeholder || el.name || el.id,
        type: el.tagName,
        value: el.value
      }
    })
    sendResponse({
      data: data.filter((el) => el),
      location: window.location
    })
  }

  if (request.action === "fill_form") {
    const { data } = request
    data.forEach((field: Field) => {
      const element: any =
        document.querySelector(`#${field.id}`) ||
        document.querySelector(`[name="${field.id}"]`) ||
        document
          .querySelector("iframe")
          ?.contentDocument?.querySelector(`#${field.id}`) ||
        document
          .querySelector("iframe")
          ?.contentDocument?.querySelector(`[name="${field.id}"]`)
      if (element) {
        if (field.type === "SELECT") {
          const selectElement = element as HTMLSelectElement
          const option: any = selectElement.querySelector(
            `option[value="${field.value}"]`
          )
          if (option) {
            option.selected = true
          }
        } else {
          element.value = field.value
        }
      }
    })
    sendResponse({ message: "Form filled" })
  }
})
console.log("content script loaded")
