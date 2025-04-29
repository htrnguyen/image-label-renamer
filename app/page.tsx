"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Save, ArrowRight, Download, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ImageMagnifier from "@/components/image-magnifier"

export default function Home() {
  const [files, setFiles] = useState<{ images: File[]; labels: File[] }>({ images: [], labels: [] })
  const [validPairs, setValidPairs] = useState<{ imageIndex: number; labelIndex: number }[]>([])
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [currentJson, setCurrentJson] = useState<any | null>(null)
  const [productName, setProductName] = useState("")
  const [productNameHistory, setProductNameHistory] = useState<string[]>([])
  const [side, setSide] = useState("F")
  const [count, setCount] = useState(1)
  const [history, setHistory] = useState<Array<{ original: string; renamed: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [renamedFiles, setRenamedFiles] = useState<{
    image: Blob | null
    json: Blob | null
    names: { image: string; json: string } | null
  }>({
    image: null,
    json: null,
    names: null,
  })
  const [allRenamedFiles, setAllRenamedFiles] = useState<
    Array<{
      originalName: string
      image: Blob
      json: Blob
      names: { image: string; json: string }
    }>
  >([])
  const [useOriginalName, setUseOriginalName] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [lastProductName, setLastProductName] = useState("")
  const [showDownloadHelp, setShowDownloadHelp] = useState(true)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(true)
  const [fileCounters, setFileCounters] = useState<number[]>([])

  const productNameRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to ensure product name is lowercase
  const setLowercaseProductName = (name: string) => {
    setProductName(name.toLowerCase())
  }

  // Keyboard shortcuts
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Only process shortcuts with Ctrl key
    if (e.ctrlKey) {
      if (e.key === "f") {
        e.preventDefault()
        setSide("F")
      } else if (e.key === "b") {
        e.preventDefault()
        setSide("B")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        if (currentPairIndex < validPairs.length - 1) {
          setCurrentPairIndex(currentPairIndex + 1)
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentPairIndex > 0) {
          setCurrentPairIndex(currentPairIndex - 1)
        }
      } else if ((e.key === "Enter" || e.key === "s") && !isProcessing && productName) {
        e.preventDefault()
        handleRenameCurrentFile()
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts)
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts)
  }, [currentPairIndex, validPairs.length, productName, isProcessing])

  // Load current file when index changes
  useEffect(() => {
    if (validPairs.length > 0 && currentPairIndex < validPairs.length) {
      loadCurrentFile()
    }
  }, [currentPairIndex, validPairs])

  // Focus on product name input when files are loaded
  useEffect(() => {
    if (validPairs.length > 0 && productNameRef.current) {
      productNameRef.current.focus()
    }
  }, [validPairs.length])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const selectedFiles = Array.from(e.target.files)
    const imageFiles: File[] = []
    const labelFiles: File[] = []

    // Process selected files
    selectedFiles.forEach((file) => {
      const filePath = file.webkitRelativePath
      const pathParts = filePath.split("/")

      // Only process files that are in the images or labels subdirectories
      if (pathParts.length >= 2) {
        const folderName = pathParts[1]

        if (folderName === "images" && file.name.toLowerCase().endsWith(".jpg")) {
          imageFiles.push(file)
        } else if (folderName === "labels" && file.name.toLowerCase().endsWith(".json")) {
          labelFiles.push(file)
        }
      }
    })

    // Sort files by name
    imageFiles.sort((a, b) => a.name.localeCompare(b.name))
    labelFiles.sort((a, b) => a.name.localeCompare(b.name))

    // Find valid pairs (images with corresponding JSON files)
    const pairs: { imageIndex: number; labelIndex: number }[] = []

    imageFiles.forEach((imageFile, imageIndex) => {
      const jsonName = imageFile.name.replace(".jpg", ".json")
      const labelIndex = labelFiles.findIndex((labelFile) => labelFile.name === jsonName)

      if (labelIndex !== -1) {
        pairs.push({ imageIndex, labelIndex })
      }
    })

    // Assign sequential counters starting from 1
    const counters = pairs.map((_, index) => index + 1)

    setFiles({ images: imageFiles, labels: labelFiles })
    setValidPairs(pairs)
    setFileCounters(counters)
    setCurrentPairIndex(0)
    setMessage(`Đã tải ${imageFiles.length} ảnh, ${labelFiles.length} file nhãn, ${pairs.length} cặp hợp lệ`)
  }

  const loadCurrentFile = async () => {
    if (validPairs.length === 0) return

    try {
      const { imageIndex, labelIndex } = validPairs[currentPairIndex]
      const imageFile = files.images[imageIndex]
      const jsonFile = files.labels[labelIndex]

      // Load image
      setCurrentImage(URL.createObjectURL(imageFile))

      // Load JSON
      const jsonContent = await jsonFile.text()
      setCurrentJson(JSON.parse(jsonContent))

      // Use the fixed counter for this file
      setCount(fileCounters[currentPairIndex] || currentPairIndex + 1)

      // If useOriginalName is true, set the product name to the original filename (without extension)
      if (useOriginalName) {
        const originalName = imageFile.name.replace(".jpg", "")
        setLowercaseProductName(originalName)
      } else {
        // Extract product name if it follows the format
        const fileNameParts = imageFile.name.replace(".jpg", "").split("_")
        if (fileNameParts.length === 3) {
          setLowercaseProductName(fileNameParts[0])
          setSide(fileNameParts[1])
        }
      }

      // Reset renamed files
      setRenamedFiles({ image: null, json: null, names: null })
    } catch (error) {
      console.error("Error loading current file:", error)
      setMessage("Lỗi khi tải file hiện tại")
    }
  }

  const handleRenameCurrentFile = async () => {
    if (validPairs.length === 0 || !currentImage || !currentJson) {
      setMessage("Không có file để đổi tên")
      return
    }

    setIsProcessing(true)

    try {
      const { imageIndex, labelIndex } = validPairs[currentPairIndex]
      const imageFile = files.images[imageIndex]
      const jsonFile = files.labels[labelIndex]

      const originalImageName = imageFile.name
      const originalBaseName = originalImageName.replace(".jpg", "")

      // Use the fixed counter for this file
      const fileCounter = fileCounters[currentPairIndex] || currentPairIndex + 1

      // Create new file names - use the fixed counter for this file
      const newBaseName = `${productName}_${side}_${fileCounter}`
      const newImageName = `${newBaseName}.jpg`
      const newJsonName = `${newBaseName}.json`

      // Update JSON content
      const updatedJson = { ...currentJson, imagePath: newImageName }
      const updatedJsonBlob = new Blob([JSON.stringify(updatedJson, null, 2)], { type: "application/json" })

      // Create renamed image file (same content, new name)
      const imageBlob = await imageFile.arrayBuffer()
      const renamedImageBlob = new Blob([imageBlob], { type: "image/jpeg" })

      // Update history - replace existing entry for this original name if it exists
      const existingHistoryIndex = history.findIndex((item) => item.original === originalBaseName)
      if (existingHistoryIndex !== -1) {
        // Replace the existing history entry
        const updatedHistory = [...history]
        updatedHistory[existingHistoryIndex] = {
          original: originalBaseName,
          renamed: newBaseName,
        }
        setHistory(updatedHistory)
      } else {
        // Add new history entry
        setHistory([
          ...history,
          {
            original: originalBaseName,
            renamed: newBaseName,
          },
        ])
      }

      // Store renamed files for download
      const newRenamedFiles = {
        image: renamedImageBlob,
        json: updatedJsonBlob,
        names: {
          image: newImageName,
          json: newJsonName,
        },
      }

      setRenamedFiles(newRenamedFiles)

      // Check if a file with this original name already exists in allRenamedFiles
      const existingFileIndex = allRenamedFiles.findIndex((file) => file.originalName === originalBaseName)

      if (existingFileIndex !== -1) {
        // Replace the existing file
        const updatedFiles = [...allRenamedFiles]
        updatedFiles[existingFileIndex] = {
          originalName: originalBaseName,
          image: renamedImageBlob,
          json: updatedJsonBlob,
          names: {
            image: newImageName,
            json: newJsonName,
          },
        }
        setAllRenamedFiles(updatedFiles)
      } else {
        // Add to all renamed files collection
        setAllRenamedFiles([
          ...allRenamedFiles,
          {
            originalName: originalBaseName,
            image: renamedImageBlob,
            json: updatedJsonBlob,
            names: {
              image: newImageName,
              json: newJsonName,
            },
          },
        ])
      }

      // Add product name to history if not already there
      if (!productNameHistory.includes(productName)) {
        setProductNameHistory([...productNameHistory, productName])
      }

      setMessage(`Đã đổi tên thành công: ${originalImageName} → ${newImageName}`)

      // Move to next file if available
      if (currentPairIndex < validPairs.length - 1) {
        setCurrentPairIndex(currentPairIndex + 1)
      }
    } catch (error) {
      console.error("Error renaming file:", error)
      setMessage("Lỗi khi đổi tên file")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadRenamedFile = (type: "image" | "json") => {
    if (!renamedFiles.names) return

    const blob = type === "image" ? renamedFiles.image : renamedFiles.json
    const fileName = type === "image" ? renamedFiles.names.image : renamedFiles.names.json

    if (!blob) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllRenamedFiles = () => {
    if (allRenamedFiles.length === 0) {
      setMessage("Chưa có file nào được đổi tên")
      return
    }

    // Create a zip file using JSZip
    import("jszip")
      .then(({ default: JSZip }) => {
        const zip = new JSZip()

        // Create images and labels folders
        const imagesFolder = zip.folder("images")
        const labelsFolder = zip.folder("labels")

        if (!imagesFolder || !labelsFolder) {
          setMessage("Lỗi khi tạo thư mục trong file ZIP")
          return
        }

        // Add all files to the zip
        allRenamedFiles.forEach((file) => {
          imagesFolder.file(file.names.image, file.image)
          labelsFolder.file(file.names.json, file.json)
        })

        // Add history file
        zip.file("rename_history.json", JSON.stringify(history, null, 2))

        // Generate the zip file
        zip.generateAsync({ type: "blob" }).then((content) => {
          const url = URL.createObjectURL(content)
          const link = document.createElement("a")
          link.href = url
          link.download = "renamed_files.zip"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setMessage(`Đã tải xuống ${allRenamedFiles.length} cặp file đã đổi tên`)
        })
      })
      .catch((err) => {
        console.error("Error creating ZIP file:", err)
        setMessage("Lỗi khi tạo file ZIP")
      })
  }

  const downloadHistoryFile = () => {
    if (history.length === 0) return

    const historyBlob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(historyBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "rename_history.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFileInfo = () => {
    if (!currentImage) return <div className="text-center p-4">Chưa có file nào được chọn</div>

    // Check if current file has been renamed
    const { imageIndex } = validPairs[currentPairIndex]
    const currentFileName = files.images[imageIndex]?.name.replace(".jpg", "")
    const hasBeenRenamed = allRenamedFiles.some((file) => file.originalName === currentFileName)

    // Get the renamed name if it exists
    const renamedInfo = allRenamedFiles.find((file) => file.originalName === currentFileName)

    return (
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>
              Tiến độ: {currentPairIndex + 1}/{validPairs.length}
            </span>
            <span>{Math.round(((currentPairIndex + 1) / validPairs.length) * 100)}%</span>
          </div>
          <Progress value={((currentPairIndex + 1) / validPairs.length) * 100} className="h-1" />
        </div>

        {showDownloadHelp && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm">Lưu ý về tải xuống file</AlertTitle>
            <AlertDescription className="text-xs">
              Do giới hạn của trình duyệt, các file đã đổi tên cần được tải xuống thủ công. Sau khi đổi tên tất cả file,
              bạn có thể nhấn nút "Tải xuống tất cả" để tải về một file ZIP.
            </AlertDescription>
            <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => setShowDownloadHelp(false)}>
              Đã hiểu
            </Button>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden h-[200px]">
              {currentImage && (
                <ImageMagnifier
                  src={currentImage || "/placeholder.svg"}
                  alt="Preview"
                  magnifierHeight={100}
                  magnifierWidth={100}
                  zoomLevel={2.5}
                />
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex items-center">
              <span className="truncate flex-1">
                File hiện tại: {files.images[validPairs[currentPairIndex].imageIndex]?.name}
              </span>
              {hasBeenRenamed && (
                <Badge variant="outline" className="ml-1 text-xs h-5">
                  Đã đổi tên
                </Badge>
              )}
            </div>

            {/* File name preview - collapsible */}
            <Collapsible open={isPreviewOpen} onOpenChange={setIsPreviewOpen} className="mt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Xem trước tên file:</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isPreviewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="p-1 border border-dashed rounded-md bg-muted/30 mt-1">
                  <p className="text-xs font-mono">
                    {productName ? `${productName}_${side}_${count}.jpg` : "Chưa có tên sản phẩm"}
                  </p>
                  <p className="text-xs font-mono">
                    {productName ? `${productName}_${side}_${count}.json` : "Chưa có tên sản phẩm"}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {hasBeenRenamed && renamedInfo && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <p className="font-medium text-xs mb-1">File đã đổi tên:</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs truncate mr-1">{renamedInfo.names.image}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = URL.createObjectURL(renamedInfo.image)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = renamedInfo.names.image
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="h-7"
                  >
                    <Download className="h-3 w-3 mr-1" /> Tải xuống
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs truncate mr-1">{renamedInfo.names.json}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = URL.createObjectURL(renamedInfo.json)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = renamedInfo.names.json
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="h-7"
                  >
                    <Download className="h-3 w-3 mr-1" /> Tải xuống
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label htmlFor="productName" className="text-sm">
                  Tên sản phẩm
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium mb-1">Phím tắt:</p>
                        <ul className="space-y-1">
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+F</kbd> - Mặt trước (Front)
                          </li>
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+B</kbd> - Mặt sau (Back)
                          </li>
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+←</kbd>{" "}
                            <kbd className="px-1 rounded bg-muted">Ctrl+→</kbd> - Chuyển ảnh
                          </li>
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+Enter</kbd> - Đổi tên
                          </li>
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+S</kbd> - Đổi tên
                          </li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between h-8 text-xs"
                  >
                    {productName ? productName : "Chọn tên sản phẩm..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Tìm tên sản phẩm..." className="h-8" />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>Không tìm thấy tên sản phẩm.</CommandEmpty>
                      <CommandGroup>
                        {productNameHistory.map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={(currentValue) => {
                              setLowercaseProductName(currentValue)
                              setOpenCombobox(false)
                            }}
                            className="text-xs"
                          >
                            <Check className={cn("mr-2 h-3 w-3", productName === name ? "opacity-100" : "opacity-0")} />
                            {name}
                          </CommandItem>
                        ))}
                        <CommandItem
                          value="new"
                          onSelect={() => {
                            const newName = prompt("Nhập tên sản phẩm mới:")
                            if (newName) {
                              setLowercaseProductName(newName)
                              if (!productNameHistory.includes(newName.toLowerCase())) {
                                setProductNameHistory([...productNameHistory, newName.toLowerCase()])
                              }
                            }
                            setOpenCombobox(false)
                          }}
                          className="text-xs"
                        >
                          <span className="text-blue-500">+ Thêm tên mới</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                id="productName"
                ref={productNameRef}
                value={productName}
                onChange={(e) => setLowercaseProductName(e.target.value)}
                placeholder="Nhập tên sản phẩm (ví dụ: bánh-mì-tươi)"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="side" className="text-sm">
                  Mặt
                </Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant={side === "F" ? "default" : "outline"}
                    onClick={() => setSide("F")}
                    className="w-full h-8 text-xs"
                  >
                    Trước (Ctrl+F)
                  </Button>
                  <Button
                    type="button"
                    variant={side === "B" ? "default" : "outline"}
                    onClick={() => setSide("B")}
                    className="w-full h-8 text-xs"
                  >
                    Sau (Ctrl+B)
                  </Button>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <Label htmlFor="count" className="text-sm">
                  Số thứ tự (cố định)
                </Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={count}
                  disabled={true}
                  className="h-8 text-sm bg-muted"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useOriginalName"
                checked={useOriginalName}
                onChange={(e) => setUseOriginalName(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="useOriginalName" className="text-xs cursor-pointer">
                Sử dụng tên file gốc
              </Label>
            </div>

            <div className="pt-1">
              <Button
                onClick={handleRenameCurrentFile}
                disabled={isProcessing || !productName}
                className="w-full h-8 text-xs"
              >
                <Save className="mr-2 h-3 w-3" />
                Đổi tên file (Ctrl+Enter)
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1">
              <Button
                variant="outline"
                onClick={() => currentPairIndex > 0 && setCurrentPairIndex(currentPairIndex - 1)}
                disabled={currentPairIndex === 0}
                className="w-full h-8 text-xs"
              >
                ← Trước
              </Button>
              <Button
                variant="outline"
                onClick={() => currentPairIndex < validPairs.length - 1 && setCurrentPairIndex(currentPairIndex + 1)}
                disabled={currentPairIndex === validPairs.length - 1}
                className="w-full h-8 text-xs"
              >
                Tiếp theo →
              </Button>
            </div>

            {allRenamedFiles.length > 0 && (
              <div className="pt-1">
                <Button onClick={downloadAllRenamedFiles} variant="secondary" className="w-full h-8 text-xs">
                  <Download className="mr-2 h-3 w-3" />
                  Tải xuống tất cả ({allRenamedFiles.length} file)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-3 px-3 max-h-screen overflow-auto">
      <h1 className="text-xl font-bold mb-3">Đổi tên file tự động</h1>

      {validPairs.length === 0 ? (
        <Card className="mb-3">
          <CardContent className="pt-4">
            <div className="text-center space-y-3">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Chọn thư mục chứa dữ liệu</h2>
              <p className="text-muted-foreground text-sm">
                Chọn thư mục chính chứa hai thư mục con 'images' và 'labels'
              </p>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Chọn thư mục
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="rename">
          <TabsList className="mb-3 h-8">
            <TabsTrigger value="rename" className="text-xs h-7">
              Đổi tên file
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs h-7">
              Lịch sử đổi tên
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs h-7">
              Hướng dẫn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rename" className="mt-0">
            <Card>
              <CardContent className="pt-4">{renderFileInfo()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card>
              <CardContent className="pt-4">
                <h2 className="text-lg font-semibold mb-3">Lịch sử đổi tên</h2>
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa có lịch sử đổi tên nào</p>
                ) : (
                  <>
                    <div className="border rounded-md mb-3">
                      <div className="grid grid-cols-2 font-medium p-2 border-b text-sm">
                        <div>Tên gốc</div>
                        <div>Tên mới</div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {history.map((item, index) => (
                          <div key={index} className="grid grid-cols-2 p-2 border-b last:border-0 text-xs">
                            <div className="truncate">{item.original}</div>
                            <div className="flex items-center">
                              <ArrowRight className="mr-1 h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{item.renamed}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadHistoryFile} className="h-8 text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        Tải xuống lịch sử
                      </Button>

                      {allRenamedFiles.length > 0 && (
                        <Button onClick={downloadAllRenamedFiles} variant="secondary" className="h-8 text-xs">
                          <Download className="mr-1 h-3 w-3" />
                          Tải xuống tất cả file
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="mt-0">
            <Card>
              <CardContent className="pt-4">
                <h2 className="text-lg font-semibold mb-2">Hướng dẫn sử dụng</h2>
                <Collapsible open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Quy trình làm việc</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {isHelpOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-2 text-xs">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Chọn thư mục chính chứa hai thư mục con 'images' và 'labels'</li>
                        <li>Nhập tên sản phẩm, chọn mặt (F/B) và số thứ tự</li>
                        <li>Nhấn "Đổi tên file" để đổi tên file hiện tại</li>
                        <li>Tải xuống các file đã đổi tên hoặc tiếp tục đổi tên các file khác</li>
                        <li>
                          Sau khi hoàn thành, nhấn "Tải xuống tất cả" để tải về một file ZIP chứa tất cả file đã đổi tên
                        </li>
                      </ol>

                      <h3 className="text-sm font-medium pt-1">Phím tắt</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + →</kbd> Di chuyển đến file
                          tiếp theo
                        </li>
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + ←</kbd> Di chuyển đến file
                          trước đó
                        </li>
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + S</kbd> Đổi tên file hiện tại
                        </li>
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + F</kbd> Chọn mặt trước (F)
                        </li>
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + B</kbd> Chọn mặt sau (B)
                        </li>
                        <li>
                          <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl + Enter</kbd> Đổi tên file hiện
                          tại
                        </li>
                      </ul>

                      <h3 className="text-sm font-medium pt-1">Lưu ý về tải xuống file</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Do giới hạn của trình duyệt, các file đã đổi tên cần được tải xuống thủ công</li>
                        <li>
                          Sau khi đổi tên tất cả file, bạn có thể tải xuống một file ZIP chứa tất cả file đã đổi tên
                        </li>
                        <li>File ZIP sẽ chứa hai thư mục 'images' và 'labels' với cấu trúc giống như thư mục gốc</li>
                        <li>Lịch sử đổi tên cũng được lưu trong file ZIP</li>
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {message && (
        <div className="mt-2 p-2 bg-muted rounded-md">
          <p className="text-xs">{message}</p>
        </div>
      )}
    </main>
  )
}
