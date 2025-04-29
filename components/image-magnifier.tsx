"use client"

import { useState, useRef, useEffect } from "react"

interface ImageMagnifierProps {
  src: string
  alt: string
  width?: string
  height?: string
  magnifierHeight?: number
  magnifierWidth?: number
  zoomLevel?: number
}

export default function ImageMagnifier({
  src,
  alt,
  width = "100%",
  height = "auto",
  magnifierHeight = 150,
  magnifierWidth = 150,
  zoomLevel = 2.5,
}: ImageMagnifierProps) {
  const [[x, y], setXY] = useState([0, 0])
  const [[imgWidth, imgHeight], setSize] = useState([0, 0])
  const [showMagnifier, setShowMagnifier] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current.getBoundingClientRect()
      setSize([width, height])
    }
  }, [src])

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
      }}
    >
      <img
        ref={imgRef}
        src={src || "/placeholder.svg"}
        alt={alt}
        style={{
          height: "100%",
          width: "100%",
          objectFit: "contain",
        }}
        onMouseEnter={(e) => {
          // update image size and turn on magnifier
          const elem = e.currentTarget
          const { width, height } = elem.getBoundingClientRect()
          setSize([width, height])
          setShowMagnifier(true)
        }}
        onMouseMove={(e) => {
          // update cursor position
          const elem = e.currentTarget
          const { top, left } = elem.getBoundingClientRect()

          // calculate cursor position on the image
          const x = e.pageX - left - window.scrollX
          const y = e.pageY - top - window.scrollY
          setXY([x, y])
        }}
        onMouseLeave={() => {
          // close magnifier
          setShowMagnifier(false)
        }}
      />

      <div
        style={{
          display: showMagnifier ? "" : "none",
          position: "absolute",
          // prevent magnifier from being positioned outside the image
          left: Math.min(x - magnifierWidth / 2, imgWidth - magnifierWidth),
          top: Math.min(y - magnifierHeight / 2, imgHeight - magnifierHeight),
          pointerEvents: "none",
          width: `${magnifierWidth}px`,
          height: `${magnifierHeight}px`,
          opacity: "1",
          border: "1px solid lightgray",
          backgroundColor: "white",
          backgroundImage: `url('${src}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
          backgroundPositionX: `${-x * zoomLevel + magnifierWidth / 2}px`,
          backgroundPositionY: `${-y * zoomLevel + magnifierHeight / 2}px`,
          zIndex: 10,
        }}
      ></div>
    </div>
  )
}
