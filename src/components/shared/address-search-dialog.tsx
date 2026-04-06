"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void
        onclose?: () => void
        width?: string | number
        height?: string | number
      }) => { open: () => void; embed: (el: HTMLElement) => void }
    }
  }
}

type DaumPostcodeResult = {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  buildingName: string
  apartment: string
  autoRoadAddress: string
  autoJibunAddress: string
  userSelectedType: "R" | "J"
}

export type AddressResult = {
  zonecode: string
  address: string
  buildingName: string
}

type AddressSearchButtonProps = {
  onSelect: (result: AddressResult) => void
  label?: string
}

function loadDaumPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Daum Postcode script failed to load"))
    document.head.appendChild(script)
  })
}

export function AddressSearchButton({ onSelect, label = "주소 검색" }: AddressSearchButtonProps) {
  const handleClick = useCallback(async () => {
    try {
      await loadDaumPostcodeScript()
      new window.daum.Postcode({
        oncomplete(data: DaumPostcodeResult) {
          const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress
          onSelect({
            zonecode: data.zonecode,
            address,
            buildingName: data.buildingName,
          })
        },
      }).open()
    } catch (error) {
      console.error("Address search error:", error)
    }
  }, [onSelect])

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      <MapPin className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
