// Уменьшает фотографии перед отправкой в Cloudinary.
 // Максимальная сторона — 1600 px, формат — WebP, качество — 82%.
export async function optimizeImage(file, maxSide = 1600, quality = 0.82) {
  if (!file || !file.type?.startsWith('image/')) return file
  // Не преобразуем анимированные GIF, чтобы не потерять анимацию.
  if (file.type === 'image/gif') return file

  let bitmap
  let width
  let height
  let close = () => {}
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file)
      width = bitmap.width
      height = bitmap.height
      close = () => bitmap.close?.()
    } else {
      const source = URL.createObjectURL(file)
      try {
        const image = new Image()
        await new Promise((resolve, reject) => {
          image.onload = resolve
          image.onerror = reject
          image.src = source
        })
        width = image.naturalWidth
        height = image.naturalHeight
        bitmap = image
      } finally {
        URL.revokeObjectURL(source)
      }
    }

    if (!width || !height) return file
    const scale = Math.min(1, maxSide / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
    if (!blob || !blob.size) return file
    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return new File([blob], baseName + '.webp', { type: 'image/webp', lastModified: Date.now() })
  } catch (error) {
    console.warn('Image optimization skipped; original file will be uploaded:', error)
    return file
  } finally {
    close()
  }
}
