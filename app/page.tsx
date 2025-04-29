"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Save, ArrowRight, Download, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [files, setFiles] = useState<{ images: File[]; labels: File[] }>({ images: [], labels: [] })
  const [currentIndex, setCurrentIndex] = useState(0)
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
      image: Blob
      json: Blob
      names: { image: string; json: string }
    }>
  >([])
  const [useOriginalName, setUseOriginalName] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [lastProductName, setLastProductName] = useState("")
  const [showDownloadHelp, setShowDownloadHelp] = useState(true)

  const productNameRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to ensure product name is lowercase
  const setLowercaseProductName = (name: string) => {
    setProductName(name.toLowerCase())
  }

  // Function to extract counter from filename
  const extractCounterFromFilename = (filename: string): number => {
    // Try to find a number at the end of the filename
    const match = filename.match(/(\d+)(?:\.\w+)?$/)
    if (match) {
      return Number.parseInt(match[1], 10)
    }
    return 1 // Default to 1 if no number found
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
        if (currentIndex < files.images.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
      } else if (e.key === "Enter" && !isProcessing && productName) {
        e.preventDefault()
        handleRenameCurrentFile()
      } else if (e.key === "s") {
        e.preventDefault()
        handleRenameCurrentFile()
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts)
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts)
  }, [currentIndex, files.images.length, productName, isProcessing])

  // Load current file when index changes
  useEffect(() => {
    if (files.images.length > 0 && currentIndex < files.images.length) {
      loadCurrentFile()
    }
  }, [currentIndex, files.images])

  // Focus on product name input when files are loaded
  useEffect(() => {
    if (files.images.length > 0 && productNameRef.current) {
      productNameRef.current.focus()
    }
  }, [files.images.length])

  // Add this useEffect to handle automatic counter increment
  useEffect(() => {
    // If product name changed, reset counter only if product name actually changed
    if (productName !== lastProductName && lastProductName !== "") {
      setCount(1)
    }
    setLastProductName(productName)
  }, [productName])

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

    setFiles({ images: imageFiles, labels: labelFiles })
    setCurrentIndex(0)
    setMessage(`Đã tải ${imageFiles.length} ảnh và ${labelFiles.length} file nhãn`)
  }

  const loadCurrentFile = async () => {
    if (files.images.length === 0) return

    try {
      const imageFile = files.images[currentIndex]
      const imageName = imageFile.name

      // Find matching JSON file
      const jsonName = imageName.replace(".jpg", ".json")
      const jsonFile = files.labels.find((file) => file.name === jsonName)

      if (!jsonFile) {
        setMessage(`Không tìm thấy file JSON tương ứng cho ${imageName}`)
        return
      }

      // Load image
      setCurrentImage(URL.createObjectURL(imageFile))

      // Load JSON
      const jsonContent = await jsonFile.text()
      setCurrentJson(JSON.parse(jsonContent))

      // Extract counter from filename
      const extractedCount = extractCounterFromFilename(imageName)
      setCount(extractedCount)

      // If useOriginalName is true, set the product name to the original filename (without extension)
      if (useOriginalName) {
        const originalName = imageName.replace(".jpg", "")
        setLowercaseProductName(originalName)
      } else {
        // Extract product name if it follows the format
        const fileNameParts = imageName.replace(".jpg", "").split("_")
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
    if (files.images.length === 0 || !currentImage || !currentJson) {
      setMessage("Không có file để đổi tên")
      return
    }

    setIsProcessing(true)

    try {
      const imageFile = files.images[currentIndex]
      const originalImageName = imageFile.name
      const originalJsonName = originalImageName.replace(".jpg", ".json")

      // Find matching JSON file
      const jsonFile = files.labels.find((file) => file.name === originalJsonName)

      if (!jsonFile) {
        setMessage(`Không tìm thấy file JSON tương ứng cho ${originalImageName}`)
        setIsProcessing(false)
        return
      }

      // Create new file names
      const newBaseName = `${productName}_${side}_${count}`
      const newImageName = `${newBaseName}.jpg`
      const newJsonName = `${newBaseName}.json`

      // Update JSON content
      const updatedJson = { ...currentJson, imagePath: newImageName }
      const updatedJsonBlob = new Blob([JSON.stringify(updatedJson, null, 2)], { type: "application/json" })

      // Create renamed image file (same content, new name)
      const imageBlob = await imageFile.arrayBuffer()
      const renamedImageBlob = new Blob([imageBlob], { type: "image/jpeg" })

      // Update history
      const historyEntry = {
        original: originalImageName.replace(".jpg", ""),
        renamed: newBaseName,
      }
      setHistory([...history, historyEntry])

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

      // Add to all renamed files collection
      setAllRenamedFiles([
        ...allRenamedFiles,
        {
          image: renamedImageBlob,
          json: updatedJsonBlob,
          names: {
            image: newImageName,
            json: newJsonName,
          },
        },
      ])

      // Add product name to history if not already there
      if (!productNameHistory.includes(productName)) {
        setProductNameHistory([...productNameHistory, productName])
      }

      setMessage(`Đã đổi tên thành công: ${originalImageName} → ${newImageName}`)

      // Move to next file if available
      if (currentIndex < files.images.length - 1) {
        // Increment counter if the next file will use the same product name
        setCount(count + 1)
        setCurrentIndex(currentIndex + 1)
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

    return (
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Tiến độ: {currentIndex + 1}/{files.images.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / files.images.length) * 100)}%</span>
          </div>
          <Progress value={((currentIndex + 1) / files.images.length) * 100} className="h-2" />
        </div>

        {showDownloadHelp && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lưu ý về tải xuống file</AlertTitle>
            <AlertDescription>
              Do giới hạn của trình duyệt, các file đã đổi tên cần được tải xuống thủ công. Sau khi đổi tên tất cả file,
              bạn có thể nhấn nút "Tải xuống tất cả" để tải về một file ZIP chứa tất cả file đã đổi tên.
            </AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowDownloadHelp(false)}>
              Đã hiểu
            </Button>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              {currentImage && (
                <img src={currentImage || "/placeholder.svg"} alt="Preview" className="object-contain w-full h-full" />
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              File hiện tại: {files.images[currentIndex]?.name}
              {allRenamedFiles.some((f) => f.names.image === `${productName}_${side}_${count}.jpg`) && (
                <Badge variant="outline" className="ml-2">
                  Đã đổi tên
                </Badge>
              )}
            </div>

            {/* Add file name preview */}
            <div className="mt-2 p-2 border border-dashed rounded-md bg-muted/30">
              <p className="text-sm font-medium">Xem trước tên file:</p>
              <p className="text-sm font-mono">
                {productName ? `${productName}_${side}_${count}.jpg` : "Chưa có tên sản phẩm"}
              </p>
              <p className="text-sm font-mono">
                {productName ? `${productName}_${side}_${count}.json` : "Chưa có tên sản phẩm"}
              </p>
            </div>

            {renamedFiles.names && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium mb-2">File đã đổi tên:</p>
                <div className="flex justify-between items-center mb-2">
                  <span>{renamedFiles.names.image}</span>
                  <Button size="sm" variant="outline" onClick={() => downloadRenamedFile("image")}>
                    <Download className="h-4 w-4 mr-1" /> Tải xuống
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>{renamedFiles.names.json}</span>
                  <Button size="sm" variant="outline" onClick={() => downloadRenamedFile("json")}>
                    <Download className="h-4 w-4 mr-1" /> Tải xuống
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="productName">Tên sản phẩm</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Phím tắt:</p>
                        <ul className="space-y-1">
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+F</kbd> - Mặt trước
                          </li>
                          <li>
                            <kbd className="px-1 rounded bg-muted">Ctrl+B</kbd> - Mặt sau
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
                    className="w-full justify-between"
                  >
                    {productName ? productName : "Chọn tên sản phẩm..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Tìm tên sản phẩm..." />
                    <CommandList>
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
                          >
                            <Check className={cn("mr-2 h-4 w-4", productName === name ? "opacity-100" : "opacity-0")} />
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
                className="mt-2"
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="side">Mặt</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={side === "F" ? "default" : "outline"}
                    onClick={() => setSide("F")}
                    className="w-full"
                  >
                    Trước (F)
                  </Button>
                  <Button
                    type="button"
                    variant={side === "B" ? "default" : "outline"}
                    onClick={() => setSide("B")}
                    className="w-full"
                  >
                    Sau (B)
                  </Button>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="count">Số thứ tự</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(Number.parseInt(e.target.value))}
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
              <Label htmlFor="useOriginalName" className="text-sm cursor-pointer">
                Sử dụng tên file gốc
              </Label>
            </div>

            <div className="pt-2">
              <Button onClick={handleRenameCurrentFile} disabled={isProcessing || !productName} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Đổi tên file (Ctrl+Enter)
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="w-full"
              >
                ← Trước
              </Button>
              <Button
                variant="outline"
                onClick={() => currentIndex < files.images.length - 1 && setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === files.images.length - 1}
                className="w-full"
              >
                Tiếp theo →
              </Button>
            </div>

            {allRenamedFiles.length > 0 && (
              <div className="pt-2">
                <Button onClick={downloadAllRenamedFiles} variant="secondary" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
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
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Ứng dụng đổi tên file tự động</h1>

      {files.images.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Chọn thư mục chứa dữ liệu</h2>
              <p className="text-muted-foreground">Chọn thư mục chính chứa hai thư mục con 'images' và 'labels'</p>
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
          <TabsList className="mb-4">
            <TabsTrigger value="rename">Đổi tên file</TabsTrigger>
            <TabsTrigger value="history">Lịch sử đổi tên</TabsTrigger>
            <TabsTrigger value="help">Hướng dẫn</TabsTrigger>
          </TabsList>

          <TabsContent value="rename">
            <Card>
              <CardContent className="pt-6">{renderFileInfo()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Lịch sử đổi tên</h2>
                {history.length === 0 ? (
                  <p className="text-muted-foreground">Chưa có lịch sử đổi tên nào</p>
                ) : (
                  <>
                    <div className="border rounded-md mb-4">
                      <div className="grid grid-cols-2 font-medium p-3 border-b">
                        <div>Tên gốc</div>
                        <div>Tên mới</div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {history.map((item, index) => (
                          <div key={index} className="grid grid-cols-2 p-3 border-b last:border-0">
                            <div>{item.original}</div>
                            <div className="flex items-center">
                              <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />
                              {item.renamed}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadHistoryFile}>
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống lịch sử
                      </Button>

                      {allRenamedFiles.length > 0 && (
                        <Button onClick={downloadAllRenamedFiles} variant="secondary">
                          <Download className="mr-2 h-4 w-4" />
                          Tải xuống tất cả file
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Hướng dẫn sử dụng</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Quy trình làm việc</h3>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                      <li>Chọn thư mục chính chứa hai thư mục con 'images' và 'labels'</li>
                      <li>Nhập tên sản phẩm, chọn mặt (F/B) và số thứ tự</li>
                      <li>Nhấn "Đổi tên file" để đổi tên file hiện tại</li>
                      <li>Tải xuống các file đã đổi tên hoặc tiếp tục đổi tên các file khác</li>
                      <li>
                        Sau khi hoàn thành, nhấn "Tải xuống tất cả" để tải về một file ZIP chứa tất cả file đã đổi tên
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">Phím tắt</h3>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + →</kbd> Di chuyển đến file tiếp theo
                      </li>
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + ←</kbd> Di chuyển đến file trước đó
                      </li>
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + S</kbd> Đổi tên file hiện tại
                      </li>
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + F</kbd> Chọn mặt trước (F)
                      </li>
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + B</kbd> Chọn mặt sau (B)
                      </li>
                      <li>
                        <kbd className="px-2 py-1 bg-muted rounded">Ctrl + Enter</kbd> Đổi tên file hiện tại
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">Lưu ý về tải xuống file</h3>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                      <li>Do giới hạn của trình duyệt, các file đã đổi tên cần được tải xuống thủ công</li>
                      <li>
                        Sau khi đổi tên tất cả file, bạn có thể tải xuống một file ZIP chứa tất cả file đã đổi tên
                      </li>
                      <li>File ZIP sẽ chứa hai thư mục 'images' và 'labels' với cấu trúc giống như thư mục gốc</li>
                      <li>Lịch sử đổi tên cũng được lưu trong file ZIP</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {message && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p>{message}</p>
        </div>
      )}
    </main>
  )
}
