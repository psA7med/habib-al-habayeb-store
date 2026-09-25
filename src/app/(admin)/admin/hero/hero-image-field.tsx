"use client"

import { useState } from "react"
import { Image as ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface HeroImageFieldProps {
  label: string
  description: string
  name: "desktop" | "mobile"
  currentUrl: string
}

export function HeroImageField({
  label,
  description,
  name,
  currentUrl,
}: HeroImageFieldProps) {
  const [url, setUrl] = useState(currentUrl)
  const [previewError, setPreviewError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value)
    setPreviewError(null)
  }

  function handleReset() {
    setUrl(currentUrl)
    setPreviewError(null)
  }

  const displayUrl = url.trim() || currentUrl
  const isCustom = url.trim().length > 0 && url.trim() !== currentUrl

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={`hero-${name}-url`} className="text-lg font-medium">
            {label}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Image preview */}
      <div className="mt-4 relative h-48 w-full overflow-hidden rounded-lg bg-neutral-100">
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={label}
              className="h-full w-full object-cover"
              style={{ objectFit: "cover" }}
              onError={() => setPreviewError("Unable to load image")}
            />
            {isCustom && (
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                Custom
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image set
          </div>
        )}
        {previewError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-sm text-destructive">
            {previewError}
          </div>
        )}
      </div>

      {/* URL field */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            id={`hero-${name}-url`}
            type="url"
            value={url}
            onChange={handleChange}
            placeholder={`https://example.com/hero-${name}.jpg`}
            className="flex-1 font-mono text-sm"
          />
          <Button variant="outline" onClick={handleReset} title="Reset to default">
            Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a full URL to the image. The image will be displayed at its
          original aspect ratio — do not distort or crop it.
        </p>
      </div>

      {/* Current value indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        <span>
          Current:{" "}
          <span className="font-mono break-all">{displayUrl || "none"}</span>
        </span>
        {displayUrl && (
          <Button
            variant="link"
            size="sm"
            asChild
            className="h-auto p-0 text-xs"
          >
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>

      <Separator className="my-6" />
    </div>
  )
}
