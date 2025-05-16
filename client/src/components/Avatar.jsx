import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Avatar({ url, size, onUpload, isEditable = false }) {
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)  // <- Ref zum Input-Feld

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error) {
      console.error('Error downloading image: ', error.message)
    }
  }

  async function uploadAvatar(event) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) throw uploadError

      onUpload(event, filePath)
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {avatarUrl ? (
  <img
    src={avatarUrl}
    alt="Avatar"
    className="avatar image"
    style={{ height: size, width: size, cursor: isEditable ? 'pointer' : 'default', borderRadius: '50%' }}
    onClick={isEditable ? () => fileInputRef.current?.click() : undefined}
  />
) : (
    <img
    src="no-profile.png"
    alt="Placeholder"
    className="avatar placeholder"
    style={{ height: size, width: size, cursor: isEditable ? 'pointer' : 'default', borderRadius: '50%' }}
    onClick={isEditable ? () => fileInputRef.current?.click() : undefined} 
    />
  
)}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}  // <- Verbinde mit Ref
        style={{ display: 'none' }}
        onChange={uploadAvatar}
        disabled={uploading}
      />
    </div>
  )
}
