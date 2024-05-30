import { useTheme } from "@"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import {
  FiArrowLeft,
  FiPlay,
  FiPlus,
  FiSave,
  FiSettings,
  FiTrash
} from "react-icons/fi"

import { useStorage } from "@plasmohq/storage/hook"

import type { Field } from "~content"

import "~style.css"

import type { Option } from "~options"

export type SavedForm = {
  [key: string]: {
    name: string
    url: string
    data: Field[]
    id: Number
  }[]
}
function IndexPopup() {
  const [isAddMode, setIsAddMode] = useState<boolean>(false)

  const [savedForms, setSavedForms] = useStorage<SavedForm>("saved-forms", {})
  const [options, setOptions] = useStorage<Option>("options", {
    theme: "night"
  })

  const [name, setName] = useState<string>("")

  const [fieldsToSave, setFieldsToSave] = useState<string[]>([])
  const [location, setLocation] = useState<{
    host: string
    href: string
  }>({
    host: "",
    href: ""
  })

  const [scrapedData, setScrapedData] = useState<Field[]>([])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "scrape_elements" },
          (response) => {
            if (response && response.data) {
              setScrapedData(response.data)
            }
            if (response && response.location) {
              setLocation({
                host: response.location.host,
                href: response.location.href
              })
            }
          }
        )
      }
    })
  }, [])

  const handleFill = (value) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "fill_form", data: value.data },
          (response) => {
            console.log({ response })
          }
        )
      }
    })
  }
  const handleSave = () => {
    if (!name) {
      toast.error("Please enter a name for the form")
      return
    }
    if (!fieldsToSave.length) {
      toast.error("Please select at least one field to save")
      return
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: "scrape_elements" },
          (response) => {
            const data = []

            for (const field of fieldsToSave) {
              const fieldData = response.data.find((el) => el.id === field)
              if (fieldData) {
                data.push(fieldData)
              }
            }

            setSavedForms({
              ...savedForms,
              [location.host]: [
                ...(savedForms[location.host] || []),
                {
                  name:
                    (document.getElementById("form-name") as HTMLInputElement)
                      ?.value || "Form",
                  url: location.href,
                  data,
                  id: Date.now()
                }
              ]
            })
            setFieldsToSave([])
            setName("")
            setIsAddMode(false)
            toast.success("Form saved")
          }
        )
      }
    })
  }
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setFieldsToSave(scrapedData.map((field) => field.id))
    } else {
      setFieldsToSave([])
    }
  }
  const handleCheckbox = (e, identifier) => {
    if (e.target.checked) {
      setFieldsToSave([...fieldsToSave, identifier])
    } else {
      setFieldsToSave(fieldsToSave.filter((name) => name !== identifier))
    }
  }
  const handleDelete = (value) => {
    setSavedForms({
      ...savedForms,
      [location.host]: savedForms[location.host].filter(
        (v) => v.id !== value.id
      )
    })
    toast.success(`Form data for ${value.name} deleted`)
  }

  return (
    <div className="p-4 w-[40rem] flex flex-col" data-theme={options.theme}>
      <Toaster position="top-right" />
      <div className="flex gap-2 items-center sticky top-0 py-4 bg-inherit">
        {isAddMode ? (
          <FiArrowLeft
            className="cursor-pointer"
            size={14}
            onClick={() => {
              setIsAddMode(false)
              setFieldsToSave([])
              setName("")
            }}
          />
        ) : null}
        <h1 className="text-xl font-semibold">AutoFill Form 🚀 </h1>

        {!isAddMode ? (
          <>
            <button
              className="btn btn-sm btn-primary ml-auto "
              title="Add form"
              onClick={() => {
                if (scrapedData.length === 0) {
                  toast.error(
                    "No form fields found on this page which can be saved"
                  )
                  return
                }
                setIsAddMode(true)
              }}>
              <FiPlus />
            </button>
            <button
              className="btn btn-sm btn-primary ml-2"
              onClick={() => {
                chrome.tabs.create({ url: "options.html" })
              }}>
              <FiSettings />
            </button>
          </>
        ) : null}
      </div>
      {!isAddMode ? (
        <>
          <div className="flex justify-between items-center">
            <p className="prose text-lg font-semibold py-2">
              Saved forms for this website:
            </p>
          </div>
          {savedForms[location.host]?.length ? (
            <ul className="w-full max-h-64">
              {(savedForms[location.host] || []).map((value) => (
                <li key={value.name} className="py-2 ">
                  <div className="collapse collapse-arrow">
                    <input type="checkbox" />
                    <div className="collapse-title flex justify-between items-center">
                      <p className="text-lg">{value.name}</p>
                      <div className="flex items-center gap-3">
                        <button
                          title="Fill"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleFill(value)}>
                          <FiPlay />
                        </button>
                        <button
                          title="Delete"
                          className="btn btn-sm btn-error"
                          onClick={() => handleDelete(value)}>
                          <FiTrash />
                        </button>
                      </div>
                    </div>
                    <div className="collapse-content">
                      <ul>
                        {value.data.map((field) => (
                          <li key={field.id}>
                            <p>
                              <strong>{field.label}</strong>: {field.value}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="prose prose-base py-2">
              No saved forms found. Click the + button to save a form
            </p>
          )}
        </>
      ) : null}

      {isAddMode ? (
        <div>
          <div className="flex gap-2 items-center">
            <p className="prose prose-base py-2">
              Fill out the form on the webpage and save
            </p>
          </div>

          <input
            className="input input-bordered w-full max-w-xs"
            id="form-name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="prose prose-base py-2">
            Select the fields you want to save
          </p>

          <label className="label cursor-pointer">
            <span className="label-text">Select all</span>
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              onChange={handleSelectAll}
              checked={fieldsToSave.length === scrapedData.length}
            />
          </label>
          <p className="my-2" />
          <ul className="max-h-96 overflow-y-auto">
            {scrapedData.map((field) => {
              const identifier = field.id
              return (
                <li key={identifier}>
                  <label className="label cursor-pointer">
                    <span className="label-text">{field.label}</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      onChange={(e) => handleCheckbox(e, identifier)}
                      checked={fieldsToSave.includes(identifier)}
                    />
                  </label>
                </li>
              )
            })}
          </ul>
          <button
            className="btn btn-primary btn-md w-full"
            onClick={handleSave}
            title="Save form">
            Save <FiSave size={18} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default IndexPopup
