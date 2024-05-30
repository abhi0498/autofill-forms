import toast, { Toaster } from "react-hot-toast"

import { useStorage } from "@plasmohq/storage/hook"

import "~style.css"

import type { SavedForm } from "~popup"

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset"
]
export type Option = {
  theme: string
}
function Options() {
  const [options, setOptions] = useStorage<Option>("options", {
    theme: "night"
  })
  const [savedForms, setSavedForms] = useStorage<SavedForm>("saved-forms", {})

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        const data = JSON.parse(text)
        //check if data is valid and matches the SavedForm type
        if (
          data &&
          typeof data === "object" &&
          Object.keys(data).every(
            (key) =>
              Array.isArray(data[key]) &&
              data[key].every(
                (item) =>
                  item?.id &&
                  item?.name &&
                  item?.url &&
                  item?.data &&
                  Array.isArray(item?.data)
              )
          )
        ) {
          setSavedForms(data as any)
          toast.success("Forms imported successfully")
        } else {
          toast.error("Invalid data")
        }
      }
    }
    input.click()
  }
  const handleExport = () => {
    const dataStr = JSON.stringify(savedForms, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "autofill-forms.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="h-screen w-screen flex justify-center pt-16"
      data-theme={options.theme}>
      <Toaster position="top-right" />

      <dialog id="my_modal_1" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Warning</h3>
          <p className="py-4 prose">
            Are you sure you want to clear all saved forms? This action cannot
            be undone.
          </p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-4">
              <button className="btn">Close</button>
              <button
                className="btn btn-error"
                onClick={() => {
                  setSavedForms({})
                  toast.success("All forms cleared")
                  ;(document.getElementById("my_modal_1") as any).close()
                }}>
                Clear
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <div className="card p-4 shadow-lg bg-base-100 text-base-content max-h-[60vh] w-1/2">
        <h1 className="text-xl font-semibold">AutoFill Form 🚀 </h1>
        <p className="text-sm mt-2">
          This extension is designed to save form data and fill it back in when
          needed. You can save multiple forms for a website and fill them back
          in with a click.
        </p>
        <h2 className="text-lg font-semibold mt-4">Options</h2>
        <div className="flex items-center gap-2 mt-4">
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Theme</span>
            </div>
            <select
              className="select select-bordered w-full max-w-xs"
              value={options.theme}
              onChange={(e) => {
                setOptions({ theme: e.target.value })
              }}>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="btn btn-error mt-4 w-60"
          onClick={() =>
            (document.getElementById("my_modal_1") as any).showModal()
          }>
          Clear all saved forms
        </button>

        <h2 className="mt-4 text-lg font-semibold">Import/Export</h2>
        <div className="flex gap-2 mt-4">
          <input type="file" className="hidden" />
          <button className="btn btn-primary" onClick={handleImport}>
            Import
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
export default Options
